// backend/src/controllers/userController.js
const { getConnection } = require('../config/db');
const bcrypt = require('bcryptjs');

// Helper to determine the target role for updates/creations
const getValidRole = (role) => {
    const validRoles = ['super_admin', 'admin_client', 'client'];
    return validRoles.includes(role) ? role : 'client';
};

// --- Super Admin specific functions (can manage all users) ---

exports.getAllUsersAdmin = async (req, res) => {
    try {
        const pool = await getConnection();
        const [users] = await pool.execute('SELECT id, nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role, admin_client_id FROM users');
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching all users for super admin:', error);
        res.status(500).json({ message: 'Internal server error while fetching users.' });
    }
};

exports.createUserAdmin = async (req, res) => {
    const {
        nom_entreprise,
        nom_client,
        prenom_client,
        email,
        password,
        role,
        // Correction: Définir les champs optionnels à null par défaut
        telephone = null,
        adresse = null,
        siret = null,
        admin_client_id = null
    } = req.body;

    if (!nom_entreprise || !nom_client || !prenom_client || !email || !password || !role) {
        return res.status(400).json({ message: 'All required fields are needed for user creation.' });
    }

    try {
        const pool = await getConnection();
        const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        const userRole = getValidRole(role);

        const [result] = await pool.execute(
            'INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, role, admin_client_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            // S'assurer que tous les paramètres sont passés, même s'ils sont null
            [nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, userRole, admin_client_id]
        );

        const newUser = {
            id: result.insertId,
            nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role: userRole, admin_client_id
        };
        res.status(201).json(newUser);
    } catch (error) {
        console.error('Error creating user by super admin:', error);
        res.status(500).json({ message: 'Internal server error while creating user.' });
    }
};

