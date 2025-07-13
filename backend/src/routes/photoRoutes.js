// backend/src/routes/photoRoutes.js
const express = require('express');
const router = express.Router();
const photoController = require('../controllers/photoController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth'); // Chemin corrigé vers 'auth.js'
const multer = require('multer'); // Pour la gestion des uploads de fichiers (photos)

// Configuration de Multer pour le stockage en mémoire (pour traitement ultérieur ou envoi à Firebase)
const upload = multer({
    storage: multer.memoryStorage(), // Stocke le fichier en mémoire sous forme de buffer
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite la taille du fichier à 5MB
});

// --- Routes pour les Photos ---

// POST /api/photos/upload - Uploader une nouvelle photo
// Accessible par 'employer', 'admin_client', 'super_admin'
router.post('/upload',
    authenticateToken,
    authorizeRoles('employer', 'admin_client', 'super_admin'),
    upload.single('image'), // 'image' doit correspondre au nom du champ dans le FormData du frontend
    photoController.uploadPhoto
);

// GET /api/photos/client/:siret - Récupérer les photos pour un SIRET donné
// Accessible par 'admin_client' (pour ses propres établissements) et 'super_admin' (pour tous)
// Note: Les employés peuvent aussi les voir via employerRoutes.js
router.get('/client/:siret',
    authenticateToken,
    authorizeRoles('admin_client', 'super_admin'),
    photoController.getPhotosBySiret
);

// DELETE /api/photos/:id - Supprimer une photo
// Accessible par 'admin_client' (pour ses propres photos) et 'super_admin' (pour toutes)
router.delete('/:id',
    authenticateToken,
    authorizeRoles('admin_client', 'super_admin'), // CORRIGÉ : admin_client peut supprimer
    photoController.deletePhoto
);

module.exports = router;











// // backend/src/routes/photoRoutes.js
// const express = require('express');
// const router = express.Router();
// const { getConnection } = require('../config/db');
// const { authenticateToken, authorizeRoles } = require('../middleware/auth'); // Tes middlewares
// const upload = require('../config/multerConfig'); // Ton nouveau middleware Multer
// const path = require('path');
// const fs = require('fs');

// // --- POST /api/photos/upload : Uploader une photo avec métadonnées ---
// router.post('/upload', authenticateToken, upload.single('photo'), async (req, res) => {
//     let connection;
//     try {
//         if (!req.file) {
//             return res.status(400).json({ message: 'Aucun fichier photo n\'a été fourni.' });
//         }

//         const { product_name, quantity, product_type } = req.body;
//         const { client_id, role, siret } = req.user; // Assure-toi que ton token ou req.user contient client_id, role et siret

//         // Vérifie les données requises
//         if (!product_name || !quantity || !product_type || !siret) {
//             // Supprime le fichier si des données sont manquantes
//             fs.unlinkSync(req.file.path);
//             return res.status(400).json({ message: 'Toutes les métadonnées (nom produit, quantité, type, siret) sont requises.' });
//         }

//         connection = await getConnection();

//         // Insérer les métadonnées de la photo dans la base de données
//         const [result] = await connection.execute(
//             'INSERT INTO photos (siret, product_name, quantity, product_type, file_path, uploader_id, uploader_role) VALUES (?, ?, ?, ?, ?, ?, ?)',
//             [siret, product_name, parseFloat(quantity), product_type, req.file.path, client_id, role]
//         );

//         res.status(201).json({ 
//             message: 'Photo uploadée avec succès !',
//             photoId: result.insertId,
//             filePath: req.file.path // Retourne le chemin du fichier pour confirmation
//         });

//     } catch (error) {
//         console.error('Erreur lors de l\'upload de la photo:', error);
//         // Supprime le fichier si une erreur se produit après l'upload
//         if (req.file) {
//             fs.unlinkSync(req.file.path);
//         }
//         res.status(500).json({ message: 'Erreur serveur lors de l\'upload de la photo.' });
//     } finally {
//         if (connection) connection.release();
//     }
// });

// // --- GET /api/photos/client/:siret : Récupérer toutes les photos pour un client (par SIRET) ---
// // Seuls les admins ou les employés du client peuvent voir les photos de LEUR client.
// router.get('/client/:siret', authenticateToken, async (req, res) => {
//     let connection;
//     try {
//         const requestedSiret = req.params.siret;
//         const userSiret = req.user.siret; // Siret de l'utilisateur connecté

//         // L'utilisateur doit être admin ou l'employé rattaché au SIRET demandé
//         if (req.user.role !== 'admin' && requestedSiret !== userSiret) {
//             return res.status(403).json({ message: 'Accès non autorisé aux photos d\'un autre client.' });
//         }

//         connection = await getConnection();
//         const [rows] = await connection.execute(
//             'SELECT * FROM photos WHERE siret = ? ORDER BY capture_date DESC',
//             [requestedSiret]
//         );
//         res.json(rows);
//     } catch (error) {
//         console.error('Erreur lors de la récupération des photos:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la récupération des photos.' });
//     } finally {
//         if (connection) connection.release();
//     }
// });

// // --- DELETE /api/photos/:id : Supprimer une photo (Admin Client uniquement) ---
// router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
//     let connection;
//     try {
//         const photoId = req.params.id;
//         const userSiret = req.user.siret; // Siret de l'admin connecté

//         connection = await getConnection();

//         // 1. Vérifier si la photo existe et appartient au SIRET de l'admin connecté
//         const [photos] = await connection.execute(
//             'SELECT file_path FROM photos WHERE id = ? AND siret = ?',
//             [photoId, userSiret]
//         );

//         if (photos.length === 0) {
//             return res.status(404).json({ message: 'Photo non trouvée ou non autorisée pour suppression.' });
//         }

//         const filePathToDelete = photos[0].file_path;

//         // 2. Supprimer l'entrée de la base de données
//         await connection.execute('DELETE FROM photos WHERE id = ?', [photoId]);

//         // 3. Supprimer le fichier physique du serveur
//         if (fs.existsSync(filePathToDelete)) {
//             fs.unlinkSync(filePathToDelete);
//         } else {
//             console.warn(`Le fichier physique n'existe pas : ${filePathToDelete}`);
//         }
        
//         res.json({ message: 'Photo supprimée avec succès.' });

//     } catch (error) {
//         console.error('Erreur lors de la suppression de la photo:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la suppression de la photo.' });
//     } finally {
//         if (connection) connection.release();
//     }
// });

// module.exports = router;