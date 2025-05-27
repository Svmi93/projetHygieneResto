// backend/src/controllers/temperatureController.js
const { getConnection } = require('../config/db');

// --- Common function to get temperature records by user ID (for 'employer' role) ---
exports.getTemperatureRecordsByClient = async (req, res) => {
    const userId = req.user.id; // L'ID de l'employé connecté
    try {
        const pool = await getConnection();
        // MODIFICATION ICI : Récupérer le admin_client_siret de l'employé connecté
        const [userData] = await pool.execute('SELECT admin_client_siret FROM users WHERE id = ? AND role = "employer"', [userId]);
        if (userData.length === 0 || !userData[0].admin_client_siret) { // Vérifie admin_client_siret
            return res.status(403).json({ message: 'Accès refusé. Employé non trouvé ou rattaché à aucun établissement (admin_client_siret non défini).' });
        }
        const employerSiret = userData[0].admin_client_siret; // Utilise admin_client_siret

        const [records] = await pool.execute(
            'SELECT id, type, location, temperature, timestamp, notes, temperature_type FROM temperature_records WHERE user_id = ? AND siret_etablissement = ? ORDER BY timestamp DESC',
            [userId, employerSiret]
        );
        res.status(200).json(records);
    } catch (error) {
        console.error('Erreur lors de la récupération des relevés de température pour l\'employé:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des relevés.' });
    }
};

// --- Common function to create temperature record (for 'employer' role) ---
exports.createTemperatureRecord = async (req, res) => {
    const userId = req.user.id; // L'ID de l'employé connecté
    const { type, location, temperature, timestamp, temperature_type, notes = null } = req.body;

    if (!type || !location || temperature === undefined || !timestamp || !temperature_type) {
        return res.status(400).json({ message: 'Type, emplacement, température, date/heure et type de température sont requis.' });
    }
    if (!['positive', 'negative'].includes(temperature_type)) {
        return res.status(400).json({ message: 'Invalid temperature_type. Must be "positive" or "negative".' });
    }

    try {
        const pool = await getConnection();
        // MODIFICATION ICI : Récupérer le admin_client_siret de l'employé connecté
        const [userData] = await pool.execute('SELECT admin_client_siret FROM users WHERE id = ? AND role = "employer"', [userId]);
        if (userData.length === 0 || !userData[0].admin_client_siret) { // Vérifie admin_client_siret
            return res.status(403).json({ message: 'Accès refusé. Employé non trouvé ou rattaché à aucun établissement (admin_client_siret non défini).' });
        }
        const siretEtablissement = userData[0].admin_client_siret; // Utilise admin_client_siret

        const [result] = await pool.execute(
            'INSERT INTO temperature_records (user_id, siret_etablissement, type, location, temperature, timestamp, temperature_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, siretEtablissement, type, location, temperature, timestamp, temperature_type, notes]
        );

        const newRecord = { id: result.insertId, user_id: userId, siret_etablissement: siretEtablissement, type, location, temperature, timestamp, temperature_type, notes };
        res.status(201).json(newRecord);
    } catch (error) {
        console.error('Erreur lors de l\'ajout du relevé de température:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du relevé.' });
    }
};

// --- Common function to update temperature record (for 'employer' role) ---
exports.updateTemperatureRecordByClient = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id; // L'ID de l'employé connecté
    const { type, location, temperature, timestamp, temperature_type, notes = null } = req.body;

    if (!type || !location || temperature === undefined || !timestamp || !temperature_type) {
        return res.status(400).json({ message: 'Type, emplacement, température, date/heure et type de température sont requis pour la mise à jour.' });
    }
    if (!['positive', 'negative'].includes(temperature_type)) {
        return res.status(400).json({ message: 'Invalid temperature_type. Must be "positive" or "negative".' });
    }

    try {
        const pool = await getConnection();
        // Vérifier que le relevé appartient bien à l'employé connecté ET à son établissement
        // MODIFICATION ICI : Récupérer le admin_client_siret de l'employé connecté pour la vérification
        const [userData] = await pool.execute('SELECT admin_client_siret FROM users WHERE id = ? AND role = "employer"', [userId]);
        if (userData.length === 0 || !userData[0].admin_client_siret) {
            return res.status(403).json({ message: 'Accès refusé. Employé non trouvé ou rattaché à aucun établissement.' });
        }
        const employerSiret = userData[0].admin_client_siret;


        const [record] = await pool.execute(
            'SELECT user_id FROM temperature_records WHERE id = ? AND user_id = ? AND siret_etablissement = ?', // AJOUT DE siret_etablissement dans la condition
            [id, userId, employerSiret]
        );
        if (record.length === 0) {
            return res.status(403).json({ message: 'Accès refusé. Ce relevé n\'appartient pas à cet employé, à son établissement, ou n\'existe pas.' });
        }

        const [result] = await pool.execute(
            'UPDATE temperature_records SET type = ?, location = ?, temperature = ?, timestamp = ?, temperature_type = ?, notes = ? WHERE id = ?',
            [type, location, temperature, timestamp, temperature_type, notes, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Relevé de température non trouvé ou aucune modification effectuée.' });
        }

        const updatedRecord = { id: parseInt(id), user_id: userId, type, location, temperature, timestamp, temperature_type, notes };
        res.status(200).json(updatedRecord);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du relevé de température:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du relevé.' });
    }
};

// --- Admin Client specific functions (can manage temperature records of their assigned employees) ---
// Ces fonctions semblent déjà correctes, car elles utilisent 'siret' pour l'admin_client
// et 'admin_client_siret' pour vérifier la liaison avec les employés.
exports.getTemperatureRecordsForAdminClient = async (req, res) => {
    const adminClientId = req.user.id;
    try {
        const pool = await getConnection();
        // Récupérer le SIRET de l'admin_client connecté
        const [adminClientData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
        if (adminClientData.length === 0 || !adminClientData[0].siret) {
            return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
        }
        const adminClientSiret = adminClientData[0].siret;

        const [records] = await pool.execute(
            'SELECT tr.id, tr.type, tr.location, tr.temperature, tr.timestamp, tr.notes, tr.created_at, tr.user_id, tr.temperature_type, ' +
            'u.nom_entreprise AS client_nom_entreprise, u.nom_client AS client_nom_client ' +
            'FROM temperature_records tr ' +
            'JOIN users u ON tr.user_id = u.id ' +
            'WHERE tr.siret_etablissement = ? AND u.role = "employer" ' + // Filtrer par siret_etablissement et rôle 'employer'
            'ORDER BY tr.timestamp DESC',
            [adminClientSiret]
        );
        res.status(200).json(records);
    } catch (error) {
        console.error('Erreur lors de la récupération des relevés de température pour l\'admin client:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des relevés.' });
    }
};

