document.getElementById('formulario-medicamento').addEventListener('submit', async (event) => {
    event.preventDefault(); // Esto previene que el formulario se envíe dos veces

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    try {
        const response = await fetch('/menu_admin/medicamentos_admin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (response.ok) {
            alert('Medicamento registrado exitosamente!');
            event.target.reset();
        } else {
            alert('Hubo un error al registrar el medicamento.');
        }
    } catch (error) {
        alert('Error al conectar con el servidor.');
        console.error(error);
    }
});
