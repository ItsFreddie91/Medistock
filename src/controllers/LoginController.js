    const conexion = require('../conexion/conexion');
    const bcrypt = require('bcrypt');
    
    function mostrarLogin(req, res) {
        res.render('login/index');
    }
    
    function registro(req, res) {
        res.render('login/registro');
    }
    
    function formulario(req, res) {
        const { nombre, apellido_paterno, apellido_materno, usuario, contrasena } = req.body;
    
        conexion.beginTransaction(err => {
            if (err) throw err;
    
            // Comprobar si el usuario ya existe
            conexion.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario], (err, results) => {
                if (err) {
                    return conexion.rollback(() => {
                        throw err;
                    });
                }
    
                if (results.length > 0) {
                    res.render('login/registro', { message: 'El usuario ya está creado. Por favor, elige otro nombre de usuario.' });
                } else {
                    // Encriptar la contraseña antes de la inserción
                    bcrypt.hash(contrasena, 12, (err, hashedPassword) => {
                        if (err) {
                            return conexion.rollback(() => {
                                throw err;
                            });
                        }
    
                        // Insertar todos los datos en una sola consulta
                        conexion.query(
                            'INSERT INTO usuarios (nombre, apellido_paterno, apellido_materno, usuario, contrasena) VALUES (?, ?, ?, ?, ?)', 
                            [nombre, apellido_paterno, apellido_materno, usuario, hashedPassword], 
                            (err, result) => {
                                if (err) {
                                    return conexion.rollback(() => {
                                        throw err;
                                    });
                                }
    
                                // Confirmar la transacción si todo está correcto
                                conexion.commit(err => {
                                    if (err) {
                                        return conexion.rollback(() => {
                                            throw err;
                                        });
                                    }
                                    res.render('login/registro', { message: 'Usuario registrado exitosamente.' });
                                });
                            }
                        );
                    });
                }
            });
        });
    }
    

    // autenticación de usuarios
    function autenticarUsuario(req, res) {
        const { usuario, contrasena } = req.body;

        if (usuario === 'admin' && contrasena === 'admin') {
            res.redirect('/menu_admin/inicio_admin');
        } else {
            conexion.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario], (err, results) => {
                if (err) {
                    return res.render('login/index', { message: 'Hubo un error en el servidor. Inténtalo nuevamente.' });
                }
    
                if (results.length === 0) {
                    return res.render('login/index', { message: 'Contraseña Inorrecta, Intentalo de Nuevo' });
                }
    
                const user = results[0];
    
                // Compara la contraseña ingresada con la contraseña en la base de datos
                bcrypt.compare(contrasena, user.contrasena, (err, isMatch) => {
                    if (err) {
                        return res.render('login/index', { message: 'Hubo un error en el servidor. Inténtalo nuevamente.' });
                    }
    
                    if (isMatch) {
                        res.redirect('/menu/inicio'); 
                    } else {
                        res.render('login/index', { message: 'Contraseña incorrecta. Inténtalo nuevamente.' });
                    }
                });
            });
        }
    }
    
    module.exports = {
        mostrarLogin,
        registro,
        formulario,
        autenticarUsuario
    };