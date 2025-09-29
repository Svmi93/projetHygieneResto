// backend/src/controllers/photoController.js
const { getConnection } = require('../config/db');
const path = require('path');
const fs = require('fs/promises'); // Utilisation de fs.promises pour async/await

// Importe admin. Il pourrait être null si le fichier de clés est absent en dev.
const admin = require('../config/firebaseAdmin');

// Assurez-vous que le dossier 'uploads' existe
const uploadsDir = path.join(__dirname, '../../uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error); // Crée le dossier si inexistant

/**
 * Upload une nouvelle photo.
 * Accessible par 'employer', 'admin_client', 'super_admin'.
 */
exports.uploadPhoto = async (req, res) => {
    const { productName, quantity, productType } = req.body;
    const { id: uploaderId, role, siret: userSiret, admin_client_siret } = req.user;
    const imageFile = req.file;

    if (!imageFile) {
        return res.status(400).json({ message: 'Une photo est requise.' });
    }
    if (!productName || !quantity || !productType) {
        return res.status(400).json({ message: 'Tous les champs obligatoires (nom produit, quantité, type produit) sont requis.' });
    }

    let fileUrl = ''; // Sera le chemin local ou l'URL Firebase
    let siretToUse = '';

    try {
        const pool = await getConnection();

        if (role === 'employer') {
            siretToUse = admin_client_siret;
        } else if (role === 'admin_client') {
            siretToUse = userSiret;
        } else if (role === 'super_admin') {
            if (!req.body.siret) {
                return res.status(400).json({ message: 'Le SIRET est requis pour le rôle super_admin.' });
            }
            siretToUse = req.body.siret;
        } else {
            return res.status(403).json({ message: 'Rôle non autorisé à uploader des photos.' });
        }

        if (!siretToUse) {
            return res.status(400).json({ message: 'Impossible de déterminer le SIRET de l\'établissement pour la photo.' });
        }

        const fileName = `${Date.now()}_${imageFile.originalname}`;

        // --- Logique d'upload conditionnelle ---
        if (process.env.NODE_ENV === 'production' && admin) {
            // Logique Firebase Storage pour la production
            const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET); // Utiliser une variable d'environnement pour le nom du bucket
            const file = bucket.file(`company_logos/${fileName}`); 
            
            await file.save(imageFile.buffer, {
                metadata: {
                    contentType: imageFile.mimetype,
                },
                public: true, 
            });

            fileUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(`company_logos/${fileName}`)}?alt=media`;
            console.log('Fichier uploadé sur Firebase Storage:', fileUrl);

        } else {
            // Logique de stockage local pour le développement
            const filePath = path.join(uploadsDir, fileName);
            fileUrl = `/uploads/${fileName}`; // Chemin relatif pour l'accès web

            await fs.writeFile(filePath, imageFile.buffer);
            console.log('Fichier stocké localement:', filePath);
        }

        // Insérer les informations de la photo dans la base de données
        const [result] = await pool.execute(
            'INSERT INTO photos (siret, product_name, quantity, product_type, file_path, uploader_id, uploader_role) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                siretToUse,
                productName,
                parseFloat(quantity),
                productType,
                fileUrl, 
                uploaderId,
                role
            ]
        );

        res.status(201).json({ message: 'Photo uploadée avec succès.', photoId: result.insertId, imageUrl: fileUrl });

    } catch (error) {
        console.error('Erreur serveur lors de l\'upload de la photo:', error);
        res.status(500).json({ message: `Erreur serveur lors de l'upload de la photo: ${error.message}` });
    }
};

/**
 * Supprime une photo.
 * Accessible par 'admin_client' (pour ses photos) et 'super_admin' (pour toutes).
 */
