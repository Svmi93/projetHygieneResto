// backend/src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../config/db'); // Assurez-vous que le chemin vers db.js est correct

// Fonction de connexion de l'utilisateur
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const pool = await getConnection();
        // Récupérer l'utilisateur par email, y compris son SIRET pour les admin_client
        const [users] = await pool.execute('SELECT id, email, password_hash, role, siret FROM users WHERE email = ?', [email]);
        const user = users[0];

        // Vérifier si l'utilisateur existe
        if (!user) {
            console.log(`Tentative de connexion échouée: utilisateur non trouvé pour l'email ${email}`);
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        // Vérifier le mot de passe
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            console.log(`Tentative de connexion échouée: mot de passe incorrect pour l'email ${email}`);
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        // Préparer le payload du JWT
        const jwtPayload = {
            id: user.id,
            role: user.role,
        };

        // Si l'utilisateur est un admin_client, inclure son SIRET dans le payload comme client_id
        // C'est crucial pour les vérifications d'autorisation basées sur le SIRET
        if (user.role === 'admin_client' && user.siret) {
            jwtPayload.client_id = user.siret;
        }

        // Signer le token JWT
        const token = jwt.sign(
            jwtPayload,
            process.env.JWT_SECRET, // Assurez-vous que JWT_SECRET est défini dans vos variables d'environnement
            { expiresIn: '8h' } // Le token expire après 8 heures
        );

        // Renvoyer la réponse de succès avec le token, le rôle, l'ID et le SIRET (si admin_client)
        res.status(200).json({
            message: 'Connexion réussie',
            token,
            user: { // Renvoyer les informations de l'utilisateur sous un objet 'user'
                id: user.id,
                email: user.email,
                role: user.role,
                siret: user.role === 'admin_client' ? user.siret : undefined // Renvoyer le siret seulement si l'utilisateur est un admin_client
            }
        });

    } catch (error) {
        console.error('Erreur serveur lors de la connexion de l\'utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
    }
};

