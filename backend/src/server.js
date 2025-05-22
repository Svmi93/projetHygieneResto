// backend/src/server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const { getConnection } = require('./config/db'); // Importez la fonction de connexion à la DB

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes'); // Pour les routes générales des utilisateurs (ex: /me)
const adminRoutes = require('./routes/adminRoutes'); // Pour les routes Super Admin
const adminClientRoutes = require('./routes/adminClientRoutes'); // NOUVEAU: Pour les routes Admin Client
const temperatureRoutes = require('./routes/temperatureRoutes'); // Pour les routes de température (potentiellement utilisées par 'employer')

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors()); // Active CORS pour toutes les requêtes
app.use(bodyParser.json()); // Pour parser les requêtes JSON

// Test de connexion à la base de données au démarrage du serveur
getConnection()
  .then(() => {
    console.log('Connexion à la base de données MySQL réussie via config/db !');
  })
  .catch((err) => {
    console.error('Échec de la connexion à la base de données MySQL:', err);
    process.exit(1); // Arrête l'application si la connexion DB échoue
  });

// Utilisation des routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // Routes générales des utilisateurs (ex: /api/users/me)
app.use('/api/admin', adminRoutes); // Routes Super Admin (ex: /api/admin/users)
app.use('/api/admin-client', adminClientRoutes); // NOUVEAU et CRUCIAL: Routes Admin Client (ex: /api/admin-client/employees)
app.use('/api', temperatureRoutes); // Routes de température (pour les employés)

// Route de test simple
app.get('/', (req, res) => {
  res.send('API HygieneResto en cours d\'exécution !');
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
