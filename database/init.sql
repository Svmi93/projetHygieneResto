-- database/init.sql

-- Drop tables if they exist to ensure a clean start
-- IMPORTANT: L'ordre de DROP est important pour les clés étrangères
DROP TABLE IF EXISTS traceability_records; -- Nouvelle table
DROP TABLE IF EXISTS alerts;               -- Nouvelle table
DROP TABLE IF EXISTS temperature_records;
DROP TABLE IF EXISTS equipments;
DROP TABLE IF EXISTS photos;
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
    siret VARCHAR(14) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin_client', 'employer') NOT NULL DEFAULT 'employer',
    admin_client_siret VARCHAR(14) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_admin_client_siret (admin_client_siret)
);

-- Create equipments table
CREATE TABLE IF NOT EXISTS equipments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_client_id INT NOT NULL, -- L'ID de l'utilisateur admin_client
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    temperature_type ENUM('positive', 'negative') NOT NULL,
    min_temp DECIMAL(5, 2),
    max_temp DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_client_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create temperature_records table
CREATE TABLE temperature_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, -- L'ID de l'utilisateur (employé ou admin) qui a enregistré ce relevé
    siret_etablissement VARCHAR(14) NOT NULL, -- Le SIRET de l'établissement concerné
    type VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    temperature DECIMAL(5,2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    temperature_type ENUM('positive', 'negative') NOT NULL DEFAULT 'positive',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_temp_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_siret_etablissement (siret_etablissement)
);

-- Create photos table (already in your file, kept as is)
CREATE TABLE IF NOT EXISTS photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siret VARCHAR(14) NOT NULL, -- SIRET de l'établissement
    product_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    product_type ENUM('fresh', 'frozen', 'long_conservation') NOT NULL,
    capture_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    file_path VARCHAR(255) NOT NULL, -- Chemin vers le fichier sur le stockage (Firebase Storage URL ou chemin local)
    uploader_id INT NOT NULL, -- L'ID de l'utilisateur qui a uploadé la photo
    uploader_role VARCHAR(50) NOT NULL, -- Le rôle de l'utilisateur qui a uploadé
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_siret_photos FOREIGN KEY (siret) REFERENCES users(siret) ON DELETE CASCADE,
    CONSTRAINT fk_uploader_id FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
);

-- NOUVELLE TABLE: alerts
CREATE TABLE alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(14) NOT NULL, -- SIRET du client/établissement concerné par l'alerte
    user_id INT NULL, -- L'ID de l'utilisateur spécifique (employé) si l'alerte est pour lui, NULL si générale pour le client
    message TEXT NOT NULL, -- Le contenu de l'alerte
    type VARCHAR(50) NOT NULL DEFAULT 'info', -- Ex: 'info', 'warning', 'critical'
    status VARCHAR(50) NOT NULL DEFAULT 'new', -- Ex: 'new', 'read'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Clés étrangères pour l'intégrité
    FOREIGN KEY (client_id) REFERENCES users(siret) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_alert_client_id (client_id),
    INDEX idx_alert_user_id (user_id)
);

-- NOUVELLE TABLE: traceability_records
CREATE TABLE traceability_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siret VARCHAR(14) NOT NULL, -- SIRET de l'établissement concerné
    employee_id INT NOT NULL, -- L'ID de l'employé qui a créé cet enregistrement
    image_url VARCHAR(255) NOT NULL, -- URL de l'image stockée (ex: Firebase Storage URL)
    designation VARCHAR(255) NOT NULL,
    quantity_value DECIMAL(10, 2) NOT NULL,
    quantity_unit VARCHAR(50) NOT NULL, -- 'gramme', 'kilo', 'litre', 'millilitre', 'unite'
    capture_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date et heure de la prise de photo/enregistrement
    date_transformation DATETIME NULL, -- Date et heure de transformation (peut être NULL)
    date_limite_consommation DATE NOT NULL, -- Date limite de consommation (DLC)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Clés étrangères pour l'intégrité
    FOREIGN KEY (siret) REFERENCES users(siret) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_trace_siret (siret),
    INDEX idx_trace_employee_id (employee_id)
);


-- Add some initial data
INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, password_hash, role) VALUES
('SuperCorp', 'Admin', 'Super', 'superadmin@example.com', '$2a$10$w82eTzI5r7t8n9t7X5q.J.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g', 'super_admin');
-- Password for superadmin@example.com is 'SuperAdmin123!' (hashed with bcrypt)

-- GRANT permissions to rootttest user from any host
GRANT ALL PRIVILEGES ON hygieneresto_db.* TO 'rootttest'@'%';
FLUSH PRIVILEGES;

