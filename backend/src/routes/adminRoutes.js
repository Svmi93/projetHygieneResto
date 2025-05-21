// backend/src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Routes for user management by administrators
router.get('/users', authenticateToken, authorizeRoles('super_admin'), userController.getAllUsers);
router.post('/users', authenticateToken, authorizeRoles('super_admin'), userController.createUser);
router.get('/users/:id', authenticateToken, authorizeRoles('super_admin'), userController.getUserById);
router.put('/users/:id', authenticateToken, authorizeRoles('super_admin'), userController.updateUser);
router.delete('/users/:id', authenticateToken, authorizeRoles('super_admin'), userController.deleteUser);

module.exports = router;