// Fonction d'enregistrement d'un nouvel utilisateur
// Si vous avez une route /register, cette fonction devrait être appelée par cette route.
exports.register = async (req, res) => {
    const { nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password, role, admin_client_siret } = req.body;

    // Validation de base
    if (!nom_entreprise || !nom_client || !prenom_client || !email || !password || !role) {
        return res.status(400).json({ message: 'Tous les champs obligatoires sont requis.' });
    }

    try {
        const pool = await getConnection();

        // Vérifier si l'utilisateur existe déjà
        const [existingUser] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'Un utilisateur avec cet email existe déjà.' });
        }

        // Valider le SIRET pour le rôle admin_client
        if (role === 'admin_client' && (!siret || siret.length !== 14)) {
            return res.status(400).json({ message: 'Le SIRET est obligatoire et doit contenir 14 chiffres pour un rôle admin_client.' });
        }
        // Valider admin_client_siret pour le rôle employer
        if (role === 'employer' && (!admin_client_siret || admin_client_siret.length !== 14)) {
            return res.status(400).json({ message: 'Le SIRET de l\'admin client est obligatoire et doit contenir 14 chiffres pour un rôle employer.' });
        }
        // Assurer que le SIRET est unique si fourni pour admin_client
        if (role === 'admin_client' && siret) {
            const [existingSiret] = await pool.execute('SELECT id FROM users WHERE siret = ?', [siret]);
            if (existingSiret.length > 0) {
                return res.status(409).json({ message: 'Un autre admin_client utilise déjà ce SIRET.' });
            }
        }
        // Assurer que admin_client_siret existe dans la table users pour employer
        if (role === 'employer' && admin_client_siret) {
            const [adminClientExists] = await pool.execute('SELECT id FROM users WHERE siret = ? AND role = "admin_client"', [admin_client_siret]);
            if (adminClientExists.length === 0) {
                return res.status(400).json({ message: 'Le SIRET de l\'admin client spécifié n\'existe pas ou n\'est pas valide.' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Convertir les valeurs potentiellement indéfinies ou vides en null pour la base de données
        const finalTelephone = telephone || null;
        const finalAdresse = adresse || null;
        const finalSiret = siret || null;
        const finalAdminClientSiret = admin_client_siret || null;

        // Insérer le nouvel utilisateur dans la base de données
        const [result] = await pool.execute(
            'INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, role, admin_client_siret) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                nom_entreprise,
                nom_client,
                prenom_client,
                email,
                finalTelephone,
                finalAdresse,
                finalSiret,
                hashedPassword,
                role,
                finalAdminClientSiret
            ]
        );

        // Préparer le payload du JWT pour le nouvel utilisateur
        const jwtPayload = {
            id: result.insertId,
            role: role,
        };

        if (role === 'admin_client' && siret) {
            jwtPayload.client_id = siret;
        }

        const token = jwt.sign(
            jwtPayload,
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.status(201).json({
            message: 'Utilisateur enregistré avec succès.',
            token, // Renvoyer le token après l'inscription
            user: { // Renvoyer les informations de l'utilisateur
                id: result.insertId,
                email: email,
                role: role,
                siret: role === 'admin_client' ? siret : undefined
            }
        });

    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de l\'utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'enregistrement.' });
    }
};


// --- NOUVELLE FONCTION POUR VÉRIFIER LE TOKEN ---
exports.verifyToken = async (req, res) => {
    // Le token est envoyé dans l'en-tête Authorization par le frontend
    // Nous allons le décoder ici.
    const token = req.header('x-auth-token') || req.body.token; // Peut aussi venir du corps si c'est comme ça que vous l'envoyez

    if (!token) {
        return res.status(401).json({ message: 'Aucun token fourni, autorisation refusée.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Si le token est valide, nous pouvons récupérer les informations de l'utilisateur
        // que nous avons stockées dans le payload du JWT.
        const pool = await getConnection();
        // Aller chercher l'utilisateur dans la base de données pour s'assurer que les données sont à jour
        const [users] = await pool.execute('SELECT id, email, role, siret FROM users WHERE id = ?', [decoded.id]);
        const user = users[0];

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        // Renvoyer les informations de l'utilisateur qui seront utilisées par le frontend
        res.status(200).json({
            message: 'Token valide.',
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                siret: user.role === 'admin_client' ? user.siret : undefined
            }
        });

    } catch (error) {
        console.error('Erreur de vérification du token:', error);
        // Gérer les erreurs de JWT spécifiques (ex: TokenExpiredError, JsonWebTokenError)
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expiré.' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token invalide.' });
        }
        res.status(500).json({ message: 'Erreur serveur lors de la vérification du token.' });
    }
};







// // backend/src/controllers/authController.js
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const { getConnection } = require('../config/db'); // Assurez-vous que le chemin vers db.js est correct

// // Fonction de connexion de l'utilisateur
// exports.login = async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         const pool = await getConnection();
//         // Récupérer l'utilisateur par email, y compris son SIRET pour les admin_client
//         const [users] = await pool.execute('SELECT id, email, password_hash, role, siret FROM users WHERE email = ?', [email]);
//         const user = users[0];

//         // Vérifier si l'utilisateur existe
//         if (!user) {
//             console.log(`Tentative de connexion échouée: utilisateur non trouvé pour l'email ${email}`);
//             return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
//         }

//         // Vérifier le mot de passe
//         const isMatch = await bcrypt.compare(password, user.password_hash);
//         if (!isMatch) {
//             console.log(`Tentative de connexion échouée: mot de passe incorrect pour l'email ${email}`);
//             return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
//         }

//         // Préparer le payload du JWT
//         const jwtPayload = {
//             id: user.id,
//             role: user.role,
//         };

//         // Si l'utilisateur est un admin_client, inclure son SIRET dans le payload comme client_id
//         // C'est crucial pour les vérifications d'autorisation basées sur le SIRET
//         if (user.role === 'admin_client' && user.siret) {
//             jwtPayload.client_id = user.siret;
//         }

