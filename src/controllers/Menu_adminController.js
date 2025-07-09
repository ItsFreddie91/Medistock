const conexion = require('../conexion/conexion'); 
const bcrypt = require('bcrypt');
const PDFDocument = require('pdfkit');

function inicio_admin(req, res) {
    const queryMedicamentosProximos = `
        SELECT nombre, fecha_caducidad 
        FROM medicamentos 
        WHERE fecha_caducidad BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    `;
    
    const queryMedicamentosAgotarse = `
        SELECT * FROM medicamentos WHERE cantidad > 0 AND cantidad <= 5;

    `;

    conexion.query(queryMedicamentosProximos, (err, medicamentosProximos) => {
        if (err) {
            console.error("Error al obtener medicamentos próximos a caducar:", err);
            return res.status(500).send("Error al obtener datos de medicamentos próximos a caducar");
        }

        conexion.query(queryMedicamentosAgotarse, (err, medicamentosAgotarse) => {
            if (err) {
                console.error("Error al obtener medicamentos próximos a agotarse:", err);
                return res.status(500).send("Error al obtener datos de medicamentos próximos a agotarse");
            }

            const mensajesProximos = medicamentosProximos.map(
                med => `El medicamento ${med.nombre} caduca el ${new Date(med.fecha_caducidad).toLocaleDateString()}.`
            );

            const mensajesAgotarse = medicamentosAgotarse.map(
                med => `El medicamento ${med.nombre} tiene una cantidad baja (${med.cantidad} unidades).`
            );

            res.render('menu_admin/inicio_admin', {
                mensajesProximos: JSON.stringify(mensajesProximos),
                mensajesAgotarse: JSON.stringify(mensajesAgotarse)
            });
        });
    });
}









function vista_medicamentos(req, res) {
    // Obtener proveedores
    const queryProveedores = 'SELECT id_proveedores, nombre FROM proveedores';

    // Obtener medicamentos próximos a caducar
    const queryMedicamentosProximos = `
        SELECT nombre, fecha_caducidad 
        FROM medicamentos 
        WHERE fecha_caducidad BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    `;

    conexion.query(queryProveedores, (err, proveedores) => {
        if (err) {
            console.error('Error al obtener los proveedores:', err);
            return res.status(500).send('Error al obtener los proveedores');
        }

        conexion.query(queryMedicamentosProximos, (err, medicamentosProximos) => {
            if (err) {
                console.error('Error al obtener medicamentos próximos a caducar:', err);
                return res.status(500).send('Error al obtener los medicamentos próximos a caducar');
            }
            // Datos simulados para probar

    
            // Renderizar la vista pasando tanto proveedores como medicamentosProximos
            res.render('menu_admin/medicamentos_admin', { proveedores: proveedores, medicamentosProximos: medicamentosProximos });
        });
    });
}


//////////////////////////////////////////////////////////////////////////////////////////

