document.addEventListener('DOMContentLoaded', (event) => {
    // ===========================================
    // 1. OBTENER ELEMENTOS DEL DOM
    // ===========================================
    const clientForm = document.getElementById('client-form');
    const clientNameInput = document.getElementById('client-name');
    const paymentPlanSelect = document.getElementById('payment-plan');
    const startDateInput = document.getElementById('start-date');
    const notificationContainer = document.getElementById('notification-container');
    const notificationMessage = document.getElementById('notification-message');
    const clientList = document.getElementById('client-list');
    const detailsPaymentList = document.getElementById('details-payment-list');
    const amountToPaySpan = document.getElementById('amount-to-pay');
    const acceptPaymentBtn = document.getElementById('accept-payment-btn');
    const clientIndexInput = document.getElementById('client-index');
    const paidAmountSpan = document.getElementById('details-paid-amount');
    const remainingAmountSpan = document.getElementById('details-remaining-amount');
    const generateTicketBtn = document.getElementById('generate-ticket-btn');

    // Elementos de navegación y secciones
    const navButtons = document.querySelectorAll('.nav-btn');
    const showRegisterBtn = document.getElementById('show-register-btn');
    const showListBtn = document.getElementById('show-list-btn');
    const showInventoryBtn = document.getElementById('show-inventory-btn');
    const registerSection = document.getElementById('register-section');
    const listSection = document.getElementById('list-section');
    const detailsSection = document.getElementById('details-section');
    const inventorySection = document.getElementById('inventory-section');
    const backToListBtn = document.getElementById('back-to-list-btn');
    const detailsClientName = document.getElementById('details-client-name');
    const detailsPlan = document.getElementById('details-plan');
    const detailsTotalPayments = document.getElementById('details-total-payments');
    const detailsTotalCommission = document.getElementById('details-total-commission');
    const detailsFinalAmount = document.getElementById('details-final-amount');

    // Elementos del resumen financiero (anteriormente inventario)
    const financialSummaryList = document.getElementById('inventory-list');
    const totalPaidGlobalSpan = document.getElementById('total-paid-global');
    const totalFinalGlobalSpan = document.getElementById('total-final-global');

    let currentClient = null;

    // ===========================================
    // 2. FUNCIONES DE LÓGICA DE NEGOCIO
    // ===========================================
    function mostrarNotificacion(mensaje) {
        notificationMessage.textContent = mensaje;
        notificationContainer.classList.add('show');
        setTimeout(() => {
            notificationContainer.classList.remove('show');
        }, 3000);
    }

    function generarPagos(plan, startDate) {
        let pagosDelMes = [];
        const fechaBase = new Date(startDate);
        for (let dia = 1; dia <= 30; dia++) {
            let montoDiario = dia * plan;
            let fechaPago = new Date(fechaBase);
            fechaPago.setDate(fechaBase.getDate() + dia - 1);
            pagosDelMes.push({
                fecha: fechaPago.toISOString().split('T')[0],
                monto: montoDiario,
                estado: "Pendiente"
            });
        }
        return pagosDelMes;
    }

    function calcularTotales(pagos, plan) {
        let totalPagos = 0;
        pagos.forEach(pago => totalPagos += pago.monto);
        const comisionBase = 65;
        const comisionTotal = comisionBase * plan;
        const montoFinalCliente = totalPagos - comisionTotal;
        return {
            totalPagos: totalPagos,
            comisionTotal: comisionTotal,
            montoFinal: montoFinalCliente
        };
    }

    function actualizarTotalesDePagos(cliente) {
        let pagado = 0;
        cliente.pagos.forEach(pago => {
            if (pago.estado === 'Pagado') {
                pagado += pago.monto;
            }
        });
        const porPagar = cliente.totales.totalPagos - pagado;
        paidAmountSpan.textContent = `$${pagado.toFixed(2)}`;
        remainingAmountSpan.textContent = `$${porPagar.toFixed(2)}`;
    }

    function marcarPagosSeleccionados(cliente) {
        const checkboxes = detailsPaymentList.querySelectorAll('input[type="checkbox"]:checked');
        if (checkboxes.length === 0) {
            mostrarNotificacion('Por favor, selecciona al menos un día.');
            return;
        }

        const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
        const clienteIndex = clientes.findIndex(c => c.name === cliente.name);
        
        checkboxes.forEach(checkbox => {
            const pagoIndex = parseInt(checkbox.value);
            clientes[clienteIndex].pagos[pagoIndex].estado = 'Pagado';
        });

        localStorage.setItem('clientes', JSON.stringify(clientes));
        mostrarNotificacion('Pagos registrados con éxito.');

        currentClient = clientes[clienteIndex];
        mostrarDetalleCliente(currentClient);
    }

    // ===========================================
// NUEVAS FUNCIONES DE RESUMEN FINANCIERO
// ===========================================
function mostrarResumenFinanciero() {
    const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    const financialSummaryList = document.getElementById('inventory-list');
    const totalPaidGlobalSpan = document.getElementById('total-paid-global');
    const totalFinalGlobalSpan = document.getElementById('total-final-global');
    
    financialSummaryList.innerHTML = '';
    let totalPaidGlobal = 0;
    let totalFinalGlobal = 0;

    if (clientes.length === 0) {
        financialSummaryList.innerHTML = '<p>No hay clientes registrados.</p>';
        totalPaidGlobalSpan.textContent = `$0.00`;
        totalFinalGlobalSpan.textContent = `$0.00`;
        return;
    }

    clientes.forEach(cliente => {
        let pagadoPorCliente = 0;
        cliente.pagos.forEach(pago => {
            if (pago.estado === 'Pagado') {
                pagadoPorCliente += pago.monto;
            }
        });

        totalPaidGlobal += pagadoPorCliente;
        totalFinalGlobal += cliente.totales.montoFinal;

        const li = document.createElement('li');
        li.innerHTML = `
            <div class="client-summary-item">
                <span><strong>${cliente.name}</strong></span>
                <span>$${pagadoPorCliente.toFixed(2)}</span>
                <span>$${cliente.totales.totalPagos.toFixed(2)}</span>
                <span>$${cliente.totales.montoFinal.toFixed(2)}</span>
            </div>
        `;
        financialSummaryList.appendChild(li);
    });

    totalPaidGlobalSpan.textContent = `$${totalPaidGlobal.toFixed(2)}`;
    totalFinalGlobalSpan.textContent = `$${totalFinalGlobal.toFixed(2)}`;
}

    // ===========================================
    // FUNCIONES DE VISTA
    // ===========================================
    function showSection(sectionId) {
        document.querySelectorAll('.page-section').forEach(section => {
            section.classList.add('hidden');
        });
        document.getElementById(sectionId).classList.remove('hidden');

        navButtons.forEach(btn => btn.classList.remove('active'));
        if (sectionId === 'register-section') {
            showRegisterBtn.classList.add('active');
        } else if (sectionId === 'list-section') {
            showListBtn.classList.add('active');
        } else if (sectionId === 'inventory-section') {
            showInventoryBtn.classList.add('active');
        }
    }

    function mostrarDetalleCliente(cliente) {
        currentClient = cliente;
        showSection('details-section');
        
        detailsClientName.textContent = cliente.name;
        detailsPlan.textContent = `Plan ${cliente.plan}`;
        detailsTotalPayments.textContent = `$${cliente.totales.totalPagos.toFixed(2)}`;
        detailsTotalCommission.textContent = `$${cliente.totales.comisionTotal.toFixed(2)}`;
        detailsFinalAmount.textContent = `$${cliente.totales.montoFinal.toFixed(2)}`;
        
        actualizarTotalesDePagos(cliente);
        
        detailsPaymentList.innerHTML = '';
        cliente.pagos.forEach((pago, index) => {
            const li = document.createElement('li');
            li.classList.add('payment-item');
            
            if (pago.estado === 'Pagado') {
                li.classList.add('paid');
                li.innerHTML = `
                    <div class="payment-info">
                        <span class="payment-date">Día ${index + 1}: ${pago.fecha}</span>
                        <span class="payment-amount">$${pago.monto.toFixed(2)}</span>
                    </div>
                    <span class="payment-status-text">Pagado</span>
                `;
            } else {
                li.innerHTML = `
                    <div class="payment-info">
                        <span class="payment-date">Día ${index + 1}: ${pago.fecha}</span>
                        <span class="payment-amount">$${pago.monto.toFixed(2)}</span>
                    </div>
                    <input type="checkbox" class="payment-checkbox" value="${index}">
                `;
            }
            detailsPaymentList.appendChild(li);
        });

        amountToPaySpan.textContent = '$0.00';

        const todosPagosCompletados = cliente.pagos.every(pago => pago.estado === 'Pagado');
        if (todosPagosCompletados) {
            generateTicketBtn.classList.remove('hidden');
            acceptPaymentBtn.classList.add('hidden');
        } else {
            generateTicketBtn.classList.add('hidden');
            acceptPaymentBtn.classList.remove('hidden');
        }
    }

    function mostrarClientes() {
        const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
        clientList.innerHTML = '';

        if (clientes.length === 0) {
            clientList.innerHTML = '<p>No hay clientes registrados.</p>';
            return;
        }

        clientes.forEach((cliente, index) => {
            const li = document.createElement('li');
            li.classList.add('client-item');
            
            li.innerHTML = `
                <span class="client-name">${cliente.name}</span>
                <div class="client-actions">
                    <button class="edit-btn" data-index="${index}">Editar</button>
                    <button class="delete-btn" data-index="${index}">Eliminar</button>
                </div>
            `;
            
            li.querySelector('.client-name').addEventListener('click', () => {
                mostrarDetalleCliente(cliente);
            });

            clientList.appendChild(li);
        });

        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const clienteIndex = event.target.dataset.index;
                eliminarCliente(clienteIndex);
            });
        });

        const editButtons = document.querySelectorAll('.edit-btn');
        editButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const clienteIndex = event.target.dataset.index;
                cargarFormularioParaEditar(clienteIndex);
            });
        });
    }

    // ===========================================
    // FUNCIONES DE MANEJO DE DATOS
    // ===========================================
    function eliminarCliente(index) {
        const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
        const confirmacion = confirm("¿Estás seguro de que quieres eliminar a este cliente?");
        if (confirmacion) {
            clientes.splice(index, 1);
            localStorage.setItem('clientes', JSON.stringify(clientes));
            mostrarClientes();
            mostrarNotificacion("Cliente eliminado con éxito.");
        }
    }

    function cargarFormularioParaEditar(index) {
        const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
        const clienteAEditar = clientes[index];
        clientNameInput.value = clienteAEditar.name;
        paymentPlanSelect.value = clienteAEditar.plan;
        startDateInput.value = clienteAEditar.pagos[0].fecha;
        clientIndexInput.value = index;
        clientForm.querySelector('button').textContent = "Guardar Cambios";
        showSection('register-section');
    }

    function generarTicket(cliente) {
        const ticketContent = `
            <h2>RECIBO DE PAGO</h2>
            <p><strong>Cliente:</strong> ${cliente.name}</p>
            <p><strong>Plan de Pagos:</strong> Plan ${cliente.plan}</p>
            <p><strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString()}</p>
            <hr>
            <h3>Resumen de Pagos</h3>
            <p><strong>Total de Pagos:</strong> $${cliente.totales.totalPagos.toFixed(2)}</p>
            <p><strong>Total Pagado:</strong> $${cliente.totales.totalPagos.toFixed(2)}</p>
            <p><strong>Total Comisión:</strong> $${cliente.totales.comisionTotal.toFixed(2)}</p>
            <p><strong>Monto Final a Entregar:</strong> $${cliente.totales.montoFinal.toFixed(2)}</p>
            <hr>
            <p><strong>¡Gracias por tu pago completo!</strong></p>
        `;
    
        const printWindow = window.open('', '', 'height=600,width=400');
        printWindow.document.write('<html><head><title>Ticket de Pago</title>');
        printWindow.document.write('<style>body { font-family: Arial, sans-serif; padding: 20px; } h2 { text-align: center; } p { margin: 5px 0; } hr { border: 1px dashed #ccc; margin: 10px 0; }</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(ticketContent);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
    
        printWindow.print();
    }

    // ===========================================
    // 5. MANEJO DE EVENTOS
    // ===========================================
    clientForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const clientName = clientNameInput.value.trim();
        const paymentPlan = parseInt(paymentPlanSelect.value);
        const startDate = startDateInput.value;
        const indexToUpdate = clientIndexInput.value;

        if (clientName === '' || startDate === '') {
            mostrarNotificacion('Por favor, ingresa el nombre y la fecha de inicio.');
            return;
        }

        const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
        const pagos = generarPagos(paymentPlan, startDate);
        const totales = calcularTotales(pagos, paymentPlan);

        let newClient = {
            name: clientName,
            plan: paymentPlan,
            pagos: pagos,
            totales: totales
        };

        if (indexToUpdate !== "") {
            newClient.pagos = clientes[indexToUpdate].pagos;
            newClient.totales = calcularTotales(newClient.pagos, paymentPlan);
            clientes[indexToUpdate] = newClient;
            mostrarNotificacion(`Cliente "${clientName}" actualizado con éxito.`);
        } else {
            clientes.push(newClient);
            mostrarNotificacion(`Cliente "${clientName}" registrado con éxito.`);
        }

        localStorage.setItem('clientes', JSON.stringify(clientes));
        clientForm.reset();
        clientIndexInput.value = "";
        clientForm.querySelector('button').textContent = "Registrar Cliente";
        mostrarClientes();
        showSection('list-section');
    });

    detailsPaymentList.addEventListener('change', (event) => {
        if (event.target.classList.contains('payment-checkbox')) {
            let totalAmount = 0;
            const checkboxes = detailsPaymentList.querySelectorAll('input[type="checkbox"]:checked');
            checkboxes.forEach(checkbox => {
                const pagoIndex = parseInt(checkbox.value);
                totalAmount += currentClient.pagos[pagoIndex].monto;
            });
            amountToPaySpan.textContent = `$${totalAmount.toFixed(2)}`;
        }
    });

    acceptPaymentBtn.addEventListener('click', () => {
        marcarPagosSeleccionados(currentClient);
    });

    generateTicketBtn.addEventListener('click', () => {
        generarTicket(currentClient);
    });

    showRegisterBtn.addEventListener('click', () => {
        clientForm.reset();
        clientIndexInput.value = "";
        clientForm.querySelector('button').textContent = "Registrar Cliente";
        showSection('register-section');
    });

    showListBtn.addEventListener('click', () => {
        mostrarClientes();
        showSection('list-section');
    });
    
    showInventoryBtn.addEventListener('click', () => {
        showSection('inventory-section');
        mostrarResumenFinanciero(); // Llama a la nueva función
    });
    
    backToListBtn.addEventListener('click', () => {
        showSection('list-section');
        mostrarClientes();
    });
    
    // Iniciar la app en la sección de registro
    showSection('register-section');
});