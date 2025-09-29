// backend/src/controllers/temperatureController.js
const { getConnection } = require('../config/db');

// --- Méthodes pour Employé ---

// Renommée de getMyTemperatureRecords pour correspondre à employerRoutes.js
exports.getTemperatureRecordsByClient = async (req, res) => {
    const userId = req.user.id;
    const siretEtablissement = req.user.client_id; // Le SIRET de l'admin_client auquel l'employé est rattaché

    try {
        const pool = await getConnection();
        // Récupérer les relevés de température spécifiques à cet employé ou généraux pour son établissement
        const [records] = await pool.execute(
            'SELECT * FROM temperature_records WHERE (user_id = ? OR siret_etablissement = ?) ORDER BY timestamp DESC',
            [userId, siretEtablissement]
        );
        res.json(records);
    } catch (error) {
        console.error('Erreur lors de la récupération des relevés de température de l\'employé:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des relevés.' });
    }
};

// Renommée de addMyTemperatureRecord pour correspondre à employerRoutes.js
exports.createTemperatureRecord = async (req, res) => {
    const { type, location, temperature, temperature_type, notes } = req.body;
    const userId = req.user.id;
    const siretEtablissement = req.user.client_id; // Le SIRET de l'admin_client auquel l'employé est rattaché

    if (!type || !location || temperature === undefined || temperature === null || !siretEtablissement) {
        return res.status(400).json({ message: 'Tous les champs obligatoires (type, localisation, température, SIRET) sont requis.' });
    }

    try {
        const pool = await getConnection();
        const [result] = await pool.execute(
            'INSERT INTO temperature_records (user_id, siret_etablissement, type, location, temperature, temperature_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, siretEtablissement, type, location, parseFloat(temperature), temperature_type || 'positive', notes || null]
        );
        res.status(201).json({ message: 'Relevé de température ajouté avec succès.', recordId: result.insertId });
    } catch (error) {
        console.error('Erreur lors de l\'ajout du relevé de température de l\'employé:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du relevé.' });
    }
};

// NOUVELLE FONCTION pour que l'employé puisse mettre à jour SES PROPRES relevés
exports.updateTemperatureRecordByClient = async (req, res) => {
    const { id } = req.params; // ID du relevé de température à mettre à jour
    const { type, location, temperature, temperature_type, notes } = req.body;
    const userId = req.user.id; // L'ID de l'employé connecté
    const siretEtablissement = req.user.client_id; // Le SIRET de l'admin_client auquel l'employé est rattaché

    if (!type || !location || temperature === undefined || temperature === null) {
        return res.status(400).json({ message: 'Tous les champs obligatoires (type, localisation, température) sont requis pour la mise à jour.' });
    }

    try {
        const pool = await getConnection();

        // Vérifier que le relevé existe et appartient bien à CET EMPLOYE et à SON ETABLISSEMENT
        const [record] = await pool.execute(
            'SELECT id FROM temperature_records WHERE id = ? AND user_id = ? AND siret_etablissement = ?',
            [id, userId, siretEtablissement]
        );
        if (record.length === 0) {
            return res.status(404).json({ message: 'Relevé de température non trouvé ou non autorisé.' });
        }

        const [result] = await pool.execute(
            'UPDATE temperature_records SET type = ?, location = ?, temperature = ?, temperature_type = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [type, location, parseFloat(temperature), temperature_type || 'positive', notes || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Relevé non trouvé ou aucune modification effectuée.' });
        }
        res.json({ message: 'Relevé de température mis à jour avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du relevé de température par l\'employé:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du relevé.' });
    }
};

// NOUVELLE FONCTION pour que l'employé puisse supprimer SES PROPRES relevés (si autorisé)
// Actuellement non utilisée dans employerRoutes.js selon vos commentaires précédents, mais incluse pour complétude.
exports.deleteTemperatureRecordByClient = async (req, res) => {
    const { id } = req.params; // ID du relevé de température à supprimer
    const userId = req.user.id; // L'ID de l'employé connecté
    const siretEtablissement = req.user.client_id; // Le SIRET de l'admin_client auquel l'employé est rattaché

    try {
        const pool = await getConnection();

        // Vérifier que le relevé existe et appartient bien à CET EMPLOYE et à SON ETABLISSEMENT
        const [record] = await pool.execute(
            'SELECT id FROM temperature_records WHERE id = ? AND user_id = ? AND siret_etablissement = ?',
            [id, userId, siretEtablissement]
        );
        if (record.length === 0) {
            return res.status(404).json({ message: 'Relevé de température non trouvé ou non autorisé.' });
        }

        const [result] = await pool.execute('DELETE FROM temperature_records WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Relevé non trouvé.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Erreur lors de la suppression du relevé de température par l\'employé:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression du relevé.' });
    }
};


