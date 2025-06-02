// backend/src/controllers/userController.js
const { getConnection } = require('../config/db');
const bcrypt = require('bcryptjs');

// Function to get user profile (used by /api/users/me)
exports.getProfile = async (req, res) => {
    try {
        const pool = await getConnection();
        // S'assure de ne pas retourner le hash du mot de passe
        const [rows] = await pool.execute(
            'SELECT id, nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role, admin_client_siret FROM users WHERE id = ?',
            [req.user.id]
        );
        if (rows.length > 0) {
            // Destructure pour exclure password_hash si jamais il était sélectionné par erreur
            const { password_hash, ...profile } = rows[0];
            res.json(profile);
        } else {
            res.status(404).json({ message: 'User not found.' });
        }
    } catch (error) {
        console.error('Erreur lors de la récupération du profil utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération du profil utilisateur.' });
    }
};

// --- Fonctions Super Admin ---
// Ces fonctions sont conçues pour être utilisées uniquement par un `super_admin`.
// Assurez-vous que les routes appelant ces fonctions sont protégées
// par le middleware `authorizeRoles('super_admin')`.

// Get all users (Super Admin only)
exports.getAllUsersAdmin = async (req, res) => {
    try {
        const pool = await getConnection();
        // Exclure password_hash de la sélection pour des raisons de sécurité
        const [users] = await pool.execute('SELECT id, nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role, admin_client_siret, created_at, updated_at FROM users');
        res.status(200).json(users);
    } catch (error) {
        console.error('Erreur lors de la récupération de tous les utilisateurs (Super Admin):', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des utilisateurs.' });
    }
};

// Create a new user (Super Admin only)
exports.createUserAdmin = async (req, res) => {
    const { nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password, role, admin_client_siret } = req.body;

    if (!nom_entreprise || !nom_client || !prenom_client || !email || !password || !role) {
        return res.status(400).json({ message: 'Tous les champs obligatoires sont requis.' });
    }

    try {
        const pool = await getConnection();
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

        // Convert any potentially undefined values to null for database insertion
        const finalTelephone = telephone || null;
        const finalAdresse = adresse || null;
        const finalSiret = siret || null; // Will be null if siret is undefined or an empty string
        const finalAdminClientSiret = admin_client_siret || null; // Will be null if admin_client_siret is undefined or an empty string

        const [result] = await pool.execute(
            'INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, role, admin_client_siret) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [nom_entreprise, nom_client, prenom_client, email, finalTelephone, finalAdresse, finalSiret, hashedPassword, role, finalAdminClientSiret]
        );

        res.status(201).json({ id: result.insertId, nom_entreprise, nom_client, prenom_client, email, role });
    } catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur (Super Admin):', error);
        res.status(500).json({ message: 'Erreur serveur lors de la création de l\'utilisateur.' });
    }
};

// Update a user (Super Admin only)
exports.updateUserAdmin = async (req, res) => {
    const { id } = req.params;
    const { nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password, role, admin_client_siret } = req.body;

    // Permettre la mise à jour même si un seul champ est fourni
    if (!nom_entreprise && !nom_client && !prenom_client && !email && !telephone && !adresse && !siret && !password && !role && !admin_client_siret) {
        return res.status(400).json({ message: 'Aucune donnée fournie pour la mise à jour.' });
    }

    try {
        const pool = await getConnection();

        // Fetch current user data to check role and SIRET constraints
        const [currentUser] = await pool.execute('SELECT siret, role FROM users WHERE id = ?', [id]);
        if (currentUser.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }
        const currentRole = currentUser[0].role;
        const currentSiret = currentUser[0].siret;

        // Validate SIRET for admin_client role if role is being changed to or is already admin_client
        if (role === 'admin_client' && (!siret || siret.length !== 14)) {
            return res.status(400).json({ message: 'Le SIRET est obligatoire et doit contenir 14 chiffres pour un rôle admin_client.' });
        }
        // Validate admin_client_siret for employer role if role is being changed to or is already employer
        if (role === 'employer' && (!admin_client_siret || admin_client_siret.length !== 14)) {
            return res.status(400).json({ message: 'Le SIRET de l\'admin client est obligatoire et doit contenir 14 chiffres pour un rôle employer.' });
        }
        // Ensure SIRET is unique if provided for admin_client and different from current user's SIRET
        if (role === 'admin_client' && siret && siret !== currentSiret) {
            const [existingSiret] = await pool.execute('SELECT id FROM users WHERE siret = ? AND id != ?', [siret, id]);
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

        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        const updates = [];
        const values = [];

        // Add fields to update dynamically
        if (nom_entreprise !== undefined) { updates.push('nom_entreprise = ?'); values.push(nom_entreprise); }
        if (nom_client !== undefined) { updates.push('nom_client = ?'); values.push(nom_client); }
        if (prenom_client !== undefined) { updates.push('prenom_client = ?'); values.push(prenom_client); }
        if (email !== undefined) { updates.push('email = ?'); values.push(email); }
        if (telephone !== undefined) { updates.push('telephone = ?'); values.push(telephone || null); }
        if (adresse !== undefined) { updates.push('adresse = ?'); values.push(adresse || null); }
        if (siret !== undefined) { updates.push('siret = ?'); values.push(siret || null); }
        if (password !== undefined) { updates.push('password_hash = ?'); values.push(hashedPassword); }
        if (role !== undefined) { updates.push('role = ?'); values.push(role); }
        if (admin_client_siret !== undefined) { updates.push('admin_client_siret = ?'); values.push(admin_client_siret || null); }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'Aucune donnée à mettre à jour.' });
        }

        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        values.push(id);

        const [result] = await pool.execute(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé ou aucune modification effectuée.' });
        }

        res.status(200).json({ message: 'Utilisateur mis à jour avec succès.', id: parseInt(id) });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur (Super Admin):', error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de l\'utilisateur.' });
    }
};

// Delete a user (Super Admin only)
exports.deleteUserAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }
        res.status(204).send(); // 204 No Content for successful deletion
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur (Super Admin):', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'utilisateur.' });
    }
};

// --- Fonctions Admin Client ---
// Ces fonctions sont conçues pour être utilisées uniquement par un `admin_client`.
// Assurez-vous que les routes appelant ces fonctions sont protégées
// par le middleware `authorizeRoles('admin_client')`.

// Get employees by admin client SIRET
exports.getEmployeesByAdminClientId = async (req, res) => {
    // OPTIMISATION: Récupérer le SIRET directement depuis le token (req.user.client_id)
    const adminClientSiret = req.user.client_id; // SIRET de l'admin_client connecté (depuis le JWT)
    if (!adminClientSiret) {
        return res.status(403).json({ message: 'Accès refusé: SIRET de l\'admin client manquant dans le token.' });
    }

    try {
        const pool = await getConnection();
        // Récupérer tous les utilisateurs avec le rôle 'employer' et le même admin_client_siret
        const [employees] = await pool.execute(
            'SELECT id, nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role, admin_client_siret FROM users WHERE role = "employer" AND admin_client_siret = ?',
            [adminClientSiret]
        );
        res.status(200).json(employees);
    } catch (error) {
        console.error('Erreur lors de la récupération des employés pour l\'admin client:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des employés.' });
    }
};