exports.addTemperatureRecordByAdminClient = async (req, res) => {
    const adminClientId = req.user.id;
    const { user_id, type, location, temperature, timestamp, temperature_type, notes = null } = req.body;

    if (!user_id || !type || !location || temperature === undefined || !timestamp || !temperature_type) {
        return res.status(400).json({ message: 'ID utilisateur, type, emplacement, température, date/heure et type de température sont requis.' });
    }
    if (!['positive', 'negative'].includes(temperature_type)) {
        return res.status(400).json({ message: 'Invalid temperature_type. Must be "positive" or "negative".' });
    }

    try {
        const pool = await getConnection();

        // Récupérer le SIRET de l'admin_client connecté
        const [adminClientData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
        if (adminClientData.length === 0 || !adminClientData[0].siret) {
            return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
        }
        const adminClientSiret = adminClientData[0].siret;

        // Vérifier que l'user_id fourni est bien un employé rattaché à cet admin_client via le SIRET
        // ICI : S'assurer que le siret_etablissement de l'employé correspond au admin_client_siret
        const [employerData] = await pool.execute(
            'SELECT id, admin_client_siret FROM users WHERE id = ? AND role = "employer" AND admin_client_siret = ?', // MODIFICATION ICI
            [user_id, adminClientSiret]
        );
        if (employerData.length === 0) {
            return res.status(403).json({ message: 'Accès refusé. L\'utilisateur spécifié n\'est pas un employé de votre établissement.' });
        }
        // Le SIRET de l'employé (qui doit être le même que l'admin client's admin_client_siret)
        const employerSiret = employerData[0].admin_client_siret; // MODIFICATION ICI

        const [result] = await pool.execute(
            'INSERT INTO temperature_records (user_id, siret_etablissement, type, location, temperature, timestamp, temperature_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [user_id, employerSiret, type, location, temperature, timestamp, temperature_type, notes]
        );

        const newRecord = { id: result.insertId, user_id, siret_etablissement: employerSiret, type, location, temperature, timestamp, temperature_type, notes };
        res.status(201).json(newRecord);
    } catch (error) {
        console.error('Erreur lors de l\'ajout du relevé de température par l\'admin client:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du relevé.' });
    }
};

exports.updateTemperatureRecordForAdminClient = async (req, res) => {
    const { id } = req.params;
    const adminClientId = req.user.id;
    const { user_id, type, location, temperature, timestamp, temperature_type, notes = null } = req.body;

    if (!user_id || !type || !location || temperature === undefined || !timestamp || !temperature_type) {
        return res.status(400).json({ message: 'ID utilisateur, type, emplacement, température, date/heure et type de température sont requis pour la mise à jour.' });
    }
    if (!['positive', 'negative'].includes(temperature_type)) {
        return res.status(400).json({ message: 'Invalid temperature_type. Must be "positive" or "negative".' });
    }

    try {
        const pool = await getConnection();
        // Récupérer le SIRET de l'admin_client connecté
        const [adminClientData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
        if (adminClientData.length === 0 || !adminClientData[0].siret) {
            return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
        }
        const adminClientSiret = adminClientData[0].siret;

        // Vérifier que le relevé existe et appartient à un employé de cet admin_client
        const [recordToUpdate] = await pool.execute(
            'SELECT tr.id FROM temperature_records tr JOIN users u ON tr.user_id = u.id ' +
            'WHERE tr.id = ? AND tr.user_id = ? AND u.role = "employer" AND u.admin_client_siret = ?',
            [id, user_id, adminClientSiret]
        );
        if (recordToUpdate.length === 0) {
            return res.status(403).json({ message: 'Accès refusé. Ce relevé n\'appartient pas à un employé de votre établissement ou n\'existe pas.' });
        }

        const [result] = await pool.execute(
            'UPDATE temperature_records SET user_id = ?, type = ?, location = ?, temperature = ?, timestamp = ?, temperature_type = ?, notes = ? WHERE id = ?',
            [user_id, type, location, temperature, timestamp, temperature_type, notes, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Relevé de température non trouvé ou aucune modification effectuée.' });
        }

        const updatedRecord = { id: parseInt(id), user_id, type, location, temperature, timestamp, temperature_type, notes };
        res.status(200).json(updatedRecord);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du relevé de température par l\'admin client:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du relevé.' });
    }
};

exports.deleteTemperatureRecordForAdminClient = async (req, res) => {
    const { id } = req.params;
    const adminClientId = req.user.id;

    try {
        const pool = await getConnection();
        // Récupérer le SIRET de l'admin_client connecté
        const [adminClientData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
        if (adminClientData.length === 0 || !adminClientData[0].siret) {
            return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
        }
        const adminClientSiret = adminClientData[0].siret;

        // Vérifier que le relevé existe et appartient à un employé de cet admin_client
        const [recordToDelete] = await pool.execute(
            'SELECT tr.id FROM temperature_records tr JOIN users u ON tr.user_id = u.id ' +
            'WHERE tr.id = ? AND u.role = "employer" AND u.admin_client_siret = ?',
            [id, adminClientSiret]
        );
        if (recordToDelete.length === 0) {
            return res.status(403).json({ message: 'Accès refusé. Ce relevé n\'appartient pas à un employé de votre établissement ou n\'existe pas.' });
        }

        const [result] = await pool.execute('DELETE FROM temperature_records WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Relevé de température non trouvé.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Erreur lors de la suppression du relevé de température par l\'admin client:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression du relevé.' });
    }
};

// --- Super Admin specific functions (can manage all temperature records) ---
exports.getAllTemperatureRecordsAdmin = async (req, res) => {
    try {
        const pool = await getConnection();
        const [records] = await pool.execute(
            'SELECT tr.id, tr.type, tr.location, tr.temperature, tr.timestamp, tr.notes, tr.created_at, tr.user_id, tr.siret_etablissement, tr.temperature_type, ' +
            'u.nom_entreprise AS client_nom_entreprise, u.nom_client AS client_nom_client, u.prenom_client AS client_prenom_client ' +
            'FROM temperature_records tr ' +
            'JOIN users u ON tr.user_id = u.id ' +
            'ORDER BY tr.timestamp DESC'
        );
        res.status(200).json(records);
    } catch (error) {
        console.error('Error fetching all temperature records for super admin:', error);
        res.status(500).json({ message: 'Internal server error while fetching temperature records.' });
    }
};

