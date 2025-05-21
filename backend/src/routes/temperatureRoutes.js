// backend/src/routes/temperatureRoutes.js
const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/db');

// GET all temperature records
router.get('/temperatures', async (req, res) => {
  try {
    const pool = await getConnection();
    // MODIFIÉ: Inclut maintenant 'user_id' dans la sélection
    // Correction: Utilise le nom de table correct 'temperature_records'
    const [rows] = await pool.execute(
      'SELECT id, type, location, temperature, timestamp, notes, created_at, user_id FROM temperature_records ORDER BY timestamp DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des relevés de température:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des relevés.' });
  }
});

// POST a new temperature record
router.post('/temperatures', async (req, res) => {
  // Ajoutez 'user_id' ici si vous le recevez du frontend, sinon il sera NULL par défaut pour l'instant
  // Pour le moment, on va le laisser NULL car l'auth n'est pas encore implémentée
  const { type, location, temperature, timestamp, notes } = req.body;
  // const user_id = req.user ? req.user.id : null; // Ceci viendra plus tard avec l'authentification

  if (!type || !location || temperature === undefined || !timestamp) {
    return res.status(400).json({ message: 'Veuillez fournir tous les champs requis (type, location, temperature, timestamp).' });
  }

  try {
    const pool = await getConnection();
    // Correction: Utilise le nom de table correct 'temperature_records'
    const [result] = await pool.execute(
      // MODIFIÉ: Ajout de user_id à l'insertion. Pour l'instant, on insère NULL.
      // Quand l'authentification sera faite, on passera le vrai user_id ici.
      'INSERT INTO temperature_records (type, location, temperature, timestamp, notes, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [type, location, temperature, timestamp, notes, null] // null pour user_id temporairement
    );

    res.status(201).json({
      id: result.insertId,
      type,
      location,
      temperature,
      timestamp,
      notes,
      created_at: new Date().toISOString(),
      user_id: null // On renvoie null pour user_id pour le moment
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du relevé de température:', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du relevé.' });
  }
});

module.exports = router;
