// backend/src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const temperatureController = require('../controllers/temperatureController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth'); // Chemin corrigé vers 'auth.js'

// Toutes les routes ici nécessitent le rôle 'super_admin'
// Ce middleware s'applique à toutes les routes définies après lui dans ce routeur
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








