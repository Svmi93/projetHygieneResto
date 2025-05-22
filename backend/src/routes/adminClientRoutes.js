// backend/src/routes/adminClientRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const temperatureController = require('../controllers/temperatureController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Toutes les routes ici nécessitent le rôle 'admin_client'
router.use(authenticateToken, authorizeRoles('admin_client'));

// --- Employee Management (Admin Client) ---
// Récupérer les employés gérés par cet admin client
router.get('/employees', userController.getEmployeesByAdminClientId);
// Créer un nouvel employé
router.post('/employees', userController.createEmployeeByAdminClient);
// Mettre à jour un employé
router.put('/employees/:id', userController.updateEmployeeByAdminClient);
// Supprimer un employé
router.delete('/employees/:id', userController.deleteEmployeeByAdminClient);

// --- Temperature Record Management (Admin Client) ---
// Récupérer les relevés de température des employés gérés par cet admin client
router.get('/temperatures', temperatureController.getTemperatureRecordsForAdminClient);
// Ajouter un relevé de température pour un employé géré par cet admin client
router.post('/temperatures', temperatureController.addTemperatureRecordByAdminClient);
// Mettre à jour un relevé de température pour un employé géré par cet admin client
router.put('/temperatures/:id', temperatureController.updateTemperatureRecordForAdminClient);
// Supprimer un relevé de température pour un employé géré par cet admin client
router.delete('/temperatures/:id', temperatureController.deleteTemperatureRecordForAdminClient);

module.exports = router;







// // backend/src/routes/adminClientRoutes.js (pour le rôle admin_client)
// const express = require('express');
// const router = express.Router();
// const userController = require('../controllers/userController');
// const temperatureController = require('../controllers/temperatureController');
// const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// // Toutes les routes ici nécessitent le rôle 'admin_client'
// router.use(authenticateToken, authorizeRoles('admin_client'));

// // --- Gestion des employés (clients) rattachés à cet admin_client ---
// router.get('/employees', userController.getClientsByAdminClientId); // Renommé 'clients' en 'employees' pour la clarté
// router.post('/employees', userController.createClientByAdminClient);
// router.put('/employees/:id', userController.updateClientByAdminClient);
// router.delete('/employees/:id', userController.deleteClientByAdminClient);

// // --- Gestion des relevés de température des employés rattachés à cet admin_client ---
// router.get('/temperatures', temperatureController.getTemperatureRecordsForAdminClient);
// router.post('/temperatures', temperatureController.addTemperatureRecordByAdminClient);
// router.put('/temperatures/:id', temperatureController.updateTemperatureRecordForAdminClient);
// router.delete('/temperatures/:id', temperatureController.deleteTemperatureRecordForAdminClient);

// module.exports = router;





// // backend/src/routes/adminClientRoutes.js (for admin_client role)
// const express = require('express');
// const router = express.Router();
// const userController = require('../controllers/userController');
// const temperatureController = require('../controllers/temperatureController');
// const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// // All routes here require admin_client role
// router.use(authenticateToken, authorizeRoles('admin_client'));

// // --- Client User Management (by admin_client) ---
// router.get('/clients', userController.getClientsByAdminClientId);
// router.post('/clients', userController.createClientByAdminClient);
// router.put('/clients/:id', userController.updateClientByAdminClient);
// router.delete('/clients/:id', userController.deleteClientByAdminClient);

// // --- Temperature Records Management (for clients by admin_client) ---
// router.get('/temperatures', temperatureController.getTemperatureRecordsForAdminClient);
// router.post('/temperatures', temperatureController.addTemperatureRecordByAdminClient);
// router.put('/temperatures/:id', temperatureController.updateTemperatureRecordForAdminClient);
// router.delete('/temperatures/:id', temperatureController.deleteTemperatureRecordForAdminClient);

// module.exports = router;