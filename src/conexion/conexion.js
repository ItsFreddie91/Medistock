// =====================================
// ARCHIVO DE CONEXIÓN COMPLETO Y FINAL
// =====================================
const mysql = require('mysql2');

const db_config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT),
};

let conexion;

// ---------------------------------------
// AGREGAR CAMPOS "activo" SI NO EXISTEN
// ---------------------------------------
function configurarCamposActivo() {
    const tablas = [
        { nombre: 'usuarios', query: 'ALTER TABLE usuarios ADD COLUMN activo TINYINT(1) DEFAULT 1' },
        { nombre: 'clientes', query: 'ALTER TABLE clientes ADD COLUMN activo TINYINT(1) DEFAULT 1' },
        { nombre: 'medicamentos', query: 'ALTER TABLE medicamentos ADD COLUMN activo TINYINT(1) DEFAULT 1' },
        { nombre: 'proveedores', query: 'ALTER TABLE proveedores ADD COLUMN activo TINYINT(1) DEFAULT 1' }
    ];

    console.log('🔧 Verificando campos "activo"...');

    tablas.forEach((tabla) => {
        conexion.query(tabla.query, (err) => {
            if (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`✔️ ${tabla.nombre} | Campo "activo" ya existe`);
                } else {
                    console.log(`⚠️ ${tabla.nombre} | ${err.message}`);
                }
            } else {
                console.log(`🆕 ${tabla.nombre} | Campo "activo" agregado`);
            }
        });
    });
}

// ---------------------------------------
// QUITAR ÍNDICE UNIQUE DE usuarios.usuario
// ---------------------------------------
function quitarUniqueUsuarios() {
    const sqlBuscar = `
        SHOW INDEX FROM usuarios 
        WHERE Column_name = 'usuario' AND Non_unique = 0
    `;

    conexion.query(sqlBuscar, (err, results) => {
        if (err) {
            console.log("⚠️ Error al buscar índice UNIQUE:", err.message);
            return;
        }

        if (results.length === 0) {
            console.log("✔️ No existe índice UNIQUE en usuarios.usuario");
            return;
        }

        const nombreIndice = results[0].Key_name;
        const sqlEliminar = `ALTER TABLE usuarios DROP INDEX \`${nombreIndice}\``;

        conexion.query(sqlEliminar, (err2) => {
            if (err2) {
                console.log("⚠️ Error al eliminar índice UNIQUE:", err2.message);
            } else {
                console.log(`🗑️ Índice UNIQUE eliminado: ${nombreIndice}`);
            }
        });
    });
}

// ---------------------------------------
// RECONECTAR AUTOMÁTICAMENTE
// ---------------------------------------
function handleDisconnect() {
    conexion = mysql.createConnection(db_config);

    conexion.connect((err) => {
        if (err) {
            console.error('❌ Error al conectar a MySQL:', err);
            setTimeout(handleDisconnect, 2000);
        } else {
            console.log('✅ Conectado a MySQL 🚀');

            configurarCamposActivo();   // Crea campo activo si no existe
            quitarUniqueUsuarios();     // Elimina índice UNIQUE del username
        }
    });

    conexion.on('error', (err) => {
        console.error('⚠️ Error MySQL:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        } else {
            throw err;
        }
    });
}

handleDisconnect();

module.exports = conexion;
