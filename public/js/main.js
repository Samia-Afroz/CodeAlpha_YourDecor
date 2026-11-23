// ===== main.js: shared code used by every page =====
const API = '/api';
const SHOP = {
  name: 'Your Decor',
  tagline: 'Your home, your choice',
  phone: '+880 1700-000000',
  email: 'hello@yourdecor.com',
  address: 'Dhaka, Bangladesh',
};

// Shown when an image file is missing
const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="100%" height="100%" fill="#f6efe4"/><text x="50%" y="50%" fill="#b08968" font-family="Georgia" font-size="28" text-anchor="middle" dominant-baseline="middle">Your Decor</text></svg>'
  );

// ---------- small helpers ----------
const $ = (sel) => document.querySelector(sel);
const money = (n) => '৳' + Number(n || 0).toLocaleString('en-US');
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const imgTag = (src, alt, extra = '') =>
  `<img src="${esc(src || PLACEHOLDER)}" alt="${esc(alt)}" ${extra} onerror="this.onerror=null;this.src=PLACEHOLDER">`;
const getParam = (name) => new URLSearchParams(location.search).get(name);

function toast(msg) {
  let t = $('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ---------- auth (token kept in localStorage) ----------
const Auth = {
  token: () => localStorage.getItem('yd_token'),
  user: () => JSON.parse(localStorage.getItem('yd_user') || 'null'),
  save(token, user) {
    localStorage.setItem('yd_token', token);
    localStorage.setItem('yd_user', JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem('yd_token');
    localStorage.removeItem('yd_user');
    location.href = '/index.html';
  },
};

// fetch wrapper: adds token + JSON, throws readable errors
async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (Auth.token()) headers.Authorization = 'Bearer ' + Auth.token();
  const res = await fetch(API + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && Auth.token()) {
    localStorage.removeItem('yd_token');
    localStorage.removeItem('yd_user');
  }
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

// ---------- cart (kept in localStorage) ----------
const Cart = {
  get: () => JSON.parse(localStorage.getItem('yd_cart') || '[]'),
  save(items) {
    localStorage.setItem('yd_cart', JSON.stringify(items));
    updateCartCount();
  },
  add(product, qty = 1) {
    const items = Cart.get();
    const found = items.find((i) => i.productId === product._id);
    if (found) found.qty = Math.min(found.qty + qty, product.stock || 99);
    else
      items.push({
        productId: product._id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.image,
        stock: product.stock,
        qty,
      });
    Cart.save(items);
    toast(`"${product.name}" added to cart`);
  },
  setQty(productId, qty) {
    const items = Cart.get().map((i) => (i.productId === productId ? { ...i, qty: Math.max(1, qty) } : i));
    Cart.save(items);
  },
  remove(productId) {
    Cart.save(Cart.get().filter((i) => i.productId !== productId));
  },
  clear() {
    Cart.save([]);
  },
  count: () => Cart.get().reduce((s, i) => s + i.qty, 0),
  subtotal: () => Cart.get().reduce((s, i) => s + i.qty * i.price, 0),
};

function updateCartCount() {
  const el = $('#cartCount');
  if (el) el.textContent = Cart.count();
}

// Keeps a list of loaded products so "Add to cart" buttons can find them
const productCache = {};
function addToCartById(id) {
  const p = productCache[id];
  if (!p) return;
  if (p.stock < 1) return toast('Sorry, this item is out of stock');
  Cart.add(p, 1);
}

// ---------- product card used on many pages ----------
function productCard(p) {
  productCache[p._id] = p;
  const sale = p.oldPrice > p.price;
  return `
    <div class="product-card">
      <a href="/product.html?slug=${encodeURIComponent(p.slug)}" class="img-wrap">
        ${imgTag(p.image, p.name, 'loading="lazy"')}
        ${sale ? '<span class="badge">Sale</span>' : ''}
        ${p.stock < 1 ? '<span class="badge" style="background:#b3412e">Sold out</span>' : ''}
      </a>
      <div class="info">
        <span class="cat">${esc(p.category)}</span>
        <h3><a href="/product.html?slug=${encodeURIComponent(p.slug)}">${esc(p.name)}</a></h3>
        <div class="price">${money(p.price)}${sale ? `<span class="old-price">${money(p.oldPrice)}</span>` : ''}</div>
        <div class="actions">
          <a class="btn btn-outline" href="/product.html?slug=${encodeURIComponent(p.slug)}">Details</a>
          <button class="btn" onclick="addToCartById('${p._id}')">Add to cart</button>
        </div>
      </div>
    </div>`;
}

// ---------- order tracking (used on My Orders + Admin pages) ----------
// Must match STAGES in models/Order.js
const ORDER_STAGES = [
  { key: 'Pending',          label: 'Order Placed',     icon: '🧾', text: 'We received your order and will confirm it soon.' },
  { key: 'Confirmed',        label: 'Confirmed',        icon: '✔',  text: 'Your order is confirmed.' },
  { key: 'Packed',           label: 'Packed & Ready',   icon: '📦', text: 'Your order is packed and ready to ship.' },
  { key: 'Shipped',          label: 'Shipped',          icon: '🚚', text: 'Your order has been handed to the courier.' },
  { key: 'Out for Delivery', label: 'Out for Delivery', icon: '🛵', text: 'Our delivery partner is on the way to you.' },
  { key: 'Delivered',        label: 'Delivered',        icon: '🏠', text: 'Delivered. Enjoy your new pieces!' },
];
const stageLabel = (status) =>
  status === 'Cancelled' ? 'Cancelled' : (ORDER_STAGES.find((s) => s.key === status) || {}).label || status;
const fmtDate = (d) =>
  new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// Progress bar with 6 steps; dates come from order.statusHistory
function orderTracker(order) {
  const history = order.statusHistory || [];
  if (order.status === 'Cancelled') {
    const c = history.filter((h) => h.status === 'Cancelled').pop();
    return `<div class="tracker-cancelled">✖ This order was cancelled${c ? ' on ' + fmtDate(c.date) : ''}${c && c.note ? ' — ' + esc(c.note) : ''}</div>`;
  }
  const current = ORDER_STAGES.findIndex((s) => s.key === order.status);
  const dateOf = (key) => {
    const h = history.filter((x) => x.status === key).pop();
    if (h) return fmtDate(h.date);
    if (key === 'Pending') return fmtDate(order.createdAt);
    return '';
  };
  return `
    <div class="tracker">
      ${ORDER_STAGES.map((s, i) => `
        <div class="step ${i < current ? 'done' : ''} ${i === current ? 'current' : ''}">
          <div class="dot">${i <= current ? s.icon : i + 1}</div>
          <div class="step-label">${s.label}</div>
          <div class="step-date">${i <= current ? dateOf(s.key) : ''}</div>
        </div>`).join('')}
    </div>
    <p class="tracker-msg">${ORDER_STAGES[current] ? ORDER_STAGES[current].text : ''}</p>`;
}

// Full timeline of status changes with notes
function orderTimeline(order) {
  const history = (order.statusHistory || []).slice().reverse();
  if (!history.length) return '';
  return `<ul class="timeline">${history
    .map((h) => `<li><strong>${esc(stageLabel(h.status))}</strong> <span>${fmtDate(h.date)}</span>${h.note ? `<p>${esc(h.note)}</p>` : ''}</li>`)
    .join('')}</ul>`;
}

// ---------- header / navbar / footer injected on every page ----------
function renderHeader() {
  const user = Auth.user();
  const page = location.pathname;
  const active = (p) => (page.endsWith(p) ? 'active' : '');

  $('#header').innerHTML = `
    <div class="topbar">
      <div class="container">
        <div>📞 ${SHOP.phone} &nbsp; | &nbsp; ✉ ${SHOP.email}</div>
        <div class="links">
          ${
            user
              ? `<span>Hi, ${esc(user.name.split(' ')[0])}</span>
                 ${user.isAdmin ? '<a href="/admin.html">Admin Panel</a>' : ''}
                 <a href="/orders.html">My Orders</a>
                 <a href="#" id="logoutBtn">Logout</a>`
              : `<a href="/login.html">Login</a> <a href="/register.html">Register</a>`
          }
        </div>
      </div>
    </div>

    <div class="main-header">
      <div class="container">
        <a href="/index.html" class="logo">
          <img src="/images/logo.png" alt="Your Decor logo" onerror="this.style.display='none'">
          <div class="logo-text"><strong>${SHOP.name}</strong><span>${SHOP.tagline}</span></div>
        </a>
        <form class="search-form" action="/products.html">
          <input type="text" name="search" placeholder="Search mirrors, vases, plates..." value="${esc(getParam('search') || '')}">
          <button class="btn" type="submit">Search</button>
        </form>
        <a href="/cart.html" class="btn cart-btn">🛒 Cart <span class="cart-count" id="cartCount">0</span></a>
      </div>
    </div>

    <nav class="navbar">
      <div class="container">
        <button class="menu-toggle" id="menuToggle" aria-label="Menu">☰</button>
        <ul class="nav-links" id="navLinks">
          <li><a href="/index.html" class="${active('index.html') || (page === '/' ? 'active' : '')}">Home</a></li>
          <li class="dropdown" id="catDropdown">
            <a href="/products.html">Categories ▾</a>
            <div class="dropdown-menu" id="catMenu"><span>Loading...</span></div>
          </li>
          <li><a href="/products.html" class="${active('products.html')}">Shop All</a></li>
          <li><a href="/products.html?category=plates">Culinary</a></li>
          <li><a href="/index.html#about">About Us</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </div>
    </nav>`;

  if ($('#logoutBtn')) $('#logoutBtn').onclick = (e) => { e.preventDefault(); Auth.logout(); };
  $('#menuToggle').onclick = () => $('#navLinks').classList.toggle('show');
  // On mobile, tap "Categories" to open/close the list
  $('#catDropdown > a').addEventListener('click', (e) => {
    if (window.innerWidth <= 700) {
      e.preventDefault();
      $('#catDropdown').classList.toggle('open');
    }
  });

  updateCartCount();
  loadCategoryMenu();
}

async function loadCategoryMenu() {
  try {
    const cats = await api('/products/categories');
    const groups = {};
    cats.forEach((c) => (groups[c.group] = groups[c.group] || []).push(c));
    $('#catMenu').innerHTML = Object.entries(groups)
      .map(
        ([group, list]) => `
        <div>
          <h4>${esc(group)}</h4>
          <ul>${list.map((c) => `<li><a href="/products.html?category=${c.slug}">${esc(c.name)}</a></li>`).join('')}</ul>
        </div>`
      )
      .join('');
  } catch {
    $('#catMenu').innerHTML = '<span>Could not load categories</span>';
  }
}

function renderFooter() {
  $('#footer').innerHTML = `
    <footer class="footer" id="contact">
      <div class="container footer-grid">
        <div>
          <h4>${SHOP.name}</h4>
          <p>${SHOP.tagline}. Mirrors, vases, plants, furniture and beautiful tableware to make every corner feel like home.</p>
        </div>
        <div>
          <h4>Shop</h4>
          <ul>
            <li><a href="/products.html?category=mirrors">Mirrors</a></li>
            <li><a href="/products.html?category=vases">Vases</a></li>
            <li><a href="/products.html?category=furniture">Furniture</a></li>
            <li><a href="/products.html?category=plates">Plates</a></li>
          </ul>
        </div>
        <div>
          <h4>Account</h4>
          <ul>
            <li><a href="/login.html">Login</a></li>
            <li><a href="/register.html">Register</a></li>
            <li><a href="/orders.html">My Orders</a></li>
            <li><a href="/cart.html">Cart</a></li>
          </ul>
        </div>
        <div>
          <h4>Contact</h4>
          <p>📍 ${SHOP.address}</p>
          <p>📞 ${SHOP.phone}</p>
          <p>✉ ${SHOP.email}</p>
        </div>
      </div>
      <div class="footer-bottom">© ${new Date().getFullYear()} ${SHOP.name}. All rights reserved.</div>
    </footer>`;
}

document.addEventListener('DOMContentLoaded', () => {
  if ($('#header')) renderHeader();
  if ($('#footer')) renderFooter();
});
