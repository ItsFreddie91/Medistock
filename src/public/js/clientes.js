        // Capturar el evento submit del formulario
        document.getElementById('formulario-cliente').addEventListener('submit', async (event) => {
            event.preventDefault(); // Evita la recarga de la página
    
            // Obtener los datos del formulario
            const formData = new FormData(event.target);
            const data = Object.fromEntries(formData);
    
            try {
                // Enviar los datos al servidor
                const response = await fetch('/menu/clientes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });
    
                // Verificar si la respuesta fue exitosa
                if (response.ok) {
                    // Mostrar el mensaje de alerta
                    alert('Cliente agregado exitosamente!');
    
                    // Limpiar el formulario
                    event.target.reset();
                } else {
                    alert('Hubo un error al agregar el cliente.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('No se pudo conectar con el servidor.');
            }
        });