// backend/src/routes/employeeRoutes.js (pour le rôle 'employer')
const express = require('express');
const router = express.Router();
const temperatureController = require('../controllers/temperatureController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Toutes les routes ici nécessitent le rôle 'employer'
router.use(authenticateToken, authorizeRoles('employer')); // CHANGED: 'client' to 'employer'

// --- Gestion des relevés de température par l'employé lui-même ---
// L'employé peut créer ses propres relevés
router.post('/temperatures', temperatureController.createTemperatureRecord);
// L'employé peut voir ses propres relevés
router.get('/temperatures', temperatureController.getTemperatureRecordsByClient);
// L'employé peut modifier ses propres relevés
router.put('/temperatures/:id', temperatureController.updateTemperatureRecordByClient);

// IMPORTANT: La suppression des relevés n'est PAS autorisée pour les employés.
// Donc, il n'y a PAS de route DELETE ici.

module.exports = router;







// // backend/src/routes/clientRoutes.js (for client role)
// const express = require('express');
// const router = express.Router();
// const temperatureController = require('../controllers/temperatureController');
// const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// // All routes here require client role
// router.use(authenticateToken, authorizeRoles('client'));

// // --- Temperature Records Management (by client themselves) ---
// router.post('/temperatures', temperatureController.createTemperatureRecord);
// router.get('/temperatures', temperatureController.getTemperatureRecordsByClient);
// router.put('/temperatures/:id', temperatureController.updateTemperatureRecordByClient);
// router.delete('/temperatures/:id', temperatureController.deleteTemperatureRecordByClient);

// module.exports = router;