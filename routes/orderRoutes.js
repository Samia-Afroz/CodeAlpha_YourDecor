const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const { restock } = require('../utils/stock');

const router = express.Router();

const FREE_DELIVERY_ABOVE = 5000;
const DELIVERY_CHARGE = 120;

// Customer can cancel only before the order is packed
const CANCELLABLE = ['Pending', 'Confirmed'];

// POST /api/orders  -> place an order (logged-in users only)
// body: { items: [{ productId, qty }], shipping: { fullName, phone, address, city } }
router.post('/', protect, async (req, res, next) => {
  try {
    const { items, shipping } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }
    if (!shipping || !shipping.fullName || !shipping.phone || !shipping.address || !shipping.city) {
      return res.status(400).json({ message: 'Please fill in all shipping details' });
    }

    // Never trust prices from the browser: read them from the database
    const orderItems = [];
    for (const item of items) {
      if (!mongoose.isValidObjectId(item.productId)) {
        return res.status(400).json({ message: 'Invalid product in cart' });
      }
      const product = await Product.findById(item.productId);
      const qty = parseInt(item.qty, 10);
      if (!product) return res.status(400).json({ message: 'A product in your cart no longer exists' });
      if (!qty || qty < 1) return res.status(400).json({ message: 'Invalid quantity' });
      if (product.stock < qty) {
        return res.status(400).json({ message: `Only ${product.stock} left of "${product.name}"` });
      }
      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        qty,
      });
    }

    const itemsPrice = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    const deliveryCharge = itemsPrice >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_CHARGE;

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shipping,
      itemsPrice,
      deliveryCharge,
      totalPrice: itemsPrice + deliveryCharge,
      status: 'Pending',
      statusHistory: [{ status: 'Pending', note: 'Order placed successfully' }],
    });

    // Reduce stock
    for (const i of orderItems) {
      await Product.updateOne({ _id: i.product }, { $inc: { stock: -i.qty } });
    }

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/my  -> orders of the logged-in user
router.get('/my', protect, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id  -> one order (only its owner or an admin can see it)
router.get('/:id', protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const order = await Order.findById(req.params.id);
    if (!order || (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin)) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:id/cancel  -> customer cancels own order (only before packing)
router.patch('/:id/cancel', protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const order = await Order.findById(req.params.id);
    if (!order || order.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (!CANCELLABLE.includes(order.status)) {
      return res.status(400).json({ message: `Order is already ${order.status} and cannot be cancelled` });
    }
    order.status = 'Cancelled';
    order.statusHistory.push({ status: 'Cancelled', note: 'Cancelled by customer' });
    await order.save();
    await restock(order);
    res.json(order);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
