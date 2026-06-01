// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const state = {
  user: null,
  token: null,
  products: [],
  cart: [],
  summary: [],
  orders: [],
  lastOrder: null,
  categoryFilter: 'all',
  snackTypeFilter: 'all',
  searchTerm: '',
};

const selectors = {
  loginSection: document.getElementById('login-section'),
  customerSection: document.getElementById('customer-section'),
  staffSection: document.getElementById('staff-section'),
  adminSection: document.getElementById('admin-section'),
  superSection: document.getElementById('super-section'),
  statusMessage: document.getElementById('status-message'),
  currentUser: document.getElementById('current-user'),
  logoutButton: document.getElementById('logout-button'),
  customerProducts: document.getElementById('customer-products'),
  customerCart: document.getElementById('customer-cart'),
  paymentMethod: document.getElementById('payment-method'),
  checkoutButton: document.getElementById('checkout-button'),
  billOutput: document.getElementById('bill-output'),
  staffOrders: document.getElementById('staff-orders'),
  adminSummary: document.getElementById('admin-summary'),
  adminOrders: document.getElementById('admin-orders'),
  calendarGrid: document.getElementById('calendar-grid'),
  calendarDetail: document.getElementById('calendar-detail'),
  superUsers: document.getElementById('super-users'),
  printBillButton: document.getElementById('print-bill-button'),
  themeToggle: document.getElementById('theme-toggle'),
  switchLoginButton: document.getElementById('switch-login-button'),
  viewCustomerButton: document.getElementById('view-customer-button'),
  calendarButton: document.getElementById('open-calendar-button'),
  loginContext: document.getElementById('login-context'),
  loginForm: document.getElementById('login-form'),
  loginUsername: document.getElementById('login-username'),
  loginPassword: document.getElementById('login-password'),
  productSearch: document.getElementById('product-search'),
  categoryFilter: document.getElementById('category-filter'),
  snackTypeFilter: document.getElementById('snack-type-filter'),
  adminProductName: document.getElementById('admin-product-name'),
  adminProductCategory: document.getElementById('admin-product-category'),
  adminProductPrice: document.getElementById('admin-product-price'),
  adminProductType: document.getElementById('admin-product-type'),
  adminProductStock: document.getElementById('admin-product-stock'),
  adminAddProductButton: document.getElementById('admin-add-product'),
  adminProductsList: document.getElementById('admin-products-list'),
};

function showMessage(message, type = 'info') {
  selectors.statusMessage.textContent = message;
  selectors.statusMessage.classList.remove('hidden');
  if (type === 'error') {
    selectors.statusMessage.style.background = '#fce8e8';
    selectors.statusMessage.style.borderColor = '#f1c1c1';
  } else {
    selectors.statusMessage.style.background = '#e9f6ee';
    selectors.statusMessage.style.borderColor = '#c9e6d0';
  }
  setTimeout(() => {
    selectors.statusMessage.classList.add('hidden');
  }, 5000);
}

function showSection(sectionId) {
  document.querySelectorAll('main section').forEach((node) => node.classList.add('hidden'));
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.remove('hidden');
  }
}

async function apiFetch(path, options = {}) {
  const headers = options.headers || {};
  if (state.token) {
    headers['x-auth-token'] = state.token;
  }
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'API error');
  }
  return data;
}

function updateUserDisplay() {
  if (state.user) {
    selectors.currentUser.textContent = `${state.user.name} (${state.user.role})`;
    selectors.logoutButton.classList.remove('hidden');
    if (selectors.switchLoginButton) selectors.switchLoginButton.classList.add('hidden');
    if (state.user.role === 'Staff') {
      if (selectors.viewCustomerButton) selectors.viewCustomerButton.classList.remove('hidden');
    } else {
      if (selectors.viewCustomerButton) selectors.viewCustomerButton.classList.add('hidden');
    }
    if (selectors.calendarButton) {
      selectors.calendarButton.classList.toggle('hidden', !(state.user.role === 'Admin' || state.user.role === 'SuperAdmin'));
    }
  } else {
    selectors.currentUser.textContent = '';
    selectors.logoutButton.classList.add('hidden');
    if (selectors.switchLoginButton) selectors.switchLoginButton.classList.remove('hidden');
    if (selectors.viewCustomerButton) selectors.viewCustomerButton.classList.add('hidden');
    if (selectors.calendarButton) selectors.calendarButton.classList.add('hidden');
  }
}

