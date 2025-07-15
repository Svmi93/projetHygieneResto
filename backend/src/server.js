// backend/src/server.js
require('dotenv').config(); // Charger les variables d'environnement au tout début
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet'); // Import Helmet
const path = require('path'); // Importe le module 'path' pour gérer les chemins de fichiers

// IMPORTER initializeDatabasePool et getConnection (qui est getPooledConnection dans db.js)
const { initializeDatabasePool } = require('./config/db');
const startDailyTemperatureCheck = require('./jobs/dailyTemperatureCheck');

// Routes
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

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "http://localhost:5001", "https://storage.googleapis.com"],
      connectSrc: ["'self'", "http://localhost:5001", "http://localhost:5173", "http://localhost:5174"], // MODIFIÉ : Ajout de 5174
    },
  },
}));

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'], // MODIFIÉ : Autorise les deux ports
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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

    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
      startDailyTemperatureCheck();
    });

  } catch (err) {
    console.error('Échec de la connexion à la base de données MySQL ou démarrage du serveur:', err);
    process.exit(1);
  }
}

startServer();









// // backend/src/server.js
// require('dotenv').config(); // Charger les variables d'environnement au tout début
// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const helmet = require('helmet'); // Import Helmet
// const path = require('path'); // Importe le module 'path' pour gérer les chemins de fichiers

// // IMPORTER initializeDatabasePool et getConnection (qui est getPooledConnection dans db.js)
// const { initializeDatabasePool } = require('./config/db'); // On n'a besoin que de initializeDatabasePool ici
// // Si ta tâche cron a besoin de getConnection, elle devra l'importer elle-même ou tu peux la passer.
// const startDailyTemperatureCheck = require('./jobs/dailyTemperatureCheck'); // Importez la tâche cron

// // Routes
// const authRoutes = require('./routes/authRoutes');
// const userRoutes = require('./routes/userRoutes');
// const adminRoutes = require('./routes/adminRoutes');
// const adminClientRoutes = require('./routes/adminClientRoutes');
// const temperatureRoutes = require('./routes/temperatureRoutes');
// const equipmentRoutes = require('./routes/equipmentRoutes'); // Importe les routes d'équipement
// const employerRoutes = require('./routes/employerRoutes');
// const alertRoutes = require('./routes/alertRoutes');
// const photoRoutes = require('./routes/photoRoutes'); // Importe les routes photos

// const app = express();
// const PORT = process.env.PORT || 5001;

// // Middleware
// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       scriptSrc: ["'self'", "'unsafe-eval'"],
//       styleSrc: ["'self'", "'unsafe-inline'"],
//       imgSrc: ["'self'", "data:", "http://localhost:5001", "https://storage.googleapis.com"], // MODIFIÉ : Autorise les images depuis Firebase Storage
//       connectSrc: ["'self'", "http://localhost:5001", "http://localhost:5173"],
//     },
//   },
// }));

// app.use(cors({
//   origin: 'http://localhost:5173',
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true
// }));
// app.use(bodyParser.json());

// // Middleware pour servir les fichiers statiques (photos uploadées localement, si utilisé)
// // Les photos seront accessibles via http://localhost:5001/uploads/nom_du_fichier.jpg
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


// // Démarrage du serveur et initialisation de la base de données
// async function startServer() {
//   try {
//     // Initialiser le pool de connexions à la base de données UNE SEULE FOIS au démarrage
//     await initializeDatabasePool();
//     console.log('Connexion à la base de données MySQL réussie via config/db !');

//     // Définition des routes de l'API
//     app.use('/api/auth', authRoutes);
//     app.use('/api/users', userRoutes);
//     app.use('/api/admin', adminRoutes);
//     app.use('/api/admin-client', adminClientRoutes);
//     app.use('/api/employer', employerRoutes);
//     app.use('/api', temperatureRoutes); // Les routes de température sont montées directement sous /api
//     app.use('/api', equipmentRoutes); // MODIFIÉ : Monte les routes d'équipement directement sous /api
//     // La ligne app.use('/api/employees/my-locations', equipmentRoutes); a été supprimée car incorrecte.

//     // Utilisation des routes d'alertes et de photos
//     app.use('/api/alerts', alertRoutes);
//     app.use('/api/photos', photoRoutes);

