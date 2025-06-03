const express = require('express');
const router = express.Router();
const Menu_adminController = require('../controllers/Menu_adminController'); 

router.get('/inicio_admin', Menu_adminController.inicio_admin);    

router.get('/medicamentos_admin', Menu_adminController.vista_medicamentos);         //registrar medicamwntos   vista
router.post('/medicamentos_admin', Menu_adminController.insertarMedicamento);         //registrar medicamwntos   datos

router.get('/clientes_admin', Menu_adminController.vista_clientes);    
router.post('/clientes_admin', Menu_adminController.post_clientes);
router.get('/buscar-cliente', Menu_adminController.buscarCliente);

//resultados de busqueda
router.get('/editarcliente_buscar/:id_clientes',  Menu_adminController.mostrarFormularioEdicion);
router.post('/editarcliente_buscar/:id_clientes',  Menu_adminController.actualizarCliente);
router.get('/resultadoCliente/:id_clientes', Menu_adminController.mostrarClienteActualizado);
router.post('/eliminar_cliente/:id_clientes',  Menu_adminController.eliminarCliente);

/////////////////////////////////////////////////////////////////////////////////////////////////////////

router.get('/datos_medicamentos_admin', Menu_adminController.vista_datos_medicamentos);
router.post('/datos_medicamentos_admin', Menu_adminController.post_datos_medicamentos);





router.get('/tabla_medicamentos', Menu_adminController.tabla_medicamentos);
router.get('/tabla_clientes', Menu_adminController.tabla_clientes);
router.get('/tabla_proveedores', Menu_adminController.tabla_proveedores);


router.get('/reporte_medicamentos', Menu_adminController.generarReportePDF);

router.get('/proveedores_admin', Menu_adminController.vista_proveedores);    
router.post('/proveedores_admin', Menu_adminController.post_proveedores);
router.get('/administrar_proveedores', Menu_adminController.administrar_proveedores);
router.get('/administrar_proveedores/modificar_proveedor/:id_proveedores', Menu_adminController.editarProveedor);
router.post('/administrar_proveedores/modificar_proveedor/:id_proveedores', Menu_adminController.actualizarProveedor);
router.post('/eliminar_proveedor/:id_proveedores', Menu_adminController.eliminarProveedor);
router.get('/buscar-proveedor', Menu_adminController.buscarProveedor);

router.get('/administrar_usuarios/', Menu_adminController.administrar_usuarios); 
router.get('/administrar_usuarios/modificar_usuarios/:id_usuarios', Menu_adminController.editarUsuario);
router.post('/administrar_usuarios/modificar_usuarios/:id_usuarios', Menu_adminController.actualizarUsuario);

router.post('/administrar_usuarios/', Menu_adminController.formulario); 





router.post('/administrar_usuarios/:id_usuario',  Menu_adminController.eliminarUsuario);

router.post('/venta', Menu_adminController.venta_medicamentos_vista);    
router.get('/venta', Menu_adminController.venta_medicamentos); 

router.get('/historial_ventas', Menu_adminController.historialVentas);          // Vista principal del historial
router.get('/buscar_ventas', Menu_adminController.buscarVentas);  

router.get('/modificar_medicamento/:id_medicamentos', Menu_adminController.editarMedicamento);
router.post('/modificar_medicamento/:id_medicamentos', Menu_adminController.actualizarMedicamento);
router.post('/eliminar_medicamento/:id_medicamentos', Menu_adminController.eliminarMedicamento);
router.get('/buscar-medicamento', Menu_adminController.buscarMedicamento);

router.post('/historial_ventas/eliminar/:id_venta', Menu_adminController.eliminarVenta);

module.exports = router;