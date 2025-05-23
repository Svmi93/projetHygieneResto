const mysql = require('mysql2/promise');
require('dotenv').config(); // Ensure dotenv is loaded here too

const dbConfig = {
  host: process.env.HOST,
  user: process.env.USERNAME,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool; // This variable will hold our connection pool

// This function will initialize the pool if it hasn't been already
// and return the pool instance.
async function initializeDatabasePool() {
  if (!pool) {
    try {
      pool = mysql.createPool(dbConfig);
      console.log('Pool de connexions à la base de données créé.');
      // Optional: Ping the database to ensure connection is live
      const testConnection = await pool.getConnection();
      testConnection.release(); // Release the test connection immediately
      console.log('Connexion initiale au pool réussie.');
    } catch (error) {
      console.error('Erreur lors de la création ou de la connexion initiale au pool :', error);
      throw error; // Re-throw to propagate the error
    }
  }
  return pool; // Returns the pool instance
}

// This function will return an actual connection object FROM the pool
async function getPooledConnection() {
  if (!pool) {
    // If someone calls getPooledConnection before the pool is initialized,
    // initialize it first. (Better to call initializeDatabasePool once at server start)
    await initializeDatabasePool();
  }
  return await pool.getConnection(); // THIS is the crucial change: get a connection from the pool
}

module.exports = {
  initializeDatabasePool, // Export this to call it once at server startup
  getConnection: getPooledConnection // Export the function that gets a connection from the pool
};








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