// --- Méthodes pour Admin Client ---

exports.getTemperatureRecordsForAdminClient = async (req, res) => {
    const adminClientSiret = req.user.client_id; // SIRET de l'admin_client du token

    if (!adminClientSiret) {
        return res.status(400).json({ message: 'SIRET de l\'administrateur client manquant dans le token.' });
    }

    try {
        const pool = await getConnection();
        // Récupérer tous les relevés de température pour les employés rattachés à ce SIRET admin_client
        // Jointure avec la table users pour obtenir le nom et prénom de l'employé
        const [records] = await pool.execute(
            `SELECT tr.*, u.nom_client, u.prenom_client, u.nom_entreprise AS client_nom_entreprise
             FROM temperature_records tr
             JOIN users u ON tr.user_id = u.id
             WHERE tr.siret_etablissement = ? ORDER BY tr.timestamp DESC`,
            [adminClientSiret]
        );
        res.json(records);
    } catch (error) {
        console.error('Erreur lors de la récupération des relevés de température pour Admin Client:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des relevés.' });
    }
};

exports.addTemperatureRecordByAdminClient = async (req, res) => {
    const { user_id, type, location, temperature, temperature_type, notes } = req.body;
    const adminClientSiret = req.user.client_id; // SIRET de l'admin_client du token

    if (!user_id || !type || !location || temperature === undefined || temperature === null || !adminClientSiret) {
        return res.status(400).json({ message: 'Tous les champs obligatoires (ID utilisateur, type, localisation, température, SIRET) sont requis.' });
    }

    try {
        const pool = await getConnection();

        // Vérifier que l'user_id appartient bien à un employé rattaché à cet adminClientSiret
        const [employee] = await pool.execute('SELECT id FROM users WHERE id = ? AND role = "employer" AND admin_client_siret = ?', [user_id, adminClientSiret]);
        if (employee.length === 0) {
            return res.status(403).json({ message: 'Employé non trouvé ou non rattaché à votre établissement.' });
        }

        const [result] = await pool.execute(
            'INSERT INTO temperature_records (user_id, siret_etablissement, type, location, temperature, temperature_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user_id, adminClientSiret, type, location, parseFloat(temperature), temperature_type || 'positive', notes || null]
        );
        res.status(201).json({ message: 'Relevé de température ajouté avec succès.', recordId: result.insertId });
    } catch (error) {
        console.error('Erreur lors de l\'ajout du relevé de température par Admin Client:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du relevé.' });
    }
};

exports.updateTemperatureRecordForAdminClient = async (req, res) => {
    const { id } = req.params; // ID du relevé de température
    const { type, location, temperature, temperature_type, notes } = req.body;
    const adminClientSiret = req.user.client_id; // SIRET de l'admin_client du token

    if (!adminClientSiret) {
        return res.status(400).json({ message: 'SIRET de l\'administrateur client manquant dans le token.' });
    }
    if (!type || !location || temperature === undefined || temperature === null) {
        return res.status(400).json({ message: 'Tous les champs obligatoires (type, localisation, température) sont requis pour la mise à jour.' });
    }

    try {
        const pool = await getConnection();

        // Vérifier que le relevé existe et appartient bien à l'établissement de cet admin_client
        const [record] = await pool.execute('SELECT id FROM temperature_records WHERE id = ? AND siret_etablissement = ?', [id, adminClientSiret]);
        if (record.length === 0) {
            return res.status(404).json({ message: 'Relevé de température non trouvé ou non rattaché à votre établissement.' });
        }

        const [result] = await pool.execute(
            'UPDATE temperature_records SET type = ?, location = ?, temperature = ?, temperature_type = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [type, location, parseFloat(temperature), temperature_type || 'positive', notes || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Relevé non trouvé ou aucune modification effectuée.' });
        }
        res.json({ message: 'Relevé de température mis à jour avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du relevé de température par Admin Client:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du relevé.' });
    }
};

exports.deleteTemperatureRecordForAdminClient = async (req, res) => {
    const { id } = req.params; // ID du relevé de température
    const adminClientSiret = req.user.client_id; // SIRET de l'admin_client du token

    if (!adminClientSiret) {
        return res.status(400).json({ message: 'SIRET de l\'administrateur client manquant dans le token.' });
    }

    try {
        const pool = await getConnection();

        // Vérifier que le relevé existe et appartient bien à l'établissement de cet admin_client
        const [record] = await pool.execute('SELECT id FROM temperature_records WHERE id = ? AND siret_etablissement = ?', [id, adminClientSiret]);
        if (record.length === 0) {
            return res.status(404).json({ message: 'Relevé de température non trouvé ou non rattaché à votre établissement.' });
        }

        const [result] = await pool.execute('DELETE FROM temperature_records WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Relevé non trouvé.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Erreur lors de la suppression du relevé de température par Admin Client:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression du relevé.' });
    }
};

