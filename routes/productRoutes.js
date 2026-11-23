const express = require('express');
const Product = require('../models/Product');
const categories = require('../config/categories');

const router = express.Router();

// GET /api/products/categories  -> list of categories with product count
router.get('/categories', async (req, res, next) => {
  try {
    const counts = await Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
    const map = Object.fromEntries(counts.map((c) => [c._id, c.count]));
    res.json(
      categories.map((c) => ({
        ...c,
        image: `/images/categories/${c.slug}.jpg`,
        count: map[c.slug] || 0,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// GET /api/products?category=vases&search=glass&featured=true&sort=price_asc
router.get('/', async (req, res, next) => {
  try {
    const { category, search, featured, sort } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (featured === 'true') filter.featured = true;
    if (search) {
      // escape special regex characters typed by the user
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
      ];
    }

    let sortBy = { createdAt: -1 };
    if (sort === 'price_asc') sortBy = { price: 1 };
    if (sort === 'price_desc') sortBy = { price: -1 };
    if (sort === 'name') sortBy = { name: 1 };

    const products = await Product.find(filter).sort(sortBy);
    res.json(products);
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:slug  -> single product
router.get('/:slug', async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
