// backend/src/config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config(); // S'assurer que dotenv est chargé pour process.env

const dbConfig = {
  host: process.env.HOST, // Use environment variable for host
  user: process.env.USERNAME,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306, // Port par défaut pour MySQL
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'  // Fix encoding error by specifying supported charset
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
      // Fix for encoding error: override charset to utf8mb4_general_ci in connection config
      if (error.message && error.message.includes("Encoding not recognized: 'cesu8'")) {
        dbConfig.charset = 'utf8mb4_general_ci';
        pool = mysql.createPool(dbConfig);
        const testConnection = await pool.getConnection();
        testConnection.release();
        console.log('Connexion initiale au pool MySQL réussie avec charset utf8mb4_general_ci.');
        return pool;
      }
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
