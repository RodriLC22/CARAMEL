// Logo en Base64 de un icono de cupcake simple como placeholder premium
const LOGO_BASE64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Q5NzczNiIgcng9IjIwIi8+CiAgPHBhdGggZD0iTTM1LDc1IEw2NSw3NSBMNzAsNTAgTDMwLDUwIFoiIGZpbGw9IiNmZGZhZjYiLz4KICA8cGF0aCBkPSJNMzAsNTAgQzMwLDM1IDcwLDM1IDcwLDUwIFoiIGZpbGw9IiNmZGZhZjYiLz4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjMwIiByPSI2IiBmaWxsPSIjZTUzOTM1Ii8+Cjwvc3ZnPg==";

// Estado inicial del inventario
const QR_BASE64 = "qr.jpeg";


const defaultProducts = [
    { id: 1, name: "Alfajor Vainilla", price: 8.00, stock: 100, icon: "🥮" },
    { id: 2, name: "Alfajor Chocolate", price: 10.00, stock: 100, icon: "🍫" },
    { id: 3, name: "Tres leche Vaso", price: 17.00, stock: 100, icon: "🍰" },
    { id: 4, name: "Pie de limón", price: 12.00, stock: 100, icon: "🍋" },
    { id: 5, name: "Cupcake", price: 12.00, stock: 100, icon: "🧁" },
    { id: 6, name: "Torta Matilda", price: 17.00, stock: 100, icon: "🎂" },
    { id: 7, name: "Gelatina", price: 5.00, stock: 100, icon: "🍮" },
    { id: 8, name: "Budin", price: 7.00, stock: 100, icon: "🍞" },
    { id: 9, name: "Torta personal", price: 40.00, stock: 100, icon: "🍰" },
    { id: 10, name: "Torta mediana", price: 150.00, stock: 100, icon: "🎂" },
    { id: 11, name: "Torta Chocolate Vaso", price: 17.00, stock: 100, icon: "🍫" },
    { id: 12, name: "Torta Mixta Vaso", price: 17.00, stock: 100, icon: "🍰" }
];

let products = [];
let cart = [];
let transactions = [];

// Inicialización
function init() {
    document.getElementById('store-logo').src = LOGO_BASE64;
    document.getElementById('qr-image').src = QR_BASE64;
    loadData();
    renderProducts();
    updateCartUI();

    // Listeners
    document.getElementById('cash-received').addEventListener('input', calculateChange);
    document.getElementById('btn-checkout').addEventListener('click', processCheckout);
    document.getElementById('btn-history').addEventListener('click', openHistory);
    document.getElementById('btn-close-modal').addEventListener('click', closeHistory);
    
    document.getElementById('btn-summary').addEventListener('click', openSummary);
    document.getElementById('btn-close-summary').addEventListener('click', closeSummary);
    document.getElementById('btn-download-pdf').addEventListener('click', downloadPDF);
    document.getElementById('btn-clear-history').addEventListener('click', clearHistory);
    
    document.getElementById('btn-planilla').addEventListener('click', openPlanilla);
    document.getElementById('btn-close-planilla').addEventListener('click', closePlanilla);
    document.getElementById('btn-print-planilla').addEventListener('click', printPlanilla);
    
    document.getElementById('btn-stock').addEventListener('click', openDailyStock);
    document.getElementById('btn-close-stock').addEventListener('click', closeDailyStock);
    document.getElementById('btn-save-stock').addEventListener('click', saveDailyStock);
    
    document.getElementById('qr-image').addEventListener('click', openQRModal);
    document.getElementById('btn-close-qr').addEventListener('click', closeQRModal);

    document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
        radio.addEventListener('change', togglePaymentMethod);
    });

    // Service Worker Registration
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('Service Worker Registered'))
            .catch(err => console.log('Service Worker Registration Failed', err));
    }
}

function togglePaymentMethod(e) {
    const isCash = e.target.value === 'cash';
    document.getElementById('cash-payment-section').style.display = isCash ? 'block' : 'none';
    document.getElementById('qr-payment-section').style.display = isCash ? 'none' : 'block';
    calculateChange();
}

