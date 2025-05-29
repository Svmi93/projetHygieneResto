// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../config/db');

// Register a new user
router.post('/register', async (req, res) => {
    const { nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password, role, admin_client_siret } = req.body;

    // Basic validation
    if (!nom_entreprise || !nom_client || !prenom_client || !email || !password || !role) {
        return res.status(400).json({ message: 'Tous les champs obligatoires sont requis.' });
    }

    try {
        const pool = await getConnection();

        // Check if user already exists
        const [existingUser] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'Un utilisateur avec cet email existe déjà.' });
        }

        // Validate SIRET for admin_client role
        if (role === 'admin_client' && (!siret || siret.length !== 14)) {
            return res.status(400).json({ message: 'Le SIRET est obligatoire et doit contenir 14 chiffres pour un rôle admin_client.' });
        }
        // Validate admin_client_siret for employer role
        if (role === 'employer' && (!admin_client_siret || admin_client_siret.length !== 14)) {
            return res.status(400).json({ message: 'Le SIRET de l\'admin client est obligatoire et doit contenir 14 chiffres pour un rôle employer.' });
        }
        // Ensure SIRET is unique if provided for admin_client
        if (role === 'admin_client' && siret) {
            const [existingSiret] = await pool.execute('SELECT id FROM users WHERE siret = ?', [siret]);
            if (existingSiret.length > 0) {
                return res.status(409).json({ message: 'Un autre admin_client utilise déjà ce SIRET.' });
            }
        }
        // Ensure admin_client_siret exists in users table for employer
        if (role === 'employer' && admin_client_siret) {
            const [adminClientExists] = await pool.execute('SELECT id FROM users WHERE siret = ? AND role = "admin_client"', [admin_client_siret]);
            if (adminClientExists.length === 0) {
                return res.status(400).json({ message: 'Le SIRET de l\'admin client spécifié n\'existe pas ou n\'est pas valide.' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Convert any potentially undefined or empty string values to null for database insertion
        const finalTelephone = telephone || null;
        const finalAdresse = adresse || null;
        const finalSiret = siret || null; // Will be null if siret is undefined or an empty string
        const finalAdminClientSiret = admin_client_siret || null; // Will be null if admin_client_siret is undefined or an empty string

        // Insert new user into the database
        const [result] = await pool.execute(
            'INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, role, admin_client_siret) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                nom_entreprise,
                nom_client,
                prenom_client,
                email,
                finalTelephone,    // Use the potentially null value
                finalAdresse,      // Use the potentially null value
                finalSiret,        // Use the potentially null value
                hashedPassword,
                role,
                finalAdminClientSiret // Use the potentially null value
            ]
        );

        const newUser = { id: result.insertId, nom_entreprise, nom_client, prenom_client, email, role };
        res.status(201).json({ message: 'Utilisateur enregistré avec succès.', user: newUser });

    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de l\'utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'enregistrement.' });
    }
});

// User login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const pool = await getConnection();
        const [users] = await pool.execute('SELECT id, email, password_hash, role FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (!user) {
            console.log(`Utilisateur non trouvé pour l'email: ${email}`);
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            console.log(`Mot de passe incorrect pour l'email: ${email}`);
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.status(200).json({ message: 'Connexion réussie', token, role: user.role });

    } catch (error) {
        console.error('Erreur lors de la connexion de l\'utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
    }
});

module.exports = router;








// // backend/src/routes/authRoutes.js
// const express = require('express');
// const router = express.Router();
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const { getConnection } = require('../config/db');

// // Register a new user
// router.post('/register', async (req, res) => {
//     const { nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password, role, admin_client_siret } = req.body;

//     // Basic validation
//     if (!nom_entreprise || !nom_client || !prenom_client || !email || !password || !role) {
//         return res.status(400).json({ message: 'Tous les champs obligatoires sont requis.' });
//     }

//     try {
//         const pool = await getConnection();