exports.addTemperatureRecordAdmin = async (req, res) => {
    const { user_id, siret_etablissement, type, location, temperature, timestamp, temperature_type, notes = null } = req.body;

    if (!user_id || !siret_etablissement || !type || !location || temperature === undefined || !timestamp || !temperature_type) {
        return res.status(400).json({ message: 'User ID, SIRET établissement, type, emplacement, température, date/heure et type de température sont requis.' });
    }
    if (!['positive', 'negative'].includes(temperature_type)) {
        return res.status(400).json({ message: 'Invalid temperature_type. Must be "positive" or "negative".' });
    }

    try {
        const pool = await getConnection();
        // Optional: Valider que user_id et siret_etablissement sont cohérents
        // Il est préférable de vérifier si l'user_id existe et son rôle, et récupérer le siret_etablissement directement de l'utilisateur
        // pour éviter des incohérences si l'admin tente d'assigner un siret incorrect.
        // Pour un super_admin, on pourrait laisser tel quel si on assume qu'il connaît la structure.
        const [userCheck] = await pool.execute('SELECT siret, admin_client_siret, role FROM users WHERE id = ?', [user_id]);
        if (userCheck.length === 0) {
            return res.status(400).json({ message: 'User ID fourni non trouvé.' });
        }
        let actualSiretEtablissement;
        if (userCheck[0].role === 'admin_client') {
            actualSiretEtablissement = userCheck[0].siret;
        } else if (userCheck[0].role === 'employer') {
            actualSiretEtablissement = userCheck[0].admin_client_siret;
        } else {
            // Gérer d'autres rôles si nécessaire, ou rejeter
            return res.status(400).json({ message: 'Le rôle de l\'utilisateur fourni ne permet pas la création de relevés de température.' });
        }
        if (actualSiretEtablissement !== siret_etablissement) {
            console.warn(`Incohérence détectée: le SIRET fourni (${siret_etablissement}) ne correspond pas au SIRET de l'établissement de l'utilisateur (${actualSiretEtablissement}). Le SIRET réel de l'utilisateur sera utilisé.`);
            siret_etablissement = actualSiretEtablissement; // Prioriser le SIRET de l'utilisateur dans la DB
        }

        const [result] = await pool.execute(
            'INSERT INTO temperature_records (user_id, siret_etablissement, type, location, temperature, timestamp, temperature_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [user_id, siret_etablissement, type, location, temperature, timestamp, temperature_type, notes]
        );

        const newRecord = { id: result.insertId, user_id, siret_etablissement, type, location, temperature, timestamp, temperature_type, notes };
        res.status(201).json(newRecord);
    } catch (error) {
        console.error('Erreur lors de l\'ajout du relevé de température par le super admin:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du relevé.' });
    }
};

exports.updateTemperatureRecordAdmin = async (req, res) => {
    const { id } = req.params;
    const { user_id, siret_etablissement, type, location, temperature, timestamp, temperature_type, notes = null } = req.body;

    if (!user_id || !siret_etablissement || !type || !location || temperature === undefined || !timestamp || !temperature_type) {
        return res.status(400).json({ message: 'User ID, SIRET établissement, type, emplacement, température, date/heure et type de température sont requis pour la mise à jour.' });
    }
    if (!['positive', 'negative'].includes(temperature_type)) {
        return res.status(400).json({ message: 'Invalid temperature_type. Must be "positive" or "negative".' });
    }

    try {
        const pool = await getConnection();
        // Optional: Valider que user_id et siret_etablissement sont cohérents
        const [userCheck] = await pool.execute('SELECT siret, admin_client_siret, role FROM users WHERE id = ?', [user_id]);
        if (userCheck.length === 0) {
            return res.status(400).json({ message: 'User ID fourni non trouvé.' });
        }
        let actualSiretEtablissement;
        if (userCheck[0].role === 'admin_client') {
            actualSiretEtablissement = userCheck[0].siret;
        } else if (userCheck[0].role === 'employer') {
            actualSiretEtablissement = userCheck[0].admin_client_siret;
        } else {
            // Gérer d'autres rôles si nécessaire, ou rejeter
            return res.status(400).json({ message: 'Le rôle de l\'utilisateur fourni ne permet pas la mise à jour de relevés de température.' });
        }
        if (actualSiretEtablissement !== siret_etablissement) {
            console.warn(`Incohérence détectée: le SIRET fourni (${siret_etablissement}) ne correspond pas au SIRET de l'établissement de l'utilisateur (${actualSiretEtablissement}).`);
            // Décidez si vous voulez permettre la mise à jour avec le SIRET fourni ou forcer le SIRET réel de l'utilisateur
            // Pour l'instant, on laisse le SIRET fourni mais on loggue l'avertissement.
        }

        const [result] = await pool.execute(
            'UPDATE temperature_records SET user_id = ?, siret_etablissement = ?, type = ?, location = ?, temperature = ?, timestamp = ?, temperature_type = ?, notes = ? WHERE id = ?',
            [user_id, siret_etablissement, type, location, temperature, timestamp, temperature_type, notes, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Relevé de température non trouvé ou aucune modification effectuée.' });
        }

        const updatedRecord = { id: parseInt(id), user_id, siret_etablissement, type, location, temperature, timestamp, temperature_type, notes };
        res.status(200).json(updatedRecord);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du relevé de température par le super admin:', error);
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
        console.error('Erreur lors de la suppression du relevé de température par le super admin:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression du relevé.' });
    }
};







// // backend/src/controllers/temperatureController.js
// const { getConnection } = require('../config/db');

// // --- Common function to get temperature records by user ID (for 'employer' role) ---
// exports.getTemperatureRecordsByClient = async (req, res) => {
//     const userId = req.user.id; // L'ID de l'employé connecté
//     try {
//         const pool = await getConnection();
//         // Récupérer le SIRET de l'employé connecté
//         const [userData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "employer"', [userId]);
//         if (userData.length === 0 || !userData[0].siret) {
//             return res.status(403).json({ message: 'Accès refusé. Employé non trouvé ou SIRET non défini.' });
//         }
//         const employerSiret = userData[0].siret;

