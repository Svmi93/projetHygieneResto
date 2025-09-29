const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../config/db');
const admin = require('../config/firebaseAdmin'); // Assurez-vous que ceci est bien en haut

// Fonction utilitaire pour uploader un fichier sur Firebase Storage
const uploadToFirebase = async (file, folder = 'uploads') => {
    if (process.env.NODE_ENV === 'test') {
        // Mock upload during tests to bypass Firebase Storage
        return Promise.resolve(`https://fakeurl.com/${folder}/${Date.now()}_${file.originalname}`);
    }
    // --- DÉBUT DE LA CORRECTION ---
    // Vérifie si l'Admin SDK Firebase est initialisé
    if (!admin || !admin.storage) {
        console.warn('Firebase Admin SDK non initialisé, le fichier ne sera pas uploadé sur Firebase Storage.');
        return null; // Retourne null si Firebase n'est pas disponible
    }

    const bucket = admin.storage().bucket(); // Utilisez le bucket par défaut si configuré dans firebaseAdmin.js
    const fileName = `${folder}/${Date.now()}_${file.originalname}`;
    const fileUpload = bucket.file(fileName);

    const blobStream = fileUpload.createWriteStream({
        metadata: { contentType: file.mimetype },
        public: true, // Assurez-vous que le fichier est public si c'est l'intention
    });

    return new Promise((resolve, reject) => {
        blobStream.on('error', (error) => {
            console.error('Erreur lors de l\'upload vers Firebase Storage:', error);
            reject('Erreur lors de l\'upload de l\'image.');
        });

        blobStream.on('finish', () => {
            // L'URL publique sera générée automatiquement si 'public: true' est défini
            // ou si la politique de seau le permet. Sinon, vous pourriez avoir besoin de :
            // fileUpload.getSignedUrl(...) ou simplement l'URL standard si public.
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
            resolve(publicUrl);
        });

        blobStream.end(file.buffer); // Multer met le contenu du fichier dans file.buffer
    });
    // --- FIN DE LA CORRECTION ---
};

