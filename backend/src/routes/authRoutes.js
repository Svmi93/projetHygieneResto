const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth'); // IMPORTANT: Assurez-vous d'importer le middleware d'authentification ici
const multer = require('multer'); // Importez multer

// Configurez multer pour le stockage en mémoire.
// Firebase Storage a besoin du buffer du fichier, donc le stockage en mémoire est idéal.
const upload = multer({ storage: multer.memoryStorage() });

// Route pour l'enregistrement d'un nouvel utilisateur avec upload de logo
// 'logo' doit correspondre au nom de l'input de type file dans votre formulaire frontend.
router.post('/register', upload.single('logo'), authController.register);

// Route pour la connexion de l'utilisateur
router.post('/login', authController.login);

// Route pour vérifier la validité du token et récupérer les informations complètes de l'utilisateur
// authenticateToken valide le token et peuple req.user avec le payload du JWT.
// authController.verifyToken utilise ensuite req.user.id pour récupérer le profil complet depuis la DB.
router.get('/verify-token', authenticateToken, authController.verifyToken);

module.exports = router;