//         const [records] = await pool.execute(
//             'SELECT id, type, location, temperature, timestamp, notes, temperature_type FROM temperature_records WHERE user_id = ? AND siret_etablissement = ? ORDER BY timestamp DESC', // <--- ADDED temperature_type
//             [userId, employerSiret]
//         );
//         res.status(200).json(records);
//     } catch (error) {
//         console.error('Erreur lors de la récupération des relevés de température pour l\'employé:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la récupération des relevés.' });
//     }
// };

// // --- Common function to create temperature record (for 'employer' role) ---
// exports.createTemperatureRecord = async (req, res) => {
//     const userId = req.user.id; // L'ID de l'employé connecté
//     const { type, location, temperature, timestamp, temperature_type, notes = null } = req.body; // <--- ADDED timestamp, temperature_type

//     if (!type || !location || temperature === undefined || !timestamp || !temperature_type) { // <--- ADDED timestamp, temperature_type
//         return res.status(400).json({ message: 'Type, emplacement, température, date/heure et type de température sont requis.' });
//     }
//     if (!['positive', 'negative'].includes(temperature_type)) { // <--- ADDED validation
//         return res.status(400).json({ message: 'Invalid temperature_type. Must be "positive" or "negative".' });
//     }

//     try {
//         const pool = await getConnection();
//         // Récupérer le SIRET de l'employé connecté pour l'assigner au relevé
//         const [userData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "employer"', [userId]);
//         if (userData.length === 0 || !userData[0].siret) {
//             return res.status(403).json({ message: 'Accès refusé. Employé non trouvé ou SIRET non défini.' });
//         }
//         const siretEtablissement = userData[0].siret;

//         const [result] = await pool.execute(
//             'INSERT INTO temperature_records (user_id, siret_etablissement, type, location, temperature, timestamp, temperature_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', // <--- ADDED timestamp, temperature_type
//             [userId, siretEtablissement, type, location, temperature, timestamp, temperature_type, notes] // <--- ADDED timestamp, temperature_type
//         );

//         const newRecord = { id: result.insertId, user_id: userId, siret_etablissement: siretEtablissement, type, location, temperature, timestamp, temperature_type, notes }; // <--- ADDED timestamp, temperature_type
//         res.status(201).json(newRecord);
//     } catch (error) {
//         console.error('Erreur lors de l\'ajout du relevé de température:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du relevé.' });
//     }
// };

// // --- Common function to update temperature record (for 'employer' role) ---
// exports.updateTemperatureRecordByClient = async (req, res) => {
//     const { id } = req.params;
//     const userId = req.user.id; // L'ID de l'employé connecté
//     const { type, location, temperature, timestamp, temperature_type, notes = null } = req.body; // <--- ADDED timestamp, temperature_type

//     if (!type || !location || temperature === undefined || !timestamp || !temperature_type) { // <--- ADDED timestamp, temperature_type
//         return res.status(400).json({ message: 'Type, emplacement, température, date/heure et type de température sont requis pour la mise à jour.' });
//     }
//     if (!['positive', 'negative'].includes(temperature_type)) { // <--- ADDED validation
//         return res.status(400).json({ message: 'Invalid temperature_type. Must be "positive" or "negative".' });
//     }

//     try {
//         const pool = await getConnection();
//         // Vérifier que le relevé appartient bien à l'employé connecté
//         const [record] = await pool.execute('SELECT user_id FROM temperature_records WHERE id = ? AND user_id = ?', [id, userId]);
//         if (record.length === 0) {
//             return res.status(403).json({ message: 'Accès refusé. Ce relevé n\'appartient pas à cet employé ou n\'existe pas.' });
//         }

//         const [result] = await pool.execute(
//             'UPDATE temperature_records SET type = ?, location = ?, temperature = ?, timestamp = ?, temperature_type = ?, notes = ? WHERE id = ?', // <--- ADDED timestamp, temperature_type
//             [type, location, temperature, timestamp, temperature_type, notes, id] // <--- ADDED timestamp, temperature_type
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Relevé de température non trouvé ou aucune modification effectuée.' });
//         }

//         const updatedRecord = { id: parseInt(id), user_id: userId, type, location, temperature, timestamp, temperature_type, notes }; // <--- ADDED timestamp, temperature_type
//         res.status(200).json(updatedRecord);
//     } catch (error) {
//         console.error('Erreur lors de la mise à jour du relevé de température:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du relevé.' });
//     }
// };

// // --- Admin Client specific functions (can manage temperature records of their assigned employees) ---
// exports.getTemperatureRecordsForAdminClient = async (req, res) => {
//     const adminClientId = req.user.id;
//     try {
//         const pool = await getConnection();
//         // Récupérer le SIRET de l'admin_client connecté
//         const [adminClientData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
//         if (adminClientData.length === 0 || !adminClientData[0].siret) {
//             return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
//         }
//         const adminClientSiret = adminClientData[0].siret;

//         const [records] = await pool.execute(
//             'SELECT tr.id, tr.type, tr.location, tr.temperature, tr.timestamp, tr.notes, tr.created_at, tr.user_id, tr.temperature_type, ' + // <--- ADDED temperature_type
//             'u.nom_entreprise AS client_nom_entreprise, u.nom_client AS client_nom_client ' +
//             'FROM temperature_records tr ' +
//             'JOIN users u ON tr.user_id = u.id ' +
//             'WHERE tr.siret_etablissement = ? AND u.role = "employer" ' + // Filtrer par siret_etablissement et rôle 'employer'
//             'ORDER BY tr.timestamp DESC',
//             [adminClientSiret]
//         );
//         res.status(200).json(records);
//     } catch (error) {
//         console.error('Erreur lors de la récupération des relevés de température pour l\'admin client:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la récupération des relevés.' });
//     }
// };

// exports.addTemperatureRecordByAdminClient = async (req, res) => {
//     const adminClientId = req.user.id;
//     const { user_id, type, location, temperature, timestamp, temperature_type, notes = null } = req.body; // <--- ADDED timestamp, temperature_type

//     if (!user_id || !type || !location || temperature === undefined || !timestamp || !temperature_type) { // <--- ADDED timestamp, temperature_type
//         return res.status(400).json({ message: 'ID utilisateur, type, emplacement, température, date/heure et type de température sont requis.' });
//     }
//     if (!['positive', 'negative'].includes(temperature_type)) { // <--- ADDED validation
//         return res.status(400).json({ message: 'Invalid temperature_type. Must be "positive" or "negative".' });
//     }

