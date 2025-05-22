// backend/src/controllers/temperatureController.js
const { getConnection } = require('../config/db');

// Helper function to validate common temperature fields
const validateTemperatureFields = (type, location, temperature, timestamp) => {
    if (!type || !location || temperature === undefined || timestamp === undefined) {
        return 'Veuillez fournir tous les champs requis (type, location, temperature, timestamp).';
    }
    // Basic type checking (can be expanded)
    if (typeof type !== 'string' || typeof location !== 'string' || typeof temperature !== 'number' || typeof timestamp !== 'string') {
        return 'Les types de données des champs fournis sont incorrects.';
    }
    return null; // No error
};

// --- Common Temperature Record Functions (used by multiple roles) ---

// This function is for the initial public route or might be removed later
// GET all temperature records (currently used by /api/temperatures route)
exports.getTemperatureRecords = async (req, res) => {
    try {
        const pool = await getConnection();
        const [rows] = await pool.execute(
            'SELECT id, type, location, temperature, timestamp, notes, created_at, user_id FROM temperature_records ORDER BY timestamp DESC'
        );
        res.json(rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des relevés de température:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des relevés.' });
    }
};

// --- Client Specific Temperature Record Functions (renommé 'Employee') ---

// Employee can create their own temperature records
exports.createTemperatureRecord = async (req, res) => {
    // req.user.id est défini par authenticateToken middleware
    const user_id = req.user.id;
    const { type, location, temperature, timestamp, notes = null } = req.body;

    const validationError = validateTemperatureFields(type, location, temperature, timestamp);
    if (validationError) {
        return res.status(400).json({ message: validationError });
    }

    try {
        const pool = await getConnection();
        const [result] = await pool.execute(
            'INSERT INTO temperature_records (type, location, temperature, timestamp, notes, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [type, location, temperature, timestamp, notes, user_id]
        );

        res.status(201).json({
            id: result.insertId,
            type,
            location,
            temperature,
            timestamp,
            notes,
            created_at: new Date().toISOString(),
            user_id
        });
    } catch (error) {
        console.error('Erreur lors de l\'ajout du relevé de température par l\'employé:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du relevé.' });
    }
};

// Employee can get their own temperature records
exports.getTemperatureRecordsByClient = async (req, res) => {
    const user_id = req.user.id; // L'ID de l'employé connecté

    try {
        const pool = await getConnection();
        const [rows] = await pool.execute(
            'SELECT id, type, location, temperature, timestamp, notes, created_at, user_id FROM temperature_records WHERE user_id = ? ORDER BY timestamp DESC',
            [user_id]
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des relevés de température pour l\'employé:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des relevés.' });
    }
};

// Employee can update their own temperature records
exports.updateTemperatureRecordByClient = async (req, res) => {
    const { id } = req.params; // ID du relevé à mettre à jour
    const user_id = req.user.id; // ID de l'employé connecté (pour s'assurer qu'il met à jour le sien)
    const { type, location, temperature, timestamp, notes = null } = req.body;

    const validationError = validateTemperatureFields(type, location, temperature, timestamp);
    if (validationError) {
        return res.status(400).json({ message: validationError });
    }

    try {
        const pool = await getConnection();
        const [result] = await pool.execute(
            'UPDATE temperature_records SET type = ?, location = ?, temperature = ?, timestamp = ?, notes = ? WHERE id = ? AND user_id = ?',
            [type, location, temperature, timestamp, notes, id, user_id]
        );

        if (result.affectedRows === 0) {
            // Either record not found or not owned by this user
            return res.status(404).json({ message: 'Relevé non trouvé ou vous n\'êtes pas autorisé à le modifier.' });
        }

        res.status(200).json({ message: 'Relevé mis à jour avec succès.', id: parseInt(id) });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du relevé de température par l\'employé:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du relevé.' });
    }
};

// Employee cannot delete their own temperature records - This function will NOT be exposed via clientRoutes
// exports.deleteTemperatureRecordByClient = async (req, res) => { /* ... */ };


// --- Admin Client Specific Temperature Record Functions ---

// Admin Client can get temperature records for their associated clients (employees)
exports.getTemperatureRecordsForAdminClient = async (req, res) => {
    const admin_client_id = req.user.id; // L'ID de l'admin client connecté

    try {
        const pool = await getConnection();
        // Sélectionne les relevés de température des utilisateurs qui sont des 'clients' (employés)
        // ET dont l'admin_client_id correspond à l'ID de l'admin client connecté.
        const [rows] = await pool.execute(
            `SELECT tr.id, tr.type, tr.location, tr.temperature, tr.timestamp, tr.notes, tr.created_at, tr.user_id,
                    u.nom_entreprise AS client_nom_entreprise, u.nom_client AS client_nom_client
             FROM temperature_records tr
             JOIN users u ON tr.user_id = u.id
             WHERE u.role = 'client' AND u.admin_client_id = ?
             ORDER BY tr.timestamp DESC`,
            [admin_client_id]
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des relevés de température pour l\'admin client:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des relevés.' });
    }
};

