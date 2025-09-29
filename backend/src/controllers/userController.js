// backend/src/controllers/userController.js
const { getConnection } = require('../config/db');
const bcrypt = require('bcryptjs');

// --- Méthodes pour tous les utilisateurs (profil) ---

exports.getProfile = async (req, res) => {
    let pool;
    try {
        pool = await getConnection();
        const [users] = await pool.execute(
            'SELECT id, nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role, admin_client_siret, created_at, updated_at FROM users WHERE id = ?',
            [req.user.id]
        );
        if (users.length === 0) {
            return res.status(404).json({ message: 'Profil utilisateur non trouvé.' });
        }
        res.json(users[0]);
    } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération du profil.' });
    } finally {
        if (pool) pool.release();
    }
};

exports.updateProfile = async (req, res) => {
    const { nom_entreprise, nom_client, prenom_client, email, telephone, adresse, password } = req.body;
    const userId = req.user.id;

    let pool;
    try {
        pool = await getConnection();
        let updateFields = [];
        let params = [];

        if (nom_entreprise !== undefined) { updateFields.push('nom_entreprise = ?'); params.push(nom_entreprise); }
        if (nom_client !== undefined) { updateFields.push('nom_client = ?'); params.push(nom_client); }
        if (prenom_client !== undefined) { updateFields.push('prenom_client = ?'); params.push(prenom_client); }
        if (email !== undefined) { updateFields.push('email = ?'); params.push(email); }
        if (telephone !== undefined) { updateFields.push('telephone = ?'); params.push(telephone || null); }
        if (adresse !== undefined) { updateFields.push('adresse = ?'); params.push(adresse || null); }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.push('password_hash = ?');
            params.push(hashedPassword);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'Aucune donnée à mettre à jour.' });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(userId);

        const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
        const [result] = await pool.execute(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé ou aucune modification effectuée.' });
        }
        res.json({ message: 'Profil mis à jour avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du profil.' });
    } finally {
        if (pool) pool.release();
    }
};

// --- Méthodes pour Super Admin ---

