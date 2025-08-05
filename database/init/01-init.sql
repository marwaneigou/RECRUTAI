-- Initialize RecrutIA database
CREATE DATABASE IF NOT EXISTS recrutia;

-- Create user for the application
CREATE USER IF NOT EXISTS 'recrutia_user'@'%' IDENTIFIED BY 'recrutia_password';
GRANT ALL PRIVILEGES ON recrutia.* TO 'recrutia_user'@'%';
FLUSH PRIVILEGES;

-- Use the database
\c recrutia;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
