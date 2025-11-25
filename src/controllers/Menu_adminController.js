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

// PARA AGREGAR UN NUEVO PROVEEDOR (versión para fetch)
function post_proveedores(req, res) {
    const { nombre, direccion, telefono, correo } = req.body;

    conexion.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: "Error en la transacción." });

        // Solo buscar proveedores activos
        conexion.query(
            'SELECT * FROM proveedores WHERE nombre = ? AND activo = 1',
            [nombre],
            (err, results) => {

                if (err) {
                    return conexion.rollback(() => {
                        res.status(500).json({ success: false, message: "Error al consultar proveedor." });
                    });
                }

                // Si existe y está activo → NO permitir
                if (results.length > 0) {
                    return res.json({ success: false, message: "El proveedor ya está registrado." });
                }

                // Insertar nuevo proveedor (si estaba desactivado NO importa)
                conexion.query(
                    'INSERT INTO proveedores (nombre, direccion, telefono, correo, activo) VALUES (?, ?, ?, ?, 1)',
                    [nombre, direccion, telefono, correo],
                    (err, result) => {

                        if (err) {
                            return conexion.rollback(() => {
                                res.status(500).json({ success: false, message: "Error al registrar proveedor." });
                            });
                        }

                        conexion.commit(err => {
                            if (err) {
                                return conexion.rollback(() => {
                                    res.status(500).json({ success: false, message: "Error al guardar cambios." });
                                });
                            }

                            return res.json({ success: true, message: "Proveedor registrado exitosamente." });
                        });
                    }
                );
            }
        );
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
            res.render('menu_admin/modificar_proveedor', { 
                proveedor: results[0]
            });
        }
    });
}


// Actualizar proveedor en la base de datos
function actualizarProveedor(req, res) {
    const id = req.params.id_proveedores;
    const { nombre, direccion, telefono, correo } = req.body;

    const query = `
        UPDATE proveedores 
        SET nombre = ?, direccion = ?, telefono = ?, correo = ?
        WHERE id_proveedores = ?
    `;

    conexion.query(query, [nombre, direccion, telefono, correo, id], (err) => {
        if (err) {
            console.error('Error al actualizar proveedor:', err);
            req.flash("error", "Error al actualizar el proveedor.");
            return res.redirect("back");
        }

        // ⭐ MENSAJE DE ÉXITO ⭐
        req.flash("success", "Proveedor actualizado correctamente.");

        // ⭐ REGRESAR A LA BÚSQUEDA ⭐
        res.redirect(`/menu_admin/buscar-proveedor?nombre=${encodeURIComponent(nombre)}`);
    });
}

  

// Eliminar proveedor
function eliminarProveedor(req, res) {
    const id_proveedores = req.params.id_proveedores;
    const nombreBuscado = req.query.nombre;

    // En lugar de borrar, solo lo marcamos como inactivo
    const query = 'UPDATE proveedores SET activo = 0 WHERE id_proveedores = ?';

    conexion.query(query, [id_proveedores], (err) => {
        if (err) {
            console.error('Error al eliminar el proveedor:', err);
            return res.status(500).send('Error al eliminar el proveedor');
        }

        res.redirect(`/menu_admin/buscar-proveedor?nombre=${encodeURIComponent(nombreBuscado)}`);
    });
}