// Admin Client can add temperature records for one of their associated clients (employees)
exports.addTemperatureRecordByAdminClient = async (req, res) => {
    const admin_client_id = req.user.id; // L'ID de l'admin client connecté
    const { user_id, type, location, temperature, timestamp, notes = null } = req.body; // user_id est maintenant requis

    // Valider les champs du relevé
    const validationError = validateTemperatureFields(type, location, temperature, timestamp);
    if (validationError) {
        return res.status(400).json({ message: validationError });
    }
    // Valider que user_id est fourni et est un nombre
    if (!user_id || typeof user_id !== 'number') {
        return res.status(400).json({ message: 'L\'ID de l\'employé (user_id) est requis et doit être un nombre.' });
    }

    try {
        const pool = await getConnection();
        // Vérifier que le user_id fourni est bien un client (employé) associé à cet admin_client
        const [clientExists] = await pool.execute(
            'SELECT id FROM users WHERE id = ? AND role = "client" AND admin_client_id = ?',
            [user_id, admin_client_id]
        );

        if (clientExists.length === 0) {
            return res.status(403).json({ message: 'Employé non trouvé ou non associé à votre compte.' });
        }

        const [result] = await pool.execute(
            'INSERT INTO temperature_records (type, location, temperature, timestamp, notes, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [type, location, temperature, timestamp, notes, user_id]
        );

        res.status(201).json({
            id: result.insertId,
            type,
            location,
            temperature,
            timestamp,
            notes,
            created_at: new Date().toISOString(),
            user_id
        });
    } catch (error) {
        console.error('Erreur lors de l\'ajout du relevé de température par l\'admin client:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du relevé.' });
    }
};

// Admin Client can update temperature records for their associated clients (employees)
exports.updateTemperatureRecordForAdminClient = async (req, res) => {
    const { id } = req.params; // ID du relevé à mettre à jour
    const admin_client_id = req.user.id; // ID de l'admin client connecté
    const { user_id, type, location, temperature, timestamp, notes = null } = req.body; // user_id est requis pour la vérification

    const validationError = validateTemperatureFields(type, location, temperature, timestamp);
    if (validationError) {
        return res.status(400).json({ message: validationError });
    }
    if (!user_id || typeof user_id !== 'number') {
        return res.status(400).json({ message: 'L\'ID de l\'employé (user_id) est requis et doit être un nombre.' });
    }

    try {
        const pool = await getConnection();
        // Vérifier que le relevé existe et appartient bien à un client (employé) associé à cet admin_client
        const [recordExists] = await pool.execute(
            `SELECT tr.id FROM temperature_records tr
             JOIN users u ON tr.user_id = u.id
             WHERE tr.id = ? AND u.id = ? AND u.role = 'client' AND u.admin_client_id = ?`,
            [id, user_id, admin_client_id]
        );

        if (recordExists.length === 0) {
            return res.status(404).json({ message: 'Relevé non trouvé ou non associé à un de vos employés.' });
        }

        const [result] = await pool.execute(
            'UPDATE temperature_records SET type = ?, location = ?, temperature = ?, timestamp = ?, notes = ? WHERE id = ?',
            [type, location, temperature, timestamp, notes, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Relevé non trouvé ou aucune modification effectuée.' });
        }

        res.status(200).json({ message: 'Relevé mis à jour avec succès.', id: parseInt(id) });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du relevé de température par l\'admin client:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du relevé.' });
    }
};

// Admin Client can delete temperature records for their associated clients (employees)
exports.deleteTemperatureRecordForAdminClient = async (req, res) => {
    const { id } = req.params; // ID du relevé à supprimer
    const admin_client_id = req.user.id; // ID de l'admin client connecté

    try {
        const pool = await getConnection();
        // Vérifier que le relevé existe et appartient bien à un client (employé) associé à cet admin_client
        const [recordExists] = await pool.execute(
            `SELECT tr.id FROM temperature_records tr
             JOIN users u ON tr.user_id = u.id
             WHERE tr.id = ? AND u.role = 'client' AND u.admin_client_id = ?`,
            [id, admin_client_id]
        );

        if (recordExists.length === 0) {
            return res.status(404).json({ message: 'Relevé non trouvé ou non associé à un de vos employés.' });
        }

        const [result] = await pool.execute('DELETE FROM temperature_records WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Relevé non trouvé.' });
        }
        res.status(204).send(); // No content for successful deletion
    } catch (error) {
        console.error('Erreur lors de la suppression du relevé de température par l\'admin client:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression du relevé.' });
    }
};







