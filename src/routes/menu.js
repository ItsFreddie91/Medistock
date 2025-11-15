const express = require('express');
const router = express.Router();
const Menu_Controller = require('../controllers/Menu_Controller'); 

router.get('/inicio', Menu_Controller.inicio);    

router.get('/medicamentos', Menu_Controller.vista_medicamentos);         
router.post('/medicamentos', Menu_Controller.insertarMedicamento);        

router.get('/clientes', Menu_Controller.vista_clientes);    
router.post('/clientes', Menu_Controller.post_clientes);
router.get('/buscar-cliente', Menu_Controller.buscarCliente);

//resultados de busqueda
router.get('/editarcliente_buscar/:id_clientes',  Menu_Controller.mostrarFormularioEdicion);
router.post('/editarcliente_buscar/:id_clientes',  Menu_Controller.actualizarCliente);
router.get('/resultadoCliente/:id_clientes', Menu_Controller.mostrarClienteActualizado);
router.post('/eliminar_cliente/:id_clientes',  Menu_Controller.eliminarCliente);

/////////////////////////////////////////////////////////////////////////////////////////////////////////

router.get('/datos_medicamentos', Menu_Controller.vista_datos_medicamentos);
router.post('/datos_medicamentos', Menu_Controller.post_datos_medicamentos);

router.get('/reporte_medicamentos', Menu_Controller.generarReportePDF);



















router.post('/venta', Menu_Controller.venta_medicamentos_vista);    
router.get('/venta', Menu_Controller.venta_medicamentos);  
router.get('/historial_ventas', Menu_Controller.historialVentas);          // Vista principal del historial
router.get('/buscar_ventas', Menu_Controller.buscarVentas);  

router.post('/historial_ventas/eliminar/:id_venta', Menu_Controller.eliminarVenta);
















router.get('/modificar_medicamento/:id_medicamentos', Menu_Controller.editarMedicamento);
router.post('/modificar_medicamento/:id_medicamentos', Menu_Controller.actualizarMedicamento);
router.post('/eliminar_medicamento/:id_medicamentos', Menu_Controller.eliminarMedicamento);
router.get('/buscar-medicamento', Menu_Controller.buscarMedicamento);


router.get('/tabla_medicamentos', Menu_Controller.tabla_medicamentos);
router.get('/tabla_clientes', Menu_Controller.tabla_clientes);
router.get('/tabla_proveedores', Menu_Controller.tabla_proveedores);


///////////////////////DPF VENTAS//////////////////////////////

router.get('/pdf', Menu_Controller.exportarVentasPDF);







module.exports = router;