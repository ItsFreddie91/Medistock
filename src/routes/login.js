const express = require('express');
const LoginController = require('../controllers/LoginController');
const router = express.Router();

router.get('/', LoginController.mostrarLogin);
router.post('/', LoginController.autenticarUsuario);

module.exports = router;