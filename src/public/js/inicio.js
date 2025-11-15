document.addEventListener('DOMContentLoaded', () => {
    // Establecer un retraso para mostrar los mensajes después de cargar la página
    setTimeout(() => {
        const mensajesProximos = <%- mensajesProximos %>;
        const mensajesAgotarse = <%- mensajesAgotarse %>;

        // Construir una alerta con todos los medicamentos próximos a caducar
        if (mensajesProximos.length > 0) {
            const alertaProximos = mensajesProximos.join('\n'); // Une los mensajes con saltos de línea
            alert(`Medicamentos próximos a caducar:\n\n${alertaProximos}`);
        }

        // Construir una alerta con todos los medicamentos con cantidad baja
        if (mensajesAgotarse.length > 0) {
            const alertaAgotarse = mensajesAgotarse.join('\n'); // Une los mensajes con saltos de línea
            alert(`Medicamentos con cantidades bajas:\n\n${alertaAgotarse}`);
        }
    }, 500); // Retraso de 500 ms (medio segundo)
});