// MODIFIÉ ET OPTIMISÉ : Créer un nouvel employé pour l'admin_client authentifié
exports.createEmployeeByAdminClient = async (req, res) => {
    const { nom_client, prenom_client, email, telephone, adresse, password, role } = req.body; // 'role' est passé dans le body pour validation
    // Récupérer le SIRET de l'admin_client depuis le token de l'utilisateur authentifié
    const adminClientSiret = req.user.client_id;

    // 1. Validation de base des champs
    if (!nom_client || !prenom_client || !email || !password || !role) {
        return res.status(400).json({ message: 'Nom, prénom, email, mot de passe et rôle sont requis.' });
    }

    // 2. IMPORTANT : Vérifier que le rôle demandé est bien 'employer'
    if (role !== 'employer') {
        console.warn(`Tentative de création d'un rôle non autorisé par admin_client. Rôle demandé: ${role}, AdminClientSiret: ${adminClientSiret}`);
        return res.status(403).json({ message: 'Un admin client ne peut créer que des utilisateurs avec le rôle "employer".' });
    }

    // 3. Assurer que le SIRET de l'admin_client est bien présent dans le token
    if (!adminClientSiret) {
        return res.status(403).json({ message: 'Accès refusé: SIRET de l\'admin client manquant dans le token.' });
    }

    try {
        const pool = await getConnection();

        // Récupérer le nom de l'entreprise de l'admin client pour l'assigner à l'employé
        const [adminClientData] = await pool.execute('SELECT nom_entreprise FROM users WHERE siret = ? AND role = "admin_client"', [adminClientSiret]);
        if (adminClientData.length === 0) {
            return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini pour la création de l\'employé.' });
        }
        const nomEntreprise = adminClientData[0].nom_entreprise;

        // Vérifier si l'email existe déjà
        const [existingUser] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'Un utilisateur avec cet email existe déjà.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Convertir les champs optionnels en null si vides
        const finalTelephone = telephone || null;
        const finalAdresse = adresse || null;

        // Pour un employé, la colonne 'siret' doit être NULL, car il n'a pas son propre SIRET d'entreprise.
        // C'est la colonne 'admin_client_siret' qui le lie à l'admin client.
        const employeeSiret = null;

        // 4. Créer l'employé en attachant automatiquement son SIRET à celui de l'admin_client
        const [result] = await pool.execute(
            'INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, role, admin_client_siret) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                nomEntreprise, nom_client, prenom_client, email, finalTelephone, finalAdresse,
                employeeSiret, hashedPassword, 'employer', adminClientSiret // Le rôle est forcé à 'employer', le SIRET est celui de l'admin_client
            ]
        );

        const newUser = { id: result.insertId, nom_entreprise: nomEntreprise, nom_client, prenom_client, email, role: 'employer', admin_client_siret: adminClientSiret };
        res.status(201).json({ message: 'Employé créé avec succès.', user: newUser });

    } catch (error) {
        console.error('Erreur lors de la création d\'un employé par l\'admin client:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la création de l\'employé.' });
    }
};

// Update employee by admin client
exports.updateEmployeeByAdminClient = async (req, res) => {
    const { id } = req.params; // ID de l'employé à mettre à jour
    const adminClientId = req.user.id;
    const { nom_client, prenom_client, email, telephone, adresse, password } = req.body;

    if (!nom_client || !prenom_client || !email) {
        return res.status(400).json({ message: 'Nom, prénom et email sont requis pour la mise à jour de l\'employé.' });
    }

    try {
        const pool = await getConnection();
        // Récupérer le SIRET de l'admin_client connecté
        const [adminClientData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
        if (adminClientData.length === 0 || !adminClientData[0].siret) {
            return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
        }
        const adminClientSiret = adminClientData[0].siret;

        // Vérifier que l'employé à mettre à jour est bien rattaché à cet admin_client
        const [employeeToUpdate] = await pool.execute(
            'SELECT id FROM users WHERE id = ? AND role = "employer" AND admin_client_siret = ?',
            [id, adminClientSiret]
        );
        if (employeeToUpdate.length === 0) {
            return res.status(403).json({ message: 'Accès refusé. Cet employé n\'est pas géré par votre établissement ou n\'existe pas.' });
        }

        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // Convert any potentially undefined values to null for database update
        const finalTelephone = telephone || null;
        const finalAdresse = adresse || null;

        const [result] = await pool.execute(
            'UPDATE users SET nom_client = ?, prenom_client = ?, email = ?, telephone = ?, adresse = ?, password_hash = COALESCE(?, password_hash) WHERE id = ?',
            [nom_client, prenom_client, email, finalTelephone, finalAdresse, hashedPassword, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Employé non trouvé ou aucune modification effectuée.' });
        }

        res.status(200).json({ id: parseInt(id), nom_client, prenom_client, email });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'employé par l\'admin client:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de l\'employé.' });
    }
};