// --- Méthodes pour Super Admin ---

exports.getAllTemperatureRecordsAdmin = async (req, res) => {
    try {
        const pool = await getConnection();
        // Jointure avec la table users pour obtenir les détails de l'utilisateur et de l'entreprise
        const [records] = await pool.execute(
            `SELECT tr.*, u.nom_client, u.prenom_client, u.nom_entreprise AS client_nom_entreprise
             FROM temperature_records tr
             JOIN users u ON tr.user_id = u.id
             ORDER BY tr.timestamp DESC`
        );
        res.json(records);
    } catch (error) {
        console.error('Erreur lors de la récupération de tous les relevés de température (Super Admin):', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des relevés.' });
    }
};

exports.addTemperatureRecordAdmin = async (req, res) => {
    const { user_id, siret_etablissement, type, location, temperature, temperature_type, notes } = req.body;

    if (!user_id || !siret_etablissement || !type || !location || temperature === undefined || temperature === null) {
        return res.status(400).json({ message: 'Tous les champs obligatoires (ID utilisateur, SIRET, type, localisation, température) sont requis.' });
    }

    try {
        const pool = await getConnection();
        // Vérifier que l'user_id existe et que le siret_etablissement existe et correspond à un admin_client
        const [userExists] = await pool.execute('SELECT id FROM users WHERE id = ?', [user_id]);
        if (userExists.length === 0) {
            return res.status(400).json({ message: 'L\'ID utilisateur spécifié n\'existe pas.' });
        }
        const [siretExists] = await pool.execute('SELECT id FROM users WHERE siret = ? AND role = "admin_client"', [siret_etablissement]);
        if (siretExists.length === 0) {
            return res.status(400).json({ message: 'Le SIRET d\'établissement spécifié n\'existe pas ou n\'est pas un admin_client.' });
        }

        const [result] = await pool.execute(
            'INSERT INTO temperature_records (user_id, siret_etablissement, type, location, temperature, temperature_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user_id, siret_etablissement, type, location, parseFloat(temperature), temperature_type || 'positive', notes || null]
        );
        res.status(201).json({ message: 'Relevé de température ajouté avec succès.', recordId: result.insertId });
    } catch (error) {
        console.error('Erreur lors de l\'ajout du relevé de température (Super Admin):', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du relevé.' });
    }
};

exports.updateTemperatureRecordAdmin = async (req, res) => {
    const { id } = req.params;
    const { user_id, siret_etablissement, type, location, temperature, temperature_type, notes } = req.body;

    if (!user_id || !siret_etablissement || !type || !location || temperature === undefined || temperature === null) {
        return res.status(400).json({ message: 'Tous les champs obligatoires (ID utilisateur, SIRET, type, localisation, température) sont requis pour la mise à jour.' });
    }

    try {
        const pool = await getConnection();

        // Vérifier que le relevé existe
        const [recordExists] = await pool.execute('SELECT id FROM temperature_records WHERE id = ?', [id]);
        if (recordExists.length === 0) {
            return res.status(404).json({ message: 'Relevé de température non trouvé.' });
        }

        // Vérifier que l'user_id existe et que le siret_etablissement existe et correspond à un admin_client
        const [userExists] = await pool.execute('SELECT id FROM users WHERE id = ?', [user_id]);
        if (userExists.length === 0) {
            return res.status(400).json({ message: 'L\'ID utilisateur spécifié n\'existe pas.' });
        }
        const [siretExists] = await pool.execute('SELECT id FROM users WHERE siret = ? AND role = "admin_client"', [siret_etablissement]);
        if (siretExists.length === 0) {
            return res.status(400).json({ message: 'Le SIRET d\'établissement spécifié n\'existe pas ou n\'est pas un admin_client.' });
        }

        const [result] = await pool.execute(
            'UPDATE temperature_records SET user_id = ?, siret_etablissement = ?, type = ?, location = ?, temperature = ?, temperature_type = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [user_id, siret_etablissement, type, location, parseFloat(temperature), temperature_type || 'positive', notes || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Relevé non trouvé ou aucune modification effectuée.' });
        }
        res.json({ message: 'Relevé de température mis à jour avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du relevé de température (Super Admin):', error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du relevé.' });
    }
};

exports.deleteTemperatureRecordAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        const [result] = await pool.execute('DELETE FROM temperature_records WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Relevé de température non trouvé.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Erreur lors de la suppression du relevé de température (Super Admin):', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression du relevé.' });
    }
};







