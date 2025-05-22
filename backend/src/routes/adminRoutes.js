//// backend/src/routes/adminRoutes.js (pour super_admin uniquement)
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const temperatureController = require('../controllers/temperatureController'); // Importez le contrôleur de température
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Toutes les routes ici nécessitent le rôle 'super_admin'
router.use(authenticateToken, authorizeRoles('super_admin'));

// --- Gestion de TOUS les utilisateurs (par super_admin) ---
router.get('/users', userController.getAllUsersAdmin);
router.post('/users', userController.createUserAdmin);
router.put('/users/:id', userController.updateUserAdmin);
router.delete('/users/:id', userController.deleteUserAdmin);

// --- Gestion de TOUS les relevés de température (par super_admin) ---
// Le Super Admin peut voir tous les relevés
router.get('/temperatures', temperatureController.getTemperatureRecords); // Utilise la fonction générique
// Le Super Admin peut créer des relevés pour n'importe quel user_id (doit être fourni dans le body)
router.post('/temperatures', temperatureController.addTemperatureRecordByAdminClient); // Réutilise cette fonction car elle gère le user_id dans le body
// Le Super Admin peut modifier n'importe quel relevé (doit fournir user_id dans le body pour la vérification)
router.put('/temperatures/:id', temperatureController.updateTemperatureRecordForAdminClient); // Réutilise cette fonction
// Le Super Admin peut supprimer n'importe quel relevé
router.delete('/temperatures/:id', temperatureController.deleteTemperatureRecordForAdminClient); // Réutilise cette fonction

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