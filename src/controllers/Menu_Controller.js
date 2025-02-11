const conexion = require('../conexion/conexion'); 

function inicio(req, res) {
    const queryMedicamentosProximos = `
        SELECT nombre, fecha_caducidad 
        FROM medicamentos 
        WHERE fecha_caducidad BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    `;
    
    const queryMedicamentosAgotarse = `
        SELECT nombre, cantidad 
        FROM medicamentos 
        WHERE cantidad < 10
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

            res.render('menu/inicio', {
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

            // Renderizar la vista pasando tanto proveedores como medicamentosProximos
            res.render('menu/medicamentos', { proveedores: proveedores, medicamentosProximos: medicamentosProximos });
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

            res.redirect('/menu/medicamentos');
        }
    );
}


//PARA REGISTRA CLIENTES
function vista_clientes(req, res) {
    res.render('menu/clientes', { message: '' }); // Renderiza la vista correcta
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
                        res.render('menu/clientes', { message });
                    });
                }
            
                conexion.commit(err => {
                    if (err) {
                        return conexion.rollback(() => {
                            const message = 'Error al confirmar la transacción. Por favor, inténtalo de nuevo.';
                            res.render('menu/clientes', { message });
                        });
                    }
                    const message = 'Cliente agregado exitosamente!';
                    res.render('menu/clientes', { message });
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
        res.render('menu/resultadoCliente', { clientes: resultados, nombreBuscado: nombre });
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
            res.render('menu/editarcliente_buscar', { cliente: resultados[0] });
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
        res.redirect(`/menu/resultadoCliente/${idCliente}`);
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
            res.render('menu/resultadoCliente', {
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
        res.redirect(`/menu/buscar-cliente?nombre=${encodeURIComponent(nombreBuscado)}`);
    });
}






//MUESRA LA TABLA DE MEDICAMENTOS
function vista_datos_medicamentos(req, res) {
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
      Medicamentos m
    LEFT JOIN 
      Presentacion p ON m.presentation_id = p.id_presentacion
    LEFT JOIN 
      Controlado c ON m.controlado_id = c.id_controlado
    LEFT JOIN 
      Proveedores pr ON m.proveedores_id = pr.id_proveedores
    ORDER BY 
      m.id_medicamentos DESC;
  `;
  

    conexion.query(query, (err, results) => {
        if (err) {
            console.error('Error al consultar medicamentos:', err);
            return res.status(500).send('Error al consultar medicamentos');
        }
        res.render('menu/datos_medicamentos', { medicamentos: results });
    });
}

