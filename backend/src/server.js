// backend/src/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

console.log('--- .env variables ---');
console.log('HOST:', process.env.HOST);
console.log('USERNAME:', process.env.USERNAME);
console.log('PASSWORD:', process.env.PASSWORD ? 'Loaded' : 'NOT LOADED or EMPTY');
console.log('DATABASE:', process.env.DATABASE);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Loaded' : 'NOT LOADED or EMPTY'); // Check JWT_SECRET
console.log('--------------------');

const { getConnection } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5001;

// Import route modules
const temperatureRoutes = require('./routes/temperatureRoutes'); // This will eventually be removed or redirected for clients
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes'); // Super Admin specific routes
const adminClientRoutes = require('./routes/adminClientRoutes'); // NEW: Admin Client specific routes
const clientRoutes = require('./routes/clientRoutes'); // NEW: Client specific routes

// Middleware
app.use(express.json());

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174', // Your frontend is now on 5174
    'http://127.0.0.1:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5175'
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
}));

// Route Middlewares
app.use('/api', temperatureRoutes); // Keep this for now, but will likely be superseded
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes); // Super Admin routes
app.use('/api/admin-client', adminClientRoutes); // NEW: Admin Client routes
app.use('/api/client', clientRoutes); // NEW: Client routes

// Basic routes (optional, for testing API root)
app.get('/api', (req, res) => {
  res.status(200).json({ message: 'API HygièneResto fonctionne !' });
});

app.get('/', (req, res) => {
  res.send('API HygièneResto est démarrée !');
});

async function initializeDatabaseAndStartServer() {
  try {
    const pool = await getConnection();
    console.log('Connexion à la base de données MySQL réussie via config/db !');

    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
    });
  } catch (error) {
    console.error('Erreur lors de la connexion à la base de données ou du démarrage du serveur :', error);
    process.exit(1);
  }
}

initializeDatabaseAndStartServer();