-- Vous pouvez décommenter et ajouter des exemples d'Admin Client et d'Employé ici si vous le souhaitez
-- INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, siret, password_hash, role) VALUES
-- ('La Bonne Bouffe SARL', 'Martin', 'Paul', 'adminclient@example.com', '12345678901234', '$2a$10$HASHED_PASSWORD_HERE', 'admin_client');

-- INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, password_hash, role, admin_client_siret) VALUES
-- ('La Bonne Bouffe SARL', 'Durand', 'Sophie', 'employer@example.com', '$2a$10$HASHED_PASSWORD_HERE', 'employer', '12345678901234');











-- -- database/init.sql

-- -- Drop tables if they exist to ensure a clean start
-- DROP TABLE IF EXISTS temperature_records;
-- DROP TABLE IF EXISTS equipments;
-- DROP TABLE IF EXISTS users;
-- DROP TABLE IF EXISTS photos;

-- -- Create users table
-- CREATE TABLE users (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     nom_entreprise VARCHAR(255) NOT NULL,
--     nom_client VARCHAR(255) NOT NULL,
--     prenom_client VARCHAR(255) NOT NULL,
--     email VARCHAR(255) NOT NULL UNIQUE,
--     telephone VARCHAR(20),
--     adresse VARCHAR(255),
--     siret VARCHAR(14) UNIQUE,
--     password_hash VARCHAR(255) NOT NULL,
--     role ENUM('super_admin', 'admin_client', 'employer') NOT NULL DEFAULT 'employer',
--     admin_client_siret VARCHAR(14) NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     INDEX idx_admin_client_siret (admin_client_siret)
-- );

-- -- Create equipments table
-- CREATE TABLE IF NOT EXISTS equipments (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     admin_client_id INT NOT NULL,
--     name VARCHAR(255) NOT NULL,
--     type VARCHAR(100) NOT NULL,
--     temperature_type ENUM('positive', 'negative') NOT NULL,
--     min_temp DECIMAL(5, 2),
--     max_temp DECIMAL(5, 2),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     FOREIGN KEY (admin_client_id) REFERENCES users(id) ON DELETE CASCADE
-- );

-- -- Create temperature_records table
-- CREATE TABLE temperature_records (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     user_id INT NOT NULL,
--     siret_etablissement VARCHAR(14) NOT NULL,
--     type VARCHAR(255) NOT NULL,
--     location VARCHAR(255) NOT NULL,
--     temperature DECIMAL(5,2) NOT NULL,
--     timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     temperature_type ENUM('positive', 'negative') NOT NULL DEFAULT 'positive',
--     notes TEXT,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     CONSTRAINT fk_temp_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
--     INDEX idx_siret_etablissement (siret_etablissement)
-- );

-- CREATE TABLE IF NOT EXISTS photos (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     siret VARCHAR(14) NOT NULL,
--     product_name VARCHAR(255) NOT NULL,
--     quantity DECIMAL(10, 2) NOT NULL,
--     product_type ENUM('fresh', 'frozen', 'long_conservation') NOT NULL,
--     capture_date DATETIME DEFAULT CURRENT_TIMESTAMP,
--     file_path VARCHAR(255) NOT NULL,
--     uploader_id INT NOT NULL,
--     uploader_role VARCHAR(50) NOT NULL,
--     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     CONSTRAINT fk_siret_photos FOREIGN KEY (siret) REFERENCES users(siret) ON DELETE CASCADE,
--     CONSTRAINT fk_uploader_id FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
-- );

-- -- Add some initial data
-- INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, password_hash, role) VALUES
-- ('SuperCorp', 'Admin', 'Super', 'superadmin@example.com', '$2a$10$w82eTzI5r7t8n9t7X5q.J.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g', 'super_admin');

-- -- GRANT permissions to rootttest user from any host

-- -- Ceci est crucial pour permettre la connexion depuis d'autres conteneurs Docker

-- GRANT ALL PRIVILEGES ON hygieneresto_db.* TO 'rootttest'@'%';

-- FLUSH PRIVILEGES;


-- -- GRANT ALL PRIVILEGES ON hygieneresto_db.* TO 'rootttest'@'%' IDENTIFIED BY '${PASSWORD}';
-- -- FLUSH PRIVILEGES;

-- -- Exemple d'Admin Client (avec un SIRET)
-- -- INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, siret, password_hash, role) VALUES
-- -- ('La Bonne Bouffe SARL', 'Martin', 'Paul', 'adminclient@example.com', '12345678901234', '$2a$10$HASHED_PASSWORD_HERE', 'admin_client');