// Cargar datos de LocalStorage
function loadData() {
    const storedProducts = localStorage.getItem('caramel_products_v2');
    if (storedProducts) {
        let parsedProducts = JSON.parse(storedProducts);
        // Sincronizar nombres y precios desde defaultProducts por si hubo actualización
        products = parsedProducts.map(p => {
            const dp = defaultProducts.find(d => d.id === p.id);
            if (dp) {
                return { ...p, name: dp.name, price: dp.price, icon: dp.icon };
            }
            return p;
        });
        
        // Agregar nuevos productos que no existan en localStorage
        defaultProducts.forEach(dp => {
            if (!products.find(p => p.id === dp.id)) {
                products.push({...dp});
            }
        });
        
    } else {
        products = [...defaultProducts];
        saveProducts();
    }

    const storedTransactions = localStorage.getItem('caramel_transactions_v2');
    if (storedTransactions) {
        transactions = JSON.parse(storedTransactions);
    }
}

function saveProducts() {
    localStorage.setItem('caramel_products_v2', JSON.stringify(products));
}

function saveTransactions() {
    localStorage.setItem('caramel_transactions_v2', JSON.stringify(transactions));
}

// Renderizar Productos
function renderProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = `product-card ${product.stock === 0 ? 'out-of-stock' : ''}`;

        let stockClass = '';
        if (product.stock === 0) stockClass = 'out';
        else if (product.stock < 5) stockClass = 'low';

        card.innerHTML = `
            <div class="product-icon">${product.icon}</div>
            <div class="product-name">${product.name}</div>
            <div class="product-price">$${product.price.toFixed(2)}</div>
            <div class="product-stock ${stockClass}">Stock: ${product.stock}</div>
        `;

        if (product.stock > 0) {
            card.onclick = () => addToCart(product);
        }

        grid.appendChild(card);
    });
}

// Lógica del Carrito
function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);

    // Verificar límite de stock
    const currentQty = existing ? existing.qty : 0;
    if (currentQty >= product.stock) {
        showToast("No hay suficiente stock");
        return;
    }

    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    updateCartUI();
}

function removeFromCart(id) {
    const index = cart.findIndex(item => item.id === id);
    if (index !== -1) {
        if (cart[index].qty > 1) {
            cart[index].qty -= 1;
        } else {
            cart.splice(index, 1);
        }
    }
    updateCartUI();
}

function updateCartUI() {
    const cartContainer = document.getElementById('cart-items');

    if (cart.length === 0) {
        cartContainer.innerHTML = '<div class="empty-cart">Selecciona productos para comenzar</div>';
        document.getElementById('subtotal-amount').textContent = '$0.00';
        document.getElementById('total-amount').textContent = '$0.00';
        document.getElementById('btn-checkout').disabled = true;
        calculateChange();
        return;
    }

    cartContainer.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;

        const el = document.createElement('div');
        el.className = 'cart-item';
        el.innerHTML = `
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-price">$${item.price.toFixed(2)} c/u</div>
            </div>
            <div class="item-controls">
                <button class="btn-qty" onclick="removeFromCart(${item.id})">-</button>
                <span>${item.qty}</span>
                <button class="btn-qty" onclick="addToCart(products.find(p => p.id === ${item.id}))">+</button>
                <span style="font-weight:600; width:60px; text-align:right">$${itemTotal.toFixed(2)}</span>
            </div>
        `;
        cartContainer.appendChild(el);
    });

    document.getElementById('subtotal-amount').textContent = `$${total.toFixed(2)}`;
    document.getElementById('total-amount').textContent = `$${total.toFixed(2)}`;
    document.getElementById('btn-checkout').disabled = false;
    calculateChange();
}

// Calcular Cambio
function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