function post_datos_medicamentos(req, res) {
    const cantidad = parseInt(req.body.cantidad, 10); // Captura la cantidad ingresada

    const query = cantidad 
        ? `SELECT 
             m.id_medicamentos,
             m.nombre,
             m.cantidad,
             m.precio,
             m.fecha_caducidad,
             p.presentacion AS nombre_presentacion,
             c.controlado AS nombre_controlado,
             pr.nombre AS nombre_proveedor
           FROM 
             Medicamentos m
           JOIN 
             Presentacion p ON m.presentation_id = p.id_presentacion
           JOIN 
             Controlado c ON m.controlado_id = c.id_controlado
           JOIN 
             Proveedores pr ON m.proveedores_id = pr.id_proveedores
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
             pr.nombre AS nombre_proveedor
           FROM 
             Medicamentos m
           JOIN 
             Presentacion p ON m.presentation_id = p.id_presentacion
           JOIN 
             Controlado c ON m.controlado_id = c.id_controlado
           JOIN 
             Proveedores pr ON m.proveedores_id = pr.id_proveedores`;

    conexion.query(query, cantidad ? [cantidad] : [], (err, results) => {
        if (err) {
            console.error('Error al consultar medicamentos:', err);
            return res.status(500).send('Error al consultar medicamentos');
        }
        console.log(results);
        res.render('menu/datos_medicamentos', { 
            medicamentos: results,
            cantidad: cantidad // Asegúrate de pasar la cantidad
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
    pr.nombre AS nombre_proveedor
FROM 
    Medicamentos m
LEFT JOIN 
    Presentacion p ON m.presentation_id = p.id_presentacion
LEFT JOIN 
    Controlado c ON m.controlado_id = c.id_controlado
LEFT JOIN 
    Proveedores pr ON m.proveedores_id = pr.id_proveedores
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
                .text(`ID: ${medicamento.id_medicamentos}`)
                .text(`Nombre: ${medicamento.nombre}`)
                .text(`Cantidad: ${medicamento.cantidad}`)
                .text(`Precio: ${medicamento.precio}`)
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

function venta_medicamentos(req, res) {
    conexion.query('SELECT * FROM medicamentos WHERE cantidad > 0', (err, results) => {
        if (err) {
            console.error(err);
            req.flash('error', 'Ocurrió un error al cargar los medicamentos.');
            return res.redirect('/menu/inicio');
        }

        res.render('menu/venta', { medicamentos: results });
    });
}

function venta_medicamentos_vista(req, res) {
    const medicamentos = req.body.medicamentos;

    if (!Array.isArray(medicamentos) || medicamentos.length === 0) {
        req.flash('error', 'No se seleccionaron medicamentos.');
        return res.redirect('/menu/venta');
    }

    let errores = [];
    let actualizaciones = medicamentos.map(medicamento => {
        return new Promise((resolve, reject) => {
            conexion.query('SELECT cantidad FROM medicamentos WHERE id_medicamentos = ?', [medicamento.id], (error, results) => {
                if (error) {
                    errores.push(`Error al consultar el medicamento ${medicamento.nombre}: ${error.message}`);
                    return reject(error);
                }

                if (results.length === 0) {
                    errores.push(`El medicamento ${medicamento.nombre} no existe.`);
                    return reject(new Error('Medicamento no existe'));
                }

                const disponible = results[0].cantidad;

                if (medicamento.cantidad > disponible) {
                    errores.push(`Cantidad insuficiente en inventario para ${medicamento.nombre}.`);
                    return reject(new Error('Cantidad insuficiente'));
                }

                conexion.query(
                    'UPDATE medicamentos SET cantidad = cantidad - ? WHERE id_medicamentos = ?',
                    [medicamento.cantidad, medicamento.id],
                    (error) => {
                        if (error) {
                            errores.push(`Error al actualizar el inventario de ${medicamento.nombre}: ${error.message}`);
                            return reject(error);
                        }

                        resolve();
                    }
                );
            });
        });
    });

    Promise.all(actualizaciones)
        .then(() => {
            if (errores.length > 0) {
                req.flash('error', errores.join(' '));
            } else {
                req.flash('success', 'Venta realizada con éxito.');
            }
            res.json({ success: errores.length === 0 });
        })
        .catch(() => {
            req.flash('error', 'Ocurrió un error al realizar la venta.');
            res.json({ success: false });
        });
}






    //funciones de miecmantos 
    function buscarMedicamento(req, res) {
        const nombreBuscado = req.query.nombre; 
        const query = 'SELECT * FROM medicamentos WHERE nombre LIKE ?';
    
        conexion.query(query, [`%${nombreBuscado}%`], (err, resultados) => {
            if (err) {
                console.error('Error al buscar medicamentos:', err);
                return res.status(500).send('Error al buscar medicamentos');
            }
    
            res.render('menu/resultadoMedicamento', {
                medicamentos: resultados,
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
            res.redirect(`/menu/buscar-medicamento?nombre=${encodeURIComponent(nombreBuscado)}`);
        });
    }

    function actualizarMedicamento(req, res) {
        const idMedicamento = req.params.id_medicamentos;
        const { nombre, precio, cantidad, fecha_caducidad, presentation_id, controlado_id, proveedor_id } = req.body;
    
        console.log("Datos recibidos: ", req.body); // Para depuración
    
        if (!nombre || !precio || !cantidad || !fecha_caducidad || !presentation_id || !controlado_id) {
            return res.status(400).send('Todos los campos son obligatorios.');
        }
    
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
    
        console.log("Consulta SQL: ", query); // Para depuración
        console.log("Valores: ", values); // Para depuración
    
        conexion.query(query, values, (err, result) => {
            if (err) {
                console.error("Error al actualizar medicamento:", err);
                return res.status(500).send("Error al actualizar medicamento");
            }
    
            res.redirect('/menu/medicamentos');
        });
    }
    

// Función para editar medicamento
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
                                    res.render('menu/modificar_medicamento', {
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

    
    
    

module.exports = {
    inicio,
    vista_medicamentos,
    insertarMedicamento,

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

    venta_medicamentos_vista,
    venta_medicamentos,

    buscarMedicamento,
    eliminarMedicamento,
    actualizarMedicamento,
    editarMedicamento
};