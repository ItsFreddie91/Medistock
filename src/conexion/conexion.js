const mysql = require('mysql2');

const db_config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT),
};

let conexion;

// Función para configurar campos activo
function configurarCamposActivo() {
    const tablas = [
        { nombre: 'usuarios', query: 'ALTER TABLE usuarios ADD COLUMN activo TINYINT(1) DEFAULT 1' },
        { nombre: 'clientes', query: 'ALTER TABLE clientes ADD COLUMN activo TINYINT(1) DEFAULT 1' },
        { nombre: 'medicamentos', query: 'ALTER TABLE medicamentos ADD COLUMN activo TINYINT(1) DEFAULT 1' }
    ];

    console.log('🔧 Configurando campos "activo" en tablas...');

    tablas.forEach((tabla) => {
        conexion.query(tabla.query, (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`✅ "${tabla.nombre}": Campo "activo" ya existe`);
                } else {
                    console.log(`ℹ️ "${tabla.nombre}": ${err.message}`);
                }
            } else {
                console.log(`✅ "${tabla.nombre}": Campo "activo" agregado`);
            }
        });
    });
}

function handleDisconnect() {
    conexion = mysql.createConnection(db_config);

    conexion.connect((err) => {
        if (err) {
            console.error('Error al conectar con la base de datos:', err);
            setTimeout(handleDisconnect, 2000);
        } else {
            console.log('Conectado a la base de datos MySQL 🚀');
            // Llamar a la configuración después de conectar
            configurarCamposActivo();
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



// const mysql = require('mysql2');
// const conexion = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'centro'
// });

// conexion.connect((err) => {
//     if (err) {
//         console.error('Error conectando a la base de datos:', err.stack);
//         return;
//     }
//     console.log('BASE DE DATOS CONECTADA');
// });

// module.exports = conexion;