//         // Check if user already exists
//         const [existingUser] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
//         if (existingUser.length > 0) {
//             return res.status(409).json({ message: 'Un utilisateur avec cet email existe déjà.' });
//         }

//         // Validate SIRET for admin_client role
//         if (role === 'admin_client' && (!siret || siret.length !== 14)) {
//             return res.status(400).json({ message: 'Le SIRET est obligatoire et doit contenir 14 chiffres pour un rôle admin_client.' });
//         }
//         // Validate admin_client_siret for employer role
//         if (role === 'employer' && (!admin_client_siret || admin_client_siret.length !== 14)) {
//             return res.status(400).json({ message: 'Le SIRET de l\'admin client est obligatoire et doit contenir 14 chiffres pour un rôle employer.' });
//         }
//         // Ensure SIRET is unique if provided for admin_client
//         if (role === 'admin_client' && siret) {
//             const [existingSiret] = await pool.execute('SELECT id FROM users WHERE siret = ?', [siret]);
//             if (existingSiret.length > 0) {
//                 return res.status(409).json({ message: 'Un autre admin_client utilise déjà ce SIRET.' });
//             }
//         }
//         // Ensure admin_client_siret exists in users table for employer
//         if (role === 'employer' && admin_client_siret) {
//             const [adminClientExists] = await pool.execute('SELECT id FROM users WHERE siret = ? AND role = "admin_client"', [admin_client_siret]);
//             if (adminClientExists.length === 0) {
//                 return res.status(400).json({ message: 'Le SIRET de l\'admin client spécifié n\'existe pas ou n\'est pas valide.' });
//             }
//         }

//         const hashedPassword = await bcrypt.hash(password, 10);

//         // --- START MODIFICATION ---
//         // Convert any potentially undefined values to null for database insertion
//         const finalTelephone = telephone || null;
//         const finalAdresse = adresse || null;
//         const finalSiret = siret || null; // Will be null if siret is undefined or an empty string
//         const finalAdminClientSiret = admin_client_siret || null; // Will be null if admin_client_siret is undefined or an empty string
//         // --- END MODIFICATION ---

//         // Insert new user into the database
//         const [result] = await pool.execute(
//             'INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, role, admin_client_siret) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
//             [
//                 nom_entreprise,
//                 nom_client,
//                 prenom_client,
//                 email,
//                 finalTelephone,    // Use the potentially null value
//                 finalAdresse,      // Use the potentially null value
//                 finalSiret,        // Use the potentially null value
//                 hashedPassword,
//                 role,
//                 finalAdminClientSiret // Use the potentially null value
//             ]
//         );

//         const newUser = { id: result.insertId, nom_entreprise, nom_client, prenom_client, email, role };
//         res.status(201).json({ message: 'Utilisateur enregistré avec succès.', user: newUser });

//     } catch (error) {
//         console.error('Erreur lors de l\'enregistrement de l\'utilisateur:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de l\'enregistrement.' });
//     }
// });

// // User login
// router.post('/login', async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         const pool = await getConnection();
//         const [users] = await pool.execute('SELECT id, email, password_hash, role FROM users WHERE email = ?', [email]);
//         const user = users[0];

//         if (!user) {
//             console.log(`Utilisateur non trouvé pour l'email: ${email}`);
//             return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
//         }

//         const isMatch = await bcrypt.compare(password, user.password_hash);
//         if (!isMatch) {
//             console.log(`Mot de passe incorrect pour l'email: ${email}`);
//             return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
//         }

//         const token = jwt.sign(
//             { id: user.id, role: user.role },
//             process.env.JWT_SECRET,
//             { expiresIn: '8h' }
//         );

//         res.status(200).json({ message: 'Connexion réussie', token, role: user.role });

//     } catch (error) {
//         console.error('Erreur lors de la connexion de l\'utilisateur:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
//     }
// });

// module.exports = router;