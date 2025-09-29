// backend/src/routes/alertRoutes.js
const express = require('express');
const router = express.Router();
// CORRIGÉ ICI : Le chemin d'accès au middleware d'authentification est maintenant correct.
const { authenticateToken, authorizeRoles } = require('../middleware/auth'); // Chemin corrigé vers 'authMiddleware.js'
const { getConnection } = require('../config/db'); // Assurez-vous que le chemin est correct

// Route pour récupérer les alertes de l'utilisateur connecté
// Autorise 'employer', 'admin_client', et 'super_admin'
router.get('/my-alerts', authenticateToken, authorizeRoles('employer', 'admin_client', 'super_admin'), async (req, res) => {
  try {
    const pool = await getConnection();
    const { role, client_id, id: userId } = req.user; // req.user vient du JWT décodé

    let alertsQuery;
    let queryParams;

    if (role === 'super_admin') {
      // Super admin peut voir toutes les alertes (ou filtrer différemment si besoin)
      alertsQuery = 'SELECT * FROM alerts ORDER BY created_at DESC'; // Utilise created_at comme dans init.sql
      queryParams = [];
    } else if (role === 'admin_client') {
      // Admin client voit les alertes de son client_id (siret)
      alertsQuery = 'SELECT * FROM alerts WHERE client_id = ? AND status IN (?, ?) ORDER BY created_at DESC'; // Utilise created_at
      queryParams = [client_id, 'new', 'read']; // Afficher les nouvelles et lues par défaut
    } else if (role === 'employer') {
      // Employé voit les alertes de son client_id et/ou celles qui lui sont spécifiques
      alertsQuery = 'SELECT * FROM alerts WHERE client_id = ? AND (user_id = ? OR user_id IS NULL) AND status IN (?, ?) ORDER BY created_at DESC'; // Utilise created_at
      queryParams = [client_id, userId, 'new', 'read']; // Afficher les nouvelles et lues par défaut
    } else {
      return res.status(403).json({ message: 'Rôle utilisateur non autorisé pour cette action.' });
    }

    const [rows] = await pool.execute(alertsQuery, queryParams);
    res.json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des alertes.' });
  }
});

// Route pour marquer une alerte comme lue
// Autorise 'employer', 'admin_client', et 'super_admin'
router.put('/:id/read', authenticateToken, authorizeRoles('employer', 'admin_client', 'super_admin'), async (req, res) => {
  try {
    const pool = await getConnection();
    const { id } = req.params;
    const { role, client_id, id: userId } = req.user;

    // Vérifier que l'utilisateur a le droit de marquer cette alerte comme lue
    const [alertRows] = await pool.execute('SELECT client_id, user_id FROM alerts WHERE id = ?', [id]);
    if (alertRows.length === 0) {
      return res.status(404).json({ message: 'Alerte non trouvée.' });
    }
    const alert = alertRows[0];

    // L'admin client peut marquer les alertes de son client_id
    // L'employé peut marquer ses propres alertes ou celles de son client_id non spécifiques à un user
    const isAuthorized = (role === 'super_admin') ||
                         (role === 'admin_client' && alert.client_id === client_id) ||
                         (role === 'employer' && alert.client_id === client_id && (alert.user_id === userId || alert.user_id === null));

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Non autorisé à marquer cette alerte comme lue.' });
    }

    await pool.execute('UPDATE alerts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['read', id]); // Utilise updated_at
    res.json({ message: 'Alerte marquée comme lue.' });
  } catch (error) {
    console.error('Erreur lors du marquage de l\'alerte comme lue:', error);
    res.status(500).json({ message: 'Erreur serveur lors du marquage de l\'alerte comme lue.' });
  }
});

module.exports = router;
