//         // Signer le token JWT
//         const token = jwt.sign(
//             jwtPayload,
//             process.env.JWT_SECRET, // Assurez-vous que JWT_SECRET est défini dans vos variables d'environnement
//             { expiresIn: '8h' } // Le token expire après 8 heures
//         );

//         // Renvoyer la réponse de succès avec le token, le rôle, l'ID et le SIRET (si admin_client)
//         res.status(200).json({
//             message: 'Connexion réussie',
//             token,
//             role: user.role,
//             id: user.id,
//             // Renvoyer le siret seulement si l'utilisateur est un admin_client
//             siret: user.role === 'admin_client' ? user.siret : undefined
//         });

//     } catch (error) {
//         console.error('Erreur serveur lors de la connexion de l\'utilisateur:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
//     }
// };

// // Fonction d'enregistrement d'un nouvel utilisateur
// // Si vous avez une route /register, cette fonction devrait être appelée par cette route.
// exports.register = async (req, res) => {
//     const { nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password, role, admin_client_siret } = req.body;

//     // Validation de base
//     if (!nom_entreprise || !nom_client || !prenom_client || !email || !password || !role) {
//         return res.status(400).json({ message: 'Tous les champs obligatoires sont requis.' });
//     }

//     try {
//         const pool = await getConnection();

//         // Vérifier si l'utilisateur existe déjà
//         const [existingUser] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
//         if (existingUser.length > 0) {
//             return res.status(409).json({ message: 'Un utilisateur avec cet email existe déjà.' });
//         }

//         // Valider le SIRET pour le rôle admin_client
//         if (role === 'admin_client' && (!siret || siret.length !== 14)) {
//             return res.status(400).json({ message: 'Le SIRET est obligatoire et doit contenir 14 chiffres pour un rôle admin_client.' });
//         }
//         // Valider admin_client_siret pour le rôle employer
//         if (role === 'employer' && (!admin_client_siret || admin_client_siret.length !== 14)) {
//             return res.status(400).json({ message: 'Le SIRET de l\'admin client est obligatoire et doit contenir 14 chiffres pour un rôle employer.' });
//         }
//         // Assurer que le SIRET est unique si fourni pour admin_client
//         if (role === 'admin_client' && siret) {
//             const [existingSiret] = await pool.execute('SELECT id FROM users WHERE siret = ?', [siret]);
//             if (existingSiret.length > 0) {
//                 return res.status(409).json({ message: 'Un autre admin_client utilise déjà ce SIRET.' });
//             }
//         }
//         // Assurer que admin_client_siret existe dans la table users pour employer
//         if (role === 'employer' && admin_client_siret) {
//             const [adminClientExists] = await pool.execute('SELECT id FROM users WHERE siret = ? AND role = "admin_client"', [admin_client_siret]);
//             if (adminClientExists.length === 0) {
//                 return res.status(400).json({ message: 'Le SIRET de l\'admin client spécifié n\'existe pas ou n\'est pas valide.' });
//             }
//         }

//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Convertir les valeurs potentiellement indéfinies ou vides en null pour la base de données
//         const finalTelephone = telephone || null;
//         const finalAdresse = adresse || null;
//         const finalSiret = siret || null;
//         const finalAdminClientSiret = admin_client_siret || null;

//         // Insérer le nouvel utilisateur dans la base de données
//         const [result] = await pool.execute(
//             'INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, role, admin_client_siret) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
//             [
//                 nom_entreprise,
//                 nom_client,
//                 prenom_client,
//                 email,
//                 finalTelephone,
//                 finalAdresse,
//                 finalSiret,
//                 hashedPassword,
//                 role,
//                 finalAdminClientSiret
//             ]
//         );

//         const newUser = { id: result.insertId, nom_entreprise, nom_client, prenom_client, email, role };
//         res.status(201).json({ message: 'Utilisateur enregistré avec succès.', user: newUser });

//     } catch (error) {
//         console.error('Erreur lors de l\'enregistrement de l\'utilisateur:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de l\'enregistrement.' });
//     }
// };
