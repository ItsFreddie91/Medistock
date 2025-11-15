const conexion = require('../conexion/conexion');
const bcrypt = require('bcrypt');

function mostrarLogin(req, res) {
    res.render('login/index');
}

function autenticarUsuario(req, res) {
    const { usuario, contrasena } = req.body;

    // Autenticación del administrador (usuario fijo)
    if (usuario === 'admin' && contrasena === 'admin') {
        req.session.usuarioId = 1;  // id fijo para el administrador
        req.session.usuarioNombre = 'Administrador';  // Nombre del administrador
        req.session.tipoUsuario = 'admin';  // Tipo de usuario: admin
        console.log('Administrador autenticado, usuarioId: 1');
        return res.redirect('/menu_admin/inicio_admin');
    }
    
    // Autenticación para otros usuarios (vendedores)
    conexion.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario], (err, results) => {
        if (err) {
            return res.render('login/index', { message: 'Hubo un error en el servidor. Inténtalo nuevamente.' });
        }

        if (results.length === 0) {
            return res.render('login/index', { message: 'Este Usuario no Existe, Inténtalo de Nuevo.' });
        }

        const user = results[0];

        // Comparar la contraseña proporcionada con la almacenada en la base de datos
        bcrypt.compare(contrasena, user.contrasena, (err, isMatch) => {
            if (err) {
                console.log("Error en bcrypt compare:", err);
                return res.render('login/index', { message: 'Hubo un error en el servidor. Inténtalo nuevamente.' });
            }

            console.log("Resultado de comparación:", isMatch);

            if (isMatch) {
                req.session.usuarioId = user.id_usuario;  // id_usuario dinámico
                req.session.usuarioNombre = user.nombre;  // Nombre del vendedor
                req.session.tipoUsuario = 'vendedor';  // Tipo de usuario: vendedor
                console.log('Usuario autenticado, usuarioId:', user.id_usuario);
                return res.redirect('/menu/inicio');  // Redirige a la vista del vendedor
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
