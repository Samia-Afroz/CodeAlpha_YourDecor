const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Allows only logged-in users (token sent as "Authorization: Bearer <token>")
const protect = async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Please log in first' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Session expired, please log in again' });
  }
};

// Allows only admin users (use after protect)
const adminOnly = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access only' });
  }
  next();
};

module.exports = { protect, adminOnly };
