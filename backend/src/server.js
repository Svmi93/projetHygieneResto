// backend/src/server.js
require('dotenv').config();
require('./config/firebaseAdmin');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const { initializeDatabasePool } = require('./config/db');
const startDailyTemperatureCheck = require('./jobs/dailyTemperatureCheck');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminClientRoutes = require('./routes/adminClientRoutes');
const temperatureRoutes = require('./routes/temperatureRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const employerRoutes = require('./routes/employerRoutes');
const alertRoutes = require('./routes/alertRoutes');
const photoRoutes = require('./routes/photoRoutes');
const traceabilityRoutes = require('./routes/traceabilityRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "http://localhost:5001", "https://storage.googleapis.com"],
      connectSrc: ["'self'", "http://localhost:5001", "http://localhost:5173", "http://localhost:5174"],
    },
  },
}));

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: true
}));
app.use(bodyParser.json());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

async function startServer() {
  try {
    await initializeDatabasePool();
    console.log('Connexion à la base de données MySQL réussie via config/db !');

    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/admin-client', adminClientRoutes);
    app.use('/api/employer', employerRoutes);
    app.use('/api', temperatureRoutes);
    app.use('/api', equipmentRoutes);
    app.use('/api/alerts', alertRoutes);
    app.use('/api/photos', photoRoutes);
    app.use('/api/traceability', traceabilityRoutes);

    app.get('/', (req, res) => {
      res.send('API HygieneResto en cours d\'exécution !');
    });

    const server = app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
      startDailyTemperatureCheck();
    });

    module.exports = server;

  } catch (err) {
    console.error('Échec de la connexion à la base de données MySQL ou démarrage du serveur:', err);
    process.exit(1);
  }
}

startServer();