// Fonction de connexion de l'utilisateur
exports.login = async (req, res) => {
    const { email, password } = req.body;

    console.log('Login request received for email:', email);

    try {
        const pool = await getConnection();
        // Récupérer toutes les informations nécessaires de l'utilisateur
        const [users] = await pool.execute(
            'SELECT id, email, password_hash, role, siret, nom_client, prenom_client, nom_entreprise, logo_url, admin_client_siret FROM users WHERE email = ?',
            [email]
        );
        const user = users[0];

        if (!user) {
            console.log(`Login attempt failed: user not found for email ${email}`);
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            console.log(`Login attempt failed: incorrect password for email ${email}`);
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        // Préparer le payload du JWT
        const jwtPayload = {
            id: user.id,
            role: user.role,
        };

        // Inclure le SIRET pour les admin_client dans le payload
        if (user.role === 'admin_client' && user.siret) {
            jwtPayload.client_id = user.siret;
        }
        // Inclure le SIRET de l'admin_client pour les employés
        if (user.role === 'employer' && user.admin_client_siret) {
            jwtPayload.client_id = user.admin_client_siret;
        }

        const token = jwt.sign(
            jwtPayload,
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        // Déterminer l'URL du logo à renvoyer
        let finalLogoUrl = user.logo_url;
        if (user.role === 'employer' && user.admin_client_siret) {
            // Si c'est un employé, récupérer le logo de l'admin_client associé
            const [adminClients] = await pool.execute('SELECT logo_url FROM users WHERE siret = ? AND role = "admin_client"', [user.admin_client_siret]);
            if (adminClients.length > 0) {
                finalLogoUrl = adminClients[0].logo_url;
            } else {
                finalLogoUrl = null; // Aucun logo trouvé pour l'admin_client
            }
        }

        console.log('Login successful for email:', email);

        res.status(200).json({
            message: 'Connexion réussie',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                nom_client: user.nom_client,
                prenom_client: user.prenom_client,
                nom_entreprise: user.nom_entreprise,
                siret: user.siret,
                logoUrl: finalLogoUrl, // L'URL du logo à utiliser
                admin_client_siret: user.admin_client_siret // Pour les employés
            }
        });

    } catch (error) {
        console.error('Server error during user login:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
    }
};

// Fonction d'enregistrement d'un nouvel utilisateur
exports.register = async (req, res) => {
    const { nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password, role, admin_client_siret } = req.body;
    const logoFile = req.file; // Le fichier sera ici grâce à Multer

    // Validation de base
    if (!nom_entreprise || !nom_client || !prenom_client || !email || !password || !role) {
        return res.status(400).json({ message: 'Tous les champs obligatoires sont requis.' });
    }

    if (role === 'admin_client' && !logoFile) {
        // --- DÉBUT DE LA CORRECTION ---
        // Permettre l'enregistrement sans logo en développement si Firebase n'est pas initialisé
        if (!admin || !admin.storage) {
            console.warn("Logo de l'entreprise manquant pour Admin Client, mais Firebase SDK non initialisé. L'enregistrement continuera sans upload de logo.");
            // Ne pas retourner d'erreur ici, laisser la création de l'utilisateur se faire sans logo
        } else {
            return res.status(400).json({ message: 'Le logo de l\'entreprise est requis pour un Admin Client lorsque Firebase est configuré.' });
        }
        // --- FIN DE LA CORRECTION ---
    }

    try {
        const pool = await getConnection();

        // Vérifier si l'utilisateur existe déjà par email
        const [existingUser] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            // Instead of returning 409, return 200 with existing user info to allow idempotent registration
            const [existingUserData] = await pool.execute('SELECT id, email, role, nom_client, prenom_client, nom_entreprise, siret, logo_url, admin_client_siret FROM users WHERE email = ?', [email]);
            const user = existingUserData[0];
            return res.status(200).json({
                message: 'Utilisateur déjà enregistré.',
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    nom_client: user.nom_client,
                    prenom_client: user.prenom_client,
                    nom_entreprise: user.nom_entreprise,
                    siret: user.siret,
                    logoUrl: user.logo_url,
                    admin_client_siret: user.admin_client_siret
                }
            });
        }

        // Valider le SIRET pour le rôle admin_client
        if (role === 'admin_client') {
            if (!siret || siret.length !== 14) {
                return res.status(400).json({ message: 'Le SIRET est obligatoire et doit contenir 14 chiffres pour un rôle admin_client.' });
            }
            // Assurer que le SIRET est unique pour admin_client
            const [existingSiret] = await pool.execute('SELECT id FROM users WHERE siret = ?', [siret]);
            if (existingSiret.length > 0) {
                return res.status(409).json({ message: 'Un autre admin_client utilise déjà ce SIRET.' });
            }
        }

        // Valider admin_client_siret pour le rôle employer
        if (role === 'employer') {
            if (!admin_client_siret || admin_client_siret.length !== 14) {
                return res.status(400).json({ message: 'Le SIRET de l\'admin client est obligatoire et doit contenir 14 chiffres pour un rôle employer.' });
            }
            // Assurer que admin_client_siret existe dans la table users pour employer
            const [adminClientExists] = await pool.execute('SELECT id FROM users WHERE siret = ? AND role = "admin_client"', [admin_client_siret]);
            if (adminClientExists.length === 0) {
                return res.status(400).json({ message: 'Le SIRET de l\'admin client spécifié n\'existe pas ou n\'est pas valide.' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let logoUrl = null;

        // Si un fichier logo est fourni (pour admin_client), l'uploader
        if (logoFile) {
            logoUrl = await uploadToFirebase(logoFile, 'company_logos');
        }

        // Convertir les valeurs potentiellement indéfinies ou vides en null pour la base de données
        const finalTelephone = telephone || null;
        const finalAdresse = adresse || null;
        const finalSiret = siret || null;
        const finalAdminClientSiret = admin_client_siret || null;

        // Insérer le nouvel utilisateur dans la base de données
        const [result] = await pool.execute(
            'INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, role, admin_client_siret, logo_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
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
                finalAdminClientSiret,
                logoUrl // Enregistrer l'URL du logo
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
        if (role === 'employer' && admin_client_siret) {
            jwtPayload.client_id = admin_client_siret;
        }

        const token = jwt.sign(
            jwtPayload,
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.status(201).json({
            message: 'Utilisateur enregistré avec succès.',
            token,
            user: {
                id: result.insertId,
                email: email,
                role: role,
                nom_client: nom_client,
                prenom_client: prenom_client,
                nom_entreprise: nom_entreprise,
                siret: finalSiret,
                logoUrl: logoUrl, // Inclure l'URL du logo dans la réponse
                admin_client_siret: finalAdminClientSiret
            }
        });

    } catch (error) {
        console.error('Server error during user registration:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'enregistrement.' });
    }
};

// NOUVELLE FONCTION : Récupérer les informations complètes de l'utilisateur après vérification du token
// Cette fonction sera appelée par la route /verify-token après que le middleware authenticateToken ait validé le token.
exports.verifyToken = async (req, res) => {
    console.log('verifyToken: Request received');
    // req.user est peuplé par le middleware authenticateToken avec le payload du JWT (id, role, client_id)
    const userId = req.user.id;
    const userRole = req.user.role;
    console.log(`verifyToken: User ID from token: ${userId}, role: ${userRole}`);

    try {
        const pool = await getConnection();
        console.log('verifyToken: Database connection established');
        // Récupérer toutes les informations nécessaires de l'utilisateur à partir de la base de données
        const [users] = await pool.execute(
            'SELECT id, email, role, nom_client, prenom_client, nom_entreprise, siret, logo_url, admin_client_siret FROM users WHERE id = ?',
            [userId]
        );
        console.log(`verifyToken: User query result count: ${users.length}`);

        if (users.length === 0) {
            console.log('verifyToken: User not found');
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }
        const user = users[0];

        // Déterminer l'URL du logo à renvoyer
        let finalLogoUrl = user.logo_url;
        if (user.role === 'employer' && user.admin_client_siret) {
            // Si c'est un employé, récupérer le logo de l'admin_client associé
            const [adminClients] = await pool.execute('SELECT logo_url FROM users WHERE siret = ? AND role = "admin_client"', [user.admin_client_siret]);
            if (adminClients.length > 0) {
                finalLogoUrl = adminClients[0].logo_url;
            } else {
                finalLogoUrl = null; // Aucun logo trouvé pour l'admin_client
            }
        }

        const userProfile = {
            id: user.id,
            email: user.email,
            role: user.role,
            nom_client: user.nom_client,
            prenom_client: user.prenom_client,
            nom_entreprise: user.nom_entreprise,
            siret: user.siret,
            logoUrl: finalLogoUrl, // L'URL du logo à utiliser
            admin_client_siret: user.admin_client_siret
        };
        console.log('verifyToken: Sending user profile response');
        res.status(200).json({ message: 'Token valide', user: userProfile });

    } catch (error) {
        console.error('Server error during token verification and profile retrieval:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la vérification du token.' });
    }
};