function insertarMedicamento(req, res) {
    console.log(req.body); // Verifica los datos recibidos

    const { nombre, cantidad, precio, fecha_caducidad, presentation_id, controlado_id, proveedores_id } = req.body;

    if (!nombre || !cantidad || !precio || !fecha_caducidad || !presentation_id || !controlado_id || !proveedores_id) {
        return res.status(400).send('Por favor, completa todos los campos.');
    }

    const query = `
        INSERT INTO medicamentos 
        (nombre, cantidad, precio, fecha_caducidad, presentation_id, controlado_id, proveedores_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    conexion.query(
        query,
        [nombre, cantidad, precio, fecha_caducidad, presentation_id, controlado_id, proveedores_id],
        (err, result) => {
            if (err) {
                console.error('Error al insertar medicamento:', err);
                return res.status(500).send('Hubo un error al guardar el medicamento.');
            }

            res.redirect('/menu_admin/medicamentos_admin');
        }
    );
}


///////////////////////////////////////////////////////////////////////

// RENDERIZA A LA PAGINA DE PROVEEDORES
function vista_proveedores(req, res) {
    res.render('menu_admin/proveedores_admin');
}

//PARA AGRAGR UN NUEVO PROVEEDOR
function post_proveedores(req, res) {
    const { nombre, direccion, telefono, correo } = req.body;
    conexion.beginTransaction(err => {
        if (err) throw err;
        conexion.query('SELECT * FROM proveedores WHERE nombre = ?', [nombre], (err, results) => {
            if (err) {
                return conexion.rollback(() => {
                    throw err;
                });
            }
            if (results.length > 0) {
                res.render('menu_admin/proveedores_admin', { message: 'El proveedor ya está registrado.' });
            } else {
                conexion.query('INSERT INTO proveedores (nombre, direccion, telefono, correo) VALUES (?, ?, ?, ?)', [nombre, direccion, telefono, correo], (err, result) => {
                    if (err) {
                        return conexion.rollback(() => {
                            throw err;
                        });
                    }
                    conexion.commit(err => {
                        if (err) {
                            return conexion.rollback(() => {
                                throw err;
                            });
                        }
                        res.render('menu_admin/proveedores_admin', { message: 'Proveedor registrado exitosamente.' });
                    });
                });
            }
        });
    });
}

function administrar_proveedores (req, res){//1
  const query = 'SELECT * FROM proveedores';
  conexion.query(query, (err, results) => {
      if (err) {
          console.error('Error al obtener proveedores:', err);
          res.status(500).send('Error al obtener proveedores');
      } else {
          res.render('menu_admin/administrar_proveedores', { proveedores: results }); 
      }
  });
}

function editarProveedor(req, res) {
    const id = req.params.id_proveedores;
    const query = 'SELECT * FROM proveedores WHERE id_proveedores = ?';
    
    conexion.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener proveedor:', err);
            res.status(500).send('Error al obtener proveedor');
        } else {
            res.render('menu_admin/modificar_proveedor', { proveedor: results[0] });
        }
    });
}

// Actualizar proveedor en la base de datos
function actualizarProveedor(req, res) {
    const id = req.params.id_proveedores;
    console.log("ID del proveedor a actualizar:", id); // Línea de depuración
  
    const { nombre, direccion, telefono, correo } = req.body;
    const query = 'UPDATE proveedores SET nombre = ?, direccion = ?, telefono = ?, correo = ? WHERE id_proveedores = ?';
  
    conexion.query(query, [nombre, direccion, telefono, correo, id], (err) => {
        if (err) {
            console.error('Error al actualizar proveedor:', err);
            res.status(500).send('Error al actualizar proveedor');
        } else {
            // Después de actualizar, redirigir a la página de resultados con el nombre del proveedor
            res.redirect(`/menu_admin/buscar-proveedor?nombre=${encodeURIComponent(nombre)}`);
        }
    });
  }
  

// Eliminar proveedor
function eliminarProveedor(req, res) {
    const id_proveedores = req.params.id_proveedores; // Obtén el ID del proveedor desde los parámetros
    const nombreBuscado = req.query.nombre; // Captura el nombre buscado desde la consulta en la URL

    const query = 'DELETE FROM proveedores WHERE id_proveedores = ?';

    conexion.query(query, [id_proveedores], (err) => {
        if (err) {
            console.error('Error al eliminar el proveedor:', err);
            return res.status(500).send('Error al eliminar el proveedor');
        }

        // Redirige a la página de resultados de búsqueda usando el nombre que se buscó
        res.redirect(`/menu_admin/buscar-proveedor?nombre=${encodeURIComponent(nombreBuscado)}`);
    });
}


function buscarProveedor(req, res) {
    const nombreBuscado = req.query.nombre; // Captura el nombre buscado desde la consulta en la URL
    const query = 'SELECT * FROM proveedores WHERE nombre LIKE ?';

    conexion.query(query, [`%${nombreBuscado}%`], (err, resultados) => {
        if (err) {
            console.error('Error al buscar proveedores:', err);
            return res.status(500).send('Error al buscar proveedores');
        }

        // Renderiza la vista pasando los resultados y el nombre buscado
        res.render('menu_admin/resultadoProveedor', {
            proveedores: resultados,
            nombreBuscado // Pasa el nombre buscado a la vista
        });
    });
}








//PARA REGISTRA CLIENTES
function vista_clientes(req, res) {
    res.render('menu_admin/clientes_admin', { message: '' }); // Renderiza la vista correcta
}

function post_clientes(req, res) {
    const { receta, nombre, apellido_paterno, apellido_materno } = req.body;

    conexion.beginTransaction(err => {
        if (err) throw err;

        conexion.query(
            'INSERT INTO clientes (receta, nombre, apellido_paterno, apellido_materno) VALUES (?, ?, ?, ?)', 
            [receta, nombre, apellido_paterno, apellido_materno], 
            (err, result) => {
                if (err) {
                    return conexion.rollback(() => {
                        const message = 'Error al agregar cliente. Por favor, inténtalo de nuevo.';
                        res.send(`<script>alert("${message}"); window.location.href = '/menu_admin/clientes_admin';</script>`);
                    });
                }
        
                conexion.commit(err => {
                    if (err) {
                        return conexion.rollback(() => {
                            const message = 'Error al confirmar la transacción. Por favor, inténtalo de nuevo.';
                            res.send(`<script>alert("${message}"); window.location.href = '/menu_admin/clientes_admin';</script>`);
                        });
                    }
        
                    // Si todo sale bien, renderiza la vista correcta con el mensaje de éxito
                    const message = 'Cliente agregado exitosamente!';
                    res.send(`<script>alert("${message}"); window.location.href = '/menu_admin/clientes_admin';</script>`);
                });
            }
        );
    });
}


function buscarCliente(req, res) {
    const nombre = req.query.nombre;
    const query = 'SELECT * FROM clientes WHERE nombre LIKE ?';
    const valores = [`%${nombre}%`];

    conexion.query(query, valores, (err, resultados) => {
        if (err) {
            console.error('Error al buscar el cliente:', err);
            return res.status(500).send('Error en la búsqueda del cliente');
        }

        // Asegúrate de enviar el nombre buscado para que esté disponible en la plantilla
        res.render('menu_admin/resultadoCliente', { clientes: resultados, nombreBuscado: nombre });
    });
}

// Mostrar formulario de edición
function mostrarFormularioEdicion(req, res) {
    const idCliente = req.params.id_clientes;
    const query = 'SELECT * FROM clientes WHERE id_clientes = ?';

    conexion.query(query, [idCliente], (err, resultados) => {
        if (err) {
            console.error('Error al buscar el cliente:', err);
            return res.status(500).send('Error al cargar el cliente para edición');
        }

        if (resultados.length > 0) {
            res.render('menu_admin/editarcliente_buscar', { cliente: resultados[0] });
        } else {
            res.status(404).send('Cliente no encontrado');
        }
    });
}

// Actualizar cliente
// Actualizar cliente
function actualizarCliente(req, res) {
    const idCliente = req.params.id_clientes;
    const { nombre, apellido_paterno, apellido_materno, receta } = req.body;
    const query = 'UPDATE clientes SET nombre = ?, apellido_paterno = ?, apellido_materno = ?, receta = ? WHERE id_clientes = ?';

    conexion.query(query, [nombre, apellido_paterno, apellido_materno, receta, idCliente], (err) => {
        if (err) {
            console.error('Error al actualizar el cliente:', err);
            return res.status(500).send('Error al actualizar el cliente');
        }

        // Redirige a la página de resultados con los datos del cliente actualizado
        res.redirect(`/menu_admin/resultadoCliente/${idCliente}`);
    });
}

// Mostrar cliente actualizado
function mostrarClienteActualizado(req, res) {
    const idCliente = req.params.id_clientes;
    const query = 'SELECT * FROM clientes WHERE id_clientes = ?';

    conexion.query(query, [idCliente], (err, resultados) => {
        if (err) {
            console.error('Error al obtener el cliente actualizado:', err);
            return res.status(500).send('Error al cargar el cliente actualizado');
        }

        if (resultados.length > 0) {
            // Pasar el nombre del cliente buscado como variable
            res.render('menu_admin/resultadoCliente', {
                clientes: resultados,
                nombreBuscado: resultados[0].nombre // Usa el nombre del cliente actualizado
            });
        } else {
            res.status(404).send('Cliente no encontrado');
        }
    });
}

function eliminarCliente(req, res) {
    const id_clientes = req.params.id_clientes; // Obtén el ID del cliente desde los parámetros
    const nombreBuscado = req.query.nombre; // Captura el nombre buscado desde la consulta en la URL

    const query = 'DELETE FROM clientes WHERE id_clientes = ?';

    conexion.query(query, [id_clientes], (err) => {
        if (err) {
            console.error('Error al eliminar el cliente:', err);
            return res.status(500).send('Error al eliminar el cliente');
        }

        // Redirige a la página de resultados de búsqueda usando el nombre que se buscó
        res.redirect(`/menu_admin/buscar-cliente?nombre=${encodeURIComponent(nombreBuscado)}`);
    });
}






//MUESRA LA TABLA DE MEDICAMENTOS
function vista_datos_medicamentos(req, res) {
    const cantidad = parseInt(req.query.cantidad, 10); // Captura la cantidad desde la URL

    // Construir la consulta con o sin límite dependiendo de si se especificó una cantidad válida
    const query = cantidad
        ? `SELECT 
             m.id_medicamentos,
             m.nombre,
             m.cantidad,
             m.precio,
             m.fecha_caducidad,
             p.presentacion AS nombre_presentacion,
             c.controlado AS nombre_controlado,
             IF(m.proveedores_id IS NULL, 'Proveedor eliminado', pr.nombre) AS nombre_proveedor
           FROM 
             Medicamentos m
           JOIN 
             presentacion p ON m.presentation_id = p.id_presentacion
           JOIN 
             controlado c ON m.controlado_id = c.id_controlado
           LEFT JOIN 
             proveedores pr ON m.proveedores_id = pr.id_proveedores
           ORDER BY 
             m.id_medicamentos DESC
           LIMIT ?`
        : `SELECT 
             m.id_medicamentos,
             m.nombre,
             m.cantidad,
             m.precio,
             m.fecha_caducidad,
             p.presentacion AS nombre_presentacion,
             c.controlado AS nombre_controlado,
             IF(m.proveedores_id IS NULL, 'Proveedor eliminado', pr.nombre) AS nombre_proveedor
           FROM 
             medicamentos m
           JOIN 
             presentacion p ON m.presentation_id = p.id_presentacion
           JOIN 
             controlado c ON m.controlado_id = c.id_controlado
           LEFT JOIN 
             proveedores pr ON m.proveedores_id = pr.id_proveedores
           ORDER BY 
             m.id_medicamentos DESC`;

    // Ejecutar consulta con o sin parámetros
    conexion.query(query, cantidad ? [cantidad] : [], (err, results) => {
        if (err) {
            console.error('Error al consultar medicamentos:', err);
            return res.status(500).send('Error al consultar medicamentos');
        }

        res.render('menu_admin/datos_medicamentos_admin', { 
            medicamentos: results,
            cantidad // por si deseas mostrar la cantidad actual en la vista
        });
    });
}



function tabla_medicamentos(req, res) {
    const query = `
    SELECT 
      m.id_medicamentos,
      m.nombre,
      m.cantidad,
      m.precio,
      m.fecha_caducidad,
      p.presentacion AS nombre_presentacion,
      c.controlado AS nombre_controlado,
      pr.nombre AS nombre_proveedor
    FROM 
      medicamentos m
    LEFT JOIN 
      presentacion p ON m.presentation_id = p.id_presentacion
    LEFT JOIN 
      controlado c ON m.controlado_id = c.id_controlado
    LEFT JOIN 
      proveedores pr ON m.proveedores_id = pr.id_proveedores
    ORDER BY 
      m.id_medicamentos DESC;
  `;
  

    conexion.query(query, (err, results) => {
        if (err) {
            console.error('Error al consultar medicamentos:', err);
            return res.status(500).send('Error al consultar medicamentos');
        }
        res.render('menu_admin/tabla_medicamentos', { medicamentos: results });
    });
}

function tabla_clientes(req, res) {
    const query = `
    SELECT 
      id_clientes,
      receta,
      nombre,
      apellido_paterno,
      apellido_materno
    FROM 
      clientes
    ORDER BY 
      id_clientes DESC;
    `;

    conexion.query(query, (err, results) => {
        if (err) {
            console.error('Error al consultar clientes:', err);
            return res.status(500).send('Error al consultar clientes');
        }
        res.render('menu_admin/tabla_clientes', { clientes: results });
    });
}


function tabla_proveedores(req, res) {
    const query = `
    SELECT 
      id_proveedores,
      nombre,
      direccion,
      telefono,
      correo
    FROM 
      proveedores
    ORDER BY 
      id_proveedores DESC;
    `;

    conexion.query(query, (err, results) => {
        if (err) {
            console.error('Error al consultar proveedores:', err);
            return res.status(500).send('Error al consultar proveedores');
        }
        res.render('menu_admin/tabla_proveedores', { proveedores: results });
    });
}



































function post_datos_medicamentos(req, res) {
    const cantidad = parseInt(req.body.cantidad, 10); // Captura la cantidad ingresada

    // Si el parámetro de cantidad es válido, realiza una consulta para limitar los resultados
    const query = cantidad 
        ? `SELECT 
             m.id_medicamentos,
             m.nombre,
             m.cantidad,
             m.precio,
             m.fecha_caducidad,
             p.presentacion AS nombre_presentacion,
             c.controlado AS nombre_controlado,
             IF(m.proveedores_id IS NULL, 'Proveedor eliminado', pr.nombre) AS nombre_proveedor
           FROM 
             medicamentos m
           JOIN 
             presentacion p ON m.presentation_id = p.id_presentacion
           JOIN 
             controlado c ON m.controlado_id = c.id_controlado
           LEFT JOIN 
             proveedores pr ON m.proveedores_id = pr.id_proveedores
           ORDER BY 
             m.id_medicamentos DESC
           LIMIT ?`
        : `SELECT 
             m.id_medicamentos,
             m.nombre,
             m.cantidad,
             m.precio,
             m.fecha_caducidad,
             p.presentacion AS nombre_presentacion,
             c.controlado AS nombre_controlado,
             IF(m.proveedores_id IS NULL, 'Proveedor eliminado', pr.nombre) AS nombre_proveedor
           FROM 
             medicamentos m
           JOIN 
             presentacion p ON m.presentation_id = p.id_presentacion
           JOIN 
             controlado c ON m.controlado_id = c.id_controlado
           LEFT JOIN 
             proveedores pr ON m.proveedores_id = pr.id_proveedores`;

    // Ejecutar la consulta SQL
    conexion.query(query, cantidad ? [cantidad] : [], (err, results) => {
        if (err) {
            console.error('Error al consultar medicamentos:', err);
            return res.status(500).send('Error al consultar medicamentos');
        }

        // Renderizar la vista de los medicamentos
        res.render('menu_admin/datos_medicamentos_admin', { 
            medicamentos: results,
            cantidad: cantidad, // Asegúrate de pasar la cantidad
        });
    });
}






function generarReportePDF(req, res) {
    const PDFDocument = require('pdfkit');

    // Consulta para obtener los últimos 20 medicamentos con JOIN
    const query = `
        SELECT 
            m.id_medicamentos,
            m.nombre,
            m.cantidad,
            m.precio,
            m.fecha_caducidad,
            p.presentacion AS nombre_presentacion,
            c.controlado AS nombre_controlado,
            IF(m.proveedores_id IS NULL, 'Proveedor eliminado', pr.nombre) AS nombre_proveedor
        FROM 
            medicamentos m
        LEFT JOIN 
            presentacion p ON m.presentation_id = p.id_presentacion
        LEFT JOIN 
            controlado c ON m.controlado_id = c.id_controlado
        LEFT JOIN 
            proveedores pr ON m.proveedores_id = pr.id_proveedores
        ORDER BY 
            m.id_medicamentos DESC
        LIMIT 20;`;

    // Realiza la consulta a la base de datos
    conexion.query(query, (err, medicamentos) => {
        if (err) {
            console.error('Error al consultar medicamentos:', err);
            return res.status(500).send('Error al generar reporte');
        }

        // Verifica si se encontraron medicamentos
        if (medicamentos.length === 0) {
            return res.status(404).send('No se encontraron medicamentos disponibles');
        }

        // Si se encontraron medicamentos, crea el PDF
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="reporte_medicamentos.pdf"');
        doc.pipe(res);

        // Título del PDF
        doc.fontSize(16).text('Reporte de Medicamentos', { align: 'center' });
        doc.moveDown();

        // Imprimir la lista de medicamentos
        medicamentos.forEach(medicamento => {
            doc.fontSize(12)
                .text(`Nombre: ${medicamento.nombre}`)
                .text(`Cantidad: ${medicamento.cantidad}`)
                .text(`Precio: ${medicamento.precio} $`)
                .text(`Fecha de Caducidad: ${new Date(medicamento.fecha_caducidad).toLocaleDateString()}`)
                .text(`Presentación: ${medicamento.nombre_presentacion || 'No disponible'}`)  // Muestra 'No disponible' si es NULL
                .text(`Controlado: ${medicamento.nombre_controlado || 'No disponible'}`)  // Muestra 'No disponible' si es NULL
                .text(`Proveedor: ${medicamento.nombre_proveedor || 'No disponible'}`)  // Muestra 'No disponible' si es NULL
                .moveDown();
        });
        

        // Finalizar el documento PDF
        doc.end();
    });
}





// Función para obtener y mostrar todos los usuarios
// GET - Mostrar lista de usuarios
function administrar_usuarios(req, res) {
    const query = 'SELECT * FROM usuarios';
    conexion.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener usuarios:', err);
            return res.status(500).render('menu_admin/administrar_usuarios', {
                message: 'Error al obtener usuarios',
                usuarios: [] // Pasa array vacío para evitar errores en EJS
            });
        }
        res.render('menu_admin/administrar_usuarios', { 
            usuarios: results,
            message: req.query.message // Para mensajes de redirección
        });
    });
}

// POST - Registrar nuevo usuario
function formulario(req, res) {
    const { nombre, apellido_paterno, apellido_materno, usuario, contrasena } = req.body;

    // Validación básica
    if (!nombre || !usuario || !contrasena) {
        return conexion.query('SELECT * FROM usuarios', (err, usuarios) => {
            if (err) {
                console.error('Error al obtener usuarios:', err);
                return res.status(500).render('menu_admin/administrar_usuarios', {
                    message: 'Error al validar datos',
                    usuarios: []
                });
            }
            res.render('menu_admin/administrar_usuarios', {
                usuarios: usuarios,
                message: 'Nombre, usuario y contraseña son obligatorios'
            });
        });
    }

    conexion.beginTransaction(err => {
        if (err) {
            console.error("Error en transacción:", err);
            return res.status(500).render('menu_admin/administrar_usuarios', {
                message: 'Error al iniciar transacción',
                usuarios: []
            });
        }

        // Verificar si usuario existe
        conexion.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario], (err, results) => {
            if (err) {
                return conexion.rollback(() => {
                    console.error("Error al verificar usuario:", err);
                    res.status(500).render('menu_admin/administrar_usuarios', {
                        message: 'Error al verificar usuario',
                        usuarios: []
                    });
                });
            }

            if (results.length > 0) {
                // Usuario existe, mostrar error con lista actual
                conexion.query('SELECT * FROM usuarios', (err, usuarios) => {
                    if (err) {
                        return conexion.rollback(() => {
                            res.status(500).render('menu_admin/administrar_usuarios', {
                                message: 'Error al cargar usuarios',
                                usuarios: []
                            });
                        });
                    }
                    res.render('menu_admin/administrar_usuarios', {
                        usuarios: usuarios,
                        message: 'El usuario ya existe. Elige otro nombre.'
                    });
                });
            } else {
                // Registrar nuevo usuario
                bcrypt.hash(contrasena, 12, (err, hashedPassword) => {
                    if (err) {
                        return conexion.rollback(() => {
                            console.error("Error al hashear:", err);
                            res.status(500).render('menu_admin/administrar_usuarios', {
                                message: 'Error al hashear contraseña',
                                usuarios: []
                            });
                        });
                    }

                    conexion.query(
                        'INSERT INTO usuarios (nombre, apellido_paterno, apellido_materno, usuario, contrasena) VALUES (?, ?, ?, ?, ?)',
                        [nombre, apellido_paterno, apellido_materno, usuario, hashedPassword],
                        (err, result) => {
                            if (err) {
                                return conexion.rollback(() => {
                                    console.error("Error al insertar:", err);
                                    res.status(500).render('menu_admin/administrar_usuarios', {
                                        message: 'Error al registrar usuario',
                                        usuarios: []
                                    });
                                });
                            }

                            conexion.commit(err => {
                                if (err) {
                                    return conexion.rollback(() => {
                                        console.error("Error al commit:", err);
                                        res.status(500).render('menu_admin/administrar_usuarios', {
                                            message: 'Error al confirmar registro',
                                            usuarios: []
                                        });
                                    });
                                }
                                
                                // Redirigir a GET con mensaje de éxito
                                res.redirect('/menu_admin/administrar_usuarios?message=Usuario registrado exitosamente');
                            });
                        }
                    );
                });
            }
        });
    });
}











































// Función para mostrar el formulario de edición de usuario
function editarUsuario(req, res) {
  const id = req.params.id_usuarios; 
  console.log("ID de usuario recibido:", id); // Verifica el valor del id_usuario
  const query = 'SELECT * FROM usuarios WHERE id_usuario = ?';

  conexion.query(query, [id], (err, results) => {
      if (err) {
          console.error('Error al obtener usuario:', err);
          res.status(500).send('Error al obtener usuario');
      } else {
          if (results.length > 0) {
              res.render('menu_admin/modificar_usuarios', { usuario: results[0] });
          } else {
              console.log("Usuario no encontrado en la base de datos"); // Mensaje adicional de depuración
              res.status(404).send('Usuario no encontrado');
          }
      }
  });
}


// Función para actualizar un usuario en la base de datos
function actualizarUsuario(req, res) {
    const id = parseInt(req.params.id_usuarios, 10);
    
    // Impide modificar al administrador del sistema
    if (id === 1) {
        return res.redirect('/menu_admin/administrar_usuarios?alerta=No%20se%20puede%20modificar%20al%20Administrador%20del%20sistema');
    }

    const { nombre, apellido_paterno, apellido_materno, usuario, contrasena } = req.body;

    if (contrasena) {
        bcrypt.hash(contrasena, 12, (err, hashedPassword) => {
            if (err) {
                console.error('Error al encriptar la contraseña:', err);
                res.status(500).send('Error al encriptar la contraseña');
                return;
            }

            const query = 'UPDATE usuarios SET nombre = ?, apellido_paterno = ?, apellido_materno = ?, usuario = ?, contrasena = ? WHERE id_usuario = ?';
            conexion.query(query, [nombre, apellido_paterno, apellido_materno, usuario, hashedPassword, id], (err) => {
                if (err) {
                    console.error('Error al actualizar usuario:', err);
                    res.status(500).send('Error al actualizar usuario');
                } else {
                    res.redirect('/menu_admin/administrar_usuarios');
                }
            });
        });
    } else {
        const query = 'UPDATE usuarios SET nombre = ?, apellido_paterno = ?, apellido_materno = ?, usuario = ? WHERE id_usuario = ?';
        conexion.query(query, [nombre, apellido_paterno, apellido_materno, usuario, id], (err) => {
            if (err) {
                console.error('Error al actualizar usuario:', err);
                res.status(500).send('Error al actualizar usuario');
            } else {
                res.redirect('/menu_admin/administrar_usuarios');
            }
        });
    }
}
  

function eliminarUsuario(req, res) {
    const id_usuario = parseInt(req.params.id_usuario);

    // Prevenir eliminación del administrador
if (id_usuario === 1) {
    return res.redirect('/menu_admin/administrar_usuarios?alerta=No%20se%20puede%20eliminar%20al%20Administrador%20del%20sistema');
}


    const query = 'DELETE FROM usuarios WHERE id_usuario = ?';

    conexion.query(query, [id_usuario], (err) => {
        if (err) {
            console.error('Error al eliminar el usuario:', err);
            return res.status(500).send('Error al eliminar el usuario');
        }

        res.redirect('/menu_admin/administrar_usuarios');
    });
}


    //para meidicamentos
    //funciones de miecmantos 
function buscarMedicamento(req, res) {
    const nombreBuscado = req.query.nombre;

    const query = `
        SELECT m.*, 
               p.presentacion AS nombre_presentacion, 
               c.controlado AS nombre_controlado, 
               pr.nombre AS nombre_proveedor
        FROM medicamentos m
        LEFT JOIN presentacion p ON m.presentation_id = p.id_presentacion
        LEFT JOIN controlado c ON m.controlado_id = c.id_controlado
        LEFT JOIN proveedores pr ON m.proveedores_id = pr.id_proveedores
        WHERE m.nombre LIKE ? AND m.cantidad > 0
    `;

    conexion.query(query, [`%${nombreBuscado}%`], (err, resultados) => {
        if (err) {
            console.error('Error al buscar medicamentos:', err);
            return res.status(500).send('Error al buscar medicamentos');
        }

        // Formatear la fecha de caducidad
        const medicamentosFormateados = resultados.map(medicamento => {
            const fecha = new Date(medicamento.fecha_caducidad);
            const fechaISO = fecha.toISOString().split('T')[0];

            return {
                ...medicamento,
                fecha_caducidad: fechaISO
            };
        });

        res.render('menu_admin/resultadoMedicamento_admin', {
            medicamentos: medicamentosFormateados,
            nombreBuscado 
        });
    });
}


    function eliminarMedicamento(req, res) {
        const id_medicamentos = req.params.id_medicamentos; 
        const nombreBuscado = req.query.nombre; 
    
        const query = 'DELETE FROM medicamentos WHERE id_medicamentos = ?';
    
        conexion.query(query, [id_medicamentos], (err) => {
            if (err) {
                console.error('Error al eliminar el medicamento:', err);
                return res.status(500).send('Error al eliminar el medicamento');
            }
    
            // Redirige a la página de resultados de búsqueda usando el nombre que se buscó
            res.redirect(`/menu_admin/buscar-medicamento?nombre=${encodeURIComponent(nombreBuscado)}`);
        });
    }

function actualizarMedicamento(req, res) {
    const idMedicamento = req.params.id_medicamentos;
    const { nombre, precio, cantidad, fecha_caducidad, presentation_id, controlado_id, proveedor_id } = req.body;

    if (!nombre || !precio || !cantidad || !fecha_caducidad || !presentation_id || !controlado_id) {
        return res.status(400).send('Todos los campos son obligatorios.');
    }

    // Si no hay proveedor asignado (el anterior fue eliminado), asignar un proveedor nuevo
    const proveedorIdFinal = proveedor_id && proveedor_id !== '' ? proveedor_id : null;
    const presentacionIdFinal = presentation_id && presentation_id !== '' ? presentation_id : null;

    const query = `
        UPDATE medicamentos 
        SET 
            nombre = ?, 
            precio = ?, 
            cantidad = ?, 
            fecha_caducidad = ?, 
            presentation_id = ?, 
            controlado_id = ?, 
            proveedores_id = ?
        WHERE id_medicamentos = ?
    `;

    const values = [nombre, precio, cantidad, fecha_caducidad, presentacionIdFinal, controlado_id, proveedorIdFinal, idMedicamento];

    conexion.query(query, values, (err, result) => {
        if (err) {
            console.error("Error al actualizar medicamento:", err);
            return res.status(500).send("Error al actualizar medicamento");
        }

        // Redirigir después de la actualización
        res.redirect(`/menu_admin/buscar-medicamento?nombre=${encodeURIComponent(nombre)}`);
    });
}
    
    
    
    

    function editarMedicamento(req, res) {
        const id = req.params.id_medicamentos;
    
        // Consulta para obtener el medicamento por ID
        const queryMedicamento = 'SELECT * FROM medicamentos WHERE id_medicamentos = ?';
    
        // Consulta para obtener todas las presentaciones
        const queryPresentaciones = 'SELECT * FROM presentacion';
    
        // Consulta para obtener todos los medicamentos controlados
        const queryControlados = 'SELECT * FROM controlado';
    
        // Consulta para obtener todos los proveedores
        const queryProveedores = 'SELECT * FROM proveedores';
    
        // Obtener datos del medicamento
        conexion.query(queryMedicamento, [id], (err, medicamentoResults) => {
            if (err) {
                console.error('Error al obtener el medicamento:', err);
                res.status(500).send('Error al obtener el medicamento');
            } else if (medicamentoResults.length === 0) {
                res.status(404).send('El medicamento no existe');
            } else {
                // Obtener datos de las presentaciones
                conexion.query(queryPresentaciones, (err, presentacionesResults) => {
                    if (err) {
                        console.error('Error al obtener las presentaciones:', err);
                        res.status(500).send('Error al obtener las presentaciones');
                    } else {
                        // Obtener datos de los medicamentos controlados
                        conexion.query(queryControlados, (err, controladosResults) => {
                            if (err) {
                                console.error('Error al obtener los medicamentos controlados:', err);
                                res.status(500).send('Error al obtener los medicamentos controlados');
                            } else {
                                // Obtener datos de los proveedores
                                conexion.query(queryProveedores, (err, proveedoresResults) => {
                                    if (err) {
                                        console.error('Error al obtener los proveedores:', err);
                                        res.status(500).send('Error al obtener los proveedores');
                                    } else {
                                        // Renderizar la vista con todos los datos
                                        res.render('menu_admin/modificar_medicamento_admin', {
                                            medicamento: medicamentoResults[0],
                                            presentaciones: presentacionesResults,
                                            controlados: controladosResults,
                                            proveedores: proveedoresResults // Agregar proveedores aquí
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }




















    function venta_medicamentos(req, res) {
        // Consultar los medicamentos disponibles
        conexion.query('SELECT * FROM medicamentos WHERE cantidad > 0', (err, medicamentos) => {
            if (err) {
                console.error(err);
                req.flash('error', 'Ocurrió un error al cargar los medicamentos.');
                return res.redirect('/menu_admin/inicio_admin');
            }
    
            // Consultar los clientes disponibles
            conexion.query('SELECT * FROM clientes', (err, clientes) => {
                if (err) {
                    console.error(err);
                    req.flash('error', 'Ocurrió un error al cargar los clientes.');
                    return res.redirect('/menu_admin/inicio_admin');
                }
    
                // Renderizar la vista con los datos de medicamentos y clientes
                res.render('menu_admin/venta', { medicamentos: medicamentos, clientes: clientes });
            });
        });
    }
    
    












































    
function venta_medicamentos_vista(req, res) {
    const { medicamentos, total, id_clientes } = req.body;
    const id_usuario = req.session.usuarioId;

    if (!Array.isArray(medicamentos) || medicamentos.length === 0) {
        req.flash('error', 'No se seleccionaron medicamentos.');
        return res.json({ success: false, message: 'No se seleccionaron medicamentos.' });
    }

    if (!id_clientes) {
        req.flash('error', 'Por favor, selecciona un cliente.');
        return res.json({ success: false, message: 'Por favor, selecciona un cliente.' });
    }

    let errores = [];

    const actualizaciones = medicamentos.map(medicamento => {
        return new Promise((resolve, reject) => {
            conexion.query('SELECT cantidad, precio, nombre FROM medicamentos WHERE id_medicamentos = ?', [medicamento.id], (error, results) => {
                if (error || results.length === 0) {
                    errores.push(`Error con el medicamento ID ${medicamento.id}`);
                    return reject(error || new Error('No encontrado'));
                }

                const disponible = results[0].cantidad;
                const precio_unitario = results[0].precio;
                const nombre_medicamento = results[0].nombre;
                const cantidad_vendida = medicamento.cantidad;
                const total_venta = precio_unitario * cantidad_vendida;

                if (cantidad_vendida > disponible) {
                    errores.push(`Cantidad insuficiente para ${nombre_medicamento}.`);
                    return reject(new Error('Inventario insuficiente'));
                }

                // Actualizar inventario
                conexion.query(
                    'UPDATE medicamentos SET cantidad = cantidad - ? WHERE id_medicamentos = ?',
                    [cantidad_vendida, medicamento.id],
                    (error) => {
                        if (error) {
                            errores.push(`Error al actualizar inventario de ${nombre_medicamento}`);
                            return reject(error);
                        }

                        // Insertar venta con nombre_medicamento
                        conexion.query(
                            `INSERT INTO ventas 
                             (cantidad, precio_unitario, total, id_usuario, id_medicamento, nombre_medicamento, id_cliente) 
                             VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [cantidad_vendida, precio_unitario, total_venta, id_usuario, medicamento.id, nombre_medicamento, id_clientes],
                            (error) => {
                                if (error) {
                                    errores.push(`Error al registrar la venta de ${nombre_medicamento}`);
                                    return reject(error);
                                }

                                resolve();
                            }
                        );
                    }
                );
            });
        });
    });

    Promise.all(actualizaciones)
        .then(() => {
            if (errores.length > 0) {
                req.flash('error', errores.join(' '));
                return res.json({ success: false, message: errores.join(' ') });
            } else {
                req.flash('success', 'Venta realizada con éxito.');
                res.json({ success: true });
            }
        })
        .catch(err => {
            console.error('Error al procesar la venta:', err);
            req.flash('error', 'Ocurrió un error al realizar la venta.');
            res.json({ success: false, message: 'Error al procesar la venta.' });
        });
}
    
                
        
        



























    // Controlador para mostrar el historial de ventas
