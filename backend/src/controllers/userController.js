// backend/src/controllers/userController.js
const { getConnection } = require('../config/db');
const bcrypt = require('bcryptjs'); // Pour le hachage de mot de passe si on ajoute un champ password plus tard

// Get all users (Read) - Accessible par Super Admin
exports.getAllUsers = async (req, res) => {
    try {
        const pool = await getConnection();
        // Exclure les champs sensibles comme le mot de passe_hash
        const [users] = await pool.execute('SELECT id, nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role FROM users');
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ message: 'Internal server error while fetching users.' });
    }
};

// Get user by ID (Read) - Accessible par Super Admin
exports.getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        const [users] = await pool.execute('SELECT id, nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(users[0]);
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        res.status(500).json({ message: 'Internal server error while fetching user.' });
    }
};


// Create a new user (Create) - Accessible par Super Admin
exports.createUser = async (req, res) => {
    const { nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password, role } = req.body;

    if (!nom_entreprise || !nom_client || !prenom_client || !email || !password || !role) {
        return res.status(400).json({ message: 'All required fields are needed for user creation.' });
    }

    try {
        const pool = await getConnection();

        // Check if user already exists
        const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Ensure role is valid (super_admin, admin, client)
        const validRoles = ['super_admin', 'admin', 'client'];
        const userRole = validRoles.includes(role) ? role : 'client'; // Default to client if invalid role provided

        const [result] = await pool.execute(
            'INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, userRole]
        );

        // Return the newly created user (without password_hash)
        const newUser = {
            id: result.insertId,
            nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role: userRole
        };

        res.status(201).json(newUser);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Internal server error while creating user.' });
    }
};

// Update an existing user (Update) - Accessible par Super Admin
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role } = req.body;

    if (!nom_entreprise || !nom_client || !prenom_client || !email || !role) {
        return res.status(400).json({ message: 'All required fields are needed for user update (except password).' });
    }

    // Ensure role is valid
    const validRoles = ['super_admin', 'admin', 'client'];
    const userRole = validRoles.includes(role) ? role : 'client';

    try {
        const pool = await getConnection();

        // Check if another user already has this email (if email is changed)
        const [existingEmailUsers] = await pool.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
        if (existingEmailUsers.length > 0) {
            return res.status(409).json({ message: 'This email is already used by another user.' });
        }

        const [result] = await pool.execute(
            'UPDATE users SET nom_entreprise = ?, nom_client = ?, prenom_client = ?, email = ?, telephone = ?, adresse = ?, siret = ?, role = ? WHERE id = ?',
            [nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, userRole, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found or no changes made.' });
        }

        // Return the updated user data
        const updatedUser = { id: parseInt(id), nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role: userRole };
        res.status(200).json(updatedUser);

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Internal server error while updating user.' });
    }
};

// Delete a user (Delete) - Accessible par Super Admin
exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    // Prevent super_admin from deleting themselves or other super_admins (optional but recommended)
    // You'd need to check req.user.id and the role of the user being deleted.
    // For simplicity, let's allow deletion for now, but be careful.
    if (req.user.id === parseInt(id)) {
        return res.status(403).json({ message: 'You cannot delete your own account from here.' });
    }

    try {
        const pool = await getConnection();

        // Check if the user being deleted is a super_admin
        const [userToDelete] = await pool.execute('SELECT role FROM users WHERE id = ?', [id]);
        if (userToDelete.length > 0 && userToDelete[0].role === 'super_admin') {
            return res.status(403).json({ message: 'Cannot delete another Super Admin account.' });
        }

        const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(204).send(); // No content for successful deletion
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Internal server error while deleting user.' });
    }
};