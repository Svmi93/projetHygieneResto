-- database/init.sql

-- Drop tables if they exist to ensure a clean start
DROP TABLE IF EXISTS temperature_records;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom_entreprise VARCHAR(255) NOT NULL,
    nom_client VARCHAR(255) NOT NULL,
    prenom_client VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telephone VARCHAR(20),
    adresse VARCHAR(255),
    siret VARCHAR(14), -- 14 digits for SIRET
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin_client', 'employer') NOT NULL DEFAULT 'employer',
    admin_client_id INT NULL, -- NEW: Links a client to their admin_client
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_client FOREIGN KEY (admin_client_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create temperature_records table
CREATE TABLE temperature_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, -- The client who recorded this temperature
    type VARCHAR(255) NOT NULL, -- e.g., 'frigo-positif', 'livraison'
    location VARCHAR(255) NOT NULL, -- e.g., 'Réfrigérateur 1', 'Zone de réception'
    temperature DECIMAL(5,2) NOT NULL, -- Temperature in Celsius, e.g., -18.50
    -- NEW: timestamp will automatically be set by MySQL upon insert
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add some initial data
-- Super Admin
INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, password_hash, role) VALUES
('SuperCorp', 'Admin', 'Super', 'superadmin@example.com', '$2a$10$w82eTzI5r7t8n9t7X5q.J.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g', 'super_admin');
-- Password for superadmin@example.com is 'SuperAdmin123!' (hashed with bcrypt)

-- Admin Client (will be created manually by Super Admin later or during testing)
-- INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, password_hash, role) VALUES
-- ('La Bonne Bouffe SARL', 'Martin', 'Paul', 'adminclient@example.com', '$2a$10$HASHED_PASSWORD_HERE', 'admin_client');

-- Client (will be created by Admin Client later or during testing)
-- INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, password_hash, role, admin_client_id) VALUES
-- ('Restaurant Du Coin', 'Durand', 'Sophie', 'client@example.com', '$2a$10$HASHED_PASSWORD_HERE', 'client', ID_DE_L_ADMIN_CLIENT);