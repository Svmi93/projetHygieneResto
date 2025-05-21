// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../config/db');
const { jwtSecret } = require('../config/jwt'); // Make sure this file exists and exports jwtSecret

// Middleware for password validation
const validatePassword = (req, res, next) => {
  const { password } = req.body;
  // This regex enforces: at least 14 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/~`])[A-Za-z\d!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/~`]{14,}$/;

  if (!password || !passwordRegex.test(password)) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 14 caractères, dont une majuscule, une minuscule, un chiffre et un caractère spécial.' });
  }
  next(); // If password is valid, proceed to the next middleware/route handler
};

// Route d'inscription (Créer un nouvel utilisateur)
router.post('/register', validatePassword, async (req, res) => {
  const { nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password, role } = req.body;

  // Basic validation for required fields
  if (!email || !password || !nom_entreprise || !nom_client || !prenom_client) {
    return res.status(400).json({ message: 'Veuillez fournir tous les champs requis (email, mot de passe, nom entreprise, nom client, prénom client).' });
  }

  try {
    const pool = await getConnection();

    // Check if user already exists
    const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Determine the user's role (default to 'client' if not provided or invalid)
    const userRole = ['super_admin', 'admin', 'client'].includes(role) ? role : 'client';

    // Insert new user into the database
    const [result] = await pool.execute(
      'INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, userRole]
    );

    res.status(201).json({ message: 'Utilisateur enregistré avec succès.', userId: result.insertId });

  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'enregistrement.' });
  }
});

// Route de connexion
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Veuillez fournir l\'email et le mot de passe.' });
  }

  try {
    const pool = await getConnection();

    // Find user by email
    const [users] = await pool.execute('SELECT id, email, password_hash, role FROM users WHERE email = ?', [email]);
    const user = users[0];

    if (!user) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });
    }

    // Compare provided password with hashed password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });
    }

    // Generate a JWT
    const token = jwt.sign(
      { id: user.id, role: user.role }, // Payload of the token
      jwtSecret,                        // Secret key
      { expiresIn: '1h' }               // Token expiration
    );

    res.json({ message: 'Connexion réussie.', token, role: user.role, userId: user.id });

  } catch (error) {
    console.error('Erreur lors de la connexion de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
  }
});

module.exports = router;