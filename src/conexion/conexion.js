// src/conexion/conexion.js
const mysql = require('mysql2');

const db_config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

let conexion;

function handleDisconnect() {
    conexion = mysql.createConnection(db_config);

    conexion.connect((err) => {
        if (err) {
            console.error('Error al conectar con la base de datos:', err);
            setTimeout(handleDisconnect, 2000); // Reintenta en 2s
        } else {
            console.log('Conectado a la base de datos');
        }
    });

    conexion.on('error', function (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.warn('Conexión perdida. Reintentando...');
            handleDisconnect();
        } else {
            throw err;
        }
    });
}

handleDisconnect();

module.exports = conexion;
