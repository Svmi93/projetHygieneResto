// backend/src/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' }); // Ensure the path to your .env is correct, relative to server.js

// Check .env variables (good for debugging, keep this)
console.log('--- .env variables ---');
console.log('HOST:', process.env.HOST);
console.log('USERNAME:', process.env.USERNAME);
console.log('PASSWORD:', process.env.PASSWORD ? 'Loaded' : 'NOT LOADED or EMPTY');
console.log('DATABASE:', process.env.DATABASE);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('--------------------');

const { getConnection } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5001; // Use 5001 consistently as per docker-compose.yml

// Import route modules
const temperatureRoutes = require('./routes/temperatureRoutes');
const authRoutes = require('./routes/authRoutes'); // Make sure this file exists and is correctly structured
const adminRoutes = require('./routes/adminRoutes'); // <-- NOUVELLE LIGNE : Importation des routes admin

// Middleware
app.use(express.json()); // To parse JSON request bodies

app.use(cors({
  // Assurez-vous que tous les ports de votre frontend sont listés ici
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
}));

// Route Middlewares
app.use('/api', temperatureRoutes); // e.g., /api/temperatures
app.use('/api/auth', authRoutes);    // e.g., /api/auth/register, /api/auth/login
app.use('/api/admin', adminRoutes);  // <-- NOUVELLE LIGNE : Utilisation des routes admin

// Basic routes (optional, for testing API root)
app.get('/api', (req, res) => {
  res.status(200).json({ message: 'API HygièneResto fonctionne !' });
});

app.get('/', (req, res) => {
  res.send('API HygièneResto est démarrée !');
});

// Initialize database connection and start server
async function initializeDatabaseAndStartServer() {
  try {
    const pool = await getConnection(); // getConnection returns the pool
    console.log('Connexion à la base de données MySQL réussie via config/db !');

    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
    });
  } catch (error) {
    console.error('Erreur lors de la connexion à la base de données ou du démarrage du serveur :', error);
    process.exit(1); // Exit if DB connection fails
  }
}

initializeDatabaseAndStartServer();