//     // Route de test simple pour vérifier que l'API fonctionne
//     app.get('/', (req, res) => {
//       res.send('API HygieneResto en cours d\'exécution !');
//     });

//     // Démarrage de l'écoute du serveur HTTP
//     app.listen(PORT, () => {
//       console.log(`Serveur démarré sur le port ${PORT}`);

//       // Démarrage de la tâche cron une fois que le serveur écoute
//       startDailyTemperatureCheck();
//     });

//   } catch (err) {
//     // En cas d'échec de la connexion à la base de données ou du démarrage du serveur
//     console.error('Échec de la connexion à la base de données MySQL ou démarrage du serveur:', err);
//     process.exit(1);
//   }
// }

// // Appeler la fonction asynchrone pour lancer le serveur
// startServer();












// // backend/src/server.js
// require('dotenv').config(); // Charger les variables d'environnement au tout début
// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const helmet = require('helmet'); // Import Helmet
// const path = require('path'); // Importe le module 'path' pour gérer les chemins de fichiers

// // IMPORTER initializeDatabasePool et getConnection (qui est getPooledConnection dans db.js)
// const { initializeDatabasePool } = require('./config/db'); // On n'a besoin que de initializeDatabasePool ici
// // Si ta tâche cron a besoin de getConnection, elle devra l'importer elle-même ou tu peux la passer.
// const startDailyTemperatureCheck = require('./jobs/dailyTemperatureCheck'); // Importez la tâche cron

// // Routes
// const authRoutes = require('./routes/authRoutes');
// const userRoutes = require('./routes/userRoutes');
// const adminRoutes = require('./routes/adminRoutes');
// const adminClientRoutes = require('./routes/adminClientRoutes');
// const temperatureRoutes = require('./routes/temperatureRoutes');
// const equipmentRoutes = require('./routes/equipmentRoutes');
// const employerRoutes = require('./routes/employerRoutes');
// const alertRoutes = require('./routes/alertRoutes');
// const photoRoutes = require('./routes/photoRoutes'); // <<< NOUVELLE LIGNE : Importe les routes photos

// const app = express();
// const PORT = process.env.PORT || 5001;

// // Middleware
// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       scriptSrc: ["'self'", "'unsafe-eval'"],
//       styleSrc: ["'self'", "'unsafe-inline'"],
//       imgSrc: ["'self'", "data:", "http://localhost:5001"], // <<< MODIFIÉ : Autorise les images depuis le backend
//       connectSrc: ["'self'", "http://localhost:5001", "http://localhost:5173"],
//     },
//   },
// }));

// app.use(cors({
//   origin: 'http://localhost:5173',
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true
// }));
// app.use(bodyParser.json());

// // <<< NOUVELLE LIGNE : Middleware pour servir les fichiers statiques (photos uploadées)
// // Les photos seront accessibles via http://localhost:5001/uploads/nom_du_fichier.jpg
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


// // Démarrage du serveur et initialisation de la base de données
// async function startServer() {
//   try {
//     // Initialiser le pool de connexions à la base de données UNE SEULE FOIS au démarrage
//     await initializeDatabasePool();
//     console.log('Connexion à la base de données MySQL réussie via config/db !');

//     // --- PLUS DE LIGNES POUR LA SYNCHRONISATION SEQUELIZE ICI ---
//     // La synchronisation de la base de données sera gérée manuellement ou via des scripts SQL/migrations séparés.

//     // Définition des routes de l'API
//     app.use('/api/auth', authRoutes);
//     app.use('/api/users', userRoutes);
//     app.use('/api/admin', adminRoutes);
//     app.use('/api/admin-client', adminClientRoutes);
//     app.use('/api/employer', employerRoutes);
//     app.use('/api', temperatureRoutes);
//     app.use('/api/admin-client/equipments', equipmentRoutes);
//     app.use('/api/employees/my-locations', equipmentRoutes);

//     // Utilisation des routes d'alertes
//     app.use('/api/alerts', alertRoutes);
//     app.use('/api/photos', photoRoutes); // <<< NOUVELLE LIGNE : Utilise les routes photos

//     // Route de test simple pour vérifier que l'API fonctionne
//     app.get('/', (req, res) => {
//       res.send('API HygieneResto en cours d\'exécution !');
//     });

//     // Démarrage de l'écoute du serveur HTTP
//     app.listen(PORT, () => {
//       console.log(`Serveur démarré sur le port ${PORT}`);

