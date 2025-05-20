# ProjetHygienePerso



#  Backend de l'Application HygièneResto
Ce répertoire contient le code backend de l'application HygièneResto. Il s'agit d'une API RESTful développée avec Node.js et Express, utilisant MySQL pour la base de données.

Table des Matières
Technologies Utilisées
Prérequis
Installation
Configuration de la Base de Données
Variables d'Environnement
Lancement de l'Application
Structure du Projet
API Endpoints (À Définir)
Licence


1. Technologies Utilisées
Node.js
Express.js (Framework web pour Node.js)
MySQL (Base de données relationnelle)
mysql2 (Driver MySQL pour Node.js)
bcryptjs (Pour le hachage des mots de passe)
jsonwebtoken (Pour la gestion des tokens JWT)
cors (Gestion des requêtes Cross-Origin)
dotenv (Gestion des variables d'environnement)
nodemon (Pour le rechargement automatique en développement)


3. Prérequis
Avant de commencer, assure-toi d'avoir les éléments suivants installés sur ta machine :

Node.js (version 18 ou supérieure recommandée)
npm (normalement installé avec Node.js)
MySQL Server (installé et fonctionnel)
Docker et Docker Compose (si tu souhaites utiliser la configuration Docker)


3. Installation
Pour installer les dépendances du projet :

Navigue dans le répertoire backend :
Bash

cd backend
Installe les packages npm :
Bash

npm install
4. Configuration de la Base de Données
Cette API utilise une base de données MySQL.

Créer la base de données :
Connecte-toi à ton serveur MySQL (par exemple via mysql -u root -p ou un outil comme MySQL Workbench / phpMyAdmin) et crée une base de données.

SQL

CREATE DATABASE hygienesto_db;
(Tu peux choisir un nom différent, mais assure-toi de le mettre à jour dans ton fichier .env).

Mettre à jour les informations de connexion :
Les informations de connexion à la base de données sont définies via les variables d'environnement. Passe à la section suivante pour les configurer.

5. Variables d'Environnement
Crée un fichier nommé .env à la racine du dossier backend (au même niveau que package.json). Ce fichier contiendra tes informations sensibles.

Extrait de code

PORT=3000
DB_HOST=localhost
DB_USER=****
DB_PASSWORD=your_mysql_password
DB_NAME=hygienesto_db
JWT_SECRET=your_jwt_secret_key_here # Choisis une chaîne de caractères complexe et unique
Remplace your_mysql_password par le mot de passe de ton utilisateur MySQL.
Remplace your_jwt_secret_key_here par une clé secrète forte et unique pour la signature de tes tokens JWT.


6. Lancement de l'Application
En mode développement
Pour lancer l'API en mode développement (avec rechargement automatique grâce à nodemon) :

Bash

cd backend
npm run dev
L'API sera accessible à l'adresse http://localhost:3000 (ou le port que tu as défini dans PORT).

En mode production
Pour lancer l'API en production (sans nodemon) :

Bash

cd backend
npm start
Avec Docker (Recommandé pour un setup complet)
Tu as un fichier compose.yaml à la racine de ton projet, ce qui est excellent pour gérer le backend et la base de données (et le frontend plus tard) ensemble.

Assure-toi que Docker Desktop est lancé.

Navigue à la racine de ton projet ProjetHygienePerso (là où se trouve compose.yaml).

Lance les services définis dans ton compose.yaml :

Bash

docker compose up -d
(-d pour exécuter en arrière-plan)

Pour arrêter les services :

Bash

docker compose down
7. Structure du Projet
backend/
├── .env                  # Variables d'environnement (non versionné)
├── Dockerfile            # Configuration Docker pour le backend
├── index.js              # Point d'entrée principal de l'API
├── package.json          # Dépendances et scripts
├── package-lock.json
└── src/
    ├── config/
    │   └── db.js         # Configuration de la connexion à la base de données
    └── server.js         # Configuration du serveur Express et des routes
    # Ajoutez ici d'autres dossiers comme 'routes/', 'controllers/', 'models/', 'middlewares/' etc.
8. API Endpoints (À Définir)
Cette section est cruciale et devra être complétée au fur et à mesure que tu développes ton API. Elle décrira toutes les routes disponibles, leurs méthodes HTTP, les paramètres attendus, et les réponses possibles.

Exemple (à adapter) :

Authentification
POST /api/auth/register
Description : Enregistre un nouvel utilisateur.
Requête : {"username": "...", "email": "...", "password": "..."}
Réponse : {"message": "User registered successfully", "token": "..."}
POST /api/auth/login
Description : Connecte un utilisateur existant et retourne un token JWT.
Requête : {"email": "...", "password": "..."}
Réponse : {"message": "Login successful", "token": "..."}
Utilisateurs
GET /api/users/:id (Protégée par JWT)
Description : Récupère les informations d'un utilisateur par son ID.
Requête : Headers: Authorization: Bearer <token>
Réponse : {"id": ..., "username": "...", "email": "..."}
... (Ajoute d'autres sections pour tes entités : produits, commandes, etc.)
9. Licence
(Ajoute ta licence ici, par exemple MIT, si applicable)

MIT License

Copyright (c) [Année] [Ton Nom ou Nom de l'Organisation]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
Prochaines étapes pour toi :
Personnalise le README.md : Ajoute des détails spécifiques à ton projet, comme les entités principales de ton application (Produits d'hygiène, Utilisateurs, etc.).
Complète la section "API Endpoints" : C'est essentiel pour documenter comment ton API fonctionne.
Commence à développer tes routes et contrôleurs dans backend/src/ pour implémenter la logique de ton API.
