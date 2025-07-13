// backend/src/controllers/traceabilityController.js
const { getConnection } = require('../config/db');
const admin = require('firebase-admin'); // Importe Firebase Admin SDK

// IMPORTANT: Configurez Firebase Admin SDK ici.
// Remplacez par le chemin réel de votre fichier de clé de compte de service Firebase
// et l'ID de votre projet Firebase.
// Une fois configuré, vous pouvez supprimer le bloc de code "Placeholder pour `bucket`" ci-dessous.

const serviceAccount = require('../../firebase-admin-keys/hygiene1-664ad-firebase-adminsdk.json'); // Chemin et nom de fichier corrigés
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'hygiene1-664ad.appspot.com' // Utilisez l'ID de votre projet Firebase
});
const bucket = admin.storage().bucket(); // La déclaration de 'bucket' est ici.

// Le bloc de code "Placeholder pour `bucket`" a été supprimé pour éviter la double déclaration.


/**
 * Ajoute un nouvel enregistrement de traçabilité avec une photo.
 * Accessible par 'employer', 'admin_client', 'super_admin'.
 */
exports.addTraceabilityRecord = async (req, res) => {
    const { designation, quantityValue, quantityUnit, dateTransformation, dateLimiteConsommation } = req.body;
    const { id: userId, role, client_id: adminClientSiretFromToken } = req.user; // userId est l'ID de l'utilisateur connecté
    const imageFile = req.file; // Fichier image de Multer

    if (!imageFile) {
        return res.status(400).json({ message: 'Une photo est requise pour l\'enregistrement de traçabilité.' });
    }
    if (!designation || !quantityValue || !quantityUnit || !dateLimiteConsommation) {
        return res.status(400).json({ message: 'Tous les champs obligatoires (désignation, quantité, unité, DLC) sont requis.' });
    }

    let imageUrl = '';
    let siretToUse = '';
    let employeeIdToUse = userId; // L'utilisateur connecté est l'employé/admin qui crée le relevé

    try {
        const pool = await getConnection();

        // Déterminer le SIRET en fonction du rôle
        if (role === 'employer') {
            // Un employé enregistre pour son propre SIRET (admin_client_siret)
            const [employerData] = await pool.execute('SELECT admin_client_siret FROM users WHERE id = ? AND role = "employer"', [userId]);
            if (employerData.length === 0 || !employerData[0].admin_client_siret) {
                return res.status(403).json({ message: 'Employé non rattaché à un établissement ou SIRET manquant.' });
            }
            siretToUse = employerData[0].admin_client_siret;
        } else if (role === 'admin_client') {
            // Un admin_client enregistre pour son propre SIRET
            siretToUse = adminClientSiretFromToken; // SIRET de l'admin_client est dans le token
        } else if (role === 'super_admin') {
            // Un super_admin doit spécifier le SIRET dans le body
            if (!req.body.siret) {
                return res.status(400).json({ message: 'Le SIRET est requis dans le corps de la requête pour le rôle super_admin.' });
            }
            siretToUse = req.body.siret;
            // Si le super_admin agit pour un employé spécifique, req.body.employeeId pourrait être utilisé
            // Pour l'instant, l'employee_id sera l'ID du super_admin lui-même.
        } else {
            return res.status(403).json({ message: 'Rôle non autorisé à ajouter des relevés de traçabilité.' });
        }

        if (!siretToUse) {
            return res.status(400).json({ message: 'Impossible de déterminer le SIRET de l\'établissement.' });
        }

        // --- Logique d'upload de fichier vers Firebase Storage ---
        const fileName = `traceability_images/${Date.now()}_${imageFile.originalname}`;
        const fileUpload = bucket.file(fileName);
        const blobStream = fileUpload.createWriteStream({
            metadata: {
                contentType: imageFile.mimetype
            }
        });

        await new Promise((resolve, reject) => {
            blobStream.on('error', (err) => {
                console.error('Erreur d\'upload Firebase:', err);
                reject('Erreur lors de l\'upload de l\'image.');
            });
            blobStream.on('finish', () => {
                imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
                resolve();
            });
            blobStream.end(imageFile.buffer);
        });

        // Convertir les chaînes vides en NULL pour les champs DATETIME/DATE optionnels
        const finalDateTransformation = dateTransformation ? new Date(dateTransformation).toISOString().slice(0, 19).replace('T', ' ') : null;
        const finalDateLimiteConsommation = new Date(dateLimiteConsommation).toISOString().slice(0, 10); // Format YYYY-MM-DD

        // Insérer l'enregistrement dans la base de données
        const [result] = await pool.execute(
            'INSERT INTO traceability_records (siret, employee_id, image_url, designation, quantity_value, quantity_unit, date_transformation, date_limite_consommation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                siretToUse,
                employeeIdToUse, // L'ID de l'utilisateur connecté
                imageUrl,
                designation,
                parseFloat(quantityValue),
                quantityUnit,
                finalDateTransformation,
                finalDateLimiteConsommation
            ]
        );

        res.status(201).json({ message: 'Enregistrement de traçabilité ajouté avec succès.', recordId: result.insertId, imageUrl });

    } catch (error) {
        console.error('Erreur serveur lors de l\'ajout de l\'enregistrement de traçabilité:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'ajout de l\'enregistrement de traçabilité.' });
    }
};

