const mysql = require('mysql');
require('dotenv').config(); // Importante para usar variables de entorno

const conexion = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT, 
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

conexion.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err.stack);
        return;
    }
    console.log('BASE DE DATOS CONECTADA');
});

module.exports = conexion;