// // backend/src/controllers/temperatureController.js
// const { getConnection } = require('../config/db');

// // --- Functions for client users (can only manage their own records) ---

// exports.createTemperatureRecord = async (req, res) => {
//     const userId = req.user.id; // The ID of the logged-in client
//     const { type, location, temperature, notes } = req.body; // timestamp is now auto-generated by DB

//     if (!type || !location || temperature === undefined || temperature === null) {
//         return res.status(400).json({ message: 'Type, Location, and Temperature are required.' });
//     }

//     try {
//         const pool = await getConnection();
//         const [result] = await pool.execute(
//             'INSERT INTO temperature_records (user_id, type, location, temperature, notes) VALUES (?, ?, ?, ?, ?)',
//             [userId, type, location, temperature, notes]
//         );

//         // Fetch the newly created record, including the auto-generated timestamp
//         const [newRecord] = await pool.execute(
//             'SELECT id, user_id, type, location, temperature, timestamp, notes FROM temperature_records WHERE id = ?',
//             [result.insertId]
//         );

//         res.status(201).json(newRecord[0]);
//     } catch (error) {
//         console.error('Error creating temperature record:', error);
//         res.status(500).json({ message: 'Internal server error while creating temperature record.' });
//     }
// };

// exports.getTemperatureRecordsByClient = async (req, res) => {
//     const userId = req.user.id; // The ID of the logged-in client
//     try {
//         const pool = await getConnection();
//         const [records] = await pool.execute(
//             'SELECT id, type, location, temperature, timestamp, notes FROM temperature_records WHERE user_id = ? ORDER BY timestamp DESC',
//             [userId]
//         );
//         res.status(200).json(records);
//     } catch (error) {
//         console.error('Error fetching temperature records for client:', error);
//         res.status(500).json({ message: 'Internal server error while fetching temperature records.' });
//     }
// };

// exports.updateTemperatureRecordByClient = async (req, res) => {
//     const { id } = req.params; // Record ID
//     const userId = req.user.id; // Logged-in user ID
//     const { type, location, temperature, notes } = req.body;

//     if (!type || !location || temperature === undefined || temperature === null) {
//         return res.status(400).json({ message: 'Type, Location, and Temperature are required for update.' });
//     }

//     try {
//         const pool = await getConnection();
//         // Ensure the record belongs to the logged-in user
//         const [targetRecord] = await pool.execute(
//             'SELECT id FROM temperature_records WHERE id = ? AND user_id = ?',
//             [id, userId]
//         );
//         if (targetRecord.length === 0) {
//             return res.status(403).json({ message: 'Access denied. This record is not yours or does not exist.' });
//         }

//         const [result] = await pool.execute(
//             'UPDATE temperature_records SET type = ?, location = ?, temperature = ?, notes = ? WHERE id = ?',
//             [type, location, temperature, notes, id]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Record not found or no changes made.' });
//         }

//         // Return the updated record
//         const [updatedRec] = await pool.execute(
//             'SELECT id, user_id, type, location, temperature, timestamp, notes FROM temperature_records WHERE id = ?',
//             [id]
//         );
//         res.status(200).json(updatedRec[0]);
//     } catch (error) {
//         console.error('Error updating temperature record by client:', error);
//         res.status(500).json({ message: 'Internal server error while updating temperature record.' });
//     }
// };

// exports.deleteTemperatureRecordByClient = async (req, res) => {
//     const { id } = req.params; // Record ID
//     const userId = req.user.id; // Logged-in user ID

//     try {
//         const pool = await getConnection();
//         // Ensure the record belongs to the logged-in user
//         const [targetRecord] = await pool.execute(
//             'SELECT id FROM temperature_records WHERE id = ? AND user_id = ?',
//             [id, userId]
//         );
//         if (targetRecord.length === 0) {
//             return res.status(403).json({ message: 'Access denied. This record is not yours or does not exist.' });
//         }

//         const [result] = await pool.execute('DELETE FROM temperature_records WHERE id = ?', [id]);
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Record not found.' });
//         }
//         res.status(204).send();
//     } catch (error) {
//         console.error('Error deleting temperature record by client:', error);
//         res.status(500).json({ message: 'Internal server error while deleting temperature record.' });
//     }
// };

// // --- Functions for admin_client users (can manage records of their assigned clients) ---

