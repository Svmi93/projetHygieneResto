// backend/src/config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config(); // S'assurer que dotenv est chargé pour process.env

const dbConfig = {
  host: (process.env.NODE_ENV === 'test' && process.env.HOST === 'db') ? 'localhost' : process.env.HOST,
  user: process.env.USERNAME,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306, // Port par défaut pour MySQL
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool;

/**
 * Initialise le pool de connexions à la base de données avec une logique de reconnexion.
 * Tente de se connecter plusieurs fois avec un délai en cas d'échec initial.
 */
async function initializeDatabasePool() {
  if (pool) { // Si le pool existe déjà, ne le réinitialise pas
    return pool;
  }

  const MAX_RETRIES = 10; // Nombre maximal de tentatives de connexion
  const RETRY_DELAY_MS = 5000; // Délai entre les tentatives en millisecondes (5 secondes)

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      pool = mysql.createPool(dbConfig);
      console.log(`Tentative ${i + 1}/${MAX_RETRIES}: Pool de connexions MySQL créé.`);

      // Teste la connexion pour s'assurer que la DB est réellement accessible
      const testConnection = await pool.getConnection();
      testConnection.release(); // Libère la connexion de test
      console.log('Connexion initiale au pool MySQL réussie.');
      return pool; // Retourne le pool si la connexion est réussie
    } catch (error) {
      console.error(`Tentative ${i + 1}/${MAX_RETRIES}: Erreur lors de la création ou de la connexion initiale au pool MySQL :`, error.message);
      
      // Si c'est la dernière tentative, lance l'erreur
      if (i === MAX_RETRIES - 1) {
        console.error('Toutes les tentatives de connexion à la base de données ont échoué. Le serveur ne peut pas démarrer.');
        throw error; // Erreur fatale après toutes les tentatives
      }

      // Attend avant de réessayer
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

/**
 * Obtient une connexion du pool. Initialise le pool si ce n'est pas déjà fait.
 */
async function getPooledConnection() {
  if (!pool) {
    await initializeDatabasePool(); // S'assure que le pool est initialisé
  }
  return await pool.getConnection();
}

module.exports = {
  initializeDatabasePool,
  getConnection: getPooledConnection // C'est cette fonction que tu utiliseras !
};








// // backend/src/config/db.js
// const mysql = require('mysql2/promise');
// require('dotenv').config(); // S'assurer que dotenv est chargé pour process.env

// const dbConfig = {
//   host: process.env.HOST,
//   user: process.env.USERNAME,
//   password: process.env.PASSWORD,
//   database: process.env.DATABASE,
//   port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306, // Port par défaut pour MySQL
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// };

// let pool;

// async function initializeDatabasePool() {
//   if (!pool) {
//     try {
//       pool = mysql.createPool(dbConfig);
//       console.log('Pool de connexions MySQL créé.');
//       const testConnection = await pool.getConnection();
//       testConnection.release();
//       console.log('Connexion initiale au pool MySQL réussie.');
//     } catch (error) {
//       console.error('Erreur lors de la création ou de la connexion initiale au pool MySQL :', error);
//       throw error;
//     }
//   }
//   return pool;
// }

// async function getPooledConnection() {
//   if (!pool) {
//     await initializeDatabasePool();
//   }
//   return await pool.getConnection();
// }

// module.exports = {
//   initializeDatabasePool,
//   getConnection: getPooledConnection // C'est cette fonction que tu utiliseras !
// };













// const mysql = require('mysql2/promise');
// require('dotenv').config(); // Ensure dotenv is loaded here too

// const dbConfig = {
//   host: process.env.HOST,
//   user: process.env.USERNAME,
//   password: process.env.PASSWORD,
//   database: process.env.DATABASE,
//   port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// };

// let pool; // This variable will hold our connection pool

// // This function will initialize the pool if it hasn't been already
// // and return the pool instance.
// async function initializeDatabasePool() {
//   if (!pool) {
//     try {
//       pool = mysql.createPool(dbConfig);
//       console.log('Pool de connexions à la base de données créé.');
//       // Optional: Ping the database to ensure connection is live
//       const testConnection = await pool.getConnection();
//       testConnection.release(); // Release the test connection immediately
//       console.log('Connexion initiale au pool réussie.');
//     } catch (error) {
//       console.error('Erreur lors de la création ou de la connexion initiale au pool :', error);
//       throw error; // Re-throw to propagate the error
//     }
//   }
//   return pool; // Returns the pool instance
// }

// // This function will return an actual connection object FROM the pool
// async function getPooledConnection() {
//   if (!pool) {
//     // If someone calls getPooledConnection before the pool is initialized,
//     // initialize it first. (Better to call initializeDatabasePool once at server start)
//     await initializeDatabasePool();
//   }
//   return await pool.getConnection(); // THIS is the crucial change: get a connection from the pool
// }

// module.exports = {
//   initializeDatabasePool, // Export this to call it once at server startup
//   getConnection: getPooledConnection // Export the function that gets a connection from the pool
// };








// // const mysql = require('mysql2/promise');
// require('dotenv').config(); // Assurez-vous que .env est chargé ici aussi si ce fichier est exécuté indépendamment

// const dbConfig = {
//   host: process.env.HOST,
//   user: process.env.USERNAME,
//   password: process.env.PASSWORD,
//   database: process.env.DATABASE,
//   port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// };

// let pool;

// async function getConnection() {
//   if (!pool) {
//     try {
//       pool = mysql.createPool(dbConfig);
//       console.log('Pool de connexions à la base de données créé.');
//     } catch (error) {
//       console.error('Erreur lors de la création du pool :', error);
//       throw error;
//     }
//   }
//   return pool;
// }

// module.exports = { getConnection };