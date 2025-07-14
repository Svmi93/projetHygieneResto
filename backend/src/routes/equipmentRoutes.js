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






// // backend/src/routes/equipmentRoutes.js
// const express = require('express');
// const router = express.Router();
// const equipmentController = require('../controllers/equipmentController');
// // Import with the correct names from authMiddleware.js
// const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// // Route for admin_client to get their equipments
// // Use authenticateToken and authorizeRoles directly
// router.route('/')
//     .get(authenticateToken, authorizeRoles('admin_client'), equipmentController.getEquipmentsForAdminClient)
//     .post(authenticateToken, authorizeRoles('admin_client'), equipmentController.createEquipment);

// // Routes for specific equipment by ID
// router.route('/:id')
//     .put(authenticateToken, authorizeRoles('admin_client'), equipmentController.updateEquipment)
//     .delete(authenticateToken, authorizeRoles('admin_client'), equipmentController.deleteEquipment);

// // This route seems to be for employees to fetch locations, likely equipment locations
// // Ensure this also uses authenticateToken and authorizeRoles if needed, or adjust
// // If employee doesn't have a specific role for this, remove authorizeRoles
// router.get('/my-locations', authenticateToken, authorizeRoles('employer'), equipmentController.getEmployeeLocations);

// module.exports = router;