function calculateChange() {
    const total = getCartTotal();
    const isQR = document.querySelector('input[name="payment-method"]:checked').value === 'qr';
    const cashInput = document.getElementById('cash-received').value;
    const cash = parseFloat(cashInput) || 0;
    const changeDisplay = document.querySelector('.change-display');
    const changeAmount = document.getElementById('change-amount');
    const btnCheckout = document.getElementById('btn-checkout');

    if (cart.length === 0) {
        changeAmount.textContent = '$0.00';
        changeDisplay.classList.remove('negative');
        btnCheckout.disabled = true;
        return;
    }

    if (isQR) {
        btnCheckout.disabled = false;
        return;
    }

    const change = cash - total;

    if (cash > 0 && cash >= total) {
        changeAmount.textContent = `$${change.toFixed(2)}`;
        changeDisplay.classList.remove('negative');
        btnCheckout.disabled = false;
    } else {
        changeAmount.textContent = `Faltan $${Math.abs(change).toFixed(2)}`;
        changeDisplay.classList.add('negative');
        btnCheckout.disabled = true;
    }
}

// Procesar Pago
function processCheckout() {
    const total = getCartTotal();
    const isQR = document.querySelector('input[name="payment-method"]:checked').value === 'qr';
    const cash = isQR ? total : (parseFloat(document.getElementById('cash-received').value) || 0);
    const change = cash - total;

    if (cash < total) return;

    // Disminuir inventario
    cart.forEach(cartItem => {
        const p = products.find(prod => prod.id === cartItem.id);
        if (p) {
            p.stock -= cartItem.qty;
        }
    });

    // Guardar transacción
    const transaction = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        total: total,
        cash: cash,
        change: change,
        paymentMethod: isQR ? 'QR' : 'Efectivo',
        items: [...cart]
    };
    transactions.unshift(transaction); // Agregar al inicio

    saveProducts();
    saveTransactions();

    // Limpiar UI
    cart = [];
    document.getElementById('cash-received').value = '';
    updateCartUI();
    renderProducts();

    const paymentMsg = isQR ? 'Pago con QR completado.' : `Venta Completada. Cambio: $${change.toFixed(2)}`;
    showToast(paymentMsg);
}

// Modal de Historial
function openHistory() {
    const list = document.getElementById('history-list');
    
    if (transactions.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:gray">No hay ventas registradas.</p>';
    } else {
        // Máxima optimización: Construir un solo string gigante en memoria y asignarlo de una vez.
        // Esto es lo más rápido posible para el navegador.
        const html = [...transactions].reverse().map(t => {
            let itemsHtml = t.items.map(i => `<li><span>${i.qty}x ${i.name}</span> <span>$${(i.price * i.qty).toFixed(2)}</span></li>`).join('');

            return `
                <div class="history-card">
                    <div class="history-header">
                        <span>${t.date} ${t.paymentMethod === 'QR' ? '📱 (QR)' : '💵 (Efectivo)'}</span>
                        <span style="color:var(--primary); font-size:18px">Total: $${t.total.toFixed(2)}</span>
                    </div>
                    <div class="history-details">
                        <div>Pago: $${t.cash.toFixed(2)} | Cambio: $${t.change.toFixed(2)}</div>
                        <ul>${itemsHtml}</ul>
                    </div>
                </div>
            `;
        }).join('');
        
        list.innerHTML = html;
    }

    document.getElementById('history-modal').classList.remove('hidden');
}

function closeHistory() {
    document.getElementById('history-modal').classList.add('hidden');
}

// ====== Modal QR ======
function openQRModal() {
    document.getElementById('qr-image-large').src = QR_BASE64;
    document.getElementById('qr-modal').classList.remove('hidden');
}
function closeQRModal() {
    document.getElementById('qr-modal').classList.add('hidden');
}