// exports.getTemperatureRecordsForAdminClient = async (req, res) => {
//     const adminClientId = req.user.id; // The ID of the logged-in admin_client
//     try {
//         const pool = await getConnection();
//         // Select records for all clients associated with this admin_client
//         const [records] = await pool.execute(
//             `SELECT tr.id, tr.user_id, u.nom_entreprise, u.nom_client, u.prenom_client, tr.type, tr.location, tr.temperature, tr.timestamp, tr.notes
//              FROM temperature_records tr
//              JOIN users u ON tr.user_id = u.id
//              WHERE u.admin_client_id = ?
//              ORDER BY tr.timestamp DESC`,
//             [adminClientId]
//         );
//         res.status(200).json(records);
//     } catch (error) {
//         console.error('Error fetching temperature records for admin client dashboard:', error);
//         res.status(500).json({ message: 'Internal server error while fetching temperature records.' });
//     }
// };

// exports.addTemperatureRecordByAdminClient = async (req, res) => {
//     const adminClientId = req.user.id; // The ID of the logged-in admin_client
//     const { client_id, type, location, temperature, notes } = req.body; // admin_client can specify client_id

//     if (!client_id || !type || !location || temperature === undefined || temperature === null) {
//         return res.status(400).json({ message: 'Client ID, Type, Location, and Temperature are required.' });
//     }

//     try {
//         const pool = await getConnection();
//         // Verify that the client_id belongs to this admin_client
//         const [targetClient] = await pool.execute(
//             'SELECT id FROM users WHERE id = ? AND role = "client" AND admin_client_id = ?',
//             [client_id, adminClientId]
//         );
//         if (targetClient.length === 0) {
//             return res.status(403).json({ message: 'Access denied. This client is not associated with your account.' });
//         }

//         const [result] = await pool.execute(
//             'INSERT INTO temperature_records (user_id, type, location, temperature, notes) VALUES (?, ?, ?, ?, ?)',
//             [client_id, type, location, temperature, notes]
//         );

//         const [newRecord] = await pool.execute(
//             'SELECT id, user_id, type, location, temperature, timestamp, notes FROM temperature_records WHERE id = ?',
//             [result.insertId]
//         );
//         res.status(201).json(newRecord[0]);
//     } catch (error) {
//         console.error('Error adding temperature record by admin client:', error);
//         res.status(500).json({ message: 'Internal server error while adding temperature record.' });
//     }
// };

// exports.updateTemperatureRecordForAdminClient = async (req, res) => {
//     const { id } = req.params; // Record ID
//     const adminClientId = req.user.id; // Logged-in admin_client ID
//     const { client_id, type, location, temperature, notes } = req.body; // client_id might be sent for verification

//     if (!client_id || !type || !location || temperature === undefined || temperature === null) {
//         return res.status(400).json({ message: 'Client ID, Type, Location, and Temperature are required for update.' });
//     }

//     try {
//         const pool = await getConnection();

//         // Verify that the record exists and belongs to a client associated with this admin_client
//         const [targetRecord] = await pool.execute(
//             `SELECT tr.id FROM temperature_records tr
//              JOIN users u ON tr.user_id = u.id
//              WHERE tr.id = ? AND u.role = "client" AND u.admin_client_id = ? AND tr.user_id = ?`,
//             [id, adminClientId, client_id]
//         );
//         if (targetRecord.length === 0) {
//             return res.status(403).json({ message: 'Access denied. This record is not for your clients or does not exist.' });
//         }

//         const [result] = await pool.execute(
//             'UPDATE temperature_records SET type = ?, location = ?, temperature = ?, notes = ? WHERE id = ?',
//             [type, location, temperature, notes, id]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Record not found or no changes made.' });
//         }

//         const [updatedRec] = await pool.execute(
//             'SELECT id, user_id, type, location, temperature, timestamp, notes FROM temperature_records WHERE id = ?',
//             [id]
//         );
//         res.status(200).json(updatedRec[0]);
//     } catch (error) {
//         console.error('Error updating temperature record for admin client:', error);
//         res.status(500).json({ message: 'Internal server error while updating temperature record.' });
//     }
// };

// exports.deleteTemperatureRecordForAdminClient = async (req, res) => {
//     const { id } = req.params; // Record ID
//     const adminClientId = req.user.id; // Logged-in admin_client ID

//     try {
//         const pool = await getConnection();

//         // Verify that the record exists and belongs to a client associated with this admin_client
//         const [targetRecord] = await pool.execute(
//             `SELECT tr.id FROM temperature_records tr
//              JOIN users u ON tr.user_id = u.id
//              WHERE tr.id = ? AND u.role = "client" AND u.admin_client_id = ?`,
//             [id, adminClientId]
//         );
//         if (targetRecord.length === 0) {
//             return res.status(403).json({ message: 'Access denied. This record is not for your clients or does not exist.' });
//         }

//         const [result] = await pool.execute('DELETE FROM temperature_records WHERE id = ?', [id]);
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Record not found.' });
//         }
//         res.status(204).send();
//     } catch (error) {
//         console.error('Error deleting temperature record for admin client:', error);
//         res.status(500).json({ message: 'Internal server error while deleting temperature record.' });
//     }
// };