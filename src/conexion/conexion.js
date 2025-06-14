const mysql = require('mysql2'); // <--- usa mysql2
require('dotenv').config();

const conexion = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

conexion.connect((err) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err.stack);
        return;
    }
    console.log('✅ BASE DE DATOS CONECTADA');
});

module.exports = conexion;
