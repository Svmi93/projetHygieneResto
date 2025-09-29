// backend/src/controllers/equipmentController.js

const { getConnection } = require('../config/db'); // Don't forget to import getConnection

// Function to get equipments for a specific admin_client
exports.getEquipmentsForAdminClient = async (req, res) => {
    try {
        // req.user.id is populated by authenticateToken middleware
        const adminClientId = req.user.id;

        const connection = await getConnection(); // Get a connection from the pool
        const [rows] = await connection.execute(
            `SELECT
                id,
                name,
                type,
                temperature_type,
                min_temp,
                max_temp,
                created_at,
                updated_at
             FROM equipments
             WHERE admin_client_id = ?`,
            [adminClientId]
        );
        connection.release(); // Release the connection back to the pool

        console.log('Récupération des équipements pour admin_client réussie.');
        // --- THIS IS THE CRUCIAL CHANGE ---
        // Return an object that contains both a message and the array of equipments
        res.status(200).json({
            message: 'Liste des équipements',
            equipments: rows // 'rows' will be the array of equipment objects from the DB
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des équipements pour admin_client:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des équipements.', error: error.message });
    }
};

// Function to create a new equipment
exports.createEquipment = async (req, res) => {
    const { name, type, temperature_type, min_temp, max_temp } = req.body;
    const adminClientId = req.user.id; // Get admin client ID from authenticated user

    // Basic validation
    if (!name || !type || !temperature_type) {
        return res.status(400).json({ message: 'Le nom, le type et le type de température sont obligatoires.' });
    }

    try {
        const connection = await getConnection();
        const [result] = await connection.execute(
            `INSERT INTO equipments (name, type, temperature_type, min_temp, max_temp, admin_client_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, type, temperature_type, min_temp, max_temp, adminClientId]
        );
        connection.release();

        const newEquipment = {
            id: result.insertId,
            name,
            type,
            temperature_type,
            min_temp,
            max_temp,
            admin_client_id: adminClientId
        };
        console.log('Création d\'un équipement réussie:', newEquipment);
        res.status(201).json({ message: 'Équipement créé avec succès', equipment: newEquipment });

    } catch (error) {
        console.error('Erreur lors de la création de l\'équipement:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la création de l\'équipement.', error: error.message });
    }
};

// Function to update an equipment
exports.updateEquipment = async (req, res) => {
    const { id } = req.params; // Equipment ID from URL parameter
    const { name, type, temperature_type, min_temp, max_temp } = req.body;
    const adminClientId = req.user.id; // Ensure the admin client owns this equipment

    // Basic validation
    if (!name || !type || !temperature_type) {
        return res.status(400).json({ message: 'Le nom, le type et le type de température sont obligatoires pour la mise à jour.' });
    }

    try {
        const connection = await getConnection();
        const [result] = await connection.execute(
            `UPDATE equipments
             SET name = ?, type = ?, temperature_type = ?, min_temp = ?, max_temp = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND admin_client_id = ?`, // IMPORTANT: Ensure the equipment belongs to this admin client
            [name, type, temperature_type, min_temp, max_temp, id, adminClientId]
        );
        connection.release();

        if (result.affectedRows === 0) {
            // Either equipment not found or doesn't belong to this admin_client
            return res.status(404).json({ message: 'Équipement non trouvé ou non autorisé pour la mise à jour.' });
        }

        console.log(`Mise à jour de l'équipement avec l'ID: ${id} réussie.`);
        res.status(200).json({ message: 'Équipement mis à jour avec succès' });

    } catch (error) {
        console.error(`Erreur lors de la mise à jour de l'équipement avec l'ID: ${id}:`, error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de l\'équipement.', error: error.message });
    }
};

// Function to delete an equipment
exports.deleteEquipment = async (req, res) => {
    const { id } = req.params;
    const adminClientId = req.user.id; // Ensure the admin client owns this equipment

    try {
        const connection = await getConnection();
        const [result] = await connection.execute(
            'DELETE FROM equipments WHERE id = ? AND admin_client_id = ?',
            [id, adminClientId]
        );
        connection.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Équipement non trouvé ou non autorisé pour la suppression.' });
        }

        console.log(`Suppression de l'équipement avec l'ID: ${id} réussie.`);
        res.status(200).json({ message: 'Équipement supprimé avec succès' });

    } catch (error) {
        console.error(`Erreur lors de la suppression de l'équipement avec l'ID: ${id}:`, error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'équipement.', error: error.message });
    }
};

// Example function to get employee locations (assuming these are related to equipment)
exports.getEmployeeLocations = async (req, res) => {
    try {
        const employeeId = req.user.id; // Assuming the token identifies the employee
        // You'll need logic to determine which locations/equipments an employee can see
        // This might involve joining `employees` table with `equipments` via `admin_client_id`
        // or a dedicated `employee_locations` table.
        console.log('Récupération des localisations pour employés pour l\'employé ID:', employeeId);

        // Placeholder: Return a mock array or query your DB based on your schema
        const mockLocations = [
            { id: 1, name: 'Main Kitchen Fridge', location: 'Cuisine principale' },
            { id: 2, name: 'Storage Freezer', location: 'Entrepôt' }
        ];

        res.status(200).json({
            message: 'Liste des localisations des employés',
            locations: mockLocations // Or data from your DB query
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des localisations des employés:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des localisations des employés.' });
    }
};












