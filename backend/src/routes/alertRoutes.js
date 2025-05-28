// backend/src/routes/alertRoutes.js
const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/db'); // Importe la fonction pour obtenir une connexion
// Importe spécifiquement les fonctions authenticateToken et authorizeRoles de ton middleware
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET /api/alerts/profile - Récupérer les alertes pour l'utilisateur connecté
router.get('/profile', authenticateToken, async (req, res) => { // <-- Correction ici : utilise authenticateToken
    let connection; // Déclare la variable de connexion ici
    try {
        connection = await getConnection(); // Obtient une connexion du pool

        // Ici, tu devras adapter ta logique pour récupérer l'ID client
        // Si req.user.client_id est disponible via le middleware auth, utilise-le
        // Assurez-vous que le JWT payload contient bien client_id.
        const client_id = req.user.client_id;

        if (!client_id) {
            console.warn('Authentication Denied: client_id missing in token for user:', req.user);
            return res.status(403).json({ message: 'Accès non autorisé ou client non défini dans le token.' });
        }

        // Requête SQL directe pour récupérer les alertes
        const [rows] = await connection.execute(
            'SELECT * FROM alerts WHERE client_id = ? AND status IN (?, ?) ORDER BY createdAt DESC',
            [client_id, 'new', 'read']
        );
        res.json(rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des alertes:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des alertes.' });
    } finally {
        if (connection) connection.release(); // TRÈS IMPORTANT : Libérer la connexion
    }
});

// PUT /api/alerts/:id/read - Marquer une alerte comme lue
router.put('/:id/read', authenticateToken, async (req, res) => { // <-- Correction ici : utilise authenticateToken
    const alertId = req.params.id;
    let connection;
    try {
        connection = await getConnection();

        // Assurez-vous que le JWT payload contient bien client_id.
        const client_id = req.user.client_id;

        if (!client_id) {
            console.warn('Authorization Denied: client_id missing in token for user:', req.user);
            return res.status(403).json({ message: 'Accès non autorisé ou client non défini dans le token.' });
        }

        // Vérifier si l'alerte existe et appartient au client
        const [alertRows] = await connection.execute(
            'SELECT * FROM alerts WHERE id = ? AND client_id = ?',
            [alertId, client_id]
        );

        if (alertRows.length === 0) {
            return res.status(404).json({ message: 'Alerte non trouvée ou accès non autorisé.' });
        }

        // Mettre à jour le statut de l'alerte
        await connection.execute(
            'UPDATE alerts SET status = ?, updatedAt = NOW() WHERE id = ?',
            ['read', alertId]
        );

        res.json({ message: 'Alerte marquée comme lue.', alertId });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'alerte:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de l\'alerte.' });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;