const conexion = require('../conexion/conexion');
const bcrypt = require('bcrypt');

function mostrarLogin(req, res) {
    res.render('login/index');
}

function autenticarUsuario(req, res) {
    const { usuario, contrasena } = req.body;

    // Autenticación del administrador (usuario fijo)
    if (usuario === 'admin' && contrasena === 'admin') {
        req.session.usuarioId = 1;
        req.session.usuarioNombre = 'Administrador';
        req.session.tipoUsuario = 'admin';
        return res.redirect('/menu_admin/inicio_admin');
    }
    
    // Autenticación para otros usuarios
    conexion.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario], (err, results) => {
        if (err) {
            return res.render('login/index', { message: 'Hubo un error en el servidor. Inténtalo nuevamente.' });
        }

        // Usuario no existe
        if (results.length === 0) {
            return res.render('login/index', { message: 'Este Usuario no Existe, Inténtalo de Nuevo.' });
        }

        const user = results[0];

        // ⚠️ USUARIO DESACTIVADO → NO DEJAR INICIAR SESIÓN
        if (user.activo === 0) {
            return res.render('login/index', { message: 'Usuario no Existe, Inténtalo nuevamente.' });
        }


        // Comparar contraseña
        bcrypt.compare(contrasena, user.contrasena, (err, isMatch) => {
            if (err) {
                return res.render('login/index', { message: 'Hubo un error en el servidor. Inténtalo nuevamente.' });
            }

            if (isMatch) {
                req.session.usuarioId = user.id_usuario;
                req.session.usuarioNombre = user.nombre;
                req.session.tipoUsuario = 'vendedor';
                return res.redirect('/menu/inicio');
            } else {
                return res.render('login/index', { message: 'Contraseña incorrecta. Inténtalo nuevamente.' });
            }
        });
    });
}

module.exports = {
    mostrarLogin,
    autenticarUsuario
};