function buscarProveedor(req, res) {
    const busqueda = req.query.nombre;

    const query = `
        SELECT * FROM proveedores 
        WHERE activo = 1
        AND (nombre LIKE ?
         OR direccion LIKE ?)
    `;

    const valor = `%${busqueda}%`;

    conexion.query(query, [valor, valor], (err, resultados) => {
        if (err) {
            console.error('Error al buscar proveedores:', err);
            return res.status(500).send('Error al buscar proveedores');
        }

        res.render('menu_admin/resultadoProveedor', {
            proveedores: resultados,
            nombreBuscado: busqueda
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
    const busqueda = req.query.nombre;

    const query = `
        SELECT * FROM clientes 
        WHERE activo = 1
          AND (
                nombre LIKE ?
                OR apellido_paterno LIKE ?
                OR apellido_materno LIKE ?
                OR receta LIKE ?
          )
    `;
    
    const valor = `%${busqueda}%`;
    const valores = [valor, valor, valor, valor];

    conexion.query(query, valores, (err, resultados) => {
        if (err) {
            console.error('Error al buscar el cliente:', err);
            return res.status(500).send('Error en la búsqueda del cliente');
        }

        res.render('menu_admin/resultadoCliente', {
            clientes: resultados,
            nombreBuscado: busqueda
        });
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

    const query = `
        UPDATE clientes 
        SET nombre = ?, apellido_paterno = ?, apellido_materno = ?, receta = ?
        WHERE id_clientes = ?
    `;

    conexion.query(query, [nombre, apellido_paterno, apellido_materno, receta, idCliente], (err) => {
        if (err) {
            console.error('Error al actualizar cliente:', err);
            req.flash("error", "Error al actualizar cliente");
            return res.redirect("back");
        }

        // ⭐ MENSAJE FLASH ⭐
        req.flash("success", "Cliente actualizado correctamente");

        // ⭐ REDIRIGE A LA BÚSQUEDA CON EL NOMBRE ⭐
        res.redirect(`/menu_admin/buscar-cliente?nombre=${encodeURIComponent(nombre)}`);
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
    const id_clientes = req.params.id_clientes; 
    const nombreBuscado = req.query.nombre; 

    const query = 'UPDATE clientes SET activo = 0 WHERE id_clientes = ?';

    conexion.query(query, [id_clientes], (err) => {
        if (err) {
            console.error('Error al eliminar el cliente:', err);
            return res.status(500).send('Error al eliminar el cliente');
        }

        res.redirect(`/menu_admin/buscar-cliente?nombre=${encodeURIComponent(nombreBuscado)}`);
    });
}







//MUESRA LA TABLA DE MEDICAMENTOS
function vista_datos_medicamentos(req, res) {
    const cantidad = parseInt(req.query.cantidad, 10);

    const baseQuery = `
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
        JOIN 
            presentacion p ON m.presentation_id = p.id_presentacion
        JOIN 
            controlado c ON m.controlado_id = c.id_controlado
        LEFT JOIN 
            proveedores pr ON m.proveedores_id = pr.id_proveedores
        WHERE 
            m.cantidad > 0
            AND m.activo = 1
        ORDER BY 
            m.id_medicamentos DESC
    `;

    const query = cantidad ? baseQuery + ` LIMIT ?` : baseQuery;

    conexion.query(query, cantidad ? [cantidad] : [], (err, results) => {
        if (err) {
            console.error('Error al consultar medicamentos:', err);
            return res.status(500).send('Error al consultar medicamentos');
        }

        res.render('menu_admin/datos_medicamentos_admin', { 
            medicamentos: results,
            cantidad
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
      IFNULL(pr.nombre, 'Eliminado') AS nombre_proveedor
    FROM 
      medicamentos m
    LEFT JOIN 
      presentacion p ON m.presentation_id = p.id_presentacion
    LEFT JOIN 
      controlado c ON m.controlado_id = c.id_controlado
    LEFT JOIN 
      proveedores pr ON m.proveedores_id = pr.id_proveedores
    WHERE 
      m.activo = 1
      AND m.cantidad > 0
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
    WHERE 
      activo = 1
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
    WHERE 
      activo = 1
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
             IF(m.proveedores_id IS NULL, 'Eliminado', pr.nombre) AS nombre_proveedor
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
             IF(m.proveedores_id IS NULL, 'Eliminado', pr.nombre) AS nombre_proveedor
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
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    // SIEMPRE enviamos cabeceras del PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte_medicamentos.pdf"');
    doc.pipe(res);

    // Consulta SQL
const query = `
    SELECT 
        m.id_medicamentos,
        m.nombre,
        m.cantidad,
        m.precio,
        m.fecha_caducidad,
        p.presentacion AS nombre_presentacion,
        c.controlado AS nombre_controlado,
        IF(m.proveedores_id IS NULL, 'Eliminado', pr.nombre) AS nombre_proveedor
    FROM medicamentos m
    LEFT JOIN presentacion p ON m.presentation_id = p.id_presentacion
    LEFT JOIN controlado c ON m.controlado_id = c.id_controlado
    LEFT JOIN proveedores pr ON m.proveedores_id = pr.id_proveedores
    WHERE 
        m.cantidad > 0
        AND m.activo = 1        
    ORDER BY 
        m.id_medicamentos DESC
    LIMIT 50;
`;


    conexion.query(query, (err, medicamentos) => {
        if (err) {
            console.error('Error al consultar medicamentos:', err);
            doc.fontSize(14).fillColor('red').text('Error al generar el reporte', { align: 'center' });
            doc.end();
            return;
        }

        // ==============================
        // ENCABEZADO PDF
        // ==============================
        doc.fontSize(18).text('Centro de Salud de Teoloyucan', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(14).text('Reporte de Medicamentos', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).text(`Fecha de generación: ${new Date().toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' })}`, { align: 'right' });
        doc.moveDown(1);

        // ==============================
        // NO HAY MEDICAMENTOS
        // ==============================
        if (medicamentos.length === 0) {
            doc.moveDown(4);
            doc.font('Helvetica-Bold')
               .fontSize(16)
               .fillColor('#444444')
               .text('No hay medicamentos registrados en el inventario.', {
                    align: 'center'
               });
            doc.end();
            return;
        }

        // ==============================
        // TIENE MEDICAMENTOS → IMPRIMIR TABLA
        // ==============================

        // ANCHOS OPTIMIZADOS - MÁS ESPACIO PARA PROVEEDOR
        const columnas = [
            { header: 'Nombre', width: 100 },        // Reducido
            { header: 'Cantidad', width: 55 },       // Reducido
            { header: 'Precio', width: 55 },         // Reducido
            { header: 'Caducidad', width: 70 },      // Reducido
            { header: 'Presentación', width: 75 },   // Reducido
            { header: 'Controlado', width: 65 },     // Reducido
            { header: 'Proveedor', width: 130 }      // AUMENTADO significativamente
        ];

        const tableWidth = columnas.reduce((sum, c) => sum + c.width, 0);

        const computeStartX = () => {
            const pageWidth = doc.page.width;
            const marginLeft = doc.page.margins.left;
            const marginRight = doc.page.margins.right;
            const usableWidth = pageWidth - marginLeft - marginRight;
            const offset = Math.max(0, (usableWidth - tableWidth) / 2);          
            return marginLeft + offset;
        };

        let startX = computeStartX();
        let endX = startX + tableWidth;
        let y = doc.y;

        // FUNCIÓN PARA TRUNCAR TEXTO LARGO
        const truncarTexto = (texto, anchoMaximo) => {
            if (doc.widthOfString(texto) <= anchoMaximo) return texto;
            
            let textoTruncado = texto;
            while (textoTruncado.length > 5 && doc.widthOfString(textoTruncado + '...') > anchoMaximo) {
                textoTruncado = textoTruncado.slice(0, -1);
            }
            return textoTruncado + '...';
        };

        // ENCABEZADOS DE TABLA
        doc.font('Helvetica-Bold').fontSize(9); // Fuente más pequeña
        let x = startX;
        columnas.forEach(col => {
            doc.text(col.header, x, y, { 
                width: col.width, 
                align: 'left',
                lineBreak: false // Evita saltos de línea en encabezados
            });
            x += col.width;
        });

        y += 18;
        doc.moveTo(startX, y - 5).lineTo(endX, y - 5).stroke();

        doc.font('Helvetica').fontSize(8); // Fuente más pequeña para datos

        medicamentos.forEach((med) => {
            if (y > 750) {
                doc.addPage();
                startX = computeStartX();
                endX = startX + tableWidth;
                y = 50;

                // REIMPRIMIR ENCABEZADOS EN NUEVA PÁGINA
                doc.font('Helvetica-Bold').fontSize(9);
                x = startX;
                columnas.forEach(col => {
                    doc.text(col.header, x, y, { 
                        width: col.width,
                        lineBreak: false 
                    });
                    x += col.width;
                });
                y += 18;
                doc.moveTo(startX, y - 5).lineTo(endX, y - 5).stroke();
                doc.font('Helvetica').fontSize(8);
            }

            const datos = [
                med.nombre,
                med.cantidad.toString(),
                `$${Number(med.precio).toFixed(2)}`,
                new Date(med.fecha_caducidad).toLocaleDateString(),
                med.nombre_presentacion || 'N/D',
                med.nombre_controlado || 'N/D',
                med.nombre_proveedor || 'N/D'
            ];

            x = startX;
            datos.forEach((dato, i) => {
                const texto = dato.toString();
                const anchoColumna = columnas[i].width - 2; // Pequeño margen
                
                // Aplicar truncado solo si es necesario (especialmente para proveedor)
                const textoMostrar = (i === 6) ? truncarTexto(texto, anchoColumna) : texto;
                
                doc.text(textoMostrar, x, y, { 
                    width: columnas[i].width, 
                    align: 'left',
                    lineBreak: false // EVITA QUE EL TEXTO SE AMONTONE
                });
                x += columnas[i].width;
            });

            y += 16;
            doc.moveTo(startX, y - 3).lineTo(endX, y - 3).strokeColor('#dddddd').stroke();
        });

        doc.end();
    });
}



// Función para obtener y mostrar todos los usuarios
// GET - Mostrar lista de usuarios
function administrar_usuarios(req, res) {
    const query = 'SELECT * FROM usuarios WHERE activo = 1';

    conexion.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener usuarios:', err);
            return res.status(500).render('menu_admin/administrar_usuarios', {
                message: 'Error al obtener usuarios',
                usuarios: []
            });
        }

        res.render('menu_admin/administrar_usuarios', { 
            usuarios: results,
            message: req.query.message
        });
    });
}


// POST - Registrar nuevo usuario
function formulario(req, res) {
    const { nombre, apellido_paterno, apellido_materno, usuario, contrasena } = req.body;

    conexion.query("SELECT * FROM usuarios WHERE usuario = ?", [usuario], (err, results) => {
        if (err) {
            console.error("Error al verificar usuario:", err);
            req.flash("error", "Error al verificar usuario");
            return res.redirect("/menu_admin/administrar_usuarios");
        }

        // === CASO 1: usuario existe y está ACTIVO ===
        if (results.length > 0 && results[0].status === 1) {
            req.flash("error", "Ese usuario ya existe y está activo.");
            return res.redirect("/menu_admin/administrar_usuarios");
        }

        // === CASO 2: usuario existe pero está DESACTIVADO ===
        if (results.length > 0 && results[0].status === 0) {

            bcrypt.hash(contrasena, 12, (err, hash) => {
                if (err) {
                    req.flash("error", "Error al procesar contraseña");
                    return res.redirect("/menu_admin/administrar_usuarios");
                }

                const update = `
                    UPDATE usuarios SET 
                    nombre = ?, apellido_paterno = ?, apellido_materno = ?, 
                    contrasena = ?, status = 1
                    WHERE usuario = ?
                `;

                conexion.query(update,
                    [nombre, apellido_paterno, apellido_materno, hash, usuario],
                    (err2) => {
                        if (err2) {
                            console.error("Error al reactivar:", err2);
                            req.flash("error", "Error al reactivar usuario");
                            return res.redirect("/menu_admin/administrar_usuarios");
                        }

                        req.flash("success", "Usuario reactivado correctamente.");
                        return res.redirect("/menu_admin/administrar_usuarios");
                    }
                );
            });
            return;
        }

        // === CASO 3: usuario NO existe → insertar normal ===
        bcrypt.hash(contrasena, 12, (err, hash) => {
            if (err) {
                req.flash("error", "Error al procesar contraseña");
                return res.redirect("/menu_admin/administrar_usuarios");
            }

            const insert = `
                INSERT INTO usuarios 
                (nombre, apellido_paterno, apellido_materno, usuario, contrasena, status)
                VALUES (?, ?, ?, ?, ?, 1)
            `;

            conexion.query(insert,
                [nombre, apellido_paterno, apellido_materno, usuario, hash],
                (err2) => {
                    if (err2) {
                        console.error("Error al registrar:", err2);
                        req.flash("error", "Error al registrar usuario.");
                        return res.redirect("/menu_admin/administrar_usuarios");
                    }

                    req.flash("success", "Usuario registrado exitosamente.");
                    res.redirect("/menu_admin/administrar_usuarios");
                }
            );
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

    // Evitar editar al ADMIN principal
    if (id === 1) {
        req.flash("error", "No se puede modificar al Administrador del sistema");
        return res.redirect('/menu_admin/administrar_usuarios');
    }

    const { nombre, apellido_paterno, apellido_materno, usuario, contrasena } = req.body;

    // Si viene contraseña → encriptar
    if (contrasena && contrasena.trim() !== "") {
        bcrypt.hash(contrasena, 12, (err, hashedPassword) => {
            if (err) {
                console.error('Error al encriptar la contraseña:', err);
                req.flash("error", "Error al actualizar el usuario");
                return res.redirect('/menu_admin/administrar_usuarios');
            }

            const sql = `
                UPDATE usuarios 
                SET nombre=?, apellido_paterno=?, apellido_materno=?, usuario=?, contrasena=? 
                WHERE id_usuario=?
            `;

            conexion.query(sql, [nombre, apellido_paterno, apellido_materno, usuario, hashedPassword, id], (err) => {
                if (err) {
                    console.error('Error al actualizar usuario:', err);
                    req.flash("error", "Error al actualizar usuario");
                } else {
                    req.flash("success", "Usuario actualizado correctamente");
                }
                return res.redirect('/menu_admin/administrar_usuarios');
            });
        });

    } else {
        // Sin contraseña
        const sql = `
            UPDATE usuarios 
            SET nombre=?, apellido_paterno=?, apellido_materno=?, usuario=? 
            WHERE id_usuario=?
        `;

        conexion.query(sql, [nombre, apellido_paterno, apellido_materno, usuario, id], (err) => {
            if (err) {
                console.error('Error al actualizar usuario:', err);
                req.flash("error", "Error al actualizar usuario");
            } else {
                req.flash("success", "Usuario actualizado correctamente");
            }
            return res.redirect('/menu_admin/administrar_usuarios');
        });
    }
}

  

function eliminarUsuario(req, res) {
    const id_usuario = parseInt(req.params.id_usuario);

    // No dejar eliminar al Admin (ID = 1)
    if (id_usuario === 1) {
        return res.redirect('/menu_admin/administrar_usuarios?alerta=No%20se%20puede%20eliminar%20al%20Administrador%20del%20sistema');
    }

    const query = 'UPDATE usuarios SET activo = 0 WHERE id_usuario = ?';

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
        WHERE m.activo = 1
          AND m.nombre LIKE ?
          AND m.cantidad > 0
    `;

    conexion.query(query, [`%${nombreBuscado}%`], (err, resultados) => {
        if (err) {
            console.error('Error al buscar medicamentos:', err);
            return res.status(500).send('Error al buscar medicamentos');
        }

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

    const query = 'UPDATE medicamentos SET activo = 0 WHERE id_medicamentos = ?';

    conexion.query(query, [id_medicamentos], (err) => {
        if (err) {
            console.error('Error al eliminar el medicamento:', err);
            return res.status(500).send('Error al eliminar el medicamento');
        }

        res.redirect(`/menu_admin/buscar-medicamento?nombre=${encodeURIComponent(nombreBuscado)}`);
    });
}


function actualizarMedicamento(req, res) {
    const idMedicamento = req.params.id_medicamentos;
    const { nombre, precio, cantidad, fecha_caducidad, presentation_id, controlado_id, proveedor_id } = req.body;

    // Validación
    if (!nombre || !precio || !cantidad || !fecha_caducidad || !presentation_id || !controlado_id) {
        req.flash("error", "Todos los campos son obligatorios.");
        return res.redirect("back");
    }

    const proveedorIdFinal = proveedor_id || null;
    const presentacionIdFinal = presentation_id || null;

    const query = `
        UPDATE medicamentos 
        SET nombre = ?, precio = ?, cantidad = ?, fecha_caducidad = ?, 
            presentation_id = ?, controlado_id = ?, proveedores_id = ?
        WHERE id_medicamentos = ?
    `;

    const values = [
        nombre, precio, cantidad, fecha_caducidad,
        presentacionIdFinal, controlado_id, proveedorIdFinal,
        idMedicamento
    ];

    conexion.query(query, values, (err) => {
        if (err) {
            console.error("Error al actualizar medicamento:", err);
            req.flash("error", "Error al actualizar el medicamento.");
            return res.redirect("back");
        }

        // 🔹 Guarda mensaje de éxito
        req.flash("success", "El medicamento se actualizó correctamente.");

        // 🔹 Vuelve a la vista anterior
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
                                        proveedores: proveedoresResults,
                                        success: req.flash("success"),
                                        error: req.flash("error")
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

                // ⏰ FECHA CORRECTA DE MÉXICO
               const fechaMexico = new Date().toLocaleString("sv-SE", {
                    timeZone: "America/Mexico_City"
                }).replace(" ", "T");


                // Actualizar inventario
                conexion.query(
                    'UPDATE medicamentos SET cantidad = cantidad - ? WHERE id_medicamentos = ?',
                    [cantidad_vendida, medicamento.id],
                    (error) => {
                        if (error) {
                            errores.push(`Error al actualizar inventario de ${nombre_medicamento}`);
                            return reject(error);
                        }

                        // Insertar venta con nombre_medicamento y fecha
conexion.query(
    `INSERT INTO ventas 
     (cantidad, precio_unitario, total, id_usuario, id_medicamento, nombre_medicamento, id_cliente, fecha_venta)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
        cantidad_vendida, 
        precio_unitario, 
        total_venta, 
        id_usuario, 
        medicamento.id, 
        nombre_medicamento, 
        id_clientes,
        fechaMexico
    ],
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
               IFNULL(u.nombre, 'Usuario') AS vendedor,
               IFNULL(c.nombre, 'Eliminado') AS cliente
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

        res.redirect('/menu_admin/historial_ventas');
    });
}



// ==========================================================
//          EXPORTAR HISTORIAL DE VENTAS A PDF
// ==========================================================

function exportarVentasPDF(req, res) {
    const PDFDocument = require('pdfkit');

    // ==============================
    // FUNCIÓN PARA FECHA DE MÉXICO
    // ==============================
    function fechaMX(fecha) {
        const f = new Date(fecha.getTime() - (fecha.getTimezoneOffset() * 60000));
        return `${f.getDate().toString().padStart(2,'0')}/${
            (f.getMonth()+1).toString().padStart(2,'0')
        }/${f.getFullYear()}`;
    }

    const query = `
        SELECT 
            v.fecha_venta, 
            v.nombre_medicamento AS medicamento, 
            v.cantidad, 
            v.precio_unitario, 
            v.total,
            IFNULL(u.nombre, 'Usuario') AS vendedor,
            IFNULL(c.nombre, 'Eliminado') AS cliente
        FROM ventas v
        LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario
        LEFT JOIN clientes c ON v.id_cliente = c.id_clientes
        ORDER BY v.fecha_venta DESC;
    `;

    conexion.query(query, (err, ventas) => {
        if (err) {
            console.error('Error al obtener datos de ventas:', err);
            return res.status(500).send('Error al generar reporte');
        }

        // Crear PDF
        const doc = new PDFDocument({ margin: 40, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="historial_ventas.pdf"');
        doc.pipe(res);

        // ==============================
        // ENCABEZADO GENERAL
        // ==============================
        doc.fontSize(18).text('Centro de Salud de Teoloyucan', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(14).text('Historial de Ventas - MediStock', { align: 'center' });
        doc.moveDown(0.5);

        // FECHA CORREGIDA (Railway no adelantará el día)
        const fechaGen = new Intl.DateTimeFormat('es-MX', {
            timeZone: 'America/Mexico_City',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(new Date());

        doc.fontSize(10).text(`Fecha de generación: ${fechaGen}`, { align: 'right' });
        doc.moveDown(2);

        // ==============================
        // CASO: NO HAY DATOS
        // ==============================
        if (ventas.length === 0) {
            doc.fontSize(14).text('No se encontraron ventas registradas.', { align: 'center' });
            doc.end();
            return;
        }

        // ==============================
        // TABLA
        // ==============================
        const columnas = [
            { header: 'Fecha de Venta', width: 90 },
            { header: 'Medicamento', width: 100 },
            { header: 'Cantidad', width: 60 },
            { header: 'Precio Unitario', width: 80 },
            { header: 'Total', width: 70 },
            { header: 'Vendedor', width: 80 },
            { header: 'Cliente', width: 90 }
        ];

        const tableWidth = columnas.reduce((sum, c) => sum + c.width, 0);

        const computeStartX = () => {
            const pageWidth = doc.page.width;
            const marginLeft = doc.page.margins.left || 40;
            const marginRight = doc.page.margins.right || 40;
            const usableWidth = pageWidth - marginLeft - marginRight;
            const offset = Math.max(0, (usableWidth - tableWidth) / 2);
            return marginLeft + offset;
        };

        let startX = computeStartX();
        let endX = startX + tableWidth;
        let y = doc.y;

        // ENCABEZADOS
        doc.font('Helvetica-Bold').fontSize(10);
        let x = startX;
        columnas.forEach(col => {
            doc.text(col.header, x, y, { width: col.width, align: 'left' });
            x += col.width;
        });

        y += 18;
        doc.moveTo(startX, y - 5).lineTo(endX, y - 5).stroke();
        doc.font('Helvetica').fontSize(9);

        // FILAS
        ventas.forEach(v => {
            if (y > 750) {
                doc.addPage();
                startX = computeStartX();
                endX = startX + tableWidth;
                y = 50;

                // Redibujar encabezados
                x = startX;
                doc.font('Helvetica-Bold').fontSize(10);
                columnas.forEach(col => {
                    doc.text(col.header, x, y, { width: col.width });
                    x += col.width;
                });

                y += 18;
                doc.moveTo(startX, y - 5).lineTo(endX, y - 5).stroke();
                doc.font('Helvetica').fontSize(9);
            }

            // CORREGIR FECHA DE CADA VENTA (esto ya funcionaba bien)
            const fechaOK = fechaMX(new Date(v.fecha_venta));

            const datos = [
                fechaOK,
                v.medicamento,
                v.cantidad.toString(),
                `$${Number(v.precio_unitario).toFixed(2)}`,
                `$${Number(v.total).toFixed(2)}`,
                v.vendedor,
                v.cliente
            ];

            x = startX;
            datos.forEach((dato, i) => {
                doc.text(dato, x, y, { width: columnas[i].width, align: 'left' });
                x += columnas[i].width;
            });

            y += 16;
            doc.moveTo(startX, y - 3).lineTo(endX, y - 3)
                .strokeColor('#dddddd')
                .stroke();
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