// Theme handling
function applySavedTheme() {
  try {
    const saved = localStorage.getItem('greeny-theme');
    if (saved === 'dark') document.body.classList.add('dark');
    if (selectors.themeToggle) selectors.themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
  } catch (e) {
    // ignore
  }
}

if (selectors.themeToggle) {
  selectors.themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const mode = document.body.classList.contains('dark') ? 'dark' : 'light';
    try { localStorage.setItem('greeny-theme', mode); } catch (e) {}
    selectors.themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
  });
}

if (selectors.switchLoginButton) {
  selectors.switchLoginButton.addEventListener('click', () => showSection('login-section'));
}

if (selectors.viewCustomerButton) {
  selectors.viewCustomerButton.addEventListener('click', () => {
    showSection('customer-section');
    showMessage('Customer view (assisted) opened.', 'info');
  });
}

function clearCart() {
  state.cart = [];
  renderCart();
}

function hideBillAction() {
  if (selectors.printBillButton) {
    selectors.printBillButton.classList.add('hidden');
  }
}

function renderProducts() {
  selectors.customerProducts.innerHTML = '';
  
  const filtered = state.products.filter((product) => {
    const categoryMatch = state.categoryFilter === 'all' || product.category === state.categoryFilter;
    const typeMatch = state.categoryFilter !== 'Snacks' || state.snackTypeFilter === 'all' || product.type === state.snackTypeFilter;
    const searchMatch = state.searchTerm === '' || 
      product.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(state.searchTerm.toLowerCase());
    return categoryMatch && typeMatch && searchMatch;
  });

  if (filtered.length === 0) {
    selectors.customerProducts.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text);">No items found</p>';
    return;
  }

  filtered.forEach((product) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center">
        <img src="${product.image}" alt="${product.name}" style="width:72px;height:72px;border-radius:12px;object-fit:cover;flex:0 0 72px;" />
        <div>
          <h4>${product.name}</h4>
          <div>${product.category}</div>
          <div><strong>${formatCurrency(product.price)}</strong></div>
        </div>
      </div>
      <button class="secondary">Add</button>
    `;
    card.querySelector('button').addEventListener('click', () => addToCart(product));
    selectors.customerProducts.appendChild(card);
  });
}

function createPlaceholderImage(name) {
  const bg = encodeURIComponent('#2f8f57');
  const fg = encodeURIComponent('#ffffff');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='100%' height='100%' fill='${bg}' rx='20'/><text x='50%' y='50%' font-size='20' fill='${fg}' dominant-baseline='middle' text-anchor='middle' font-family='Arial, Helvetica, sans-serif'>${name}</text></svg>`;
  return `data:image/svg+xml;utf8,${svg}`;
}

function addToCart(product) {
  const existing = state.cart.find((item) => item.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ ...product, quantity: 1 });
  }
  renderCart();
}

function updateCartItem(productId, delta) {
  const item = state.cart.find((cartItem) => cartItem.id === productId);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    state.cart = state.cart.filter((cartItem) => cartItem.id !== productId);
  }
  renderCart();
}