exports.getAllUsersAdmin = async (req, res) => {
    try {
        const pool = await getConnection();
        const [users] = await pool.execute(
            'SELECT id, nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role, admin_client_siret, created_at, updated_at FROM users'
        );
        res.json(users);
    } catch (error) {
        console.error('Erreur lors de la récupération de tous les utilisateurs (Super Admin):', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des utilisateurs.' });
    }
};

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

        if (role === 'admin_client' && (!siret || siret.length !== 14)) {
            return res.status(400).json({ message: 'Le SIRET est obligatoire et doit contenir 14 chiffres pour un rôle admin_client.' });
        }
        if (role === 'admin_client' && siret) {
            const [existingSiret] = await pool.execute('SELECT id FROM users WHERE siret = ?', [siret]);
            if (existingSiret.length > 0) {
                return res.status(409).json({ message: 'Un autre admin_client utilise déjà ce SIRET.' });
            }
        }
        if (role === 'employer' && (!admin_client_siret || admin_client_siret.length !== 14)) {
            return res.status(400).json({ message: 'Le SIRET de l\'admin client est obligatoire et doit contenir 14 chiffres pour un rôle employer.' });
        }
        if (role === 'employer' && admin_client_siret) {
            const [adminClientExists] = await pool.execute(
                'SELECT id FROM users WHERE siret = ? AND role = "admin_client"', [admin_client_siret]
            );
            if (adminClientExists.length === 0) {
                return res.status(400).json({ message: 'Le SIRET de l\'admin client spécifié n\'existe pas ou n\'est pas valide.' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.execute(
            'INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, role, admin_client_siret) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                nom_entreprise,
                nom_client,
                prenom_client,
                email,
                telephone || null,
                adresse || null,
                siret || null,
                hashedPassword,
                role,
                admin_client_siret || null
            ]
        );

        res.status(201).json({ message: 'Utilisateur créé avec succès.', userId: result.insertId });
    } catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur (Super Admin):', error);
        res.status(500).json({ message: 'Erreur serveur lors de la création de l\'utilisateur.' });
    }
};

exports.updateUserAdmin = async (req, res) => {
    const { id } = req.params;
    const { nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password, role, admin_client_siret } = req.body;

    try {
        const pool = await getConnection();
        const [userToUpdate] = await pool.execute('SELECT role, siret FROM users WHERE id = ?', [id]);
        if (userToUpdate.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }
        const currentRole = userToUpdate[0].role;

        let updateFields = [];
        let params = [];

        if (nom_entreprise !== undefined) { updateFields.push('nom_entreprise = ?'); params.push(nom_entreprise); }
        if (nom_client !== undefined) { updateFields.push('nom_client = ?'); params.push(nom_client); }
        if (prenom_client !== undefined) { updateFields.push('prenom_client = ?'); params.push(prenom_client); }
        if (email !== undefined) { updateFields.push('email = ?'); params.push(email); }
        if (telephone !== undefined) { updateFields.push('telephone = ?'); params.push(telephone || null); }
        if (adresse !== undefined) { updateFields.push('adresse = ?'); params.push(adresse || null); }

        const targetRole = role !== undefined ? role : currentRole;
        if (role !== undefined) { updateFields.push('role = ?'); params.push(role); }

        if (siret !== undefined) {
            if (targetRole === 'admin_client' && siret && siret.length !== 14) {
                return res.status(400).json({ message: 'Le SIRET doit contenir 14 chiffres pour un rôle admin_client.' });
            }
            if (targetRole === 'admin_client' && siret) {
                const [existingSiret] = await pool.execute('SELECT id FROM users WHERE siret = ? AND id != ?', [siret, id]);
                if (existingSiret.length > 0) {
                    return res.status(409).json({ message: 'Un autre admin_client utilise déjà ce SIRET.' });
                }
            }
            updateFields.push('siret = ?'); params.push(siret || null);
        }

        if (admin_client_siret !== undefined) {
            if (targetRole === 'employer' && admin_client_siret && admin_client_siret.length !== 14) {
                return res.status(400).json({ message: 'Le SIRET de l\'admin client doit contenir 14 chiffres pour un rôle employer.' });
            }
            if (targetRole === 'employer' && admin_client_siret) {
                const [adminClientExists] = await pool.execute(
                    'SELECT id FROM users WHERE siret = ? AND role = "admin_client"', [admin_client_siret]
                );
                if (adminClientExists.length === 0) {
                    return res.status(400).json({ message: 'Le SIRET de l\'admin client spécifié n\'existe pas ou n\'est pas valide.' });
                }
            }
            updateFields.push('admin_client_siret = ?'); params.push(admin_client_siret || null);
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.push('password_hash = ?');
            params.push(hashedPassword);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'Aucune donnée à mettre à jour.' });
        }

        params.push(id);
        const query = `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        const [result] = await pool.execute(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé ou aucune modification effectuée.' });
        }
        res.json({ message: 'Utilisateur mis à jour avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur (Super Admin):', error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de l\'utilisateur.' });
    }
};

exports.deleteUserAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur (Super Admin):', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'utilisateur.' });
    }
};

// --- Méthodes pour Admin Client ---

exports.getEmployeesByAdminClientId = async (req, res) => {
    const adminClientId = req.user.id;
    const adminClientSiret = req.user.client_id;

    if (!adminClientSiret) {
        console.warn(`Tentative d'accès aux employés par admin_client_id ${adminClientId} sans SIRET dans le token.`);
        return res.status(400).json({ message: 'SIRET de l\'administrateur client manquant dans le token.' });
    }

    try {
        const pool = await getConnection();
        const [employees] = await pool.execute(
            'SELECT id, nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, role, admin_client_siret FROM users WHERE role = "employer" AND admin_client_siret = ?',
            [adminClientSiret]
        );
        res.json(employees);
    } catch (error) {
        console.error('Erreur lors de la récupération des employés par Admin Client:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des employés.' });
    }
};

