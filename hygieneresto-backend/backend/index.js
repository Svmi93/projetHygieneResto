const express = require('express');
const app = express();
const port = process.env.PORT || 5001;

// Définissez vos routes et votre logique d'application ici
app.get('/', (req, res) => {
  res.send('Bienvenue sur votre API HygièneResto!');
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});