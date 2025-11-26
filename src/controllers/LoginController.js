const conexion = require('../conexion/conexion');
const bcrypt = require('bcrypt');

function mostrarLogin(req, res) {
    res.render('login/index');
}

function autenticarUsuario(req, res) {
    const { usuario, contrasena } = req.body;

    // 🟦 Login del administrador fijo
    if (usuario === 'admin' && contrasena === 'admin') {
        req.session.usuarioId = 1;
        req.session.usuarioNombre = 'Administrador';
        req.session.tipoUsuario = 'admin';
        return res.redirect('/menu_admin/inicio_admin');
    }

    // 🟩 PRIMERO: buscar solo usuarios ACTIVOS
    conexion.query(
        "SELECT * FROM usuarios WHERE usuario = ? AND activo = 1 LIMIT 1",
        [usuario],
        (err, activos) => {

            if (err) {
                return res.render('login/index', { message: 'Error en el servidor. Inténtalo nuevamente.' });
            }

            // 🟢 SI EXISTE UN ACTIVO → iniciar sesión con ese
            if (activos.length > 0) {
                const user = activos[0];

                bcrypt.compare(contrasena, user.contrasena, (err, isMatch) => {
                    if (err) {
                        return res.render('login/index', { message: 'Error en el servidor.' });
                    }

                    if (!isMatch) {
                        return res.render('login/index', { message: 'Contraseña incorrecta.' });
                    }

                    // LOGIN OK
                    req.session.usuarioId = user.id_usuario;
                    req.session.usuarioNombre = user.nombre;
                    req.session.tipoUsuario = 'vendedor';
                    return res.redirect('/menu/inicio');
                });

                return;
            }

            // 🟥 SI NO HAY ACTIVO → buscar si existe DESACTIVADO
            conexion.query(
                "SELECT * FROM usuarios WHERE usuario = ? AND activo = 0 LIMIT 1",
                [usuario],
                (err2, desactivados) => {

                    if (err2) {
                        return res.render('login/index', { message: 'Error en el servidor.' });
                    }

                    if (desactivados.length > 0) {
                        return res.render('login/index', {
                            message: 'Este usuario no existe. Inténtalo nuevamente.'
                        });
                    }

                    // ❌ SI NO EXISTE NINGÚN REGISTRO
                    return res.render('login/index', { message: 'Este usuario no existe.' });
                }
            );
        }
    );
}

module.exports = {
    mostrarLogin,
    autenticarUsuario
};