exports.deletePhoto = async (req, res) => {
    const { id: photoId } = req.params;
    const { role, siret: adminClientSiretFromToken } = req.user;

    try {
        const pool = await getConnection();

        const [photo] = await pool.execute('SELECT siret, file_path FROM photos WHERE id = ?', [photoId]);
        if (photo.length === 0) {
            return res.status(404).json({ message: 'Photo non trouvée.' });
        }
        const photoSiret = photo[0].siret;
        const fileUrlToDelete = photo[0].file_path; 

        let isAuthorized = false;
        if (role === 'super_admin') {
            isAuthorized = true;
        } else if (role === 'admin_client') {
            if (adminClientSiretFromToken && photoSiret === adminClientSiretFromToken) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ message: 'Accès refusé: Vous n\'êtes pas autorisé à supprimer cette photo.' });
        }

        // Supprimer la photo de la base de données
        const [result] = await pool.execute('DELETE FROM photos WHERE id = ?', [photoId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Photo non trouvée ou non supprimée.' });
        }

        // --- Logique de suppression conditionnelle ---
        if (process.env.NODE_ENV === 'production' && admin && fileUrlToDelete.startsWith('https://firebasestorage.googleapis.com')) {
            // Logique de suppression Firebase Storage pour la production
            const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
            // Extraire le chemin du fichier du URL Firebase Storage
            const pathSegments = fileUrlToDelete.split('/');
            const encodedFileName = pathSegments[pathSegments.length - 1].split('?')[0];
            const fileNameInBucket = decodeURIComponent(encodedFileName);
            
            try {
                const fileToDelete = bucket.file(`company_logos/${fileNameInBucket.split('/').pop()}`); 
                await fileToDelete.delete();
                console.log(`Fichier ${fileUrlToDelete} supprimé de Firebase Storage.`);
            } catch (err) {
                console.warn(`Impossible de supprimer l'image de Firebase Storage: ${fileUrlToDelete}`, err.message);
            }
        } else {
            // Logique de suppression de fichier du stockage local pour le développement
            if (fileUrlToDelete && fileUrlToDelete.startsWith('/uploads/')) {
                try {
                    const absolutePathToDelete = path.join(__dirname, '../..', fileUrlToDelete);
                    await fs.unlink(absolutePathToDelete);
                    console.log(`Fichier ${absolutePathToDelete} supprimé du stockage local.`);
                } catch (err) {
                    console.warn(`Impossible de supprimer l'image du stockage local: ${fileUrlToDelete}`, err.message);
                }
            }
        }

        res.status(204).send(); 

    } catch (error) {
        console.error('Erreur serveur lors de la suppression de la photo:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression de la photo.' });
    }
};

/**
 * Récupère les photos pour un SIRET donné.
 * Accessible par 'admin_client' (pour ses propres photos) et 'super_admin' (pour toutes).
 * Les employés peuvent aussi les voir via employerRoutes.js (si tu as une route pour ça).
 */
exports.getPhotosBySiret = async (req, res) => {
    const { siret } = req.params;
    const { role, siret: userSiret } = req.user; // SIRET de l'utilisateur qui fait la requête

    try {
        // Vérification des autorisations
        let isAuthorized = false;
        if (role === 'super_admin') {
            isAuthorized = true; // Super admin peut voir toutes les photos
        } else if (role === 'admin_client') {
            // Un admin_client ne peut voir que les photos de son propre SIRET
            if (userSiret === siret) {
                isAuthorized = true;
            } else {
                return res.status(403).json({ message: "Accès refusé: Vous n'êtes pas autorisé à voir les photos de ce SIRET." });
            }
        } else {
            // Les autres rôles ne sont pas autorisés par cette route
            return res.status(403).json({ message: "Accès refusé: Votre rôle n'est pas autorisé à consulter ces photos." });
        }

        if (!isAuthorized) {
            return res.status(403).json({ message: "Accès refusé: Autorisation non vérifiée." });
        }

        const pool = await getConnection();
        const [rows] = await pool.execute(
            'SELECT id, siret, product_name, quantity, product_type, capture_date, file_path FROM photos WHERE siret = ?',
            [siret]
        );

        res.status(200).json(rows);

    } catch (error) {
        console.error('Erreur serveur lors de la récupération des photos par SIRET:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des photos.' });
    }
};











