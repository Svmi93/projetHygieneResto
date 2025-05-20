const mysql = require('mysql2/promise');
require('dotenv').config(); // Assurez-vous que .env est chargé ici aussi si ce fichier est exécuté indépendamment

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

let pool;

async function getConnection() {
  if (!pool) {
    try {
      pool = mysql.createPool(dbConfig);
      console.log('Pool de connexions à la base de données créé.');
    } catch (error) {
      console.error('Erreur lors de la création du pool :', error);
      throw error;
    }
  }
  return pool;
}

module.exports = { getConnection };