// backend/src/routes/equipmentRoutes.js
const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth'); // CORRIGÉ : Le chemin doit pointer vers 'auth.js'

// --- Routes pour Admin Client (gestion de ses propres équipements) ---
// Ces routes nécessitent le rôle 'admin_client'
router.get('/admin-client/equipments', authenticateToken, authorizeRoles('admin_client'), equipmentController.getEquipmentsForAdminClient);
router.post('/admin-client/equipments', authenticateToken, authorizeRoles('admin_client'), equipmentController.createEquipment);
router.put('/admin-client/equipments/:id', authenticateToken, authorizeRoles('admin_client'), equipmentController.updateEquipment);
router.delete('/admin-client/equipments/:id', authenticateToken, authorizeRoles('admin_client'), equipmentController.deleteEquipment);

// --- Route pour les localisations d'employés ---
// Cette route est destinée aux utilisateurs avec le rôle 'employer' pour récupérer leurs localisations/équipements.
// Elle sera accessible via /api/employer/my-locations car le routeur est monté sous /api.
router.get('/employer/my-locations', authenticateToken, authorizeRoles('employer'), equipmentController.getEmployeeLocations);

module.exports = router;






