// backend/src/routes/clientRoutes.js (pour le rôle 'client' / 'employee')
const express = require('express');
const router = express.Router();
const temperatureController = require('../controllers/temperatureController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Toutes les routes ici nécessitent le rôle 'client' (maintenant 'employee')
router.use(authenticateToken, authorizeRoles('client'));

// --- Gestion des relevés de température par l'employé lui-même ---
router.post('/temperatures', temperatureController.createTemperatureRecord); // L'employé peut créer ses propres relevés
router.get('/temperatures', temperatureController.getTemperatureRecordsByClient); // L'employé peut voir ses propres relevés
router.put('/temperatures/:id', temperatureController.updateTemperatureRecordByClient); // L'employé peut modifier ses propres relevés

// IMPORTANT: La suppression des relevés n'est PAS autorisée pour les employés.
// Donc, il n'y a PAS de route DELETE ici.
// router.delete('/temperatures/:id', temperatureController.deleteTemperatureRecordByClient); // Cette ligne est absente intentionnellement

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