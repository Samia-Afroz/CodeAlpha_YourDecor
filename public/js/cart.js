// ===== cart.js: cart table + checkout (order processing) =====
// Must match the values in routes/orderRoutes.js
const FREE_DELIVERY_ABOVE = 5000;
const DELIVERY_CHARGE = 120;

function renderCart() {
  const box = document.getElementById('cartContainer');
  const items = Cart.get();

  if (!items.length) {
    box.innerHTML = `
      <div class="empty">
        <h2>Your cart is empty</h2>
        <p style="margin:10px 0 20px">Browse our collection and add something you love.</p>
        <a href="/products.html" class="btn">Continue Shopping</a>
      </div>`;
    return;
  }

  const subtotal = Cart.subtotal();
  const delivery = subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_CHARGE;
  const user = Auth.user();

  box.innerHTML = `
    <div class="cart-layout">
      <div>
        <table class="cart-table">
          <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Total</th><th></th></tr></thead>
          <tbody>
            ${items
              .map(
                (i) => `
              <tr>
                <td><div class="cart-item">${imgTag(i.image, i.name)}
                  <a href="/product.html?slug=${encodeURIComponent(i.slug)}">${esc(i.name)}</a></div></td>
                <td>${money(i.price)}</td>
                <td><input type="number" min="1" max="${i.stock || 99}" value="${i.qty}" style="width:70px"
                      onchange="changeQty('${i.productId}', this.value)"></td>
                <td>${money(i.price * i.qty)}</td>
                <td><button class="remove-btn" title="Remove" onclick="removeItem('${i.productId}')">✕</button></td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
        <div style="margin-top:16px;display:flex;gap:10px">
          <a href="/products.html" class="btn btn-outline">← Continue Shopping</a>
          <button class="btn btn-outline" onclick="clearCart()">Clear Cart</button>
        </div>
      </div>

      <div class="summary-box">
        <h3>Order Summary</h3>
        <div class="summary-row"><span>Subtotal</span><span>${money(subtotal)}</span></div>
        <div class="summary-row"><span>Delivery</span><span>${delivery ? money(delivery) : 'Free'}</span></div>
        <div class="summary-row total"><span>Total</span><span>${money(subtotal + delivery)}</span></div>
        <p style="font-size:12px;color:var(--muted);margin:6px 0 16px">Free delivery on orders above ${money(FREE_DELIVERY_ABOVE)}</p>

        ${
          user
            ? `<h3 style="margin-top:10px">Shipping Details</h3>
               <div id="checkoutAlert" class="alert"></div>
               <form id="checkoutForm">
                 <div class="form-group"><label>Full name</label><input name="fullName" required value="${esc(user.name)}"></div>
                 <div class="form-group"><label>Phone</label><input name="phone" required value="${esc(user.phone || '')}"></div>
                 <div class="form-group"><label>Address</label><textarea name="address" rows="2" required></textarea></div>
                 <div class="form-group"><label>City</label><input name="city" required></div>
                 <div class="form-group"><label>Payment</label>
                   <select name="payment"><option>Cash on Delivery</option></select></div>
                 <button class="btn btn-block" type="submit" id="placeBtn">Place Order</button>
               </form>`
            : `<a class="btn btn-block" href="/login.html?redirect=/cart.html">Login to Checkout</a>
               <p style="font-size:13px;text-align:center;margin-top:8px">New here? <a href="/register.html?redirect=/cart.html" style="color:var(--brown)">Create an account</a></p>`
        }
      </div>
    </div>`;

  const form = document.getElementById('checkoutForm');
  if (form) form.addEventListener('submit', placeOrder);
}

function changeQty(id, value) {
  const item = Cart.get().find((i) => i.productId === id);
  const max = (item && item.stock) || 99;
  Cart.setQty(id, Math.min(parseInt(value, 10) || 1, max));
  renderCart();
}

function removeItem(id) {
  Cart.remove(id);
  renderCart();
}

function clearCart() {
  Cart.clear();
  renderCart();
}

async function placeOrder(e) {
  e.preventDefault();
  const form = e.target;
  const alertBox = document.getElementById('checkoutAlert');
  const btn = document.getElementById('placeBtn');
  btn.disabled = true;
  btn.textContent = 'Placing order...';

  const body = {
    items: Cart.get().map((i) => ({ productId: i.productId, qty: i.qty })),
    shipping: {
      fullName: form.fullName.value.trim(),
      phone: form.phone.value.trim(),
      address: form.address.value.trim(),
      city: form.city.value.trim(),
    },
  };

  try {
    const order = await api('/orders', { method: 'POST', body: JSON.stringify(body) });
    Cart.clear();
    location.href = '/orders.html?success=' + order._id;
  } catch (err) {
    alertBox.className = 'alert error';
    alertBox.textContent = err.message;
    btn.disabled = false;
    btn.textContent = 'Place Order';
  }
}

renderCart();