exports.createEmployeeByAdminClient = async (req, res) => {
    const { nom_client, prenom_client, email, telephone, adresse, password } = req.body;
    const adminClientId = req.user.id;
    const adminClientSiret = req.user.client_id;

    if (!nom_client || !prenom_client || !email || !password) {
        return res.status(400).json({ message: 'Nom, prénom, email et mot de passe sont requis pour le nouvel employé.' });
    }
    if (!adminClientSiret) {
        return res.status(400).json({ message: 'SIRET de l\'administrateur client manquant pour créer l\'employé.' });
    }

    try {
        const pool = await getConnection();

        const [adminClientInfo] = await pool.execute(
            'SELECT nom_entreprise FROM users WHERE id = ? AND role = "admin_client"',
            [adminClientId]
        );
        if (adminClientInfo.length === 0) {
            return res.status(404).json({ message: 'Admin client non trouvé.' });
        }
        const nom_entreprise = adminClientInfo[0].nom_entreprise;

        const [existingUser] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'Un utilisateur avec cet email existe déjà.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Correction ici : on aligne bien 10 colonnes avec 10 valeurs
        const [result] = await pool.execute(
            `INSERT INTO users 
              (nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, role, admin_client_siret) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nom_entreprise,
                nom_client,
                prenom_client,
                email,
                telephone || null,
                adresse || null,
                null, // un employé n'a jamais de SIRET
                hashedPassword,
                'employer',
                adminClientSiret
            ]
        );

        res.status(201).json({ message: 'Employé créé avec succès.', userId: result.insertId });
    } catch (error) {
        console.error('Erreur lors de la création de l\'employé par Admin Client:', error, req.body);
        res.status(500).json({ message: 'Erreur serveur lors de la création de l\'employé.' });
    }
};

exports.updateEmployeeByAdminClient = async (req, res) => {
    const { id } = req.params;
    const { nom_client, prenom_client, email, telephone, adresse, password } = req.body;
    const adminClientSiret = req.user.client_id;

    if (!adminClientSiret) {
        return res.status(400).json({ message: 'SIRET de l\'administrateur client manquant dans le token.' });
    }

    try {
        const pool = await getConnection();

        const [employee] = await pool.execute(
            'SELECT id FROM users WHERE id = ? AND role = "employer" AND admin_client_siret = ?',
            [id, adminClientSiret]
        );
        if (employee.length === 0) {
            return res.status(404).json({ message: 'Employé non trouvé ou non rattaché à votre établissement.' });
        }

        let updateFields = [];
        let params = [];

        if (nom_client !== undefined) { updateFields.push('nom_client = ?'); params.push(nom_client); }
        if (prenom_client !== undefined) { updateFields.push('prenom_client = ?'); params.push(prenom_client); }
        if (email !== undefined) { updateFields.push('email = ?'); params.push(email); }
        if (telephone !== undefined) { updateFields.push('telephone = ?'); params.push(telephone || null); }
        if (adresse !== undefined) { updateFields.push('adresse = ?'); params.push(adresse || null); }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.push('password_hash = ?');
            params.push(hashedPassword);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'Aucune donnée à mettre à jour.' });
        }

        params.push(id);
        const query = `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        const [result] = await pool.execute(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Employé non trouvé ou aucune modification effectuée.' });
        }
        res.json({ message: 'Employé mis à jour avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'employé par Admin Client:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de l\'employé.' });
    }
};

exports.deleteEmployeeByAdminClient = async (req, res) => {
    const { id } = req.params;
    const adminClientSiret = req.user.client_id;

    if (!adminClientSiret) {
        return res.status(400).json({ message: 'SIRET de l\'administrateur client manquant dans le token.' });
    }

    try {
        const pool = await getConnection();

        const [employee] = await pool.execute(
            'SELECT id FROM users WHERE id = ? AND role = "employer" AND admin_client_siret = ?',
            [id, adminClientSiret]
        );
        if (employee.length === 0) {
            return res.status(404).json({ message: 'Employé non trouvé ou non rattaché à votre établissement.' });
        }

        const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Employé non trouvé.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'employé par Admin Client:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'employé.' });
    }
};