//     try {
//         const pool = await getConnection();

//         // Récupérer le SIRET de l'admin_client connecté
//         const [adminClientData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
//         if (adminClientData.length === 0 || !adminClientData[0].siret) {
//             return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
//         }
//         const adminClientSiret = adminClientData[0].siret;

//         // Vérifier que l'user_id fourni est bien un employé rattaché à cet admin_client via le SIRET
//         const [employerData] = await pool.execute(
//             'SELECT id, siret FROM users WHERE id = ? AND role = "employer" AND admin_client_siret = ?',
//             [user_id, adminClientSiret]
//         );
//         if (employerData.length === 0) {
//             return res.status(403).json({ message: 'Accès refusé. L\'utilisateur spécifié n\'est pas un employé de votre établissement.' });
//         }
//         const employerSiret = employerData[0].siret; // Le SIRET de l'employé (qui doit être le même que l'admin client)

//         const [result] = await pool.execute(
//             'INSERT INTO temperature_records (user_id, siret_etablissement, type, location, temperature, timestamp, temperature_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', // <--- ADDED timestamp, temperature_type
//             [user_id, employerSiret, type, location, temperature, timestamp, temperature_type, notes] // <--- ADDED timestamp, temperature_type
//         );

//         const newRecord = { id: result.insertId, user_id, siret_etablissement: employerSiret, type, location, temperature, timestamp, temperature_type, notes }; // <--- ADDED timestamp, temperature_type
//         res.status(201).json(newRecord);
//     } catch (error) {
//         console.error('Erreur lors de l\'ajout du relevé de température par l\'admin client:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du relevé.' });
//     }
// };


// exports.updateTemperatureRecordForAdminClient = async (req, res) => {
//     const { id } = req.params;
//     const adminClientId = req.user.id;
//     const { user_id, type, location, temperature, timestamp, temperature_type, notes = null } = req.body; // <--- ADDED timestamp, temperature_type

//     if (!user_id || !type || !location || temperature === undefined || !timestamp || !temperature_type) { // <--- ADDED timestamp, temperature_type
//         return res.status(400).json({ message: 'ID utilisateur, type, emplacement, température, date/heure et type de température sont requis pour la mise à jour.' });
//     }
//     if (!['positive', 'negative'].includes(temperature_type)) { // <--- ADDED validation
//         return res.status(400).json({ message: 'Invalid temperature_type. Must be "positive" or "negative".' });
//     }

//     try {
//         const pool = await getConnection();
//         // Récupérer le SIRET de l'admin_client connecté
//         const [adminClientData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
//         if (adminClientData.length === 0 || !adminClientData[0].siret) {
//             return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
//         }
//         const adminClientSiret = adminClientData[0].siret;

//         // Vérifier que le relevé existe et appartient à un employé de cet admin_client
//         const [recordToUpdate] = await pool.execute(
//             'SELECT tr.id FROM temperature_records tr JOIN users u ON tr.user_id = u.id ' +
//             'WHERE tr.id = ? AND tr.user_id = ? AND u.role = "employer" AND u.admin_client_siret = ?',
//             [id, user_id, adminClientSiret]
//         );
//         if (recordToUpdate.length === 0) {
//             return res.status(403).json({ message: 'Accès refusé. Ce relevé n\'appartient pas à un employé de votre établissement ou n\'existe pas.' });
//         }

//         const [result] = await pool.execute(
//             'UPDATE temperature_records SET user_id = ?, type = ?, location = ?, temperature = ?, timestamp = ?, temperature_type = ?, notes = ? WHERE id = ?', // <--- ADDED timestamp, temperature_type
//             [user_id, type, location, temperature, timestamp, temperature_type, notes, id] // <--- ADDED timestamp, temperature_type
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Relevé de température non trouvé ou aucune modification effectuée.' });
//         }

//         const updatedRecord = { id: parseInt(id), user_id, type, location, temperature, timestamp, temperature_type, notes }; // <--- ADDED timestamp, temperature_type
//         res.status(200).json(updatedRecord);
//     } catch (error) {
//         console.error('Erreur lors de la mise à jour du relevé de température par l\'admin client:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du relevé.' });
//     }
// };

// exports.deleteTemperatureRecordForAdminClient = async (req, res) => {
//     const { id } = req.params;
//     const adminClientId = req.user.id;

//     try {
//         const pool = await getConnection();
//         // Récupérer le SIRET de l'admin_client connecté
//         const [adminClientData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
//         if (adminClientData.length === 0 || !adminClientData[0].siret) {
//             return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
//         }
//         const adminClientSiret = adminClientData[0].siret;

//         // Vérifier que le relevé existe et appartient à un employé de cet admin_client
//         const [recordToDelete] = await pool.execute(
//             'SELECT tr.id FROM temperature_records tr JOIN users u ON tr.user_id = u.id ' +
//             'WHERE tr.id = ? AND u.role = "employer" AND u.admin_client_siret = ?',
//             [id, adminClientSiret]
//         );
//         if (recordToDelete.length === 0) {
//             return res.status(403).json({ message: 'Accès refusé. Ce relevé n\'appartient pas à un employé de votre établissement ou n\'existe pas.' });
//         }

//         const [result] = await pool.execute('DELETE FROM temperature_records WHERE id = ?', [id]);
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Relevé de température non trouvé.' });
//         }
//         res.status(204).send();
//     } catch (error) {
//         console.error('Erreur lors de la suppression du relevé de température par l\'admin client:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la suppression du relevé.' });
//     }
// };

// // --- Super Admin specific functions (can manage all temperature records) ---
// exports.getAllTemperatureRecordsAdmin = async (req, res) => {
//     try {
//         const pool = await getConnection();
//         const [records] = await pool.execute(
//             'SELECT tr.id, tr.type, tr.location, tr.temperature, tr.timestamp, tr.notes, tr.created_at, tr.user_id, tr.siret_etablissement, tr.temperature_type, ' + // <--- ADDED temperature_type
//             'u.nom_entreprise AS client_nom_entreprise, u.nom_client AS client_nom_client, u.prenom_client AS client_prenom_client ' +
//             'FROM temperature_records tr ' +
//             'JOIN users u ON tr.user_id = u.id ' +
//             'ORDER BY tr.timestamp DESC'
//         );
//         res.status(200).json(records);
//     } catch (error) {
//         console.error('Error fetching all temperature records for super admin:', error);
//         res.status(500).json({ message: 'Internal server error while fetching temperature records.' });
//     }
// };

