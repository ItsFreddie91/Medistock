document.addEventListener('DOMContentLoaded', function () {
    const selectMedicamento = document.getElementById('medicamento');
    const inputCantidad = document.getElementById('cantidad');
    const btnAgregar = document.getElementById('btnAgregar');
    const listaMedicamentos = document.getElementById('listaMedicamentos');
    const totalElement = document.getElementById('total');
    const btnRealizarVenta = document.getElementById('btnRealizarVenta');

    let medicamentosSeleccionados = [];
    let total = 0;

    btnAgregar.addEventListener('click', function () {
        const medicamentoId = selectMedicamento.value;
        const nombreMedicamento = selectMedicamento.selectedOptions[0].text;
        const precio = parseFloat(selectMedicamento.selectedOptions[0].dataset.precio || 0);
        const cantidad = parseInt(inputCantidad.value, 10);

        if (!medicamentoId || medicamentoId === "") {
            alert("Por favor, selecciona un medicamento.");
            return;
        }

        if (isNaN(cantidad) || cantidad <= 0) {
            alert("Por favor, ingresa una cantidad válida.");
            inputCantidad.focus();
            return;
        }

        // Verificar si el medicamento ya está en la lista
        const existente = medicamentosSeleccionados.find(m => m.id === medicamentoId);
        if (existente) {
            existente.cantidad += cantidad;
        } else {
            medicamentosSeleccionados.push({
                id: medicamentoId,
                nombre: nombreMedicamento,
                precio: precio,
                cantidad: cantidad
            });
        }

        actualizarLista();
        inputCantidad.value = "";
    });

    function actualizarLista() {
        listaMedicamentos.innerHTML = '';
        total = 0; // Reiniciar total

        medicamentosSeleccionados.forEach((medicamento, index) => {
            total += medicamento.precio * medicamento.cantidad;

            const listItem = document.createElement('li');
            listItem.innerHTML = `${medicamento.nombre} - Cantidad: ${medicamento.cantidad} - Precio: $${(medicamento.precio * medicamento.cantidad).toFixed(2)}
            <button onclick="eliminarMedicamento(${index})">Eliminar</button>`;
            listaMedicamentos.appendChild(listItem);
        });

        totalElement.textContent = `$${total.toFixed(2)}`;
    }

    window.eliminarMedicamento = function (index) {
        total -= medicamentosSeleccionados[index].precio * medicamentosSeleccionados[index].cantidad;
        medicamentosSeleccionados.splice(index, 1);
        actualizarLista();
    };

    btnRealizarVenta.addEventListener('click', function () {
        if (medicamentosSeleccionados.length === 0) {
            alert("No hay medicamentos para vender.");
            return;
        }
    
        const clienteId = document.getElementById('cliente').value;  // Cambia esto si es necesario
        console.log(clienteId); // Verifica si el valor se está obteniendo correctamente
    
        if (!clienteId) {
            alert("Por favor, selecciona un cliente.");
            return;
        }
        console.log("Cliente ID que se está enviando:", clienteId);
        fetch('venta', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                medicamentos: medicamentosSeleccionados,
                id_clientes: clienteId  // Actualiza esto a 'id_clientes'
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Venta realizada con éxito.');
                location.reload();
            } else {
                alert('Ocurrió un error al realizar la venta.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Seleccione Medicamentos a Vender.');
        });
    });
});