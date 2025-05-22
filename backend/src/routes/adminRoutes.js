// backend/src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const temperatureController = require('../controllers/temperatureController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Toutes les routes ici nécessitent le rôle 'super_admin'
router.use(authenticateToken, authorizeRoles('super_admin'));

// --- User Management (Super Admin) ---
// Récupérer tous les utilisateurs
router.get('/users', userController.getAllUsersAdmin);
// Créer un nouvel utilisateur
router.post('/users', userController.createUserAdmin);
// Mettre à jour un utilisateur
router.put('/users/:id', userController.updateUserAdmin);
// Supprimer un utilisateur
router.delete('/users/:id', userController.deleteUserAdmin);

// --- Temperature Record Management (Super Admin) ---
// Récupérer tous les relevés de température
router.get('/temperatures', temperatureController.getAllTemperatureRecordsAdmin);
// Ajouter un relevé de température
router.post('/temperatures', temperatureController.addTemperatureRecordAdmin);
// Mettre à jour un relevé de température
router.put('/temperatures/:id', temperatureController.updateTemperatureRecordAdmin);
// Supprimer un relevé de température
router.delete('/temperatures/:id', temperatureController.deleteTemperatureRecordAdmin);

module.exports = router;

    






// // backend/src/routes/adminRoutes.js (for super_admin only)
// const express = require('express');
// const router = express.Router();
// const userController = require('../controllers/userController');
// const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// // Routes for Super Admin to manage ALL users
// router.get('/users', authenticateToken, authorizeRoles('super_admin'), userController.getAllUsersAdmin);
// router.post('/users', authenticateToken, authorizeRoles('super_admin'), userController.createUserAdmin);
// router.put('/users/:id', authenticateToken, authorizeRoles('super_admin'), userController.updateUserAdmin);
// router.delete('/users/:id', authenticateToken, authorizeRoles('super_admin'), userController.deleteUserAdmin);

// // Add other super_admin specific routes here if needed (e.g., global settings)

// module.exports = router;