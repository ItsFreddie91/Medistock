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
    
    // 🟩 Login para usuarios de la BD
    conexion.query(
        'SELECT * FROM usuarios WHERE usuario = ? LIMIT 1',
        [usuario],
        (err, results) => {

            if (err) {
                return res.render('login/index', { message: 'Error en el servidor. Inténtalo nuevamente.' });
            }

            // Usuario NO existe
            if (results.length === 0) {
                return res.render('login/index', { message: 'Este usuario no existe.' });
            }

            const user = results[0];

            // 🔴 Usuario DESACTIVADO → NO permitir login
            if (Number(user.activo) === 0) {
                return res.render('login/index', { 
                    message: 'Este usuario está eliminado o desactivado.' 
                });
            }

            // Comparar contraseña
            bcrypt.compare(contrasena, user.contrasena, (err, isMatch) => {
                if (err) {
                    return res.render('login/index', { message: 'Error en el servidor.' });
                }

                if (!isMatch) {
                    return res.render('login/index', { message: 'Contraseña incorrecta.' });
                }

                // 🟢 Login correcto
                req.session.usuarioId = user.id_usuario;
                req.session.usuarioNombre = user.nombre;
                req.session.tipoUsuario = 'vendedor';

                return res.redirect('/menu/inicio');
            });
        }
    );
}

module.exports = {
    mostrarLogin,
    autenticarUsuario
};