// exports.addTemperatureRecordAdmin = async (req, res) => {
//     const { user_id, siret_etablissement, type, location, temperature, timestamp, temperature_type, notes = null } = req.body; // <--- ADDED timestamp, temperature_type

//     if (!user_id || !siret_etablissement || !type || !location || temperature === undefined || !timestamp || !temperature_type) { // <--- ADDED timestamp, temperature_type
//         return res.status(400).json({ message: 'User ID, SIRET établissement, type, emplacement, température, date/heure et type de température sont requis.' });
//     }
//     if (!['positive', 'negative'].includes(temperature_type)) { // <--- ADDED validation
//         return res.status(400).json({ message: 'Invalid temperature_type. Must be "positive" or "negative".' });
//     }

//     try {
//         const pool = await getConnection();
//         // Optional: Valider que user_id et siret_etablissement sont cohérents
//         const [userCheck] = await pool.execute('SELECT siret FROM users WHERE id = ?', [user_id]);
//         if (userCheck.length === 0 || userCheck[0].siret !== siret_etablissement) {
//             console.warn(`Incohérence: user_id ${user_id} n'a pas le SIRET ${siret_etablissement}`);
//         }

//         const [result] = await pool.execute(
//             'INSERT INTO temperature_records (user_id, siret_etablissement, type, location, temperature, timestamp, temperature_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', // <--- ADDED timestamp, temperature_type
//             [user_id, siret_etablissement, type, location, temperature, timestamp, temperature_type, notes] // <--- ADDED timestamp, temperature_type
//         );

//         const newRecord = { id: result.insertId, user_id, siret_etablissement, type, location, temperature, timestamp, temperature_type, notes }; // <--- ADDED timestamp, temperature_type
//         res.status(201).json(newRecord);
//     } catch (error) {
//         console.error('Erreur lors de l\'ajout du relevé de température par le super admin:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du relevé.' });
//     }
// };

// exports.updateTemperatureRecordAdmin = async (req, res) => {
//     const { id } = req.params;
//     const { user_id, siret_etablissement, type, location, temperature, timestamp, temperature_type, notes = null } = req.body; // <--- ADDED timestamp, temperature_type

//     if (!user_id || !siret_etablissement || !type || !location || temperature === undefined || !timestamp || !temperature_type) { // <--- ADDED timestamp, temperature_type
//         return res.status(400).json({ message: 'User ID, SIRET établissement, type, emplacement, température, date/heure et type de température sont requis pour la mise à jour.' });
//     }
//     if (!['positive', 'negative'].includes(temperature_type)) { // <--- ADDED validation
//         return res.status(400).json({ message: 'Invalid temperature_type. Must be "positive" or "negative".' });
//     }

//     try {
//         const pool = await getConnection();
//         const [result] = await pool.execute(
//             'UPDATE temperature_records SET user_id = ?, siret_etablissement = ?, type = ?, location = ?, temperature = ?, timestamp = ?, temperature_type = ?, notes = ? WHERE id = ?', // <--- ADDED timestamp, temperature_type
//             [user_id, siret_etablissement, type, location, temperature, timestamp, temperature_type, notes, id] // <--- ADDED timestamp, temperature_type
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Relevé de température non trouvé ou aucune modification effectuée.' });
//         }

//         const updatedRecord = { id: parseInt(id), user_id, siret_etablissement, type, location, temperature, timestamp, temperature_type, notes }; // <--- ADDED timestamp, temperature_type
//         res.status(200).json(updatedRecord);
//     } catch (error) {
//         console.error('Erreur lors de la mise à jour du relevé de température par le super admin:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du relevé.' });
//     }
// };

// exports.deleteTemperatureRecordAdmin = async (req, res) => {
//     const { id } = req.params;

//     try {
//         const pool = await getConnection();
//         const [result] = await pool.execute('DELETE FROM temperature_records WHERE id = ?', [id]);
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Relevé de température non trouvé.' });
//         }
//         res.status(204).send();
//     } catch (error) {
//         console.error('Erreur lors de la suppression du relevé de température par le super admin:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la suppression du relevé.' });
//     }
// };






// // backend/src/controllers/temperatureController.js
// const { getConnection } = require('../config/db');

// // --- Common function to get temperature records by user ID (for 'employer' role) ---
// exports.getTemperatureRecordsByClient = async (req, res) => { // RENAMED from getTemperatureRecordsByClient
//     const userId = req.user.id; // L'ID de l'employé connecté
//     try {
//         const pool = await getConnection();
//         // Récupérer le SIRET de l'employé connecté
//         const [userData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "employer"', [userId]);
//         if (userData.length === 0 || !userData[0].siret) {
//             return res.status(403).json({ message: 'Accès refusé. Employé non trouvé ou SIRET non défini.' });
//         }
//         const employerSiret = userData[0].siret;

//         const [records] = await pool.execute(
//             'SELECT id, type, location, temperature, timestamp, notes FROM temperature_records WHERE user_id = ? AND siret_etablissement = ? ORDER BY timestamp DESC',
//             [userId, employerSiret]
//         );
//         res.status(200).json(records);
//     } catch (error) {
//         console.error('Erreur lors de la récupération des relevés de température pour l\'employé:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la récupération des relevés.' });
//     }
// };

// // --- Common function to create temperature record (for 'employer' role) ---
// exports.createTemperatureRecord = async (req, res) => {
//     const userId = req.user.id; // L'ID de l'employé connecté
//     const { type, location, temperature, notes = null } = req.body;

//     if (!type || !location || temperature === undefined) {
//         return res.status(400).json({ message: 'Type, emplacement et température sont requis.' });
//     }

//     try {
//         const pool = await getConnection();
//         // Récupérer le SIRET de l'employé connecté pour l'assigner au relevé
//         const [userData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "employer"', [userId]);
//         if (userData.length === 0 || !userData[0].siret) {
//             return res.status(403).json({ message: 'Accès refusé. Employé non trouvé ou SIRET non défini.' });
//         }
//         const siretEtablissement = userData[0].siret;

