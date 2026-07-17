// Logo en Base64 de un icono de cupcake simple como placeholder premium
const LOGO_BASE64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Q5NzczNiIgcng9IjIwIi8+CiAgPHBhdGggZD0iTTM1LDc1IEw2NSw3NSBMNzAsNTAgTDMwLDUwIFoiIGZpbGw9IiNmZGZhZjYiLz4KICA8cGF0aCBkPSJNMzAsNTAgQzMwLDM1IDcwLDM1IDcwLDUwIFoiIGZpbGw9IiNmZGZhZjYiLz4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjMwIiByPSI2IiBmaWxsPSIjZTUzOTM1Ii8+Cjwvc3ZnPg==";

// Estado inicial del inventario
const QR_BASE64 = "qr.jpeg";


const defaultProducts = [
    { id: 1, name: "Alfajor Vainilla", price: 7.00, stock: 100, icon: "🥮" },
    { id: 2, name: "Alfajor Chocolate", price: 10.00, stock: 100, icon: "🍫" },
    { id: 3, name: "Tres leche", price: 12.00, stock: 100, icon: "🍰" },
    { id: 4, name: "Pie de limón", price: 12.00, stock: 100, icon: "🍋" },
    { id: 5, name: "Cupcake", price: 12.00, stock: 100, icon: "🧁" },
    { id: 6, name: "Torta Matilda", price: 17.00, stock: 100, icon: "🎂" },
    { id: 7, name: "Gelatina", price: 5.00, stock: 100, icon: "🍮" },
    { id: 8, name: "Budin", price: 7.00, stock: 100, icon: "🍞" },
    { id: 9, name: "Torta personal", price: 40.00, stock: 100, icon: "🍰" },
    { id: 10, name: "Torta mediana", price: 150.00, stock: 100, icon: "🎂" }
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
        products = JSON.parse(storedProducts);
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

// Inicializar al cargar
window.addEventListener('DOMContentLoaded', init);
