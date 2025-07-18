const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// --- Routes pour les relevés de température ---

// 1. POST /temperatures - Créer un nouveau relevé de température
// Accessible par 'admin_client' et 'employer'.
router.post('/temperatures', authenticateToken, authorizeRoles('admin_client', 'employer'), async (req, res) => {
  const { type, location, temperature, timestamp, notes } = req.body;
  // user_id est l'ID de l'employé ou de l'admin_client qui crée le relevé
  // siret_etablissement sera le siret de l'admin_client ou de l'admin_client associé à l'employé
  const { id: userId, siret: userSiret, role, admin_client_siret } = req.user;

  // Déterminer le SIRET de l'établissement concerné par le relevé
  // Si c'est un admin_client, c'est son propre SIRET.
  // Si c'est un employer, c'est le SIRET de son admin_client.
  const siretToUse = role === 'admin_client' ? userSiret : admin_client_siret;

  if (!type || !location || temperature === undefined || !timestamp || !siretToUse) {
    return res.status(400).json({ message: 'Veuillez fournir tous les champs requis (type, location, temperature, timestamp, et SIRET de l\'établissement).' });
  }

  // S'assurer que le type de température est 'positive' ou 'negative' (ajustez si votre frontend envoie cette donnée)
  // Pour cet exemple, nous allons déduire ou utiliser un défaut si non fourni par le client.
  // Idéalement, la `temperature_type` devrait venir du frontend ou être déduite du `type` et de la `location`.
  // Pour l'instant, on va assumer qu'il est déduit ou envoyé par le client. Si non fourni, vous pourriez le déduire de `temperature`
  // ou laisser la valeur par défaut de la DB si elle est pertinente.
  const temperature_type = req.body.temperature_type || (temperature >= 0 ? 'positive' : 'negative');

  try {
    const pool = await getConnection();
    const [result] = await pool.execute(
      'INSERT INTO temperature_records (user_id, siret_etablissement, type, location, temperature, timestamp, notes, temperature_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, siretToUse, type, location, temperature, timestamp, notes, temperature_type]
    );

    res.status(201).json({
      id: result.insertId,
      user_id: userId,
      siret_etablissement: siretToUse,
      type,
      location,
      temperature,
      timestamp,
      notes,
      temperature_type,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du relevé de température:', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du relevé.' });
  }
});

// 2. GET /temperatures - Récupérer les relevés de température
// Accessible par 'admin_client' et 'employer'.
router.get('/temperatures', authenticateToken, authorizeRoles('admin_client', 'employer'), async (req, res) => {
  try {
    const pool = await getConnection();
    const { role, id: userId, siret: userSiret, admin_client_siret } = req.user;

    let query = 'SELECT id, user_id, siret_etablissement, type, location, temperature, timestamp, notes, temperature_type, created_at FROM temperature_records';
    let params = [];

    // L'admin_client voit tous les relevés de son établissement (via son SIRET)
    // L'employé ne voit que ses propres relevés
    if (role === 'admin_client') {
      query += ' WHERE siret_etablissement = ?';
      params.push(userSiret);
    } else if (role === 'employer') {
      query += ' WHERE user_id = ? AND siret_etablissement = ?';
      params.push(userId, admin_client_siret); // L'employé voit ses propres relevés dans son établissement
    }

    query += ' ORDER BY timestamp DESC'; // Assurer l'ordre

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des relevés de température:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des relevés.' });
  }
});

// 3. PUT /temperatures/:id - Mettre à jour un relevé de température
// UNIQUEMENT ACCESSIBLE PAR 'admin_client'.
router.put('/temperatures/:id', authenticateToken, authorizeRoles('admin_client'), async (req, res) => {
  try {
    const pool = await getConnection();
    const { id } = req.params; // ID du relevé à modifier
    const { role, siret: adminClientSiret } = req.user; // SIRET de l'admin_client connecté

    const { type, location, temperature, timestamp, notes, temperature_type } = req.body;

    // Vérifier que l'admin_client est bien propriétaire du relevé
    const [recordRows] = await pool.execute('SELECT siret_etablissement FROM temperature_records WHERE id = ?', [id]);
    if (recordRows.length === 0) {
      return res.status(404).json({ message: 'Relevé de température non trouvé.' });
    }
    const record = recordRows[0];

    // S'assurer que l'admin_client ne modifie que les relevés de son propre SIRET
    if (record.siret_etablissement !== adminClientSiret) {
      return res.status(403).json({ message: 'Non autorisé à modifier ce relevé de température.' });
    }

    // Construire la requête de mise à jour dynamiquement pour ne modifier que les champs fournis
    let updateFields = [];
    let updateParams = [];

    if (type !== undefined) { updateFields.push('type = ?'); updateParams.push(type); }
    if (location !== undefined) { updateFields.push('location = ?'); updateParams.push(location); }
    if (temperature !== undefined) { updateFields.push('temperature = ?'); updateParams.push(temperature); }
    if (timestamp !== undefined) { updateFields.push('timestamp = ?'); updateParams.push(timestamp); }
    if (notes !== undefined) { updateFields.push('notes = ?'); updateParams.push(notes); }
    if (temperature_type !== undefined) { updateFields.push('temperature_type = ?'); updateParams.push(temperature_type); }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'Aucune donnée à mettre à jour fournie.' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP'); // Mettre à jour le timestamp de modification
    updateParams.push(id); // L'ID du relevé est le dernier paramètre pour la clause WHERE

    const [result] = await pool.execute(
      `UPDATE temperature_records SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Relevé de température non trouvé ou aucune modification effectuée.' });
    }

    res.json({ message: 'Relevé de température mis à jour avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du relevé de température:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour.' });
  }
});

// 4. DELETE /temperatures/:id - Supprimer un relevé de température
// UNIQUEMENT ACCESSIBLE PAR 'admin_client'.
router.delete('/temperatures/:id', authenticateToken, authorizeRoles('admin_client'), async (req, res) => {
  try {
    const pool = await getConnection();
    const { id } = req.params; // ID du relevé à supprimer
    const { role, siret: adminClientSiret } = req.user; // SIRET de l'admin_client connecté

    // Vérifier que l'admin_client est bien propriétaire du relevé
    const [recordRows] = await pool.execute('SELECT siret_etablissement FROM temperature_records WHERE id = ?', [id]);
    if (recordRows.length === 0) {
      return res.status(404).json({ message: 'Relevé de température non trouvé.' });
    }
    const record = recordRows[0];

    // S'assurer que l'admin_client ne supprime que les relevés de son propre SIRET
    if (record.siret_etablissement !== adminClientSiret) {
      return res.status(403).json({ message: 'Non autorisé à supprimer ce relevé de température.' });
    }

    const [result] = await pool.execute('DELETE FROM temperature_records WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Relevé de température non trouvé ou déjà supprimé.' });
    }
    res.json({ message: 'Relevé de température supprimé avec succès.' });

  } catch (error) {
    console.error('Erreur lors de la suppression du relevé de température:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression.' });
  }
});

module.exports = router;