//         const [result] = await pool.execute(
//             'INSERT INTO temperature_records (user_id, siret_etablissement, type, location, temperature, notes) VALUES (?, ?, ?, ?, ?, ?)',
//             [userId, siretEtablissement, type, location, temperature, notes]
//         );

//         const newRecord = { id: result.insertId, user_id: userId, siret_etablissement: siretEtablissement, type, location, temperature, notes, timestamp: new Date() };
//         res.status(201).json(newRecord);
//     } catch (error) {
//         console.error('Erreur lors de l\'ajout du relevé de température:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du relevé.' });
//     }
// };

// // --- Common function to update temperature record (for 'employer' role) ---
// exports.updateTemperatureRecordByClient = async (req, res) => {
//     const { id } = req.params;
//     const userId = req.user.id; // L'ID de l'employé connecté
//     const { type, location, temperature, notes = null } = req.body;

//     if (!type || !location || temperature === undefined) {
//         return res.status(400).json({ message: 'Type, emplacement et température sont requis pour la mise à jour.' });
//     }

//     try {
//         const pool = await getConnection();
//         // Vérifier que le relevé appartient bien à l'employé connecté
//         const [record] = await pool.execute('SELECT user_id FROM temperature_records WHERE id = ? AND user_id = ?', [id, userId]);
//         if (record.length === 0) {
//             return res.status(403).json({ message: 'Accès refusé. Ce relevé n\'appartient pas à cet employé ou n\'existe pas.' });
//         }

//         const [result] = await pool.execute(
//             'UPDATE temperature_records SET type = ?, location = ?, temperature = ?, notes = ? WHERE id = ?',
//             [type, location, temperature, notes, id]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Relevé de température non trouvé ou aucune modification effectuée.' });
//         }

//         const updatedRecord = { id: parseInt(id), user_id: userId, type, location, temperature, notes };
//         res.status(200).json(updatedRecord);
//     } catch (error) {
//         console.error('Erreur lors de la mise à jour du relevé de température:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du relevé.' });
//     }
// };

// // --- Admin Client specific functions (can manage temperature records of their assigned employees) ---
// exports.getTemperatureRecordsForAdminClient = async (req, res) => {
//     const adminClientId = req.user.id;
//     try {
//         const pool = await getConnection();
//         // Récupérer le SIRET de l'admin_client connecté
//         const [adminClientData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
//         if (adminClientData.length === 0 || !adminClientData[0].siret) {
//             // Si l'admin client n'est pas trouvé ou n'a pas de SIRET, cela peut indiquer un problème de données
//             // ou que l'utilisateur n'est pas un admin_client valide.
//             return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
//         }
//         const adminClientSiret = adminClientData[0].siret;

//         const [records] = await pool.execute(
//             'SELECT tr.id, tr.type, tr.location, tr.temperature, tr.timestamp, tr.notes, tr.created_at, tr.user_id, ' +
//             'u.nom_entreprise AS client_nom_entreprise, u.nom_client AS client_nom_client ' +
//             'FROM temperature_records tr ' +
//             'JOIN users u ON tr.user_id = u.id ' +
//             'WHERE tr.siret_etablissement = ? AND u.role = "employer" ' + // Filtrer par siret_etablissement et rôle 'employer'
//             'ORDER BY tr.timestamp DESC',
//             [adminClientSiret]
//         );
//         res.status(200).json(records);
//     } catch (error) {
//         console.error('Erreur lors de la récupération des relevés de température pour l\'admin client:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la récupération des relevés.' });
//     }
// };

// exports.addTemperatureRecordByAdminClient = async (req, res) => {
//     const adminClientId = req.user.id;
//     const { user_id, type, location, temperature, notes = null } = req.body; // user_id de l'employé à qui le relevé est rattaché

//     if (!user_id || !type || !location || temperature === undefined) {
//         return res.status(400).json({ message: 'ID utilisateur, type, emplacement et température sont requis.' });
//     }

//     try {
//         const pool = await getConnection();

//         // Récupérer le SIRET de l'admin_client connecté
//         const [adminClientData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
//         if (adminClientData.length === 0 || !adminClientData[0].siret) {
//             return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
//         }
//         const adminClientSiret = adminClientData[0].siret;

//         // Vérifier que l'user_id fourni est bien un employé rattaché à cet admin_client via le SIRET
//         const [employeeData] = await pool.execute(
//             'SELECT id, siret FROM users WHERE id = ? AND role = "employer" AND admin_client_siret = ?',
//             [user_id, adminClientSiret]
//         );
//         if (employeeData.length === 0) {
//             return res.status(403).json({ message: 'Accès refusé. L\'utilisateur spécifié n\'est pas un employé de votre établissement.' });
//         }
//         const employeeSiret = employeeData[0].siret; // Le SIRET de l'employé (qui doit être le même que l'admin client)

//         const [result] = await pool.execute(
//             'INSERT INTO temperature_records (user_id, siret_etablissement, type, location, temperature, notes) VALUES (?, ?, ?, ?, ?, ?)',
//             [user_id, employeeSiret, type, location, temperature, notes]
//         );

//         const newRecord = { id: result.insertId, user_id, siret_etablissement: employeeSiret, type, location, temperature, notes, timestamp: new Date() };
//         res.status(201).json(newRecord);
//     } catch (error) {
//         console.error('Erreur lors de l\'ajout du relevé de température par l\'admin client:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du relevé.' });
//     }
// };


// exports.updateTemperatureRecordForAdminClient = async (req, res) => {
//     const { id } = req.params;
//     const adminClientId = req.user.id;
//     const { user_id, type, location, temperature, notes = null } = req.body;

//     if (!user_id || !type || !location || temperature === undefined) {
//         return res.status(400).json({ message: 'ID utilisateur, type, emplacement et température sont requis pour la mise à jour.' });
//     }

//     try {
//         const pool = await getConnection();
//         // Récupérer le SIRET de l'admin_client connecté
//         const [adminClientData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
//         if (adminClientData.length === 0 || !adminClientData[0].siret) {
//             return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
//         }
//         const adminClientSiret = adminClientData[0].siret;

//         // Vérifier que le relevé existe et appartient à un employé de cet admin_client
//         const [recordToUpdate] = await pool.execute(
//             'SELECT tr.id FROM temperature_records tr JOIN users u ON tr.user_id = u.id ' +
//             'WHERE tr.id = ? AND tr.user_id = ? AND u.role = "employer" AND u.admin_client_siret = ?',
//             [id, user_id, adminClientSiret]
//         );
//         if (recordToUpdate.length === 0) {
//             return res.status(403).json({ message: 'Accès refusé. Ce relevé n\'appartient pas à un employé de votre établissement ou n\'existe pas.' });
//         }

