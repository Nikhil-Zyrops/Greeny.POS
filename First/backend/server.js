const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const dataDir = path.join(__dirname, 'data');
const productsFile = path.join(dataDir, 'products.json');
const usersFile = path.join(dataDir, 'users.json');
const ordersFile = path.join(dataDir, 'orders.json');

const sessions = {};
const allowedStatuses = ['Received', 'In Progress', 'Ready', 'Completed'];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function getUserFromToken(token) {
  if (!token) return null;
  return sessions[token] || null;
}

function requireAuth(req, res, next) {
  const token = req.header('x-auth-token');
  const user = getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.user = user;
  next();
}

function requireRole(roles) {
  return (req, res, next) => {
    const token = req.header('x-auth-token');
    const user = getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    req.user = user;
    next();
  };
}

function getNextTokenNumber(orders) {
  if (!orders.length) return 101;
  return Math.max(...orders.map((order) => order.tokenNumber || 100)) + 1;
}

app.get('/api/products', (req, res) => {
  const products = readJson(productsFile);
  res.json(products);
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const users = readJson(usersFile);
  const user = users.find((item) => item.username === username && item.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  sessions[token] = {
    username: user.username,
    role: user.role,
    name: user.name,
  };

  res.json({ token, user: sessions[token] });
});

app.get('/api/user', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/orders', requireAuth, (req, res) => {
  const { items, paymentMethod } = req.body;
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Order must contain at least one item' });
  }
  if (!['Cash', 'Card', 'UPI'].includes(paymentMethod)) {
    return res.status(400).json({ error: 'Invalid payment method' });
  }

  const products = readJson(productsFile);
  const orders = readJson(ordersFile);

  const lineItems = items.map((item) => {
    const product = products.find((productItem) => productItem.id === item.id);
    return {
      id: item.id,
      name: product ? product.name : item.name,
      category: product ? product.category : item.category,
      quantity: item.quantity,
      price: product ? product.price : item.price,
      total: product ? Number((product.price * item.quantity).toFixed(2)) : Number((item.price * item.quantity).toFixed(2)),
    };
  });

  const subtotal = lineItems.reduce((sum, line) => sum + line.total, 0);
  const tax = Number((subtotal * 0.05).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));
  const newOrder = {
    id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    tokenNumber: getNextTokenNumber(orders),
    createdBy: req.user.username,
    createdAt: new Date().toISOString(),
    status: 'Received',
    paymentMethod,
    items: lineItems,
    subtotal,
    tax,
    total,
  };

  orders.unshift(newOrder);
  writeJson(ordersFile, orders);

  res.json({ order: newOrder });
});

// Public orders route for customers who do not log in
app.post('/api/orders/public', (req, res) => {
  const { items, paymentMethod } = req.body;
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Order must contain at least one item' });
  }
  if (!['Cash', 'Card', 'UPI'].includes(paymentMethod)) {
    return res.status(400).json({ error: 'Invalid payment method' });
  }

  const products = readJson(productsFile);
  const orders = readJson(ordersFile);

  const lineItems = items.map((item) => {
    const product = products.find((productItem) => productItem.id === item.id);
    return {
      id: item.id,
      name: product ? product.name : item.name,
      category: product ? product.category : item.category,
      quantity: item.quantity,
      price: product ? product.price : item.price,
      total: product ? Number((product.price * item.quantity).toFixed(2)) : Number((item.price * item.quantity).toFixed(2)),
    };
  });

  const subtotal = lineItems.reduce((sum, line) => sum + line.total, 0);
  const tax = Number((subtotal * 0.05).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));
  const newOrder = {
    id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    tokenNumber: getNextTokenNumber(orders),
    createdBy: 'Guest',
    createdAt: new Date().toISOString(),
    status: 'Received',
    paymentMethod,
    items: lineItems,
    subtotal,
    tax,
    total,
  };

  orders.unshift(newOrder);
  writeJson(ordersFile, orders);

  res.json({ order: newOrder });
});

