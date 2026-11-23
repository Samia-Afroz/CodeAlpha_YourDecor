const mongoose = require('mongoose');

// Order stages, in delivery order. "Cancelled" is separate.
const STAGES = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
const STATUSES = [...STAGES, 'Cancelled'];

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    image: String,
    price: Number,
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

// Every status change is saved here with date + note (for the tracking timeline)
const historySchema = new mongoose.Schema(
  {
    status: { type: String, enum: STATUSES, required: true },
    note: { type: String, default: '' },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    shipping: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
    },
    paymentMethod: { type: String, default: 'Cash on Delivery' },
    isPaid: { type: Boolean, default: false },
    itemsPrice: Number,
    deliveryCharge: Number,
    totalPrice: Number,
    status: { type: String, enum: STATUSES, default: 'Pending' },
    statusHistory: [historySchema],
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
Order.STAGES = STAGES;
Order.STATUSES = STATUSES;

module.exports = Order;