function historialVentas(req, res) {
    const query = `
        SELECT v.id_venta, v.fecha_venta, 
               v.nombre_medicamento AS medicamento,
               v.cantidad, v.precio_unitario, v.total,
               IFNULL(u.nombre, 'Sin vendedor') AS vendedor,
               IFNULL(c.nombre, 'Sin cliente') AS cliente
        FROM ventas v
        LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario
        LEFT JOIN clientes c ON v.id_cliente = c.id_clientes
        ORDER BY v.fecha_venta DESC
    `;

    conexion.query(query, function(err, ventas) {
        if (err) {
            console.error('Error en historialVentas:', err);
            return res.status(500).render('error', { error: 'Error al cargar el historial' });
        }

        const ventasFormateadas = ventas.map(v => ({
            ...v,
            precio_unitario: parseFloat(v.precio_unitario) || 0,
            total: parseFloat(v.total) || 0
        }));

        res.render('menu_admin/historial_ventas', { 
            ventas: ventasFormateadas,
            titulo: 'Historial de Ventas'
        });
    });
}



// Controlador para buscar ventas
function buscarVentas(req, res) {
    const { fecha, cliente } = req.query;
    let query = `
        SELECT v.id_venta, v.fecha_venta, 
               v.nombre_medicamento AS medicamento, 
               v.cantidad, v.precio_unitario, v.total,
               IFNULL(u.nombre, 'Sin vendedor') AS vendedor,
               IFNULL(c.nombre, 'Sin cliente') AS cliente
        FROM ventas v
        LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario
        LEFT JOIN clientes c ON v.id_cliente = c.id_clientes
        WHERE 1=1`;

    const params = [];

    if (fecha) {
        query += ' AND DATE(v.fecha_venta) = ?';
        params.push(fecha);
    }

    if (cliente) {
        query += ' AND c.nombre LIKE ?';
        params.push(`%${cliente}%`);
    }

    query += ' ORDER BY v.fecha_venta DESC';

    conexion.query(query, params, function(err, ventas) {
        if (err) {
            console.error('Error en buscarVentas:', err);
            return res.status(500).render('error', { error: 'Error en la búsqueda' });
        }

        res.render('menu_admin/historial_ventas', { 
            ventas,
            titulo: 'Resultados de Búsqueda',
            criterios: { fecha, cliente }
        });
    });
}