exports.updateUserAdmin = async (req, res) => {
    const { id } = req.params;
    const {
        nom_entreprise,
        nom_client,
        prenom_client,
        email,
        role,
        // Correction: Définir les champs optionnels à null par défaut
        telephone = null,
        adresse = null,
        siret = null,
        admin_client_id = null
    } = req.body;

    if (!nom_entreprise || !nom_client || !prenom_client || !email || !role) {
        return res.status(400).json({ message: 'All required fields are needed for user update (except password).' });
    }

    try {
        const pool = await getConnection();
        const [existingEmailUsers] = await pool.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
        if (existingEmailUsers.length > 0) {
            return res.status(409).json({ message: 'This email is already used by another user.' });
        }

        const userRole = getValidRole(role);
        const [result] = await pool.execute(
            'UPDATE users SET nom_entreprise = ?, nom_client = ?, prenom_client = ?, email = ?, telephone = ?, adresse = ?, siret = ?, role = ?, admin_client_id = ? WHERE id = ?',
            // S'assurer que tous les paramètres sont passés, même s'ils sont null
            [nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, userRole, admin_client_id, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found or no changes made.' });
        }

        const updatedUser = { id: parseInt(id), nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role: userRole, admin_client_id };
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error updating user by super admin:', error);
        res.status(500).json({ message: 'Internal server error while updating user.' });
    }
};

exports.deleteUserAdmin = async (req, res) => {
    const { id } = req.params;

    // Prevent deletion of own account or other super_admins (important for security)
    if (req.user.id === parseInt(id)) {
        return res.status(403).json({ message: 'You cannot delete your own account from here.' });
    }

    try {
        const pool = await getConnection();
        const [userToDelete] = await pool.execute('SELECT role FROM users WHERE id = ?', [id]);
        if (userToDelete.length > 0 && userToDelete[0].role === 'super_admin') {
            return res.status(403).json({ message: 'Cannot delete another Super Admin account.' });
        }

        const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting user by super admin:', error);
        res.status(500).json({ message: 'Internal server error while deleting user.' });
    }
};

// --- Admin Client specific functions (can only manage their assigned clients) ---

exports.getClientsByAdminClientId = async (req, res) => {
    const adminClientId = req.user.id; // The ID of the logged-in admin_client
    try {
        const pool = await getConnection();
        const [clients] = await pool.execute(
            'SELECT id, nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role FROM users WHERE role = "client" AND admin_client_id = ?',
            [adminClientId]
        );
        res.status(200).json(clients);
    } catch (error) {
        console.error('Error fetching clients for admin client:', error);
        res.status(500).json({ message: 'Internal server error while fetching clients.' });
    }
};

exports.createClientByAdminClient = async (req, res) => {
    const adminClientId = req.user.id; // The ID of the logged-in admin_client
    const {
        nom_entreprise,
        nom_client,
        prenom_client,
        email,
        password,
        // Correction: Définir les champs optionnels à null par défaut
        telephone = null,
        adresse = null,
        siret = null
    } = req.body;

    if (!nom_entreprise || !nom_client || !prenom_client || !email || !password) {
        return res.status(400).json({ message: 'All required fields are needed for client creation.' });
    }

    try {
        const pool = await getConnection();
        const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const [result] = await pool.execute(
            'INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, role, admin_client_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "client", ?)',
            // S'assurer que tous les paramètres sont passés, même s'ils sont null
            [nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, adminClientId]
        );

        const newClient = {
            id: result.insertId,
            nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role: 'client', admin_client_id: adminClientId
        };
        res.status(201).json(newClient);
    } catch (error) {
        console.error('Error creating client by admin client:', error);
        res.status(500).json({ message: 'Internal server error while creating client.' });
    }
};

exports.updateClientByAdminClient = async (req, res) => {
    const { id } = req.params; // The client ID to update
    const adminClientId = req.user.id; // The ID of the logged-in admin_client
    const {
        nom_entreprise,
        nom_client,
        prenom_client,
        email,
        // Correction: Définir les champs optionnels à null par défaut
        telephone = null,
        adresse = null,
        siret = null
    } = req.body;

    if (!nom_entreprise || !nom_client || !prenom_client || !email) {
        return res.status(400).json({ message: 'All required fields are needed for client update.' });
    }

    try {
        const pool = await getConnection();

        // Ensure the client belongs to this admin_client
        const [targetClient] = await pool.execute(
            'SELECT id FROM users WHERE id = ? AND role = "client" AND admin_client_id = ?',
            [id, adminClientId]
        );
        if (targetClient.length === 0) {
            return res.status(403).json({ message: 'Access denied. This client is not associated with your account or does not exist.' });
        }

        // Check if another client (not the current one) already has this email
        const [existingEmailUsers] = await pool.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
        if (existingEmailUsers.length > 0) {
            return res.status(409).json({ message: 'This email is already used by another user.' });
        }

        const [result] = await pool.execute(
            'UPDATE users SET nom_entreprise = ?, nom_client = ?, prenom_client = ?, email = ?, telephone = ?, adresse = ?, siret = ? WHERE id = ?',
            // S'assurer que tous les paramètres sont passés, même s'ils sont null
            [nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Client not found or no changes made.' });
        }

        const updatedClient = { id: parseInt(id), nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role: 'client', admin_client_id: adminClientId };
        res.status(200).json(updatedClient);
    } catch (error) {
        console.error('Error updating client by admin client:', error);
        res.status(500).json({ message: 'Internal server error while updating client.' });
    }
};

exports.deleteClientByAdminClient = async (req, res) => {
    const { id } = req.params; // The client ID to delete
    const adminClientId = req.user.id; // The ID of the logged-in admin_client

    try {
        const pool = await getConnection();

        // Ensure the client belongs to this admin_client and is actually a client
        const [targetClient] = await pool.execute(
            'SELECT id FROM users WHERE id = ? AND role = "client" AND admin_client_id = ?',
            [id, adminClientId]
        );
        if (targetClient.length === 0) {
            return res.status(403).json({ message: 'Access denied. This client is not associated with your account or does not exist.' });
        }

        const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Client not found.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting client by admin client:', error);
        res.status(500).json({ message: 'Internal server error while deleting client.' });
    }
};










// // backend/src/controllers/userController.js
// const { getConnection } = require('../config/db');
// const bcrypt = require('bcryptjs');

// // Helper to determine the target role for updates/creations
// const getValidRole = (role) => {
//     const validRoles = ['super_admin', 'admin_client', 'client'];
//     return validRoles.includes(role) ? role : 'client';
// };

// // --- Super Admin specific functions (can manage all users) ---

// exports.getAllUsersAdmin = async (req, res) => {
//     try {
//         const pool = await getConnection();
//         const [users] = await pool.execute('SELECT id, nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role, admin_client_id FROM users');
//         res.status(200).json(users);
//     } catch (error) {
//         console.error('Error fetching all users for super admin:', error);
//         res.status(500).json({ message: 'Internal server error while fetching users.' });
//     }
// };

// exports.createUserAdmin = async (req, res) => {
//     const { nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password, role, admin_client_id } = req.body;

//     if (!nom_entreprise || !nom_client || !prenom_client || !email || !password || !role) {
//         return res.status(400).json({ message: 'All required fields are needed for user creation.' });
//     }

//     try {
//         const pool = await getConnection();
//         const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
//         if (existingUsers.length > 0) {
//             return res.status(409).json({ message: 'User with this email already exists.' });
//         }

//         const salt = await bcrypt.genSalt(10);
//         const password_hash = await bcrypt.hash(password, salt);
//         const userRole = getValidRole(role);

//         const [result] = await pool.execute(
//             'INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, role, admin_client_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
//             [nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, userRole, admin_client_id]
//         );

//         const newUser = {
//             id: result.insertId,
//             nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role: userRole, admin_client_id
//         };
//         res.status(201).json(newUser);
//     } catch (error) {
//         console.error('Error creating user by super admin:', error);
//         res.status(500).json({ message: 'Internal server error while creating user.' });
//     }
// };

// exports.updateUserAdmin = async (req, res) => {
//     const { id } = req.params;
//     const { nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role, admin_client_id } = req.body;

//     if (!nom_entreprise || !nom_client || !prenom_client || !email || !role) {
//         return res.status(400).json({ message: 'All required fields are needed for user update (except password).' });
//     }

//     try {
//         const pool = await getConnection();
//         const [existingEmailUsers] = await pool.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
//         if (existingEmailUsers.length > 0) {
//             return res.status(409).json({ message: 'This email is already used by another user.' });
//         }

//         const userRole = getValidRole(role);
//         const [result] = await pool.execute(
//             'UPDATE users SET nom_entreprise = ?, nom_client = ?, prenom_client = ?, email = ?, telephone = ?, adresse = ?, siret = ?, role = ?, admin_client_id = ? WHERE id = ?',
//             [nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, userRole, admin_client_id, id]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'User not found or no changes made.' });
//         }

//         const updatedUser = { id: parseInt(id), nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role: userRole, admin_client_id };
//         res.status(200).json(updatedUser);
//     } catch (error) {
//         console.error('Error updating user by super admin:', error);
//         res.status(500).json({ message: 'Internal server error while updating user.' });
//     }
// };

// exports.deleteUserAdmin = async (req, res) => {
//     const { id } = req.params;

//     // Prevent deletion of own account or other super_admins (important for security)
//     if (req.user.id === parseInt(id)) {
//         return res.status(403).json({ message: 'You cannot delete your own account from here.' });
//     }

//     try {
//         const pool = await getConnection();
//         const [userToDelete] = await pool.execute('SELECT role FROM users WHERE id = ?', [id]);
//         if (userToDelete.length > 0 && userToDelete[0].role === 'super_admin') {
//             return res.status(403).json({ message: 'Cannot delete another Super Admin account.' });
//         }

//         const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'User not found.' });
//         }
//         res.status(204).send();
//     } catch (error) {
//         console.error('Error deleting user by super admin:', error);
//         res.status(500).json({ message: 'Internal server error while deleting user.' });
//     }
// };

// // --- Admin Client specific functions (can only manage their assigned clients) ---

// exports.getClientsByAdminClientId = async (req, res) => {
//     const adminClientId = req.user.id; // The ID of the logged-in admin_client
//     try {
//         const pool = await getConnection();
//         const [clients] = await pool.execute(
//             'SELECT id, nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role FROM users WHERE role = "client" AND admin_client_id = ?',
//             [adminClientId]
//         );
//         res.status(200).json(clients);
//     } catch (error) {
//         console.error('Error fetching clients for admin client:', error);
//         res.status(500).json({ message: 'Internal server error while fetching clients.' });
//     }
// };

// exports.createClientByAdminClient = async (req, res) => {
//     const adminClientId = req.user.id; // The ID of the logged-in admin_client
//     const { nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password } = req.body;

//     if (!nom_entreprise || !nom_client || !prenom_client || !email || !password) {
//         return res.status(400).json({ message: 'All required fields are needed for client creation.' });
//     }

//     try {
//         const pool = await getConnection();
//         const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
//         if (existingUsers.length > 0) {
//             return res.status(409).json({ message: 'User with this email already exists.' });
//         }

//         const salt = await bcrypt.genSalt(10);
//         const password_hash = await bcrypt.hash(password, salt);

//         const [result] = await pool.execute(
//             'INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, role, admin_client_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "client", ?)',
//             [nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, adminClientId]
//         );

//         const newClient = {
//             id: result.insertId,
//             nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role: 'client', admin_client_id: adminClientId
//         };
//         res.status(201).json(newClient);
//     } catch (error) {
//         console.error('Error creating client by admin client:', error);
//         res.status(500).json({ message: 'Internal server error while creating client.' });
//     }
// };

// exports.updateClientByAdminClient = async (req, res) => {
//     const { id } = req.params; // The client ID to update
//     const adminClientId = req.user.id; // The ID of the logged-in admin_client
//     const { nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret } = req.body;

//     if (!nom_entreprise || !nom_client || !prenom_client || !email) {
//         return res.status(400).json({ message: 'All required fields are needed for client update.' });
//     }

//     try {
//         const pool = await getConnection();

//         // Ensure the client belongs to this admin_client
//         const [targetClient] = await pool.execute(
//             'SELECT id FROM users WHERE id = ? AND role = "client" AND admin_client_id = ?',
//             [id, adminClientId]
//         );
//         if (targetClient.length === 0) {
//             return res.status(403).json({ message: 'Access denied. This client is not associated with your account or does not exist.' });
//         }

//         // Check if another client (not the current one) already has this email
//         const [existingEmailUsers] = await pool.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
//         if (existingEmailUsers.length > 0) {
//             return res.status(409).json({ message: 'This email is already used by another user.' });
//         }

//         const [result] = await pool.execute(
//             'UPDATE users SET nom_entreprise = ?, nom_client = ?, prenom_client = ?, email = ?, telephone = ?, adresse = ?, siret = ? WHERE id = ?',
//             [nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, id]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Client not found or no changes made.' });
//         }

//         const updatedClient = { id: parseInt(id), nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role: 'client', admin_client_id: adminClientId };
//         res.status(200).json(updatedClient);
//     } catch (error) {
//         console.error('Error updating client by admin client:', error);
//         res.status(500).json({ message: 'Internal server error while updating client.' });
//     }
// };

// exports.deleteClientByAdminClient = async (req, res) => {
//     const { id } = req.params; // The client ID to delete
//     const adminClientId = req.user.id; // The ID of the logged-in admin_client

//     try {
//         const pool = await getConnection();

//         // Ensure the client belongs to this admin_client and is actually a client
//         const [targetClient] = await pool.execute(
//             'SELECT id FROM users WHERE id = ? AND role = "client" AND admin_client_id = ?',
//             [id, adminClientId]
//         );
//         if (targetClient.length === 0) {
//             return res.status(403).json({ message: 'Access denied. This client is not associated with your account or does not exist.' });
//         }

//         const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Client not found.' });
//         }
//         res.status(204).send();
//     } catch (error) {
//         console.error('Error deleting client by admin client:', error);
//         res.status(500).json({ message: 'Internal server error while deleting client.' });
//     }
// };