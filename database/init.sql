-- database/init.sql

-- Drop tables if they exist to ensure a clean start
DROP TABLE IF EXISTS temperature_records;
DROP TABLE IF EXISTS users;

-- Create users table
-- Le champ `admin_client_id` stockera le SIRET de l'admin_client pour les rôles 'employer'.
-- Le champ `siret` de l'utilisateur lui-même est son propre SIRET (pour les admin_clients).
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom_entreprise VARCHAR(255) NOT NULL,
    nom_client VARCHAR(255) NOT NULL,
    prenom_client VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telephone VARCHAR(20),
    adresse VARCHAR(255),
    siret VARCHAR(14) UNIQUE, -- SIRET de l'entreprise de cet utilisateur (pour admin_client)
    password_hash VARCHAR(255) NOT NULL,
    -- Le rôle 'client' est renommé en 'employer'
    role ENUM('super_admin', 'admin_client', 'employer') NOT NULL DEFAULT 'employer',
    -- admin_client_siret stockera le SIRET de l'admin_client auquel l'employé est rattaché
    admin_client_siret VARCHAR(14) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- La clé étrangère pointe maintenant vers le SIRET de l'admin_client dans la même table users
    -- Note: Une clé étrangère sur une colonne non-clé primaire nécessite un index sur cette colonne
    -- Nous n'ajouterons pas de contrainte FOREIGN KEY directe ici pour éviter des complications avec les SIRET NULL
    -- La logique de validation sera gérée au niveau de l'application (backend)
    INDEX idx_admin_client_siret (admin_client_siret)
);

-- Create temperature_records table
-- Les relevés de température seront également liés au SIRET de l'établissement
CREATE TABLE temperature_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, -- L'ID de l'utilisateur (employé) qui a enregistré ce relevé
    siret_etablissement VARCHAR(14) NOT NULL, -- Le SIRET de l'établissement concerné par ce relevé
    type VARCHAR(255) NOT NULL, -- e.g., 'frigo-positif', 'livraison'
    location VARCHAR(255) NOT NULL, -- e.g., 'Réfrigérateur 1', 'Zone de réception'
    temperature DECIMAL(5,2) NOT NULL, -- Temperature in Celsius, e.g., -18.50
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_temp_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    -- Ajout d'une clé étrangère sur le SIRET de l'établissement
    -- La logique de validation sera gérée au niveau de l'application (backend)
    INDEX idx_siret_etablissement (siret_etablissement)
);

-- Add some initial data
-- Super Admin
INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, password_hash, role) VALUES
('SuperCorp', 'Admin', 'Super', 'superadmin@example.com', '$2a$10$w82eTzI5r7t8n9t7X5q.J.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g', 'super_admin');
-- Password for superadmin@example.com is 'SuperAdmin123!' (hashed with bcrypt)

-- GRANT permissions to rootttest user from any host
-- Ceci est crucial pour permettre la connexion depuis d'autres conteneurs Docker
GRANT ALL PRIVILEGES ON hygieneresto_db.* TO 'rootttest'@'%' IDENTIFIED BY '${PASSWORD}';
FLUSH PRIVILEGES;

-- Exemple d'Admin Client (avec un SIRET)
-- INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, siret, password_hash, role) VALUES
-- ('La Bonne Bouffe SARL', 'Martin', 'Paul', 'adminclient@example.com', '12345678901234', '$2a$10$HASHED_PASSWORD_HERE', 'admin_client');

-- Exemple d'Employé (rattaché à un Admin Client via son SIRET)
-- INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, password_hash, role, admin_client_siret) VALUES
-- ('La Bonne Bouffe SARL', 'Durand', 'Sophie', 'employer@example.com', '$2a$10$HASHED_PASSWORD_HERE', 'employer', '12345678901234');
