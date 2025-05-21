// backend/src/routes/clientRoutes.js (for client role)
const express = require('express');
const router = express.Router();
const temperatureController = require('../controllers/temperatureController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// All routes here require client role
router.use(authenticateToken, authorizeRoles('client'));

// --- Temperature Records Management (by client themselves) ---
router.post('/temperatures', temperatureController.createTemperatureRecord);
router.get('/temperatures', temperatureController.getTemperatureRecordsByClient);
router.put('/temperatures/:id', temperatureController.updateTemperatureRecordByClient);
router.delete('/temperatures/:id', temperatureController.deleteTemperatureRecordByClient);

module.exports = router;