function renderCart() {
  selectors.customerCart.innerHTML = '';
  if (!state.cart.length) {
    selectors.customerCart.innerHTML = '<p>No items in cart.</p>';
    return;
  }

  state.cart.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div>
        <div><strong>${item.name}</strong></div>
        <div>${item.quantity} × ${formatCurrency(item.price)}</div>
      </div>
      <div>
        <button class="secondary">-</button>
        <button class="secondary">+</button>
      </div>
    `;
    row.querySelector('button:nth-child(1)').addEventListener('click', () => updateCartItem(item.id, -1));
    row.querySelector('button:nth-child(2)').addEventListener('click', () => updateCartItem(item.id, 1));
    selectors.customerCart.appendChild(row);
  });
}

function safeNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatCurrency(value) {
  return `₹${safeNumber(value).toFixed(2)}`;
}

function openKioskPrint(order) {
  if (!order) return;
  const printWindow = window.open('', '_blank', 'width=600,height=800');
  if (!printWindow) {
    window.print();
    return;
  }
  const itemsHtml = order.items.map((item) => `
      <div style="margin-bottom:12px; padding:12px; border:1px solid #ddd; border-radius:12px;">
        <strong>${item.name}</strong><br />
        ${item.quantity} × ${formatCurrency(item.price)}<br />
        Total: ${formatCurrency(item.total)}
      </div>`).join('');
  printWindow.document.write(`
    <html><head><title>Greeny Cafe Receipt</title>
    <style>
      body{font-family:Arial,sans-serif;padding:20px;color:#111;background:#fff;}
      h1,h2{margin:0 0 12px;}
      .summary{margin-top:18px;}
      .summary div{display:flex;justify-content:space-between;margin:6px 0;}
      .print-hero{margin-bottom:18px;}
    </style>
    </head><body>
    <div class="print-hero"><h1>Greeny Cafe</h1><p>Bill Receipt</p></div>
    <div><strong>Token #:</strong> ${order.tokenNumber}</div>
    <div><strong>Payment:</strong> ${order.paymentMethod}</div>
    <div><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</div>
    <div style="margin-top:18px;">${itemsHtml}</div>
    <div class="summary">
      <div><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></div>
      <div><span>Tax (5%)</span><span>${formatCurrency(order.tax)}</span></div>
      <div style="font-weight:700;"><span>Total</span><span>${formatCurrency(order.total)}</span></div>
    </div>
    <script>window.onload=function(){window.print();setTimeout(()=>window.close(),500);};</script>
    </body></html>
  `);
  printWindow.document.close();
}

function printBill() {
  openKioskPrint(state.lastOrder);
}

function renderBill(order) {
  selectors.billOutput.classList.remove('hidden');
  const itemsHtml = order.items
    .map(
      (item) => `
      <div class="order-item">
        <strong>${item.name}</strong>
        <div>${item.quantity} × ${formatCurrency(item.price)}</div>
        <div>Total: ${formatCurrency(item.total)}</div>
      </div>`
    )
    .join('');

  selectors.billOutput.innerHTML = `
    <div class="bill-header">
      <h3>Bill Receipt</h3>
      <p class="bill-subtitle">Present this copy to the barista.</p>
    </div>
    <p><strong>Token #:</strong> ${order.tokenNumber}</p>
    <p><strong>Payment:</strong> ${order.paymentMethod}</p>
    <div>${itemsHtml}</div>
    <div class="summary-item">
      <span>Subtotal</span>
      <span>${formatCurrency(order.subtotal)}</span>
    </div>
    <div class="summary-item">
      <span>Tax (5%)</span>
      <span>${formatCurrency(order.tax)}</span>
    </div>
    <div class="summary-item">
      <span>Total</span>
      <span>${formatCurrency(order.total)}</span>
    </div>
  `;
  if (selectors.printBillButton) {
    selectors.printBillButton.classList.remove('hidden');
  }
}

async function handleCheckout() {
  if (!state.cart.length) {
    showMessage('Add items to the cart before checkout.', 'error');
    return;
  }
  const paymentMethod = selectors.paymentMethod.value;
  try {
    const orderData = state.cart.map((item) => ({ id: item.id, quantity: item.quantity }));
    const endpoint = state.token ? '/api/orders' : '/api/orders/public';
    const response = await apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({ items: orderData, paymentMethod }),
    });
    state.lastOrder = response.order;
    clearCart();
    renderBill(response.order);
    // Auto-print receipt for customer or staff-assisted checkout (delay to allow render)
    try {
      if (!state.user || state.user.role === 'Customer' || state.user.role === 'Staff') {
        setTimeout(() => {
          try { printBill(); } catch (e) { console.warn('Print error', e); }
        }, 300);
      }
    } catch (e) {
      console.warn('Auto-print failed', e);
    }
    showMessage('Order completed successfully. Token generated.', 'info');
    if (state.user && state.user.role === 'Customer') {
      loadOrders();
    }
    if (state.user && (state.user.role === 'Admin' || state.user.role === 'SuperAdmin')) {
      loadAdminData();
    }
  } catch (err) {
    showMessage(err.message, 'error');
  }
}

async function loadProducts() {
  try {
    const data = await apiFetch('/api/products');
    // Ensure each product has an image (placeholder SVG if not provided)
    state.products = data.map((p) => ({ ...p, image: p.image || createPlaceholderImage(p.name) }));
    renderProducts();
  } catch (err) {
    showMessage('Unable to load products: ' + err.message, 'error');
  }
}

function renderOrderCards(orders, container, actionsEnabled = false) {
  if (!container) {
    console.warn('Order card container not found');
    return;
  }
  container.innerHTML = '';
  if (!orders || !orders.length) {
    container.innerHTML = '<p>No orders available.</p>';
    return;
  }

  orders.forEach((order) => {
    const card = document.createElement('div');
    card.className = 'order-card';
    card.innerHTML = `
      <h4>Token #${order.tokenNumber} — ${order.paymentMethod}</h4>
      <div class="status"><strong>Status:</strong> ${order.status}</div>
      <div><strong>Created:</strong> ${new Date(order.createdAt).toLocaleString()}</div>
      <div><strong>Total:</strong> ${formatCurrency(order.total)}</div>
      <div class="order-items"></div>
    `;

    const itemsContainer = card.querySelector('.order-items');
    order.items.forEach((item) => {
      const itemRow = document.createElement('div');
      itemRow.className = 'order-item';
      itemRow.innerHTML = `<strong>${item.name}</strong> <span>${item.quantity} × ${formatCurrency(item.price)}</span>`;
      itemsContainer.appendChild(itemRow);
    });

    if (actionsEnabled) {
      const statusSelect = document.createElement('select');
      allowedStatuses.forEach((statusOption) => {
        const opt = document.createElement('option');
        opt.value = statusOption;
        opt.textContent = statusOption;
        if (statusOption === order.status) opt.selected = true;
        statusSelect.appendChild(opt);
      });
      statusSelect.addEventListener('change', () => updateOrderStatus(order.id, statusSelect.value));
      card.appendChild(statusSelect);
    }

    container.appendChild(card);
  });
}

async function loadOrders() {
  try {
    const data = await apiFetch('/api/orders');
    state.orders = Array.isArray(data) ? data : [];
    if (state.user.role === 'Staff') {
      renderOrderCards(state.orders, selectors.staffOrders, true);
    } else if (state.user.role === 'Admin') {
      renderOrderCards(state.orders, selectors.adminOrders, false);
    } else if (state.user.role === 'SuperAdmin') {
      renderOrderCards(state.orders, selectors.adminOrders, false);
    }
  } catch (err) {
    showMessage('Unable to load orders: ' + err.message, 'error');
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    await apiFetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    showMessage('Order status updated.', 'info');
    loadOrders();
    if (state.user.role === 'Admin' || state.user.role === 'SuperAdmin') {
      loadAdminData();
    }
  } catch (err) {
    showMessage(err.message, 'error');
  }
}

function renderSummary(summary) {
  selectors.adminSummary.innerHTML = '';
  if (!Array.isArray(summary) || summary.length === 0) {
    selectors.adminSummary.innerHTML = '<p class="muted-text">No sales summary available yet.</p>';
    return;
  }
  const totals = summary.reduce(
    (acc, item) => {
      acc.total += safeNumber(item.total);
      acc.cash += safeNumber(item.cash);
      acc.card += safeNumber(item.card);
      acc.upi += safeNumber(item.upi);
      acc.count += safeNumber(item.count);
      return acc;
    },
    { total: 0, cash: 0, card: 0, upi: 0, count: 0 }
  );

  const metrics = [
    { label: 'Total Income', value: totals.total },
    { label: 'Cash', value: totals.cash },
    { label: 'Card', value: totals.card },
    { label: 'UPI', value: totals.upi },
    { label: 'Orders', value: totals.count },
  ];

  metrics.forEach((metric) => {
    const row = document.createElement('div');
    row.className = 'summary-item';
    row.innerHTML = `
      <span>${metric.label}</span>
      <strong>${metric.label === 'Orders' ? safeNumber(metric.value) : formatCurrency(metric.value)}</strong>
    `;
    selectors.adminSummary.appendChild(row);
  });
}

function renderCalendar(summary, targetGrid = selectors.calendarGrid, targetDetail = selectors.calendarDetail) {
  targetGrid.innerHTML = '';
  targetDetail.innerHTML = '<p>Hover a date to inspect daily totals.</p>';

  if (!Array.isArray(summary) || summary.length === 0) {
    targetGrid.innerHTML = '<p class="muted-text">No daily sales data yet.</p>';
    targetDetail.innerHTML = '<p>Hover a date to inspect daily totals.</p>';
    return;
  }

  const dayMap = summary.reduce((map, item) => {
    map[item.date] = item;
    return map;
  }, {});
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let index = 0; index < firstDay; index += 1) {
    const placeholder = document.createElement('div');
    placeholder.className = 'calendar-day';
    targetGrid.appendChild(placeholder);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const key = date.toISOString().slice(0, 10);
    const record = dayMap[key] || { total: 0, cash: 0, card: 0, upi: 0, count: 0 };
    const card = document.createElement('div');
    card.className = 'calendar-day';
    card.innerHTML = `
      <div class="date-number">${day}</div>
      <div class="day-total">${formatCurrency(record.total)}</div>
    `;
    card.addEventListener('mouseenter', () => {
      targetDetail.innerHTML = `
        <h4>${key}</h4>
        <div class="summary-item"><span>Total</span><strong>${formatCurrency(record.total)}</strong></div>
        <div class="summary-item"><span>Cash</span><strong>${formatCurrency(record.cash)}</strong></div>
        <div class="summary-item"><span>Card</span><strong>${formatCurrency(record.card)}</strong></div>
        <div class="summary-item"><span>UPI</span><strong>${formatCurrency(record.upi)}</strong></div>
        <div class="summary-item"><span>Orders</span><strong>${safeNumber(record.count)}</strong></div>
      `;
    });
    targetGrid.appendChild(card);
  }
}

function renderAdminProducts() {
  if (!selectors.adminProductsList) return;
  selectors.adminProductsList.innerHTML = '';

  if (!state.products || state.products.length === 0) {
    selectors.adminProductsList.innerHTML = '<p class="muted-text">No products in database.</p>';
    return;
  }

  state.products.forEach((product) => {
    const row = document.createElement('div');
    row.className = 'admin-product-row';
    row.innerHTML = `
      <span><strong>${product.name}</strong> (${product.category})</span>
      <span>${formatCurrency(product.price)}</span>
      <span>Type: ${product.type}</span>
      <span>Stock: ${product.stock || 'N/A'}</span>
      <div class="actions">
        <button class="secondary" data-action="edit" data-id="${product.id}">Edit</button>
        <button class="secondary danger" data-action="delete" data-id="${product.id}">Delete</button>
      </div>
    `;

    const deleteBtn = row.querySelector('[data-action="delete"]');
    deleteBtn.addEventListener('click', async () => {
      if (!confirm(`Delete "${product.name}"?`)) return;
      try {
        await apiFetch(`/api/products/${product.id}`, { method: 'DELETE' });
        state.products = state.products.filter((p) => p.id !== product.id);
        renderProducts();
        renderAdminProducts();
        showMessage('Product deleted successfully!', 'info');
      } catch (e) {
        showMessage(`Error deleting product: ${e.message}`, 'error');
      }
    });

    selectors.adminProductsList.appendChild(row);
  });
}

async function loadAdminData() {
  try {
    const summary = await apiFetch('/api/summary/daily');
    state.summary = summary;
    renderSummary(summary);
    renderCalendar(summary);
    loadOrders();
    renderAdminProducts();
  } catch (err) {
    showMessage('Unable to load admin summary: ' + err.message, 'error');
  }
}

async function loadUsers() {
  try {
    const users = await apiFetch('/api/users');
    selectors.superUsers.innerHTML = '';
    users.forEach((user) => {
      const card = document.createElement('div');
      card.className = 'user-card';
      card.innerHTML = `
        <h4>${user.name}</h4>
        <div><strong>Username:</strong> ${user.username}</div>
        <div><strong>Role:</strong></div>
      `;
      const roleSelect = document.createElement('select');
      ['Customer', 'Staff', 'Admin', 'SuperAdmin'].forEach((roleOption) => {
        const opt = document.createElement('option');
        opt.value = roleOption;
        opt.textContent = roleOption;
        if (roleOption === user.role) opt.selected = true;
        roleSelect.appendChild(opt);
      });
      const updateButton = document.createElement('button');
      updateButton.textContent = 'Change Role';
      updateButton.className = 'secondary';
      updateButton.addEventListener('click', () => changeUserRole(user.username, roleSelect.value));
      card.appendChild(roleSelect);
      card.appendChild(updateButton);
      selectors.superUsers.appendChild(card);
    });
  } catch (err) {
    showMessage('Unable to load users: ' + err.message, 'error');
  }
}

async function changeUserRole(username, role) {
  try {
    await apiFetch('/api/users', {
      method: 'POST',
      body: JSON.stringify({ username, role }),
    });
    showMessage('User role updated.', 'info');
    loadUsers();
  } catch (err) {
    showMessage('Unable to update user role: ' + err.message, 'error');
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const username = selectors.loginUsername.value.trim();
  const password = selectors.loginPassword.value.trim();
  if (!username || !password) {
    showMessage('Please enter username and password.', 'error');
    return;
  }

  try {
    const response = await apiFetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    state.user = response.user;
    state.token = response.token;
    updateUserDisplay();
    selectors.loginForm.reset();
    selectors.billOutput.classList.add('hidden');
    hideBillAction();
    clearCart();
    if (state.user.role === 'Customer') {
      showSection('customer-section');
      loadProducts();
    } else if (state.user.role === 'Staff') {
      showSection('staff-section');
      loadOrders();
    } else if (state.user.role === 'Admin') {
      showSection('admin-section');
      loadAdminData();
    } else if (state.user.role === 'SuperAdmin') {
      showSection('super-section');
      loadAdminData();
      loadUsers();
    }
    selectors.loginContext?.classList.add('hidden');
    showMessage(`Welcome, ${state.user.name}!`, 'info');
  } catch (err) {
    showMessage(err.message, 'error');
  }
}

function logout() {
  state.user = null;
  state.token = null;
  state.cart = [];
  state.orders = [];
  state.summary = [];
  showSection('customer-section');
  loadProducts();
  updateUserDisplay();
  selectors.billOutput.classList.add('hidden');
  hideBillAction();
}

selectors.loginForm.addEventListener('submit', handleLogin);
selectors.logoutButton.addEventListener('click', logout);
selectors.checkoutButton.addEventListener('click', handleCheckout);
if (selectors.printBillButton) {
  selectors.printBillButton.addEventListener('click', printBill);
}

// Product filter and search listeners
if (selectors.productSearch) {
  selectors.productSearch.addEventListener('input', (e) => {
    state.searchTerm = e.target.value;
    renderProducts();
  });
}

if (selectors.categoryFilter) {
  selectors.categoryFilter.addEventListener('change', (e) => {
    state.categoryFilter = e.target.value;
    if (e.target.value === 'Snacks') {
      selectors.snackTypeFilter.classList.remove('hidden');
    } else {
      selectors.snackTypeFilter.classList.add('hidden');
      state.snackTypeFilter = 'all';
    }
    renderProducts();
  });
}

if (selectors.snackTypeFilter) {
  selectors.snackTypeFilter.addEventListener('change', (e) => {
    state.snackTypeFilter = e.target.value;
    renderProducts();
  });
}

// Admin product management
if (selectors.adminAddProductButton) {
  selectors.adminAddProductButton.addEventListener('click', async () => {
    const name = selectors.adminProductName.value.trim();
    const category = selectors.adminProductCategory.value;
    const price = parseFloat(selectors.adminProductPrice.value);
    const type = selectors.adminProductType.value;
    const stock = parseInt(selectors.adminProductStock.value) || 999;

    if (!name || isNaN(price)) {
      showMessage('Please fill in all required fields', 'error');
      return;
    }

    try {
      const response = await apiFetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, price, type, stock }),
      });

      state.products.push(response.product);
      selectors.adminProductName.value = '';
      selectors.adminProductPrice.value = '';
      selectors.adminProductStock.value = '999';
      renderProducts();
      renderAdminProducts();
      showMessage('Product added successfully!', 'info');
    } catch (e) {
      showMessage(`Error adding product: ${e.message}`, 'error');
    }
  });
}

// Sidebar nav buttons (delegated)
document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.target;
    const role = btn.dataset.role;
    if (target === 'customer-section') {
      showSection('customer-section');
      loadProducts();
      selectors.loginContext?.classList.add('hidden');
      return;
    }
    if (role && (!state.user || state.user.role !== role)) {
      showSection('login-section');
      if (selectors.loginContext) {
        selectors.loginContext.textContent = `${role} login required. Please sign in to continue.`;
        selectors.loginContext.classList.remove('hidden');
      }
      return;
    }
    if (target === 'staff-section') {
      showSection('staff-section');
      loadOrders();
      selectors.loginContext?.classList.add('hidden');
    }
    if (target === 'admin-section') {
      showSection('admin-section');
      loadAdminData();
      selectors.loginContext?.classList.add('hidden');
    }
    if (target === 'super-section') {
      showSection('super-section');
      loadAdminData();
      loadUsers();
      selectors.loginContext?.classList.add('hidden');
    }
  });
});

// Calendar modal open/close
const openCal = document.getElementById('open-calendar-button');
const calendarModal = document.getElementById('calendar-modal');
const closeCal = document.getElementById('close-calendar');
if (openCal) {
  openCal.addEventListener('click', async () => {
    try {
      const summary = state.summary && state.summary.length ? state.summary : await apiFetch('/api/summary/daily').catch(() => []);
      renderCalendar(summary, document.getElementById('calendar-modal-grid'), document.getElementById('calendar-modal-detail'));
    } catch (e) {
      console.warn('Unable to load calendar for modal', e);
    }
    calendarModal.classList.remove('hidden');
  });
}
if (closeCal) {
  closeCal.addEventListener('click', () => calendarModal.classList.add('hidden'));
}

const allowedStatuses = ['Received', 'In Progress', 'Ready', 'Completed'];

// Apply saved theme, open customers panel by default and load products
applySavedTheme();
showSection('customer-section');
loadProducts();
updateUserDisplay();
