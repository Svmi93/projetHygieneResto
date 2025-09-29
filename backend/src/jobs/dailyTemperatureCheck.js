// backend/src/jobs/dailyTemperatureCheck.js
const cron = require('node-cron');
const { getConnection } = require('../config/db'); // Importe getConnection de ton fichier de configuration de base de données

const startDailyTemperatureCheck = () => {
    // Planifie la tâche pour s'exécuter tous les jours à 23h59
    cron.schedule('59 23 * * *', async () => {
        console.log('Exécution de la tâche de vérification des relevés de température manquants...');

        let connection;
        try {
            connection = await getConnection(); // Obtient une connexion du pool

            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);

            // 1. Récupérer tous les SIRET d'admin_client distincts qui sont liés à des utilisateurs (employés)
            // Nous utilisons 'admin_client_siret' car c'est la colonne qui lie les 'employer' à leur entreprise.
            // Nous utilisons un alias 'AS client_id' pour que la variable 'client_id' reste utilisable dans la boucle.
            const [distinctClientIds] = await connection.execute(
                `SELECT DISTINCT admin_client_siret AS client_id FROM users WHERE admin_client_siret IS NOT NULL`
            );

            for (const { client_id } of distinctClientIds) {
                // S'assurer que client_id n'est pas nul ou vide avant de continuer
                if (!client_id) continue;

                // 2. Vérifier si un relevé a été effectué pour ce client (SIRET) aujourd'hui
                // On recherche si AU MOINS UN relevé existe pour le SIRET donné (client_id)
                // et pour un utilisateur lié à ce SIRET (u.admin_client_siret), dans la période du jour.
                const [recordExists] = await connection.execute(
                    `SELECT tr.id
                     FROM temperature_records tr
                     JOIN users u ON tr.user_id = u.id
                     WHERE u.admin_client_siret = ?
                     AND tr.timestamp BETWEEN ? AND ?
                     LIMIT 1`,
                    [client_id, todayStart, todayEnd]
                );

                if (recordExists.length === 0) { // Si aucun relevé n'a été trouvé pour ce SIRET aujourd'hui
                    console.warn(`Aucun relevé trouvé pour le SIRET: ${client_id} aujourd'hui. Création d'une alerte.`);

                    // 3. Récupérer le nom de l'entreprise (admin_client) pour le message
                    // L'admin_client a son SIRET dans la colonne 'siret' de sa propre ligne.
                    const [clientAdminRows] = await connection.execute(
                        `SELECT nom_entreprise FROM users WHERE siret = ? AND role = 'admin_client' LIMIT 1`,
                        [client_id] // client_id ici est le SIRET de l'admin_client
                    );
                    const clientName = clientAdminRows.length > 0 ? clientAdminRows[0].nom_entreprise : `Client ${client_id}`;
                    const alertMessage = `Un relevé de température quotidien est manquant pour l'entreprise ${clientName}.`;

                    // 4. Créer l'alerte dans la base de données
                    // La table 'alerts' utilise 'client_id' pour stocker le SIRET de l'établissement concerné.
                    await connection.execute(
                        `INSERT INTO alerts (client_id, message, status, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`,
                        [client_id, alertMessage, 'new']
                    );
                }
            }
            console.log('Tâche de vérification des relevés de température manquants terminée.');

        } catch (error) {
            console.error('Erreur lors de l\'exécution de la tâche de vérification quotidienne:', error);
            // Gère l'erreur, par exemple, en envoyant une notification d'échec de la tâche
        } finally {
            if (connection) connection.release(); // Libère la connexion, TRÈS IMPORTANT
        }
    }, {
        timezone: "Europe/Paris" // Assurez-vous que cela correspond à votre fuseau horaire
    });

    console.log('Tâche de vérification quotidienne des relevés de température planifiée.');
};

module.exports = startDailyTemperatureCheck;