-- -- Exemple d'Employé (rattaché à un Admin Client via son SIRET)
-- -- INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, password_hash, role, admin_client_siret) VALUES
-- -- ('La Bonne Bouffe SARL', 'Durand', 'Sophie', 'employer@example.com', '$2a$10$HASHED_PASSWORD_HERE', 'employer', '12345678901234');









-- -- database/init.sql

-- -- Drop tables if they exist to ensure a clean start
-- DROP TABLE IF EXISTS temperature_records;
-- DROP TABLE IF EXISTS users;

-- -- Create users table
-- -- Le champ `admin_client_id` stockera le SIRET de l'admin_client pour les rôles 'employer'.
-- -- Le champ `siret` de l'utilisateur lui-même est son propre SIRET (pour les admin_clients).
-- CREATE TABLE users (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     nom_entreprise VARCHAR(255) NOT NULL,
--     nom_client VARCHAR(255) NOT NULL,
--     prenom_client VARCHAR(255) NOT NULL,
--     email VARCHAR(255) NOT NULL UNIQUE,
--     telephone VARCHAR(20),
--     adresse VARCHAR(255),
--     siret VARCHAR(14) UNIQUE, -- SIRET de l'entreprise de cet utilisateur (pour admin_client)
--     password_hash VARCHAR(255) NOT NULL,
--     -- Le rôle 'client' est renommé en 'employer'
--     role ENUM('super_admin', 'admin_client', 'employer') NOT NULL DEFAULT 'employer',
--     -- admin_client_siret stockera le SIRET de l'admin_client auquel l'employé est rattaché
--     admin_client_siret VARCHAR(14) NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     -- La clé étrangère pointe maintenant vers le SIRET de l'admin_client dans la même table users
--     -- Note: Une clé étrangère sur une colonne non-clé primaire nécessite un index sur cette colonne
--     -- Nous n'ajouterons pas de contrainte FOREIGN KEY directe ici pour éviter des complications avec les SIRET NULL
--     -- La logique de validation sera gérée au niveau de l'application (backend)
--     INDEX idx_admin_client_siret (admin_client_siret)
-- );

-- -- Create temperature_records table
-- -- Les relevés de température seront également liés au SIRET de l'établissement
-- CREATE TABLE temperature_records (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     user_id INT NOT NULL, -- L'ID de l'utilisateur (employé) qui a enregistré ce relevé
--     siret_etablissement VARCHAR(14) NOT NULL, -- Le SIRET de l'établissement concerné par ce relevé
--     type VARCHAR(255) NOT NULL, -- e.g., 'frigo-positif', 'livraison'
--     location VARCHAR(255) NOT NULL, -- e.g., 'Réfrigérateur 1', 'Zone de réception'
--     temperature DECIMAL(5,2) NOT NULL, -- Temperature in Celsius, e.g., -18.50
--     timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     notes TEXT,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     CONSTRAINT fk_temp_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
--     -- Ajout d'une clé étrangère sur le SIRET de l'établissement
--     -- La logique de validation sera gérée au niveau de l'application (backend)
--     INDEX idx_siret_etablissement (siret_etablissement)
-- );

-- -- Add some initial data
-- -- Super Admin
-- INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, password_hash, role) VALUES
-- ('SuperCorp', 'Admin', 'Super', 'superadmin@example.com', '$2a$10$w82eTzI5r7t8n9t7X5q.J.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g.g', 'super_admin');
-- -- Password for superadmin@example.com is 'SuperAdmin123!' (hashed with bcrypt)

-- -- GRANT permissions to rootttest user from any host
-- -- Ceci est crucial pour permettre la connexion depuis d'autres conteneurs Docker
-- GRANT ALL PRIVILEGES ON hygieneresto_db.* TO 'rootttest'@'%' IDENTIFIED BY '${PASSWORD}';
-- FLUSH PRIVILEGES;

-- -- Exemple d'Admin Client (avec un SIRET)
-- -- INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, siret, password_hash, role) VALUES
-- -- ('La Bonne Bouffe SARL', 'Martin', 'Paul', 'adminclient@example.com', '12345678901234', '$2a$10$HASHED_PASSWORD_HERE', 'admin_client');

-- -- Exemple d'Employé (rattaché à un Admin Client via son SIRET)
-- -- INSERT INTO users (nom_entreprise, nom_client, prenom_client, email, password_hash, role, admin_client_siret) VALUES
-- -- ('La Bonne Bouffe SARL', 'Durand', 'Sophie', 'employer@example.com', '$2a$10$HASHED_PASSWORD_HERE', 'employer', '12345678901234');