//         const [result] = await pool.execute(
//             'UPDATE temperature_records SET user_id = ?, type = ?, location = ?, temperature = ?, notes = ? WHERE id = ?',
//             [user_id, type, location, temperature, notes, id]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Relevé de température non trouvé ou aucune modification effectuée.' });
//         }

//         const updatedRecord = { id: parseInt(id), user_id, type, location, temperature, notes };
//         res.status(200).json(updatedRecord);
//     } catch (error) {
//         console.error('Erreur lors de la mise à jour du relevé de température par l\'admin client:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du relevé.' });
//     }
// };

// exports.deleteTemperatureRecordForAdminClient = async (req, res) => {
//     const { id } = req.params;
//     const adminClientId = req.user.id;

//     try {
//         const pool = await getConnection();
//         // Récupérer le SIRET de l'admin_client connecté
//         const [adminClientData] = await pool.execute('SELECT siret FROM users WHERE id = ? AND role = "admin_client"', [adminClientId]);
//         if (adminClientData.length === 0 || !adminClientData[0].siret) {
//             return res.status(404).json({ message: 'Admin Client non trouvé ou SIRET non défini.' });
//         }
//         const adminClientSiret = adminClientData[0].siret;

//         // Vérifier que le relevé existe et appartient à un employé de cet admin_client
//         const [recordToDelete] = await pool.execute(
//             'SELECT tr.id FROM temperature_records tr JOIN users u ON tr.user_id = u.id ' +
//             'WHERE tr.id = ? AND u.role = "employer" AND u.admin_client_siret = ?',
//             [id, adminClientSiret]
//         );
//         if (recordToDelete.length === 0) {
//             return res.status(403).json({ message: 'Accès refusé. Ce relevé n\'appartient pas à un employé de votre établissement ou n\'existe pas.' });
//         }

//         const [result] = await pool.execute('DELETE FROM temperature_records WHERE id = ?', [id]);
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Relevé de température non trouvé.' });
//         }
//         res.status(204).send();
//     } catch (error) {
//         console.error('Erreur lors de la suppression du relevé de température par l\'admin client:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la suppression du relevé.' });
//     }
// };

// // --- Super Admin specific functions (can manage all temperature records) ---
// exports.getAllTemperatureRecordsAdmin = async (req, res) => {
//     try {
//         const pool = await getConnection();
//         const [records] = await pool.execute(
//             'SELECT tr.id, tr.type, tr.location, tr.temperature, tr.timestamp, tr.notes, tr.created_at, tr.user_id, tr.siret_etablissement, ' +
//             'u.nom_entreprise AS client_nom_entreprise, u.nom_client AS client_nom_client, u.prenom_client AS client_prenom_client ' +
//             'FROM temperature_records tr ' +
//             'JOIN users u ON tr.user_id = u.id ' +
//             'ORDER BY tr.timestamp DESC'
//         );
//         res.status(200).json(records);
//     } catch (error) {
//         console.error('Error fetching all temperature records for super admin:', error);
//         res.status(500).json({ message: 'Internal server error while fetching temperature records.' });
//     }
// };

// exports.addTemperatureRecordAdmin = async (req, res) => {
//     const { user_id, siret_etablissement, type, location, temperature, notes = null } = req.body;

//     if (!user_id || !siret_etablissement || !type || !location || temperature === undefined) {
//         return res.status(400).json({ message: 'User ID, SIRET établissement, type, emplacement et température sont requis.' });
//     }

//     try {
//         const pool = await getConnection();
//         // Optionnel: Valider que user_id et siret_etablissement sont cohérents
//         const [userCheck] = await pool.execute('SELECT siret FROM users WHERE id = ?', [user_id]);
//         if (userCheck.length === 0 || userCheck[0].siret !== siret_etablissement) {
//             console.warn(`Incohérence: user_id ${user_id} n'a pas le SIRET ${siret_etablissement}`);
//             // Vous pouvez choisir de renvoyer une erreur 400 ici si la cohérence est stricte
//         }

//         const [result] = await pool.execute(
//             'INSERT INTO temperature_records (user_id, siret_etablissement, type, location, temperature, notes) VALUES (?, ?, ?, ?, ?, ?)',
//             [user_id, siret_etablissement, type, location, temperature, notes]
//         );

//         const newRecord = { id: result.insertId, user_id, siret_etablissement, type, location, temperature, notes, timestamp: new Date() };
//         res.status(201).json(newRecord);
//     } catch (error) {
//         console.error('Erreur lors de l\'ajout du relevé de température par le super admin:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du relevé.' });
//     }
// };

// exports.updateTemperatureRecordAdmin = async (req, res) => {
//     const { id } = req.params;
//     const { user_id, siret_etablissement, type, location, temperature, notes = null } = req.body;

//     if (!user_id || !siret_etablissement || !type || !location || temperature === undefined) {
//         return res.status(400).json({ message: 'User ID, SIRET établissement, type, emplacement et température sont requis pour la mise à jour.' });
//     }

//     try {
//         const pool = await getConnection();
//         const [result] = await pool.execute(
//             'UPDATE temperature_records SET user_id = ?, siret_etablissement = ?, type = ?, location = ?, temperature = ?, notes = ? WHERE id = ?',
//             [user_id, siret_etablissement, type, location, temperature, notes, id]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Relevé de température non trouvé ou aucune modification effectuée.' });
//         }

//         const updatedRecord = { id: parseInt(id), user_id, siret_etablissement, type, location, temperature, notes };
//         res.status(200).json(updatedRecord);
//     } catch (error) {
//         console.error('Erreur lors de la mise à jour du relevé de température par le super admin:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du relevé.' });
//     }
// };

// exports.deleteTemperatureRecordAdmin = async (req, res) => {
//     const { id } = req.params;

//     try {
//         const pool = await getConnection();
//         const [result] = await pool.execute('DELETE FROM temperature_records WHERE id = ?', [id]);
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'Relevé de température non trouvé.' });
//         }
//         res.status(204).send();
//     } catch (error) {
//         console.error('Erreur lors de la suppression du relevé de température par le super admin:', error);
//         res.status(500).json({ message: 'Erreur serveur lors de la suppression du relevé.' });
//     }
// };




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