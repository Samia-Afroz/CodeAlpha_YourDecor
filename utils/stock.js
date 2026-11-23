const Product = require('../models/Product');

// Put the items of a cancelled order back into stock
async function restock(order) {
  for (const i of order.items) {
    await Product.updateOne({ _id: i.product }, { $inc: { stock: i.qty } });
  }
}

module.exports = { restock };
