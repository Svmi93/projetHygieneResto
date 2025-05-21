// backend/src/config/jwt.js
require('dotenv').config({ path: '../.env' }); // Assurez-vous que le chemin vers votre .env est correct

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.error('Erreur: JWT_SECRET n\'est pas défini dans le fichier .env');
  process.exit(1); // Arrête l'application si la clé secrète n'est pas définie
}

module.exports = { jwtSecret };