function eliminarVenta(req, res) {
    const id_venta = req.params.id_venta;
    
    const query = 'DELETE FROM ventas WHERE id_venta = ?';

    conexion.query(query, [id_venta], (err) => {
        if (err) {
            console.error('Error al eliminar la venta:', err);
            return res.status(500).send('Error al eliminar la venta');
        }

        // 🔁 Redirige a la vista historial de ventas (donde se cargan bien los datos)
        res.redirect('/menu_admin/historial_ventas');
    });
}





///////////////////////////////////////////PDF VENTAS-//////////////////////////////

const fs = require('fs');
const path = require('path');

function exportarVentasPDF(req, res) {
    const query = `
        SELECT 
            v.fecha_venta, 
            v.nombre_medicamento AS medicamento, 
            v.cantidad, 
            v.precio_unitario, 
            v.total,
            IFNULL(u.nombre, 'Sin vendedor') AS vendedor,
            IFNULL(c.nombre, 'Sin cliente') AS cliente
        FROM ventas v
        LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario
        LEFT JOIN clientes c ON v.id_cliente = c.id_clientes
        ORDER BY v.fecha_venta DESC
    `;

    conexion.query(query, (err, ventas) => {
        if (err) {
            return res.status(500).send('Error al obtener datos de ventas');
        }

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        res.setHeader('Content-Disposition', 'attachment; filename=historial_ventas.pdf');
        res.setHeader('Content-Type', 'application/pdf');

        doc.pipe(res);

        // Título
        doc.fontSize(16).text('Historial de Ventas - MediStock', { align: 'center' });
        doc.moveDown(1);

        // Estilo de texto normal
        doc.fontSize(10).font('Helvetica');

        ventas.forEach((v, index) => {
            doc.text(`Venta #${index + 1}`, { underline: true });
            doc.text(`Fecha: ${new Date(v.fecha_venta).toLocaleString('es-MX')}`);
            doc.text(`Medicamento: ${v.medicamento}`);
            doc.text(`Cantidad: ${v.cantidad}`);
            doc.text(`Precio Unitario: $${parseFloat(v.precio_unitario).toFixed(2)}`);
            doc.text(`Total: $${parseFloat(v.total).toFixed(2)}`);
            doc.text(`Vendedor: ${v.vendedor}`);
            doc.text(`Cliente: ${v.cliente}`);
            doc.moveDown(1); // Espacio entre ventas

            // Si llega al final de la página, salta a la siguiente
            if (doc.y > 700) doc.addPage();
        });

        doc.end();
    });
}




module.exports = {
    inicio_admin,

    vista_medicamentos,
    insertarMedicamento,

    vista_proveedores,
    post_proveedores,
    administrar_proveedores,
    editarProveedor,
    actualizarProveedor,
    eliminarProveedor,
    buscarProveedor,

    vista_clientes,
    post_clientes,
    buscarCliente,
    mostrarFormularioEdicion,
    actualizarCliente,
    mostrarClienteActualizado,
    eliminarCliente,

    vista_datos_medicamentos,     
    post_datos_medicamentos,

    generarReportePDF,

    administrar_usuarios,
    actualizarUsuario,
    editarUsuario,
    eliminarUsuario,

    venta_medicamentos,
    venta_medicamentos_vista,
    historialVentas,
    buscarVentas,


    buscarMedicamento,
    eliminarMedicamento,
    actualizarMedicamento,
    editarMedicamento,


    tabla_medicamentos,
    tabla_clientes,
    tabla_proveedores,
    formulario,

    eliminarVenta,
    exportarVentasPDF
};