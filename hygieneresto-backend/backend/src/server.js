require('dotenv').config();

console.log('--- .env variables ---');
console.log('HOST:', process.env.HOST);
console.log('USERNAME:', process.env.USERNAME);
console.log('PASSWORD:', process.env.PASSWORD ? 'Loaded' : 'NOT LOADED or EMPTY');
console.log('DATABASE:', process.env.DATABASE);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('--------------------');
const { getConnection } = require('./config/db'); // Assurez-vous que ce chemin est correct

const express = require('express'); // Déclaration de express AU DÉBUT
const cors = require('cors');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise'); // Vous utilisez mysql2, donc gardez-le

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use(cors({
  origin: 'http://localhost:3000',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));

// Configuration de la base de données MySQL (utilisation de la configuration importée)
let pool;

async function initializeDatabase() {
  try {
    pool = await getConnection();
    console.log('Connexion à la base de données MySQL réussie via config/db !');
    // Vous n'avez pas besoin de tester la connexion ici si getConnection le fait déjà.
  } catch (error) {
    console.error('Erreur lors de la connexion à la base de données :', error);
    process.exit(1);
  }
}

initializeDatabase();

const validatePassword = (req, res, next) => {
  const { password } = req.body;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/~`])[A-Za-z\d!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/~`]{14,}$/;

  if (!password || !passwordRegex.test(password)) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 14 caractères, dont une majuscule, une minuscule, un chiffre et un caractère spécial.' });
  }
  next();
};

app.post('/api/auth/register', validatePassword, async (req, res) => {
  const {
    nomEntreprise, nomClient, prenomClient, email, telephone,
    adresse, siret, password
  } = req.body;

  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      return res.status(409).json({ message: 'Cet email est déjà enregistré.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      `INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, telephone, adresse, siret, password_hash, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nomEntreprise, nomClient, prenomClient, email, telephone, adresse, siret, hashedPassword, 'client']
    );

    res.status(201).json({ message: 'Inscription réussie !', userId: result.insertId });

  } catch (error) {
    console.error('Erreur lors de l\'inscription :', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
});

app.get('/', (req, res) => {
  res.send('API HygièneResto en cours d\'exécution !');
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});