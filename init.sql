-- init.sql - Script d'initialisation de la base de données

-- Création de la base de données si elle n'existe pas
CREATE DATABASE IF NOT EXISTS hygieneresto_db;
USE hygieneresto_db;

-- Table pour les utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom_entreprise VARCHAR(255) NOT NULL,
    nom_client VARCHAR(255) NOT NULL,
    prenom_client VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telephone VARCHAR(20),
    adresse TEXT,
    siret VARCHAR(14) UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- Stockera le mot de passe haché
    role ENUM('super_admin', 'admin', 'client') DEFAULT 'client', -- Rôles
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les relevés de température
CREATE TABLE IF NOT EXISTS temperatures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    temperature DECIMAL(5, 2) NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, -- Note: Changed from NOT NULL to DEFAULT CURRENT_TIMESTAMP
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MODIFICATION NÉCESSAIRE: Ajouter la colonne user_id à temperatures
-- et la clé étrangère pour lier les relevés aux utilisateurs
ALTER TABLE temperatures
ADD COLUMN user_id INT,
ADD CONSTRAINT fk_user
FOREIGN KEY (user_id) REFERENCES users(id)
ON DELETE CASCADE; -- Supprime les relevés si l'utilisateur est supprimé


-- ATTENTION: Cette insertion est incorrecte et va échouer
-- Le nom de la table est 'temperatures', pas 'temperature_records'
-- De plus, 'timestamp' a un DEFAULT CURRENT_TIMESTAMP, mais si vous voulez une valeur spécifique,
-- vous devez la fournir. 'id' et 'created_at' sont auto-générés.
-- Je vous recommande de laisser cette insertion de côté pour l'instant
-- ou de la corriger comme suit si vous voulez des données initiales.

INSERT INTO temperatures (type, location, temperature, timestamp, notes) VALUES
('frigo-positif', 'Cuisine principale', 4.5, NOW(), 'Vérification quotidienne'),
('chambre-froide', 'Chambre froide viande', -19.2, NOW(), 'Niveau bas, vérifier');
