// backend/src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Route pour récupérer le profil de l'utilisateur connecté
router.get('/me', authenticateToken, userController.getMe);

module.exports = router;
