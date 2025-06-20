const mysql = require('mysql2');

const db_config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT),
};

let conexion;

function handleDisconnect() {
    conexion = mysql.createConnection(db_config);

    conexion.connect((err) => {
        if (err) {
            console.error('Error al conectar con la base de datos:', err);
            setTimeout(handleDisconnect, 2000); // Reintenta después de 2 segundos
        } else {
            console.log('Conectado a la base de datos MySQL 🚀');
        }
    });

    conexion.on('error', (err) => {
        console.error('Error de conexión:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        } else {
            throw err;
        }
    });
}

handleDisconnect();

module.exports = conexion;