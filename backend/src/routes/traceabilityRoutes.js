// backend/src/routes/traceabilityRoutes.js
const express = require('express');
const router = express.Router();
const traceabilityController = require('../controllers/traceabilityController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth'); // Assurez-vous que le chemin est correct et que c'est bien 'auth.js'
const multer = require('multer'); // Pour la gestion des uploads de fichiers (photos)

// Configuration de Multer pour le stockage en mémoire (pour traitement ultérieur ou envoi à Firebase)
const upload = multer({
    storage: multer.memoryStorage(), // Stocke le fichier en mémoire sous forme de buffer
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite la taille du fichier à 5MB
});

// --- Routes pour la Traçabilité ---

// POST /api/traceability/add - Ajouter un nouvel enregistrement de traçabilité (avec photo)
// Accessible par 'employer', 'admin_client', 'super_admin'
router.post('/add',
    authenticateToken,
    authorizeRoles('employer', 'admin_client', 'super_admin'),
    upload.single('image'), // 'image' doit correspondre au nom du champ dans le FormData du frontend
    traceabilityController.addTraceabilityRecord
);

// GET /api/traceability/client/:siret - Récupérer les enregistrements de traçabilité pour un SIRET donné
// Accessible par 'admin_client' (pour ses propres établissements) et 'super_admin' (pour tous)
// Le SIRET sera extrait du token pour admin_client, ou passé en paramètre pour super_admin
router.get('/client/:siret',
    authenticateToken,
    authorizeRoles('admin_client', 'super_admin'),
    traceabilityController.getTraceabilityRecordsBySiret
);

// DELETE /api/traceability/:id - Supprimer un enregistrement de traçabilité
// Accessible par 'admin_client' (pour ses propres enregistrements) et 'super_admin' (pour tous)
router.delete('/:id',
    authenticateToken,
    authorizeRoles('admin_client', 'super_admin'),
    traceabilityController.deleteTraceabilityRecord
);

module.exports = router;
