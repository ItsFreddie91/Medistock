function handleDisconnect() {
  conexion = mysql.createConnection(db_config);

  conexion.connect(function (err) {
    if (err) {
      console.error('Error al reconectar con la base de datos:', err);
      setTimeout(handleDisconnect, 2000); // Intenta de nuevo en 2s
    } else {
      console.log('Reconectado a la base de datos');
    }
  });

  conexion.on('error', function (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.warn('Conexión perdida, reconectando...');
      handleDisconnect(); // Reintenta conexión
    } else {
      throw err;
    }
  });
}

handleDisconnect(); // Llama esto al arrancar tu app
