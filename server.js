require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Unknown API route
app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Your Decor running at http://localhost:${PORT}`));
});