// ====== Cierre de Caja ======
function openSummary() {
    const content = document.getElementById('summary-content');
    
    if (transactions.length === 0) {
        content.innerHTML = '<p style="text-align:center; color:gray">No hay ventas registradas hoy.</p>';
        document.getElementById('btn-download-pdf').disabled = true;
    } else {
        document.getElementById('btn-download-pdf').disabled = false;
        
        let totalCash = 0;
        let totalQR = 0;
        let itemsCount = {};
        
        transactions.forEach(t => {
            if (t.paymentMethod === 'QR') {
                totalQR += t.total;
            } else {
                totalCash += t.total;
            }
            
            t.items.forEach(i => {
                if (!itemsCount[i.name]) {
                    itemsCount[i.name] = { qty: 0, total: 0 };
                }
                itemsCount[i.name].qty += i.qty;
                itemsCount[i.name].total += (i.price * i.qty);
            });
        });
        
        const grandTotal = totalCash + totalQR;
        
        let tableRows = Object.keys(itemsCount).map(name => {
            let item = itemsCount[name];
            return `<tr>
                <td>${name}</td>
                <td>${item.qty}</td>
                <td>$${item.total.toFixed(2)}</td>
            </tr>`;
        }).join('');

        const today = new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });

        content.innerHTML = `
            <div id="pdf-report" style="padding: 20px; background: white; color: black;">
                <h1 style="text-align:center; color:#d97736; margin-bottom: 5px;">Caramel</h1>
                <h3 style="text-align:center; color:#8c7d70; margin-bottom: 20px;">Cierre de Caja - ${today}</h3>
                
                <div class="summary-total-box">
                    <div>
                        <span>Efectivo</span>
                        <strong>$${totalCash.toFixed(2)}</strong>
                    </div>
                    <div>
                        <span>Pago QR</span>
                        <strong>$${totalQR.toFixed(2)}</strong>
                    </div>
                    <div>
                        <span>Total Ventas</span>
                        <strong style="color:var(--success);">$${grandTotal.toFixed(2)}</strong>
                    </div>
                </div>

                <h4 style="margin-bottom: 10px;">Productos Vendidos</h4>
                <table class="summary-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    document.getElementById('summary-modal').classList.remove('hidden');
}

function closeSummary() {
    document.getElementById('summary-modal').classList.add('hidden');
}

function downloadPDF() {
    const element = document.getElementById('pdf-report');
    const opt = {
      margin:       0.5,
      filename:     'Cierre_Caja_Caramel.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    if (typeof html2pdf === 'undefined') {
        alert("La librería de PDF no pudo cargar. Comprueba tu conexión a internet.");
        return;
    }
    
    html2pdf().set(opt).from(element).save();
}

function clearHistory() {
    if(confirm("¿Estás seguro de que deseas limpiar el historial? Esto borrará todas las ventas y no se puede deshacer.")) {
        transactions = [];
        saveTransactions();
        closeSummary();
        
        // También cerramos historial normal si estuviera abierto
        closeHistory();
        
        showToast("Historial borrado exitosamente.");
    }
}

// Toast
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// ====== Planilla Modal ======
function openPlanilla() {
    const content = document.getElementById('planilla-content');
    
    let itemsCount = {};
    let totalQR = 0;
    let totalBS = 0;
    
    transactions.forEach(t => {
        if (t.paymentMethod === 'QR') {
            totalQR += t.total;
        } else {
            totalBS += t.total;
        }
        
        t.items.forEach(i => {
            if (!itemsCount[i.id]) {
                itemsCount[i.id] = { qty: 0 };
            }
            itemsCount[i.id].qty += i.qty;
        });
    });
    
    const grandTotal = totalQR + totalBS;
    const today = new Date().toLocaleString('es-ES', { dateStyle: 'short' });
    
    let tableRows = products.map(p => {
        let qtySold = itemsCount[p.id] ? itemsCount[p.id].qty : 0;
        let sa = p.stock + qtySold;
        
        // Construir string detalle ej: "+ 17 + 17 + 17"
        let detalleArr = Array(qtySold).fill(p.price);
        let detalleStr = detalleArr.join(' + ');
        if (detalleStr !== '') {
            detalleStr = '+ ' + detalleStr;
        }
        
        return `<tr>
            <td style="text-align:left; border-right:1px solid #ccc; padding:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:140px;" title="${p.name}">${p.name}</td>
            <td style="border-right:1px solid #ccc; padding:6px;">${sa}</td>
            <td style="border-right:1px solid #ccc; padding:6px;"></td>
            <td style="border-right:1px solid #ccc; padding:6px;"></td>
            <td style="text-align:left; font-size:12px; color:#555; border-right:1px solid #ccc; padding:6px; letter-spacing:-0.5px;">${detalleStr}</td>
            <td style="font-weight:bold; color:var(--primary); padding:6px;">${p.stock}</td>
        </tr>`;
    }).join('');

    content.innerHTML = `
        <div id="pdf-planilla" style="padding: 20px; background: white; color: black; font-family: sans-serif;">
            <div style="display:flex; justify-content:space-between; margin-bottom:15px; font-weight:bold; font-size:14px; text-transform:uppercase;">
                <span>FECHA: ${today}</span>
                <span style="font-size:16px; text-decoration:underline;">Planilla de ventas</span>
                <span>AGENCIA: S.D.</span>
            </div>
            
            <table style="width:100%; border-collapse:collapse; text-align:center; font-size:13px; border: 1px solid #ccc;">
                <thead>
                    <tr style="background:#f4f4f4; border-bottom:1px solid #ccc;">
                        <th style="border-right:1px solid #ccc; padding:6px; width:30%;">PRODUCTO</th>
                        <th style="border-right:1px solid #ccc; padding:6px; width:8%; font-size:11px;">S.A</th>
                        <th style="border-right:1px solid #ccc; padding:6px; width:8%; font-size:11px;">ENT.<br>1</th>
                        <th style="border-right:1px solid #ccc; padding:6px; width:8%; font-size:11px;">ENT.<br>2</th>
                        <th style="border-right:1px solid #ccc; padding:6px; width:36%;">DETALLE</th>
                        <th style="padding:6px; width:10%;">SALDO</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
            
            <div style="margin-top:20px; display:flex; justify-content:flex-end;">
                <div style="text-align:right; font-size:14px; font-weight:bold; line-height:1.6;">
                    <div>VENTA QR: <span style="display:inline-block; width:80px; border-bottom:1px solid #000; text-align:center;">${totalQR.toFixed(0)}</span></div>
                    <div>VENTA BS: <span style="display:inline-block; width:80px; border-bottom:1px solid #000; text-align:center;">${totalBS.toFixed(0)}</span></div>
                    <div>VENTA TOTAL: <span style="display:inline-block; width:80px; border-bottom:1px solid #000; text-align:center;">${grandTotal.toFixed(0)}</span></div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('planilla-modal').classList.remove('hidden');
}