/**
 * Récupère les enregistrements de traçabilité pour un SIRET donné.
 * Accessible par 'admin_client' (pour son SIRET) et 'super_admin' (pour n'importe quel SIRET).
 */
exports.getTraceabilityRecordsBySiret = async (req, res) => {
    const { siret } = req.params; // SIRET potentiellement passé par l'URL
    const { role, client_id: adminClientSiretFromToken } = req.user; // SIRET de l'admin_client depuis le token

    let siretFilter = siret; // Par défaut, utilise le SIRET de l'URL

    // Si l'utilisateur est un admin_client, il ne peut voir que les relevés de son propre SIRET
    if (role === 'admin_client') {
        if (!adminClientSiretFromToken) {
            return res.status(403).json({ message: 'Accès refusé: SIRET de l\'admin client manquant dans le token.' });
        }
        // L'admin_client ne peut voir que ses propres enregistrements, ignorer le SIRET du paramètre si différent
        siretFilter = adminClientSiretFromToken;
    } else if (role === 'super_admin') {
        // Le super_admin peut voir n'importe quel SIRET, donc utilise le SIRET du paramètre
        if (!siretFilter) {
            return res.status(400).json({ message: 'Le SIRET est requis pour le rôle super_admin.' });
        }
    } else {
        return res.status(403).json({ message: 'Rôle non autorisé à récupérer les relevés de traçabilité.' });
    }

    try {
        const pool = await getConnection();
        // Jointure avec la table users pour obtenir le nom de l'employé
        const [records] = await pool.execute(
            `SELECT tr.*, u.nom_client, u.prenom_client
             FROM traceability_records tr
             JOIN users u ON tr.employee_id = u.id
             WHERE tr.siret = ? ORDER BY tr.capture_date DESC`,
            [siretFilter]
        );
        res.status(200).json(records);
    } catch (error) {
        console.error('Erreur serveur lors de la récupération des enregistrements de traçabilité:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des enregistrements de traçabilité.' });
    }
};

/**
 * Supprime un enregistrement de traçabilité.
 * Accessible par 'admin_client' (pour ses enregistrements) et 'super_admin' (pour tous).
 */
exports.deleteTraceabilityRecord = async (req, res) => {
    const { id: recordId } = req.params;
    const { role, client_id: adminClientSiretFromToken } = req.user;

    try {
        const pool = await getConnection();

        // Vérifier l'enregistrement et les permissions
        const [record] = await pool.execute('SELECT siret, image_url FROM traceability_records WHERE id = ?', [recordId]);
        if (record.length === 0) {
            return res.status(404).json({ message: 'Enregistrement de traçabilité non trouvé.' });
        }
        const recordSiret = record[0].siret;
        const imageUrlToDelete = record[0].image_url;

        let isAuthorized = false;
        if (role === 'super_admin') {
            isAuthorized = true; // Super admin peut supprimer n'importe quoi
        } else if (role === 'admin_client') {
            if (adminClientSiretFromToken && recordSiret === adminClientSiretFromToken) {
                isAuthorized = true; // Admin client peut supprimer les enregistrements de son propre SIRET
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ message: 'Accès refusé: Vous n\'êtes pas autorisé à supprimer cet enregistrement.' });
        }

        // Supprimer l'enregistrement de la base de données
        const [result] = await pool.execute('DELETE FROM traceability_records WHERE id = ?', [recordId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Enregistrement de traçabilité non trouvé ou non supprimé.' });
        }

        // --- Logique de suppression de fichier de Firebase Storage ---
        if (imageUrlToDelete && bucket) { // S'assurer que bucket est défini
            try {
                const url = new URL(imageUrlToDelete);
                const pathInBucket = url.pathname.substring(url.pathname.indexOf('/o/') + 3, url.pathname.indexOf('?')).replace(/%2F/g, '/');
                await bucket.file(pathInBucket).delete();
                console.log(`Image supprimée de Firebase Storage: ${pathInBucket}`);
            } catch (err) {
                console.warn(`Impossible de supprimer l'image de Firebase Storage: ${imageUrlToDelete}`, err.message);
                // Ne pas bloquer la réponse même si la suppression du fichier échoue
            }
        }

        res.status(204).send(); // 204 No Content pour une suppression réussie

    } catch (error) {
        console.error('Erreur serveur lors de la suppression de l\'enregistrement de traçabilité:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'enregistrement de traçabilité.' });
    }
};