// Delete employee by admin client
exports.deleteEmployeeByAdminClient = async (req, res) => {
    const { id } = req.params; // ID de l'employé à supprimer
    const adminClientId = req.user.id;

    try {
        const pool = await getConnection();
        // Récupérer le SIRET de l'admin_client connecté
        const [adminClientData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
        if (adminClientData.length === 0 || !adminClientData[0].siret) {
            return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
        }
        const adminClientSiret = adminClientData[0].siret;

        // Vérifier que l'employé à supprimer est bien rattaché à cet admin_client
        const [employeeToDelete] = await pool.execute(
            'SELECT id FROM users WHERE id = ? AND role = "employer" AND admin_client_siret = ?',
            [id, adminClientSiret]
        );
        if (employeeToDelete.length === 0) {
            return res.status(403).json({ message: 'Accès refusé. Cet employé n\'est pas géré par votre établissement ou n\'existe pas.' });
        }

        const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Employé non trouvé.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'employé par l\'admin client:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'employé.' });
    }
};













// // backend/src/controllers/userController.js
// const { getConnection } = require('../config/db');
// const bcrypt = require('bcryptjs');

// // Function to get user profile (used by /api/users/me)
// exports.getProfile = async (req, res) => {
//     try {
//         const pool = await getConnection();
//         const [rows] = await pool.execute(
//             'SELECT id, nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role, admin_client_siret FROM users WHERE id = ?',
//             [req.user.id]
//         );
//         if (rows.length > 0) {
//             res.json(rows[0]);
//         } else {
//             res.status(404).json({ message: 'User not found.' });
//         }
//     } catch (error) {
//         console.error('Erreur lors de la récupération du profil utilisateur:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la récupération du profil utilisateur.' });
//     }
// };

// // --- Super Admin Functions ---

// // Get all users (Super Admin only)
// exports.getAllUsersAdmin = async (req, res) => {
//     try {
//         const pool = await getConnection();
//         const [users] = await pool.execute('SELECT id, nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role, admin_client_siret, created_at, updated_at FROM users');
//         res.status(200).json(users);
//     } catch (error) {
//         console.error('Erreur lors de la récupération de tous les utilisateurs (Super Admin):', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la récupération des utilisateurs.' });
//     }
// };

// // Create a new user (Super Admin only)
// exports.createUserAdmin = async (req, res) => {
//     const { nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password, role, admin_client_siret } = req.body;

//     if (!nom_entreprise || !nom_client || !prenom_client || !email || !password || !role) {
//         return res.status(400).json({ message: 'Tous les champs obligatoires sont requis.' });
//     }

//     try {
//         const pool = await getConnection();
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

//         // Convert any potentially undefined values to null for database insertion
//         const finalTelephone = telephone || null;
//         const finalAdresse = adresse || null;
//         const finalSiret = siret || null; // Will be null if siret is undefined or an empty string
//         const finalAdminClientSiret = admin_client_siret || null; // Will be null if admin_client_siret is undefined or an empty string

//         const [result] = await pool.execute(
//             'INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, role, admin_client_siret) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
//             [nom_entreprise, nom_client, prenom_client, email, finalTelephone, finalAdresse, finalSiret, hashedPassword, role, finalAdminClientSiret]
//         );

//         res.status(201).json({ id: result.insertId, nom_entreprise, nom_client, prenom_client, email, role });
//     } catch (error) {
//         console.error('Erreur lors de la création de l\'utilisateur (Super Admin):', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la création de l\'utilisateur.' });
//     }
// };

// // Update a user (Super Admin only)
// exports.updateUserAdmin = async (req, res) => {
//     const { id } = req.params;
//     const { nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password, role, admin_client_siret } = req.body;

//     if (!nom_entreprise || !nom_client || !prenom_client || !email || !role) {
//         return res.status(400).json({ message: 'Tous les champs obligatoires (sauf mot de passe) sont requis pour la mise à jour.' });
//     }

//     try {
//         const pool = await getConnection();

//         // Fetch current user data to check role and SIRET constraints
//         const [currentUser] = await pool.execute('SELECT siret, role FROM users WHERE id = ?', [id]);
//         if (currentUser.length === 0) {
//             return res.status(404).json({ message: 'Utilisateur non trouvé.' });
//         }
//         const currentRole = currentUser[0].role;
//         const currentSiret = currentUser[0].siret;

//         // Validate SIRET for admin_client role
//         if (role === 'admin_client' && (!siret || siret.length !== 14)) {
//             return res.status(400).json({ message: 'Le SIRET est obligatoire et doit contenir 14 chiffres pour un rôle admin_client.' });
//         }
//         // Validate admin_client_siret for employer role
//         if (role === 'employer' && (!admin_client_siret || admin_client_siret.length !== 14)) {
//             return res.status(400).json({ message: 'Le SIRET de l\'admin client est obligatoire et doit contenir 14 chiffres pour un rôle employer.' });
//         }
//         // Ensure SIRET is unique if provided for admin_client and different from current user's SIRET
//         if (role === 'admin_client' && siret && siret !== currentSiret) {
//             const [existingSiret] = await pool.execute('SELECT id FROM users WHERE siret = ? AND id != ?', [siret, id]);
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

//         let hashedPassword = null;
//         if (password) {
//             hashedPassword = await bcrypt.hash(password, 10);
//         }

//         // Convert any potentially undefined values to null for database update
//         const finalTelephone = telephone || null;
//         const finalAdresse = adresse || null;
//         const finalSiret = siret || null;
//         const finalAdminClientSiret = admin_client_siret || null;

//         const [result] = await pool.execute(
//             'UPDATE users SET nom_entreprise = ?, nom_client = ?, prenom_client = ?, email = ?, telephone = ?, adresse = ?, siret = ?, password_hash = COALESCE(?, password_hash), role = ?, admin_client_siret = ? WHERE id = ?',
//             [nom_entreprise, nom_client, prenom_client, email, finalTelephone, finalAdresse, finalSiret, hashedPassword, role, finalAdminClientSiret, id]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Utilisateur non trouvé ou aucune modification effectuée.' });
//         }

//         res.status(200).json({ id: parseInt(id), nom_entreprise, nom_client, prenom_client, email, role });
//     } catch (error) {
//         console.error('Erreur lors de la mise à jour de l\'utilisateur (Super Admin):', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de l\'utilisateur.' });
//     }
// };

// // Delete a user (Super Admin only)
// exports.deleteUserAdmin = async (req, res) => {
//     const { id } = req.params;
//     try {
//         const pool = await getConnection();
//         const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Utilisateur non trouvé.' });
//         }
//         res.status(204).send();
//     } catch (error) {
//         console.error('Erreur lors de la suppression de l\'utilisateur (Super Admin):', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'utilisateur.' });
//     }
// };

// // --- Admin Client Specific Functions ---

// // Get employees by admin client SIRET
// exports.getEmployeesByAdminClientId = async (req, res) => {
//     const adminClientId = req.user.id; // ID de l'admin_client connecté
//     try {
//         const pool = await getConnection();
//         // Récupérer le SIRET de l'admin_client connecté
//         const [adminClientData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
//         if (adminClientData.length === 0 || !adminClientData[0].siret) {
//             return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
//         }
//         const adminClientSiret = adminClientData[0].siret;

//         // Récupérer tous les utilisateurs avec le rôle 'employer' et le même admin_client_siret
//         const [employees] = await pool.execute(
//             'SELECT id, nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role, admin_client_siret FROM users WHERE role = "employer" AND admin_client_siret = ?',
//             [adminClientSiret]
//         );
//         res.status(200).json(employees);
//     } catch (error) {
//         console.error('Error fetching employees for admin client:', error);
//         res.status(500).json({ message: 'Internal server error while fetching employees.' });
//     }
// };

// // Create employee by admin client
// exports.createEmployeeByAdminClient = async (req, res) => {
//     const adminClientId = req.user.id;
//     const { nom_client, prenom_client, email, telephone, adresse, password } = req.body;

//     if (!nom_client || !prenom_client || !email || !password) {
//         return res.status(400).json({ message: 'Nom, prénom, email et mot de passe sont requis pour créer un employé.' });
//     }

//     try {
//         const pool = await getConnection();
//         // Récupérer le SIRET de l'admin_client connecté
//         const [adminClientData] = await pool.execute('SELECT nom_entreprise, siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
//         if (adminClientData.length === 0 || !adminClientData[0].siret) {
//             return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
//         }
//         const adminClientSiret = adminClientData[0].siret;
//         const nomEntreprise = adminClientData[0].nom_entreprise;

//         const [existingUser] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
//         if (existingUser.length > 0) {
//             return res.status(409).json({ message: 'Un utilisateur avec cet email existe déjà.' });
//         }

//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Convert any potentially undefined values to null for database insertion
//         const finalTelephone = telephone || null;
//         const finalAdresse = adresse || null;

//         // --- DÉBUT DE LA CORRECTION ---
//         // Pour un employé, la colonne 'siret' doit être NULL, car il n'a pas son propre SIRET d'entreprise.
//         // C'est la colonne 'admin_client_siret' qui le lie à l'admin client.
//         const employeeSiret = null; // Défini explicitement à NULL
//         // --- FIN DE LA CORRECTION ---

//         const [result] = await pool.execute(
//             'INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, role, admin_client_siret) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
//             [nomEntreprise, nom_client, prenom_client, email, finalTelephone, finalAdresse, employeeSiret, hashedPassword, 'employer', adminClientSiret]
//         );

//         res.status(201).json({ id: result.insertId, nom_entreprise: nomEntreprise, nom_client, prenom_client, email, role: 'employer', admin_client_siret: adminClientSiret });
//     } catch (error) {
//         console.error('Erreur lors de la création de l\'employé par l\'admin client:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la création de l\'employé.' });
//     }
// };

// // Update employee by admin client
// exports.updateEmployeeByAdminClient = async (req, res) => {
//     const { id } = req.params; // ID de l'employé à mettre à jour
//     const adminClientId = req.user.id;
//     const { nom_client, prenom_client, email, telephone, adresse, password } = req.body;

//     if (!nom_client || !prenom_client || !email) {
//         return res.status(400).json({ message: 'Nom, prénom et email sont requis pour la mise à jour de l\'employé.' });
//     }

//     try {
//         const pool = await getConnection();
//         // Récupérer le SIRET de l'admin_client connecté
//         const [adminClientData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
//         if (adminClientData.length === 0 || !adminClientData[0].siret) {
//             return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
//         }
//         const adminClientSiret = adminClientData[0].siret;

//         // Vérifier que l'employé à mettre à jour est bien rattaché à cet admin_client
//         const [employeeToUpdate] = await pool.execute(
//             'SELECT id FROM users WHERE id = ? AND role = "employer" AND admin_client_siret = ?',
//             [id, adminClientSiret]
//         );
//         if (employeeToUpdate.length === 0) {
//             return res.status(403).json({ message: 'Accès refusé. Cet employé n\'est pas géré par votre établissement ou n\'existe pas.' });
//         }

//         let hashedPassword = null;
//         if (password) {
//             hashedPassword = await bcrypt.hash(password, 10);
//         }

//         // Convert any potentially undefined values to null for database update
//         const finalTelephone = telephone || null;
//         const finalAdresse = adresse || null;

//         const [result] = await pool.execute(
//             'UPDATE users SET nom_client = ?, prenom_client = ?, email = ?, telephone = ?, adresse = ?, password_hash = COALESCE(?, password_hash) WHERE id = ?',
//             [nom_client, prenom_client, email, finalTelephone, finalAdresse, hashedPassword, id]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Employé non trouvé ou aucune modification effectuée.' });
//         }

//         res.status(200).json({ id: parseInt(id), nom_client, prenom_client, email });
//     } catch (error) {
//         console.error('Erreur lors de la mise à jour de l\'employé par l\'admin client:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de l\'employé.' });
//     }
// };

// // Delete employee by admin client
// exports.deleteEmployeeByAdminClient = async (req, res) => {
//     const { id } = req.params; // ID de l'employé à supprimer
//     const adminClientId = req.user.id;

//     try {
//         const pool = await getConnection();
//         // Récupérer le SIRET de l'admin_client connecté
//         const [adminClientData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
//         if (adminClientData.length === 0 || !adminClientData[0].siret) {
//             return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
//         }
//         const adminClientSiret = adminClientData[0].siret;

//         // Vérifier que l'employé à supprimer est bien rattaché à cet admin_client
//         const [employeeToDelete] = await pool.execute(
//             'SELECT id FROM users WHERE id = ? AND role = "employer" AND admin_client_siret = ?',
//             [id, adminClientSiret]
//         );
//         if (employeeToDelete.length === 0) {
//             return res.status(403).json({ message: 'Accès refusé. Cet employé n\'est pas géré par votre établissement ou n\'existe pas.' });
//         }

//         const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Employé non trouvé.' });
//         }
//         res.status(204).send();
//     } catch (error) {
//         console.error('Erreur lors de la suppression de l\'employé par l\'admin client:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'employé.' });
//     }
// };










// // backend/src/controllers/userController.js
// const { getConnection } = require('../config/db');
// const bcrypt = require('bcryptjs');

// // Function to get user profile (used by /api/users/me)
// exports.getMe = async (req, res) => {
//     try {
//         const pool = await getConnection();
//         const [rows] = await pool.execute(
//             'SELECT id, nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role, admin_client_siret FROM users WHERE id = ?',
//             [req.user.id]
//         );
//         if (rows.length > 0) {
//             res.json(rows[0]);
//         } else {
//             res.status(404).json({ message: 'User not found.' });
//         }
//     } catch (error) {
//         console.error('Erreur lors de la récupération du profil utilisateur:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la récupération du profil utilisateur.' });
//     }
// };

// // --- Super Admin Functions ---

// // Get all users (Super Admin only)
// exports.getAllUsersAdmin = async (req, res) => {
//     try {
//         const pool = await getConnection();
//         const [users] = await pool.execute('SELECT id, nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role, admin_client_siret, created_at, updated_at FROM users');
//         res.status(200).json(users);
//     } catch (error) {
//         console.error('Erreur lors de la récupération de tous les utilisateurs (Super Admin):', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la récupération des utilisateurs.' });
//     }
// };

// // Create a new user (Super Admin only)
// exports.createUserAdmin = async (req, res) => {
//     const { nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password, role, admin_client_siret } = req.body;

//     if (!nom_entreprise || !nom_client || !prenom_client || !email || !password || !role) {
//         return res.status(400).json({ message: 'Tous les champs obligatoires sont requis.' });
//     }

//     try {
//         const pool = await getConnection();
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

//         const [result] = await pool.execute(
//             'INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, role, admin_client_siret) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
//             [nom_entreprise, nom_client, prenom_client, email, finalTelephone, finalAdresse, finalSiret, hashedPassword, role, finalAdminClientSiret]
//         );

//         res.status(201).json({ id: result.insertId, nom_entreprise, nom_client, prenom_client, email, role });
//     } catch (error) {
//         console.error('Erreur lors de la création de l\'utilisateur (Super Admin):', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la création de l\'utilisateur.' });
//     }
// };

// // Update a user (Super Admin only)
// exports.updateUserAdmin = async (req, res) => {
//     const { id } = req.params;
//     const { nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password, role, admin_client_siret } = req.body;

//     if (!nom_entreprise || !nom_client || !prenom_client || !email || !role) {
//         return res.status(400).json({ message: 'Tous les champs obligatoires (sauf mot de passe) sont requis pour la mise à jour.' });
//     }

//     try {
//         const pool = await getConnection();

//         // Fetch current user data to check role and SIRET constraints
//         const [currentUser] = await pool.execute('SELECT siret, role FROM users WHERE id = ?', [id]);
//         if (currentUser.length === 0) {
//             return res.status(404).json({ message: 'Utilisateur non trouvé.' });
//         }
//         const currentRole = currentUser[0].role;
//         const currentSiret = currentUser[0].siret;

//         // Validate SIRET for admin_client role
//         if (role === 'admin_client' && (!siret || siret.length !== 14)) {
//             return res.status(400).json({ message: 'Le SIRET est obligatoire et doit contenir 14 chiffres pour un rôle admin_client.' });
//         }
//         // Validate admin_client_siret for employer role
//         if (role === 'employer' && (!admin_client_siret || admin_client_siret.length !== 14)) {
//             return res.status(400).json({ message: 'Le SIRET de l\'admin client est obligatoire et doit contenir 14 chiffres pour un rôle employer.' });
//         }
//         // Ensure SIRET is unique if provided for admin_client and different from current user's SIRET
//         if (role === 'admin_client' && siret && siret !== currentSiret) {
//             const [existingSiret] = await pool.execute('SELECT id FROM users WHERE siret = ? AND id != ?', [siret, id]);
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

//         let hashedPassword = null;
//         if (password) {
//             hashedPassword = await bcrypt.hash(password, 10);
//         }

//         // --- START MODIFICATION ---
//         // Convert any potentially undefined values to null for database update
//         const finalTelephone = telephone || null;
//         const finalAdresse = adresse || null;
//         const finalSiret = siret || null;
//         const finalAdminClientSiret = admin_client_siret || null;
//         // --- END MODIFICATION ---

//         const [result] = await pool.execute(
//             'UPDATE users SET nom_entreprise = ?, nom_client = ?, prenom_client = ?, email = ?, telephone = ?, adresse = ?, siret = ?, password_hash = COALESCE(?, password_hash), role = ?, admin_client_siret = ? WHERE id = ?',
//             [nom_entreprise, nom_client, prenom_client, email, finalTelephone, finalAdresse, finalSiret, hashedPassword, role, finalAdminClientSiret, id]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Utilisateur non trouvé ou aucune modification effectuée.' });
//         }

//         res.status(200).json({ id: parseInt(id), nom_entreprise, nom_client, prenom_client, email, role });
//     } catch (error) {
//         console.error('Erreur lors de la mise à jour de l\'utilisateur (Super Admin):', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de l\'utilisateur.' });
//     }
// };

// // Delete a user (Super Admin only)
// exports.deleteUserAdmin = async (req, res) => {
//     const { id } = req.params;
//     try {
//         const pool = await getConnection();
//         const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Utilisateur non trouvé.' });
//         }
//         res.status(204).send();
//     } catch (error) {
//         console.error('Erreur lors de la suppression de l\'utilisateur (Super Admin):', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'utilisateur.' });
//     }
// };

// // --- Admin Client Specific Functions ---

// // Get employees by admin client SIRET
// exports.getEmployeesByAdminClientId = async (req, res) => {
//     const adminClientId = req.user.id; // ID de l'admin_client connecté
//     try {
//         const pool = await getConnection();
//         // Récupérer le SIRET de l'admin_client connecté
//         const [adminClientData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
//         if (adminClientData.length === 0 || !adminClientData[0].siret) {
//             return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
//         }
//         const adminClientSiret = adminClientData[0].siret;

//         // Récupérer tous les utilisateurs avec le rôle 'employer' et le même admin_client_siret
//         const [employees] = await pool.execute(
//             'SELECT id, nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role, admin_client_siret FROM users WHERE role = "employer" AND admin_client_siret = ?',
//             [adminClientSiret]
//         );
//         res.status(200).json(employees);
//     } catch (error) {
//         console.error('Error fetching employees for admin client:', error);
//         res.status(500).json({ message: 'Internal server error while fetching employees.' });
//     }
// };

// // Create employee by admin client
// exports.createEmployeeByAdminClient = async (req, res) => {
//     const adminClientId = req.user.id;
//     const { nom_client, prenom_client, email, telephone, adresse, password } = req.body;

//     if (!nom_client || !prenom_client || !email || !password) {
//         return res.status(400).json({ message: 'Nom, prénom, email et mot de passe sont requis pour créer un employé.' });
//     }

//     try {
//         const pool = await getConnection();
//         // Récupérer le SIRET de l'admin_client connecté
//         const [adminClientData] = await pool.execute('SELECT nom_entreprise, siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
//         if (adminClientData.length === 0 || !adminClientData[0].siret) {
//             return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
//         }
//         const adminClientSiret = adminClientData[0].siret;
//         const nomEntreprise = adminClientData[0].nom_entreprise;

//         const [existingUser] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
//         if (existingUser.length > 0) {
//             return res.status(409).json({ message: 'Un utilisateur avec cet email existe déjà.' });
//         }

//         const hashedPassword = await bcrypt.hash(password, 10);

//         // --- START MODIFICATION ---
//         // Convert any potentially undefined values to null for database insertion
//         const finalTelephone = telephone || null;
//         const finalAdresse = adresse || null;
//         // --- END MODIFICATION ---

//         const [result] = await pool.execute(
//             'INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, role, admin_client_siret) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
//             [nomEntreprise, nom_client, prenom_client, email, finalTelephone, finalAdresse, adminClientSiret, hashedPassword, 'employer', adminClientSiret] // SIRET de l'employé est le même que l'admin_client
//         );

//         res.status(201).json({ id: result.insertId, nom_entreprise: nomEntreprise, nom_client, prenom_client, email, role: 'employer', admin_client_siret: adminClientSiret });
//     } catch (error) {
//         console.error('Erreur lors de la création de l\'employé par l\'admin client:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la création de l\'employé.' });
//     }
// };

// // Update employee by admin client
// exports.updateEmployeeByAdminClient = async (req, res) => {
//     const { id } = req.params; // ID de l'employé à mettre à jour
//     const adminClientId = req.user.id;
//     const { nom_client, prenom_client, email, telephone, adresse, password } = req.body;

//     if (!nom_client || !prenom_client || !email) {
//         return res.status(400).json({ message: 'Nom, prénom et email sont requis pour la mise à jour de l\'employé.' });
//     }

//     try {
//         const pool = await getConnection();
//         // Récupérer le SIRET de l'admin_client connecté
//         const [adminClientData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
//         if (adminClientData.length === 0 || !adminClientData[0].siret) {
//             return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
//         }
//         const adminClientSiret = adminClientData[0].siret;

//         // Vérifier que l'employé à mettre à jour est bien rattaché à cet admin_client
//         const [employeeToUpdate] = await pool.execute(
//             'SELECT id FROM users WHERE id = ? AND role = "employer" AND admin_client_siret = ?',
//             [id, adminClientSiret]
//         );
//         if (employeeToUpdate.length === 0) {
//             return res.status(403).json({ message: 'Accès refusé. Cet employé n\'est pas géré par votre établissement ou n\'existe pas.' });
//         }

//         let hashedPassword = null;
//         if (password) {
//             hashedPassword = await bcrypt.hash(password, 10);
//         }

//         // --- START MODIFICATION ---
//         // Convert any potentially undefined values to null for database update
//         const finalTelephone = telephone || null;
//         const finalAdresse = adresse || null;
//         // --- END MODIFICATION ---

//         const [result] = await pool.execute(
//             'UPDATE users SET nom_client = ?, prenom_client = ?, email = ?, telephone = ?, adresse = ?, password_hash = COALESCE(?, password_hash) WHERE id = ?',
//             [nom_client, prenom_client, email, finalTelephone, finalAdresse, hashedPassword, id]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Employé non trouvé ou aucune modification effectuée.' });
//         }

//         res.status(200).json({ id: parseInt(id), nom_client, prenom_client, email });
//     } catch (error) {
//         console.error('Erreur lors de la mise à jour de l\'employé par l\'admin client:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de l\'employé.' });
//     }
// };

// // Delete employee by admin client
// exports.deleteEmployeeByAdminClient = async (req, res) => {
//     const { id } = req.params; // ID de l'employé à supprimer
//     const adminClientId = req.user.id;

//     try {
//         const pool = await getConnection();
//         // Récupérer le SIRET de l'admin_client connecté
//         const [adminClientData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
//         if (adminClientData.length === 0 || !adminClientData[0].siret) {
//             return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
//         }
//         const adminClientSiret = adminClientData[0].siret;

//         // Vérifier que l'employé à supprimer est bien rattaché à cet admin_client
//         const [employeeToDelete] = await pool.execute(
//             'SELECT id FROM users WHERE id = ? AND role = "employer" AND admin_client_siret = ?',
//             [id, adminClientSiret]
//         );
//         if (employeeToDelete.length === 0) {
//             return res.status(403).json({ message: 'Accès refusé. Cet employé n\'est pas géré par votre établissement ou n\'existe pas.' });
//         }

//         const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Employé non trouvé.' });
//         }
//         res.status(204).send();
//     } catch (error) {
//         console.error('Erreur lors de la suppression de l\'employé par l\'admin client:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'employé.' });
//     }
// };










// // backend/src/controllers/userController.js
// const { getConnection } = require('../config/db');
// const bcrypt = require('bcryptjs');

// // Function to get user profile (used by /api/users/me)
// exports.getMe = async (req, res) => {
//     try {
//         const pool = await getConnection();
//         const [rows] = await pool.execute(
//             'SELECT id, nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role, admin_client_siret FROM users WHERE id = ?',
//             [req.user.id]
//         );
//         if (rows.length > 0) {
//             res.json(rows[0]);
//         } else {
//             res.status(404).json({ message: 'User not found.' });
//         }
//     } catch (error) {
//         console.error('Erreur lors de la récupération du profil utilisateur:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la récupération du profil utilisateur.' });
//     }
// };

// // --- Super Admin Functions ---

// // Get all users (Super Admin only)
// exports.getAllUsersAdmin = async (req, res) => {
//     try {
//         const pool = await getConnection();
//         const [users] = await pool.execute('SELECT id, nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role, admin_client_siret, created_at, updated_at FROM users');
//         res.status(200).json(users);
//     } catch (error) {
//         console.error('Erreur lors de la récupération de tous les utilisateurs (Super Admin):', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la récupération des utilisateurs.' });
//     }
// };

// // Create a new user (Super Admin only)
// exports.createUserAdmin = async (req, res) => {
//     const { nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password, role, admin_client_siret } = req.body;

//     if (!nom_entreprise || !nom_client || !prenom_client || !email || !password || !role) {
//         return res.status(400).json({ message: 'Tous les champs obligatoires sont requis.' });
//     }

//     try {
//         const pool = await getConnection();
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

//         const [result] = await pool.execute(
//             'INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, role, admin_client_siret) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
//             [nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, hashedPassword, role, admin_client_siret]
//         );

//         res.status(201).json({ id: result.insertId, nom_entreprise, nom_client, prenom_client, email, role });
//     } catch (error) {
//         console.error('Erreur lors de la création de l\'utilisateur (Super Admin):', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la création de l\'utilisateur.' });
//     }
// };

// // Update a user (Super Admin only)
// exports.updateUserAdmin = async (req, res) => {
//     const { id } = req.params;
//     const { nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password, role, admin_client_siret } = req.body;

//     if (!nom_entreprise || !nom_client || !prenom_client || !email || !role) {
//         return res.status(400).json({ message: 'Tous les champs obligatoires (sauf mot de passe) sont requis pour la mise à jour.' });
//     }

//     try {
//         const pool = await getConnection();

//         // Fetch current user data to check role and SIRET constraints
//         const [currentUser] = await pool.execute('SELECT siret, role FROM users WHERE id = ?', [id]);
//         if (currentUser.length === 0) {
//             return res.status(404).json({ message: 'Utilisateur non trouvé.' });
//         }
//         const currentRole = currentUser[0].role;
//         const currentSiret = currentUser[0].siret;

//         // Validate SIRET for admin_client role
//         if (role === 'admin_client' && (!siret || siret.length !== 14)) {
//             return res.status(400).json({ message: 'Le SIRET est obligatoire et doit contenir 14 chiffres pour un rôle admin_client.' });
//         }
//         // Validate admin_client_siret for employer role
//         if (role === 'employer' && (!admin_client_siret || admin_client_siret.length !== 14)) {
//             return res.status(400).json({ message: 'Le SIRET de l\'admin client est obligatoire et doit contenir 14 chiffres pour un rôle employer.' });
//         }
//         // Ensure SIRET is unique if provided for admin_client and different from current user's SIRET
//         if (role === 'admin_client' && siret && siret !== currentSiret) {
//             const [existingSiret] = await pool.execute('SELECT id FROM users WHERE siret = ? AND id != ?', [siret, id]);
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

//         let hashedPassword = null;
//         if (password) {
//             hashedPassword = await bcrypt.hash(password, 10);
//         }

//         const [result] = await pool.execute(
//             'UPDATE users SET nom_entreprise = ?, nom_client = ?, prenom_client = ?, email = ?, telephone = ?, adresse = ?, siret = ?, password_hash = COALESCE(?, password_hash), role = ?, admin_client_siret = ? WHERE id = ?',
//             [nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, hashedPassword, role, admin_client_siret, id]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Utilisateur non trouvé ou aucune modification effectuée.' });
//         }

//         res.status(200).json({ id: parseInt(id), nom_entreprise, nom_client, prenom_client, email, role });
//     } catch (error) {
//         console.error('Erreur lors de la mise à jour de l\'utilisateur (Super Admin):', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de l\'utilisateur.' });
//     }
// };

// // Delete a user (Super Admin only)
// exports.deleteUserAdmin = async (req, res) => {
//     const { id } = req.params;
//     try {
//         const pool = await getConnection();
//         const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Utilisateur non trouvé.' });
//         }
//         res.status(204).send();
//     } catch (error) {
//         console.error('Erreur lors de la suppression de l\'utilisateur (Super Admin):', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'utilisateur.' });
//     }
// };

// // --- Admin Client Specific Functions ---

// // Get employees by admin client SIRET
// exports.getEmployeesByAdminClientId = async (req, res) => {
//     const adminClientId = req.user.id; // ID de l'admin_client connecté
//     try {
//         const pool = await getConnection();
//         // Récupérer le SIRET de l'admin_client connecté
//         const [adminClientData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
//         if (adminClientData.length === 0 || !adminClientData[0].siret) {
//             return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
//         }
//         const adminClientSiret = adminClientData[0].siret;

//         // Récupérer tous les utilisateurs avec le rôle 'employer' et le même admin_client_siret
//         const [employees] = await pool.execute(
//             'SELECT id, nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role, admin_client_siret FROM users WHERE role = "employer" AND admin_client_siret = ?',
//             [adminClientSiret]
//         );
//         res.status(200).json(employees);
//     } catch (error) {
//         console.error('Error fetching employees for admin client:', error);
//         res.status(500).json({ message: 'Internal server error while fetching employees.' });
//     }
// };

// // Create employee by admin client
// exports.createEmployeeByAdminClient = async (req, res) => {
//     const adminClientId = req.user.id;
//     const { nom_client, prenom_client, email, telephone, adresse, password } = req.body;

//     if (!nom_client || !prenom_client || !email || !password) {
//         return res.status(400).json({ message: 'Nom, prénom, email et mot de passe sont requis pour créer un employé.' });
//     }

//     try {
//         const pool = await getConnection();
//         // Récupérer le SIRET de l'admin_client connecté
//         const [adminClientData] = await pool.execute('SELECT nom_entreprise, siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
//         if (adminClientData.length === 0 || !adminClientData[0].siret) {
//             return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
//         }
//         const adminClientSiret = adminClientData[0].siret;
//         const nomEntreprise = adminClientData[0].nom_entreprise;

//         const [existingUser] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
//         if (existingUser.length > 0) {
//             return res.status(409).json({ message: 'Un utilisateur avec cet email existe déjà.' });
//         }

//         const hashedPassword = await bcrypt.hash(password, 10);

//         const [result] = await pool.execute(
//             'INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, role, admin_client_siret) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
//             [nomEntreprise, nom_client, prenom_client, email, telephone, adresse, adminClientSiret, hashedPassword, 'employer', adminClientSiret] // SIRET de l'employé est le même que l'admin_client
//         );

//         res.status(201).json({ id: result.insertId, nom_entreprise: nomEntreprise, nom_client, prenom_client, email, role: 'employer', admin_client_siret: adminClientSiret });
//     } catch (error) {
//         console.error('Erreur lors de la création de l\'employé par l\'admin client:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la création de l\'employé.' });
//     }
// };

// // Update employee by admin client
// exports.updateEmployeeByAdminClient = async (req, res) => {
//     const { id } = req.params; // ID de l'employé à mettre à jour
//     const adminClientId = req.user.id;
//     const { nom_client, prenom_client, email, telephone, adresse, password } = req.body;

//     if (!nom_client || !prenom_client || !email) {
//         return res.status(400).json({ message: 'Nom, prénom et email sont requis pour la mise à jour de l\'employé.' });
//     }

//     try {
//         const pool = await getConnection();
//         // Récupérer le SIRET de l'admin_client connecté
//         const [adminClientData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
//         if (adminClientData.length === 0 || !adminClientData[0].siret) {
//             return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
//         }
//         const adminClientSiret = adminClientData[0].siret;

//         // Vérifier que l'employé à mettre à jour est bien rattaché à cet admin_client
//         const [employeeToUpdate] = await pool.execute(
//             'SELECT id FROM users WHERE id = ? AND role = "employer" AND admin_client_siret = ?',
//             [id, adminClientSiret]
//         );
//         if (employeeToUpdate.length === 0) {
//             return res.status(403).json({ message: 'Accès refusé. Cet employé n\'est pas géré par votre établissement ou n\'existe pas.' });
//         }

//         let hashedPassword = null;
//         if (password) {
//             hashedPassword = await bcrypt.hash(password, 10);
//         }

//         const [result] = await pool.execute(
//             'UPDATE users SET nom_client = ?, prenom_client = ?, email = ?, telephone = ?, adresse = ?, password_hash = COALESCE(?, password_hash) WHERE id = ?',
//             [nom_client, prenom_client, email, telephone, adresse, hashedPassword, id]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Employé non trouvé ou aucune modification effectuée.' });
//         }

//         res.status(200).json({ id: parseInt(id), nom_client, prenom_client, email });
//     } catch (error) {
//         console.error('Erreur lors de la mise à jour de l\'employé par l\'admin client:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de l\'employé.' });
//     }
// };

// // Delete employee by admin client
// exports.deleteEmployeeByAdminClient = async (req, res) => {
//     const { id } = req.params; // ID de l'employé à supprimer
//     const adminClientId = req.user.id;

//     try {
//         const pool = await getConnection();
//         // Récupérer le SIRET de l'admin_client connecté
//         const [adminClientData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
//         if (adminClientData.length === 0 || !adminClientData[0].siret) {
//             return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
//         }
//         const adminClientSiret = adminClientData[0].siret;

//         // Vérifier que l'employé à supprimer est bien rattaché à cet admin_client
//         const [employeeToDelete] = await pool.execute(
//             'SELECT id FROM users WHERE id = ? AND role = "employer" AND admin_client_siret = ?',
//             [id, adminClientSiret]
//         );
//         if (employeeToDelete.length === 0) {
//             return res.status(403).json({ message: 'Accès refusé. Cet employé n\'est pas géré par votre établissement ou n\'existe pas.' });
//         }

//         const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Employé non trouvé.' });
//         }
//         res.status(204).send();
//     } catch (error) {
//         console.error('Erreur lors de la suppression de l\'employé par l\'admin client:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'employé.' });
//     }
// };














// // // backend/src/controllers/userController.js
// // const { getConnection } = require('../config/db');
// // const bcrypt = require('bcryptjs');

// // // Helper to determine the target role for updates/creations
// // const getValidRole = (role) => {
// //     const validRoles = ['super_admin', 'admin_client', 'employer'];
// //     return validRoles.includes(role) ? role : 'employer';
// // };

// // // --- Common function to get current user's profile ---
// // exports.getMe = async (req, res) => {
// //     try {
// //         const userId = req.user.id;
// //         const pool = await getConnection();
// //         const [users] = await pool.execute(
// //             'SELECT id, nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role, admin_client_siret FROM users WHERE id = ?', // CHANGED: admin_client_id to admin_client_siret
// //             [userId]
// //         );
// //         const user = users[0];

// //         if (!user) {
// //             return res.status(404).json({ message: 'Profil utilisateur non trouvé.' });
// //         }

// //         res.status(200).json(user);
// //     } catch (error) {
// //         console.error('Erreur lors de la récupération du profil utilisateur:', error);
// //         res.status(500).json({ message: 'Erreur serveur lors de la récupération du profil.' });
// //     }
// // };


// // // --- Super Admin specific functions (can manage all users) ---

// // exports.getAllUsersAdmin = async (req, res) => {
// //     try {
// //         const pool = await getConnection();
// //         const [users] = await pool.execute('SELECT id, nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role, admin_client_siret FROM users'); // CHANGED: admin_client_id to admin_client_siret
// //         res.status(200).json(users);
// //     } catch (error) {
// //         console.error('Error fetching all users for super admin:', error);
// //         res.status(500).json({ message: 'Internal server error while fetching users.' });
// //     }
// // };

// // exports.createUserAdmin = async (req, res) => {
// //     const {
// //         nom_entreprise,
// //         nom_client,
// //         prenom_client,
// //         email,
// //         password,
// //         role,
// //         telephone = null,
// //         adresse = null,
// //         siret = null, // SIRET fourni par le frontend (pour admin_client)
// //         admin_client_siret = null // SIRET de l'admin_client (pour employer)
// //     } = req.body;

// //     if (!nom_entreprise || !nom_client || !prenom_client || !email || !password || !role) {
// //         return res.status(400).json({ message: 'All required fields are needed for user creation.' });
// //     }

// //     try {
// //         const pool = await getConnection();
// //         const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
// //         if (existingUsers.length > 0) {
// //             return res.status(409).json({ message: 'User with this email already exists.' });
// //         }

// //         const salt = await bcrypt.genSalt(10);
// //         const password_hash = await bcrypt.hash(password, salt);
// //         const userRole = getValidRole(role);

// //         let finalSiret = siret; // Pour admin_client, super_admin
// //         let finalAdminClientSiret = admin_client_siret; // Pour employer

// //         if (userRole === 'admin_client') {
// //             if (!siret) {
// //                 return res.status(400).json({ message: 'Le numéro SIRET est requis pour un rôle admin_client.' });
// //             }
// //             // Vérifier si le SIRET existe déjà pour un autre admin_client
// //             const [existingSiret] = await pool.execute('SELECT id FROM users WHERE siret = ? AND role = "admin_client"', [siret]);
// //             if (existingSiret.length > 0) {
// //                 return res.status(409).json({ message: 'Ce numéro SIRET est déjà utilisé par un autre Admin Client.' });
// //             }
// //             finalAdminClientSiret = null; // Un admin_client n'est pas rattaché à un autre admin_client
// //         } else if (userRole === 'employer') {
// //             if (!admin_client_siret) {
// //                 return res.status(400).json({ message: 'Le SIRET de l\'admin client est requis pour un rôle employer.' });
// //             }
// //             // Vérifier que l'admin_client_siret existe et est bien un admin_client
// //             const [adminClientRows] = await pool.execute('SELECT siret, nom_entreprise, adresse FROM users WHERE siret = ? AND role = "admin_client"', [admin_client_siret]);
// //             if (adminClientRows.length === 0) {
// //                 return res.status(400).json({ message: 'Admin client avec ce SIRET non trouvé ou SIRET invalide.' });
// //             }
// //             // L'employé hérite du siret de l'établissement de son admin client
// //             finalSiret = adminClientRows[0].siret;
// //             // Assurez-vous que les infos de l'entreprise et l'adresse correspondent au SIRET de l'admin client
// //             // C'est une validation côté backend, le frontend devrait déjà pré-remplir
// //             if (nom_entreprise !== adminClientRows[0].nom_entreprise || adresse !== adminClientRows[0].adresse) {
// //                 console.warn(`Mismatch for employer creation: nom_entreprise or adresse from frontend doesn't match admin_client's siret.`);
// //                 // Vous pouvez choisir de renvoyer une erreur ou de forcer les valeurs de l'admin_client
// //                 // Pour l'instant, on va forcer les valeurs de l'admin_client pour la cohérence
// //                 data.nom_entreprise = adminClientRows[0].nom_entreprise;
// //                 data.adresse = adminClientRows[0].adresse;
// //             }
// //         } else if (userRole === 'super_admin') {
// //             finalSiret = null;
// //             finalAdminClientSiret = null;
// //         }

// //         const [result] = await pool.execute(
// //             'INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, role, admin_client_siret) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
// //             [nom_entreprise, nom_client, prenom_client, email, telephone, adresse, finalSiret, password_hash, userRole, finalAdminClientSiret]
// //         );

// //         const newUser = {
// //             id: result.insertId,
// //             nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret: finalSiret, role: userRole, admin_client_siret: finalAdminClientSiret
// //         };
// //         res.status(201).json(newUser);

// //     } catch (error) {
// //         console.error('Error creating user by super admin:', error);
// //         res.status(500).json({ message: 'Internal server error while creating user.' });
// //     }
// // };

// // exports.updateUserAdmin = async (req, res) => {
// //     const { id } = req.params;
// //     const {
// //         nom_entreprise,
// //         nom_client,
// //         prenom_client,
// //         email,
// //         role,
// //         telephone = null,
// //         adresse = null,
// //         siret = null, // Peut être mis à jour pour admin_client
// //         admin_client_siret = null // Peut être mis à jour pour employer
// //     } = req.body;

// //     if (!nom_entreprise || !nom_client || !prenom_client || !email || !role) {
// //         return res.status(400).json({ message: 'All required fields are needed for user update (except password).' });
// //     }

// //     try {
// //         const pool = await getConnection();
// //         const [existingEmailUsers] = await pool.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
// //         if (existingEmailUsers.length > 0) {
// //             return res.status(409).json({ message: 'This email is already used by another user.' });
// //         }

// //         const userRole = getValidRole(role);
// //         let finalSiret = siret;
// //         let finalAdminClientSiret = admin_client_siret;

// //         // Logique de validation et d'assignation pour la mise à jour
// //         if (userRole === 'admin_client') {
// //             if (!siret) {
// //                 return res.status(400).json({ message: 'Le numéro SIRET est requis pour un rôle admin_client.' });
// //             }
// //             // Vérifier si le SIRET existe déjà pour un autre admin_client
// //             const [existingSiret] = await pool.execute('SELECT id FROM users WHERE siret = ? AND role = "admin_client" AND id != ?', [siret, id]);
// //             if (existingSiret.length > 0) {
// //                 return res.status(409).json({ message: 'Ce numéro SIRET est déjà utilisé par un autre Admin Client.' });
// //             }
// //             finalAdminClientSiret = null;
// //         } else if (userRole === 'employer') {
// //             if (!admin_client_siret) {
// //                 return res.status(400).json({ message: 'Le SIRET de l\'admin client est requis pour un rôle employer.' });
// //             }
// //             const [adminClientRows] = await pool.execute('SELECT siret FROM users WHERE siret = ? AND role = "admin_client"', [admin_client_siret]);
// //             if (adminClientRows.length === 0) {
// //                 return res.status(400).json({ message: 'Admin client avec ce SIRET non trouvé ou SIRET invalide.' });
// //             }
// //             finalSiret = adminClientRows[0].siret; // L'employé doit avoir le SIRET de son admin_client
// //         } else if (userRole === 'super_admin') {
// //             finalSiret = null;
// //             finalAdminClientSiret = null;
// //         }

// //         const [result] = await pool.execute(
// //             'UPDATE users SET nom_entreprise = ?, nom_client = ?, prenom_client = ?, email = ?, telephone = ?, adresse = ?, siret = ?, role = ?, admin_client_siret = ? WHERE id = ?',
// //             [nom_entreprise, nom_client, prenom_client, email, telephone, adresse, finalSiret, userRole, finalAdminClientSiret, id]
// //         );

// //         if (result.affectedRows === 0) {
// //             return res.status(404).json({ message: 'User not found or no changes made.' });
// //         }

// //         const updatedUser = { id: parseInt(id), nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret: finalSiret, role: userRole, admin_client_siret: finalAdminClientSiret };
// //         res.status(200).json(updatedUser);
// //     } catch (error) {
// //         console.error('Error updating user by super admin:', error);
// //         res.status(500).json({ message: 'Internal server error while updating user.' });
// //     }
// // };

// // exports.deleteUserAdmin = async (req, res) => {
// //     const { id } = req.params;

// //     if (req.user.id === parseInt(id)) {
// //         return res.status(403).json({ message: 'You cannot delete your own account from here.' });
// //     }

// //     try {
// //         const pool = await getConnection();
// //         const [userToDelete] = await pool.execute('SELECT role FROM users WHERE id = ?', [id]);
// //         if (userToDelete.length > 0 && userToDelete[0].role === 'super_admin') {
// //             return res.status(403).json({ message: 'Cannot delete another Super Admin account.' });
// //         }

// //         const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
// //         if (result.affectedRows === 0) {
// //             return res.status(404).json({ message: 'User not found.' });
// //         }
// //         res.status(204).send();
// //     } catch (error) {
// //         console.error('Error deleting user by super admin:', error);
// //         res.status(500).json({ message: 'Internal server error while deleting user.' });
// //     }
// // };

// // // --- Admin Client specific functions (can only manage their assigned employees) ---

// // exports.getEmployeesByAdminClientId = async (req, res) => { // RENAMED
// //     const adminClientId = req.user.id;
// //     try {
// //         const pool = await getConnection();
// //         // Récupérer le SIRET de l'admin_client connecté
// //         const [adminClientData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
// //         if (adminClientData.length === 0 || !adminClientData[0].siret) {
// //             return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
// //         }
// //         const adminClientSiret = adminClientData[0].siret;

// //         // Sélectionner les employés rattachés à ce SIRET d'admin_client
// //         const [employees] = await pool.execute(
// //             'SELECT id, nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role FROM users WHERE role = "employer" AND admin_client_siret = ?',
// //             [adminClientSiret]
// //         );
// //         res.status(200).json(employees);
// //     } catch (error) {
// //         console.error('Error fetching employees for admin client:', error);
// //         res.status(500).json({ message: 'Internal server error while fetching employees.' });
// //     }
// // };

// // exports.createEmployeeByAdminClient = async (req, res) => { // RENAMED
// //     const adminClientId = req.user.id;
// //     const { nom_client, prenom_client, email, password, telephone = null } = req.body; // nom_entreprise, adresse, siret sont auto

// //     if (!nom_client || !prenom_client || !email || !password) {
// //         return res.status(400).json({ message: 'Nom, prénom, email et mot de passe sont requis pour la création d\'un employé.' });
// //     }

// //     try {
// //         const pool = await getConnection();
// //         const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
// //         if (existingUsers.length > 0) {
// //             return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
// //         }

// //         const salt = await bcrypt.genSalt(10);
// //         const password_hash = await bcrypt.hash(password, salt);

// //         // Récupérer les informations de l'Admin Client connecté pour l'auto-remplissage
// //         const [adminClientData] = await pool.execute('SELECT siret, nom_entreprise, adresse FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
// //         if (adminClientData.length === 0 || !adminClientData[0].siret) {
// //             return res.status(400).json({ message: 'Impossible de créer l\'employé: Admin Client non trouvé ou SIRET non défini.' });
// //         }

// //         const autoSiret = adminClientData[0].siret;
// //         const autoNomEntreprise = adminClientData[0].nom_entreprise;
// //         const autoAdresse = adminClientData[0].adresse;

// //         const [result] = await pool.execute(
// //             'INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, role, admin_client_siret) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "employer", ?)',
// //             [autoNomEntreprise, nom_client, prenom_client, email, telephone, autoAdresse, autoSiret, password_hash, autoSiret] // admin_client_siret est le SIRET de l'admin client
// //         );

// //         const newEmployee = {
// //             id: result.insertId,
// //             nom_entreprise: autoNomEntreprise, nom_client, prenom_client, email, telephone, adresse: autoAdresse, siret: autoSiret, role: 'employer', admin_client_siret: autoSiret
// //         };
// //         res.status(201).json(newEmployee);
// //     } catch (error) {
// //         console.error('Error creating employee by admin client:', error);
// //         res.status(500).json({ message: 'Internal server error while creating employee.' });
// //     }
// // };

// // exports.updateEmployeeByAdminClient = async (req, res) => { // RENAMED
// //     const { id } = req.params;
// //     const adminClientId = req.user.id;
// //     const { nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret } = req.body; // siret et nom_entreprise/adresse sont auto-gérés

// //     if (!nom_client || !prenom_client || !email) { // nom_entreprise n'est plus requis ici car auto-géré
// //         return res.status(400).json({ message: 'Nom, prénom et email sont requis pour la mise à jour d\'un employé.' });
// //     }

// //     try {
// //         const pool = await getConnection();
// //         // Récupérer le SIRET de l'admin_client connecté
// //         const [adminClientData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
// //         if (adminClientData.length === 0 || !adminClientData[0].siret) {
// //             return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
// //         }
// //         const adminClientSiret = adminClientData[0].siret;

// //         // Vérifier que l'employé appartient bien à cet admin_client via admin_client_siret
// //         const [targetEmployee] = await pool.execute(
// //             'SELECT id FROM users WHERE id = ? AND role = "employer" AND admin_client_siret = ?',
// //             [id, adminClientSiret]
// //         );
// //         if (targetEmployee.length === 0) {
// //             return res.status(403).json({ message: 'Accès refusé. Cet employé n\'est pas associé à votre compte ou n\'existe pas.' });
// //         }

// //         // Vérifier si un autre utilisateur (pas celui qu'on met à jour) a déjà cet email
// //         const [existingEmailUsers] = await pool.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
// //         if (existingEmailUsers.length > 0) {
// //             return res.status(409).json({ message: 'Cet email est déjà utilisé par un autre utilisateur.' });
// //         }

// //         // Pour la mise à jour, on ne modifie pas le siret_etablissement ou nom_entreprise/adresse
// //         // car ils sont liés à l'admin_client_siret.
// //         const [result] = await pool.execute(
// //             'UPDATE users SET nom_client = ?, prenom_client = ?, email = ?, telephone = ? WHERE id = ?',
// //             [nom_client, prenom_client, email, telephone, id]
// //         );

// //         if (result.affectedRows === 0) {
// //             return res.status(404).json({ message: 'Employé non trouvé ou aucune modification effectuée.' });
// //         }

// //         // Retourner les informations complètes de l'employé après mise à jour
// //         const [updatedEmployeeData] = await pool.execute(
// //             'SELECT id, nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role, admin_client_siret FROM users WHERE id = ?',
// //             [id]
// //         );
// //         res.status(200).json(updatedEmployeeData[0]);
// //     } catch (error) {
// //         console.error('Error updating employee by admin client:', error);
// //         res.status(500).json({ message: 'Internal server error while updating employee.' });
// //     }
// // };

// // exports.deleteEmployeeByAdminClient = async (req, res) => { // RENAMED
// //     const { id } = req.params;
// //     const adminClientId = req.user.id;

// //     try {
// //         const pool = await getConnection();
// //         // Récupérer le SIRET de l'admin_client connecté
// //         const [adminClientData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
// //         if (adminClientData.length === 0 || !adminClientData[0].siret) {
// //             return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
// //         }
// //         const adminClientSiret = adminClientData[0].siret;

// //         // Vérifier que l'employé appartient bien à cet admin_client via admin_client_siret
// //         const [targetEmployee] = await pool.execute(
// //             'SELECT id FROM users WHERE id = ? AND role = "employer" AND admin_client_siret = ?',
// //             [id, adminClientSiret]
// //         );
// //         if (targetEmployee.length === 0) {
// //             return res.status(403).json({ message: 'Accès refusé. Cet employé n\'est pas associé à votre compte ou n\'existe pas.' });
// //         }

// //         const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
// //         if (result.affectedRows === 0) {
// //             return res.status(404).json({ message: 'Employé non trouvé.' });
// //         }
// //         res.status(204).send();
// //     } catch (error) {
// //         console.error('Error deleting employee by admin client:', error);
// //         res.status(500).json({ message: 'Internal server error while deleting employee.' });
// //     }
// // };
