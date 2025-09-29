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










