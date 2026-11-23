const mongoose = require('mongoose');
const categories = require('../config/categories');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    category: {
      type: String,
      required: true,
      enum: categories.map((c) => c.slug),
    },
    price: { type: Number, required: true, min: 0 },
    oldPrice: { type: Number, default: 0 }, // for showing discount
    description: { type: String, default: '' },
    image: { type: String, default: '' }, // e.g. /images/products/round-mirror.jpg
    stock: { type: Number, default: 10, min: 0 },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
