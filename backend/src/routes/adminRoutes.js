// backend/src/routes/adminRoutes.js (for super_admin only)
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Routes for Super Admin to manage ALL users
router.get('/users', authenticateToken, authorizeRoles('super_admin'), userController.getAllUsersAdmin);
router.post('/users', authenticateToken, authorizeRoles('super_admin'), userController.createUserAdmin);
router.put('/users/:id', authenticateToken, authorizeRoles('super_admin'), userController.updateUserAdmin);
router.delete('/users/:id', authenticateToken, authorizeRoles('super_admin'), userController.deleteUserAdmin);

// Add other super_admin specific routes here if needed (e.g., global settings)

module.exports = router;