//       // Démarrage de la tâche cron une fois que le serveur écoute
//       startDailyTemperatureCheck();
//     });

//   } catch (err) {
//     // En cas d'échec de la connexion à la base de données ou du démarrage du serveur
//     console.error('Échec de la connexion à la base de données MySQL ou démarrage du serveur:', err);
//     process.exit(1);
//   }
// }

// // Appeler la fonction asynchrone pour lancer le serveur
// startServer();










// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const helmet = require('helmet'); // Import Helmet
// // IMPORTER initializeDatabasePool et getConnection (qui est getPooledConnection dans db.js)
// const { initializeDatabasePool, getConnection } = require('./config/db');

// // Routes
// const authRoutes = require('./routes/authRoutes');
// const userRoutes = require('./routes/userRoutes');
// const adminRoutes = require('./routes/adminRoutes');
// const adminClientRoutes = require('./routes/adminClientRoutes');
// const temperatureRoutes = require('./routes/temperatureRoutes');
// const equipmentRoutes = require('./routes/equipmentRoutes');
// const employerRoutes = require('./routes/employerRoutes');

// dotenv.config(); // Charger les variables d'environnement

// const app = express();
// const PORT = process.env.PORT || 5001;

// // Middleware

// // --- Configuration Helmet pour la Content Security Policy (CSP) ---
// // Ceci est crucial pour résoudre l'erreur 'unsafe-eval'
// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"], // Par défaut, n'autorise que les ressources de la même origine
//       scriptSrc: ["'self'", "'unsafe-eval'"], // Autorise les scripts de la même origine et 'unsafe-eval' (nécessaire pour React en dev)
//       styleSrc: ["'self'", "'unsafe-inline'"], // Autorise les styles de la même origine et 'unsafe-inline' (souvent pour les styles injectés par React)
//       imgSrc: ["'self'", "data:"], // Autorise les images de la même origine et les images encodées en base64
//       connectSrc: ["'self'", "http://localhost:5001", "http://localhost:5173"], // Autorise les connexions à votre backend et à votre frontend (Vite)
//       // Ajoutez d'autres directives si votre application utilise des ressources de d'autres domaines (polices, vidéos, etc.)
//       // fontSrc: ["'self'", "https://fonts.gstatic.com"],
//       // frameSrc: ["'self'"],
//       // mediaSrc: ["'self'"],
//       // workerSrc: ["'self'", "blob:"],
//     },
//   },
// }));

// // --- CONFIGURATION CORS MISE À JOUR ---
// // Assurez-vous que l'origine correspond exactement à l'URL de votre frontend
// app.use(cors({
//   origin: 'http://localhost:5173', // L'URL de votre application React/Vite
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Méthodes HTTP autorisées
//   allowedHeaders: ['Content-Type', 'Authorization'], // En-têtes autorisés dans les requêtes
//   credentials: true // Important si vous utilisez des cookies ou des en-têtes d'autorisation
// }));
// app.use(bodyParser.json()); // Pour analyser les corps de requête JSON

// // --- Démarrage du serveur et initialisation de la base de données ---
// // Encapsule le démarrage du serveur dans une fonction asynchrone
// async function startServer() {
//   try {
//     // Initialiser le pool de connexions à la base de données UNE SEULE FOIS au démarrage
//     await initializeDatabasePool();
//     console.log('Connexion à la base de données MySQL réussie via config/db !');

//     // --- Définition des routes de l'API ---
//     app.use('/api/auth', authRoutes);
//     app.use('/api/users', userRoutes);
//     app.use('/api/admin', adminRoutes);
//     app.use('/api/admin-client', adminClientRoutes);
//     app.use('/api/employer', employerRoutes); // Assurez-vous que cette route est correcte pour les employés
//     app.use('/api', temperatureRoutes); // Routes générales de température
//     app.use('/api/admin-client/equipments', equipmentRoutes); // Route spécifique pour les équipements de l'admin client
//     app.use('/api/employees/my-locations', equipmentRoutes); // Si nécessaire, vérifiez l'objectif de cette route

//     // Route de test simple pour vérifier que l'API fonctionne
//     app.get('/', (req, res) => {
//       res.send('API HygieneResto en cours d\'exécution !');
//     });

