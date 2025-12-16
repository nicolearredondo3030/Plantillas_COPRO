-- Crear base de datos
CREATE DATABASE IF NOT EXISTS plantillas_db;
USE plantillas_db;

-- Tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(120) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('admin','empleado','cliente') NOT NULL DEFAULT 'cliente'
);

-- Tabla plantillas
CREATE TABLE IF NOT EXISTS plantillas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  talla ENUM('S', 'M', 'L') NOT NULL,
  estado ENUM('disponible', 'agotado') NOT NULL DEFAULT 'disponible',
  precio DECIMAL(10,2) NOT NULL DEFAULT 400.00
);

-- Tabla carrito
CREATE TABLE IF NOT EXISTS carrito (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  producto_id INT NOT NULL,
  nombre VARCHAR(100),
  talla VARCHAR(10),
  cantidad INT DEFAULT 1,
  precio DECIMAL(10,2),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (producto_id) REFERENCES plantillas(id)
);

-- Tabla historial
CREATE TABLE IF NOT EXISTS historial (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  producto_id INT NOT NULL,
  nombre VARCHAR(100),
  talla VARCHAR(10),
  cantidad INT,
  precio DECIMAL(10,2),
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (producto_id) REFERENCES plantillas(id)
);
