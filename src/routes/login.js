const express = require('express');
const LoginController = require('../controllers/LoginController');
const router = express.Router();

router.get('/', LoginController.mostrarLogin);
router.post('/', LoginController.autenticarUsuario);
router.get('/registro', LoginController.registro);
router.post('/registro', LoginController.formulario);

module.exports = router;