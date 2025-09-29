// backend/src/controllers/traceabilityController.js
const { getConnection } = require('../config/db');
// Assurez-vous que le chemin vers votre fichier d'initialisation Firebase est correct.
// Si vous avez un fichier comme 'backend/src/config/firebaseAdmin.js' qui exporte l'instance 'admin' déjà initialisée.
const admin = require('../config/firebaseAdmin'); // <--- MODIFIEZ CETTE LIGNE

// Si vous avez un fichier de configuration Firebase centralisé qui initialise admin,
// vous devriez l'importer comme ceci:
// const admin = require('../config/firebaseAdmin'); // Exemple si vous avez un fichier firebaseAdmin.js

// Si admin.initializeApp() est appelé ailleurs (ex: dans server.js ou un fichier de config global),
// alors il ne doit PAS être appelé ici.
// Supprimez ou commentez la ligne suivante si elle existe et est la cause de l'erreur:
// admin.initializeApp({ /* votre configuration ici */ }); // <-- C'est la ligne qui cause le DUPLICATE_APP si appelée plusieurs fois

// Fonction utilitaire pour uploader un fichier sur Firebase Storage
// Assurez-vous que cette fonction est bien définie et n'initialise pas Firebase à nouveau.
const uploadToFirebase = async (file) => {
    const bucket = admin.storage().bucket(); // Récupère le bucket de stockage Firebase
    const fileName = `traceability/${Date.now()}_${file.originalname}`;
    const fileUpload = bucket.file(fileName);

    const blobStream = fileUpload.createWriteStream({
        metadata: {
            contentType: file.mimetype,
        },
    });

    return new Promise((resolve, reject) => {
        blobStream.on('error', (error) => {
            console.error('Erreur lors de l\'upload vers Firebase Storage:', error);
            reject('Erreur lors de l\'upload de l\'image.');
        });

        blobStream.on('finish', () => {
            // Rendre le fichier public et obtenir l'URL
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
            resolve(publicUrl);
        });

        blobStream.end(file.buffer);
    });
};


exports.addTraceabilityRecord = async (req, res) => {
    try {
        const { designation, quantityValue, quantityUnit, dateTransformation, dateLimiteConsommation } = req.body;
        const userId = req.user.id;
        const userSiret = req.user.client_id; // Utilisez client_id du token pour le SIRET de l'établissement

        if (!req.file) {
            return res.status(400).json({ message: 'Aucun fichier image n\'a été téléchargé.' });
        }

        // Vérifiez que le SIRET est disponible
        if (!userSiret) {
            return res.status(400).json({ message: 'SIRET de l\'établissement manquant dans le token utilisateur.' });
        }

        const imageUrl = await uploadToFirebase(req.file);

        const pool = await getConnection(); // Obtenez la connexion à la base de données

        const [result] = await pool.execute(
            `INSERT INTO traceability_records (
                designation,
                quantity_value,
                quantity_unit,
                date_transformation,
                date_limite_consommation,
                image_url,
                user_id,
                siret_etablissement,
                capture_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`, // Ajout de capture_date
            [designation, quantityValue, quantityUnit, dateTransformation || null, dateLimiteConsommation, imageUrl, userId, userSiret]
        );

        if (result.affectedRows === 0) {
            return res.status(500).json({ message: 'Échec de l\'ajout de l\'enregistrement de traçabilité.' });
        }

        res.status(201).json({ message: 'Enregistrement de traçabilité ajouté avec succès.', recordId: result.insertId, imageUrl });

    } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'enregistrement de traçabilité:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'ajout de l\'enregistrement de traçabilité.' });
    }
};

exports.getTraceabilityRecordsBySiret = async (req, res) => {
    try {
        const pool = await getConnection();
        const { siret } = req.params; // SIRET passé en paramètre de l'URL
        const { role, client_id } = req.user; // SIRET de l'utilisateur connecté

        // Vérification d'autorisation :
        // - Super Admin peut voir n'importe quel SIRET
        // - Admin Client ne peut voir que son propre SIRET
        // - Employé ne peut voir que le SIRET de son établissement
        if (role === 'admin_client' && client_id !== siret) {
            return res.status(403).json({ message: 'Non autorisé à accéder aux enregistrements de cet établissement.' });
        }
        if (role === 'employer') {
            const [userProfile] = await pool.execute('SELECT admin_client_siret FROM users WHERE id = ?', [req.user.id]);
            if (userProfile.length === 0 || userProfile[0].admin_client_siret !== siret) {
                return res.status(403).json({ message: 'Non autorisé à accéder aux enregistrements de cet établissement.' });
            }
        }

        const [records] = await pool.execute(
            `SELECT tr.*, u.nom_client, u.prenom_client, u.nom_entreprise
             FROM traceability_records tr
             JOIN users u ON tr.user_id = u.id
             WHERE tr.siret_etablissement = ? ORDER BY tr.capture_date DESC`,
            [siret]
        );
        res.json(records);
    } catch (error) {
        console.error('Erreur lors de la récupération des enregistrements de traçabilité par SIRET:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des enregistrements.' });
    }
};

exports.getAllTraceabilityRecords = async (req, res) => {
    try {
        const pool = await getConnection();
        const [records] = await pool.execute(
            `SELECT tr.*, u.nom_client, u.prenom_client, u.nom_entreprise
             FROM traceability_records tr
             JOIN users u ON tr.user_id = u.id
             ORDER BY tr.capture_date DESC`
        );
        res.json(records);
    } catch (error) {
        console.error('Erreur lors de la récupération de tous les enregistrements de traçabilité (Super Admin):', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des enregistrements.' });
    }
};

exports.deleteTraceabilityRecord = async (req, res) => {
    try {
        const pool = await getConnection();
        const { id } = req.params;
        const { role, client_id } = req.user;

        // Vérifier si l'enregistrement existe et si l'utilisateur est autorisé à le supprimer
        const [record] = await pool.execute('SELECT siret_etablissement FROM traceability_records WHERE id = ?', [id]);
        if (record.length === 0) {
            return res.status(404).json({ message: 'Enregistrement de traçabilité non trouvé.' });
        }

        const recordSiret = record[0].siret_etablissement;

        // Autorisation : Super Admin ou Admin Client de l'établissement concerné
        const isAuthorized = (role === 'super_admin') || (role === 'admin_client' && client_id === recordSiret);

        if (!isAuthorized) {
            return res.status(403).json({ message: 'Non autorisé à supprimer cet enregistrement.' });
        }

        const [result] = await pool.execute('DELETE FROM traceability_records WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Enregistrement de traçabilité non trouvé ou aucune suppression effectuée.' });
        }
        res.status(204).send(); // 204 No Content pour une suppression réussie
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'enregistrement de traçabilité:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'enregistrement.' });
    }
};











