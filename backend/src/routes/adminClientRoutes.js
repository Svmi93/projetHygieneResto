// backend/src/routes/adminClientRoutes.js (for admin_client role)
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const temperatureController = require('../controllers/temperatureController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// All routes here require admin_client role
router.use(authenticateToken, authorizeRoles('admin_client'));

// --- Client User Management (by admin_client) ---
router.get('/clients', userController.getClientsByAdminClientId);
router.post('/clients', userController.createClientByAdminClient);
router.put('/clients/:id', userController.updateClientByAdminClient);
router.delete('/clients/:id', userController.deleteClientByAdminClient);

// --- Temperature Records Management (for clients by admin_client) ---
router.get('/temperatures', temperatureController.getTemperatureRecordsForAdminClient);
router.post('/temperatures', temperatureController.addTemperatureRecordByAdminClient);
router.put('/temperatures/:id', temperatureController.updateTemperatureRecordForAdminClient);
router.delete('/temperatures/:id', temperatureController.deleteTemperatureRecordForAdminClient);

module.exports = router;