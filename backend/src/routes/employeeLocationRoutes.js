// backend/src/routes/employeeLocationRoutes.js (new file)
const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', authenticateToken, authorizeRoles('employer'), equipmentController.getEmployeeLocations);

module.exports = router;