app.get('/api/orders', requireAuth, (req, res) => {
  const orders = readJson(ordersFile);
  if (req.user.role === 'Customer') {
    return res.json(orders.filter((order) => order.createdBy === req.user.username));
  }
  res.json(orders);
});

app.patch('/api/orders/:id/status', requireRole(['Staff', 'Admin', 'SuperAdmin']), (req, res) => {
  const { status } = req.body;
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  const orders = readJson(ordersFile);
  const order = orders.find((item) => item.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.status = status;
  writeJson(ordersFile, orders);
  res.json({ order });
});

app.get('/api/summary/daily', requireRole(['Admin', 'SuperAdmin']), (req, res) => {
  const orders = readJson(ordersFile);
  const summary = orders.reduce((acc, order) => {
    const dateKey = order.createdAt.slice(0, 10);
    if (!acc[dateKey]) {
      acc[dateKey] = { date: dateKey, total: 0, cash: 0, card: 0, upi: 0, count: 0 };
    }
    acc[dateKey].total += order.total;
    acc[dateKey].count += 1;
    if (order.paymentMethod === 'Cash') acc[dateKey].cash += order.total;
    if (order.paymentMethod === 'Card') acc[dateKey].card += order.total;
    if (order.paymentMethod === 'UPI') acc[dateKey].upi += order.total;
    return acc;
  }, {});

  const daily = Object.values(summary).map((item) => ({
    date: item.date,
    total: Number(item.total.toFixed(2)),
    cash: Number(item.cash.toFixed(2)),
    card: Number(item.card.toFixed(2)),
    upi: Number(item.upi.toFixed(2)),
    count: item.count,
  }));

  res.json(daily.sort((a, b) => a.date.localeCompare(b.date)));
});

app.get('/api/users', requireRole(['SuperAdmin']), (req, res) => {
  const users = readJson(usersFile).map((item) => ({
    username: item.username,
    role: item.role,
    name: item.name,
  }));
  res.json(users);
});

app.post('/api/users', requireRole(['SuperAdmin']), (req, res) => {
  const { username, role } = req.body;
  if (!username || !role) {
    return res.status(400).json({ error: 'Username and role are required' });
  }
  if (!['Customer', 'Staff', 'Admin', 'SuperAdmin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const users = readJson(usersFile);
  const user = users.find((item) => item.username === username);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.role = role;
  writeJson(usersFile, users);
  res.json({ user: { username: user.username, role: user.role, name: user.name } });
});

// Admin product management
app.post('/api/products', requireRole(['Admin', 'SuperAdmin']), (req, res) => {
  const { name, category, price, type, stock, image } = req.body;
  if (!name || !category || price === undefined) {
    return res.status(400).json({ error: 'Name, category, and price are required' });
  }

  const products = readJson(productsFile);
  const newProduct = {
    id: `${Date.now()}`,
    name,
    category,
    price: Number(price),
    type: type || 'Veg',
    stock: stock !== undefined ? Number(stock) : 999,
    image: image || null,
  };

  products.push(newProduct);
  writeJson(productsFile, products);
  res.json({ product: newProduct });
});

app.delete('/api/products/:id', requireRole(['Admin', 'SuperAdmin']), (req, res) => {
  const products = readJson(productsFile);
  const index = products.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const removed = products.splice(index, 1);
  writeJson(productsFile, products);
  res.json({ product: removed[0] });
});

app.patch('/api/products/:id', requireRole(['Admin', 'SuperAdmin']), (req, res) => {
  const { name, price, stock, type } = req.body;
  const products = readJson(productsFile);
  const product = products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  if (name) product.name = name;
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);
  if (type) product.type = type;

  writeJson(productsFile, products);
  res.json({ product });
});

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Greeny Cafe POS is running locally at http://localhost:${port}`);
});