function closePlanilla() {
    document.getElementById('planilla-modal').classList.add('hidden');
}

function printPlanilla() {
    const element = document.getElementById('pdf-planilla');
    const opt = {
      margin:       0.3,
      filename:     'Planilla_Ventas_Caramel.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    if (typeof html2pdf === 'undefined') {
        alert("La librería de PDF no pudo cargar. Comprueba tu conexión a internet.");
        return;
    }
    
    html2pdf().set(opt).from(element).save();
}

// ====== Modal Stock Diario ======
function openDailyStock() {
    const content = document.getElementById('stock-content');
    
    let html = '<div class="stock-form" style="display:flex; flex-direction:column; gap:10px;">';
    
    products.forEach(p => {
        html += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:#f9f9f9; border-radius:8px;">
                <span style="font-weight:600;">${p.name}</span>
                <input type="number" id="stock-input-${p.id}" value="${p.stock}" min="0" style="width:80px; padding:8px; border:1px solid #ccc; border-radius:4px; text-align:center;">
            </div>
        `;
    });
    
    html += '</div>';
    content.innerHTML = html;
    
    document.getElementById('daily-stock-modal').classList.remove('hidden');
}

function closeDailyStock() {
    document.getElementById('daily-stock-modal').classList.add('hidden');
}

function saveDailyStock() {
    products.forEach(p => {
        const input = document.getElementById(`stock-input-${p.id}`);
        if (input) {
            p.stock = parseInt(input.value) || 0;
        }
    });
    
    saveProducts();
    renderProducts();
    closeDailyStock();
    showToast("Stock actualizado correctamente");
}

// Inicializar al cargar
window.addEventListener('DOMContentLoaded', init);