//     // --- Démarrage de l'écoute du serveur HTTP ---
//     app.listen(PORT, () => {
//       console.log(`Serveur démarré sur le port ${PORT}`);
//     });

//   } catch (err) {
//     // En cas d'échec de la connexion à la base de données ou du démarrage du serveur
//     console.error('Échec de la connexion à la base de données MySQL ou démarrage du serveur:', err);
//     process.exit(1); // Arrête le processus Node.js
//   }
// }

// // Appeler la fonction asynchrone pour lancer le serveur
// startServer();






// // backend/src/server.js
// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const { getConnection } = require('./config/db'); // Importez la fonction de connexion à la DB

// // Routes
// const authRoutes = require('./routes/authRoutes');
// const userRoutes = require('./routes/userRoutes');
// const adminRoutes = require('./routes/adminRoutes');
// const adminClientRoutes = require('./routes/adminClientRoutes');
// const temperatureRoutes = require('./routes/temperatureRoutes');
// const equipmentRoutes = require('./routes/equipmentRoutes'); // <--- ENSURE THIS IS CORRECTLY IMPORTED

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5001;

// // Middleware
// app.use(cors());
// app.use(bodyParser.json());

// // Test de connexion à la base de données au démarrage du serveur
// getConnection()
//   .then(() => {
//     console.log('Connexion à la base de données MySQL réussie via config/db !');
//   })
//   .catch((err) => {
//     console.error('Échec de la connexion à la base de données MySQL:', err);
//     process.exit(1); // Arrête l'application si la connexion DB échoue
//   });

// // Utilisation des routes
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/admin-client', adminClientRoutes);
// app.use('/api', temperatureRoutes);
// app.use('/api/admin-client/equipments', equipmentRoutes); // This path for admin client equipment
// // If /api/employees/my-locations is also handled by equipmentRoutes,
// // you might need a separate router or ensure the route is handled correctly within equipmentRoutes.
// // For now, I'll assume the equipmentRoutes handles both / and /my-locations internally with its paths.
// // If not, you might need: app.use('/api/employees', equipmentRoutes); and move /my-locations inside it.
// // For the example, I'll keep it as you had it.
// app.use('/api/employees/my-locations', equipmentRoutes);

// // Route de test simple
// app.get('/', (req, res) => {
//   res.send('API HygieneResto en cours d\'exécution !');
// });

// // Démarrage du serveur
// app.listen(PORT, () => {
//   console.log(`Serveur démarré sur le port ${PORT}`);
// });






// // backend/src/server.js
// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const { getConnection } = require('./config/db'); // Importez la fonction de connexion à la DB

// // Routes
// const authRoutes = require('./routes/authRoutes');
// const userRoutes = require('./routes/userRoutes'); // Pour les routes générales des utilisateurs (ex: /me)
// const adminRoutes = require('./routes/adminRoutes'); // Pour les routes Super Admin
// const adminClientRoutes = require('./routes/adminClientRoutes'); // NOUVEAU: Pour les routes Admin Client
// const temperatureRoutes = require('./routes/temperatureRoutes'); // Pour les routes de température (potentiellement utilisées par 'employer')

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5001;

// // Middleware
// app.use(cors()); // Active CORS pour toutes les requêtes
// app.use(bodyParser.json()); // Pour parser les requêtes JSON

// // Test de connexion à la base de données au démarrage du serveur
// getConnection()
//   .then(() => {
//     console.log('Connexion à la base de données MySQL réussie via config/db !');
//   })
//   .catch((err) => {
//     console.error('Échec de la connexion à la base de données MySQL:', err);
//     process.exit(1); // Arrête l'application si la connexion DB échoue
//   });

// // Utilisation des routes
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes); // Routes générales des utilisateurs (ex: /api/users/me)
// app.use('/api/admin', adminRoutes); // Routes Super Admin (ex: /api/admin/users)
// app.use('/api/admin-client', adminClientRoutes); // NOUVEAU et CRUCIAL: Routes Admin Client (ex: /api/admin-client/employees)
// app.use('/api', temperatureRoutes); // Routes de température (pour les employés)

// // Route de test simple
// app.get('/', (req, res) => {
//   res.send('API HygieneResto en cours d\'exécution !');
// });

// // Démarrage du serveur
// app.listen(PORT, () => {
//   console.log(`Serveur démarré sur le port ${PORT}`);
// });
