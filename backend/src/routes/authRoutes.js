// // backend/src/routes/authRoutes.js
// const express = require('express');
// const router = express.Router();
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const { getConnection } = require('../config/db');
// const { jwtSecret } = require('../config/jwt');

// // Middleware for password validation
// const validatePassword = (req, res, next) => {
//   const { password } = req.body;
//   const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/~`])[A-Za-z\d!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/~`]{14,}$/;

//   if (!password || !passwordRegex.test(password)) {
//     return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 14 caractères, dont une majuscule, une minuscule, un chiffre et un caractère spécial.' });
//   }
//   next();
// };

// // Route d'inscription (Créer un nouvel utilisateur)
// router.post('/register', validatePassword, async (req, res) => {
//   const {
//     nom_entreprise,
//     nom_client,
//     prenom_client,
//     email,
//     password,
//     role,
//     // Ces champs doivent avoir des valeurs par défaut null si non fournis
//     telephone = null,
//     adresse = null,
//     siret = null,
//     admin_client_id = null
//   } = req.body;

//   if (!email || !password || !nom_entreprise || !nom_client || !prenom_client) {
//     return res.status(400).json({ message: 'Veuillez fournir tous les champs requis (email, mot de passe, nom entreprise, nom client, prénom client).' });
//   }

//   try {
//     const pool = await getConnection();
//     const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
//     if (existingUsers.length > 0) {
//       return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
//     }

//     const salt = await bcrypt.genSalt(10);
//     const password_hash = await bcrypt.hash(password, salt);

//     // Ensure role is valid (super_admin, admin_client, client) - Updated
//     const userRole = ['super_admin', 'admin_client', 'client'].includes(role) ? role : 'client';

//     const [result] = await pool.execute(
//       'INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, role, admin_client_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
//       // Ensure all parameters are explicitly defined, using null for optional ones
//       [nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, userRole, admin_client_id]
//     );

//     res.status(201).json({ message: 'Utilisateur enregistré avec succès.', userId: result.insertId });

//   } catch (error) {
//     console.error('Erreur lors de l\'enregistrement de l\'utilisateur:', error);
//     res.status(500).json({ message: 'Erreur serveur lors de l\'enregistrement.' });
//   }
// });

// // Route de connexion
// router.post('/login', async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({ message: 'Veuillez fournir l\'email et le mot de passe.' });
//   }

//   try {
//     const pool = await getConnection();
//     const [users] = await pool.execute('SELECT id, email, password_hash, role FROM users WHERE email = ?', [email]);
//     const user = users[0];

//     if (!user) {
//       return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });
//     }

//     const isMatch = await bcrypt.compare(password, user.password_hash);
//     if (!isMatch) {
//       return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });
//     }

//     const token = jwt.sign(
//       { id: user.id, role: user.role },
//       jwtSecret,
//       { expiresIn: '1h' }
//     );

//     res.json({ message: 'Connexion réussie.', token, role: user.role, userId: user.id });

//   } catch (error) {
//     console.error('Erreur lors de la connexion de l\'utilisateur:', error);
//     res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
//   }
// });

// module.exports = router;


// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router(); // <-- La variable 'router' est déclarée ici
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../config/db');
const { jwtSecret } = require('../config/jwt'); // Assurez-vous que ce chemin est correct

// Middleware for password validation
const validatePassword = (req, res, next) => {
  const { password } = req.body;
  // Regex pour mot de passe: au moins 14 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/~`])[A-Za-z\d!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/~`]{14,}$/;

  if (!password || !passwordRegex.test(password)) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 14 caractères, dont une majuscule, une minuscule, un chiffre et un caractère spécial.' });
  }
  next();
};

// Route d'inscription (Créer un nouvel utilisateur)
router.post('/register', validatePassword, async (req, res) => {
  const {
    nom_entreprise,
    nom_client,
    prenom_client,
    email,
    password,
    role,
    // Ces champs doivent avoir des valeurs par défaut null si non fournis
    telephone = null,
    adresse = null,
    siret = null,
    admin_client_id = null
  } = req.body;

  if (!email || !password || !nom_entreprise || !nom_client || !prenom_client) {
    return res.status(400).json({ message: 'Veuillez fournir tous les champs requis (email, mot de passe, nom entreprise, nom client, prénom client).' });
  }

  try {
    const pool = await getConnection();
    const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Ensure role is valid (super_admin, admin_client, client) - Updated
    const userRole = ['super_admin', 'admin_client', 'client'].includes(role) ? role : 'client';

    const [result] = await pool.execute(
      'INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, role, admin_client_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, userRole, admin_client_id]
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
    const [users] = await pool.execute('SELECT id, email, password_hash, role FROM users WHERE email = ?', [email]);
    const user = users[0];

    // Log temporaires pour le débogage de la connexion
    console.log('Tentative de connexion pour l\'email:', email);
    console.log('Utilisateur trouvé:', user ? 'Oui' : 'Non');

    if (!user) {
      console.log('Utilisateur non trouvé pour l\'email:', email);
      return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });
    }

    // IMPORTANT: Ne pas logger le mot de passe en clair en production!
    console.log('Mot de passe fourni (non haché):', password);
    console.log('Mot de passe haché en DB:', user.password_hash);

    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log('Comparaison de mot de passe (isMatch):', isMatch);

    if (!isMatch) {
      console.log('Mot de passe fourni ne correspond pas au hachage en DB.');
      return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      jwtSecret, // Assurez-vous que jwtSecret est bien défini et chargé
      { expiresIn: '1h' }
    );

    res.json({ message: 'Connexion réussie.', token, role: user.role, userId: user.id });

  } catch (error) {
    console.error('Erreur lors de la connexion de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
  }
});

module.exports = router;
