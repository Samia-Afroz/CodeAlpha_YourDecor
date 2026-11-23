const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const { protect, adminOnly } = require('../middleware/auth');
const { restock } = require('../utils/stock');

const router = express.Router();

// Every route in this file needs a logged-in admin
router.use(protect, adminOnly);

// Default note shown to the customer for each stage
const DEFAULT_NOTES = {
  Pending: 'Order placed',
  Confirmed: 'Your order has been confirmed',
  Packed: 'Your order is packed and ready to ship',
  Shipped: 'Your order has been handed to the courier',
  'Out for Delivery': 'Our delivery partner is on the way',
  Delivered: 'Order delivered. Thank you for shopping with Your Decor!',
  Cancelled: 'Order cancelled by store',
};

// GET /api/admin/stats  -> number of orders in each status + revenue
router.get('/stats', async (req, res, next) => {
  try {
    const groups = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$totalPrice' } } },
    ]);
    const byStatus = Object.fromEntries(Order.STATUSES.map((s) => [s, 0]));
    let totalOrders = 0;
    let revenue = 0;
    groups.forEach((g) => {
      byStatus[g._id] = g.count;
      totalOrders += g.count;
      if (g._id === 'Delivered') revenue += g.total;
    });
    res.json({ totalOrders, revenue, byStatus });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/orders?status=Pending  -> all orders (newest first)
router.get('/orders', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status && Order.STATUSES.includes(req.query.status)) filter.status = req.query.status;
    const orders = await Order.find(filter).populate('user', 'name email phone').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/orders/:id/status   body: { status, note }
router.patch('/orders/:id/status', async (req, res, next) => {
  try {
    const { status, note } = req.body;
    if (!Order.STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.status === 'Cancelled' || order.status === 'Delivered') {
      return res.status(400).json({ message: `Order is already ${order.status}. It cannot be changed.` });
    }
    if (order.status === status) {
      return res.status(400).json({ message: `Order is already ${status}` });
    }

    order.status = status;
    order.statusHistory.push({ status, note: (note || '').trim() || DEFAULT_NOTES[status] });
    if (status === 'Delivered') order.isPaid = true; // cash collected on delivery
    await order.save();

    if (status === 'Cancelled') await restock(order);

    await order.populate('user', 'name email phone');
    res.json(order);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
