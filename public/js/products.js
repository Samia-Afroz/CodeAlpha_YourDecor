// ===== products.js: shop page with category filter, search and sort =====
const category = getParam('category') || '';
const search = getParam('search') || '';
let categories = [];

async function loadSidebar() {
  categories = await api('/products/categories');
  const total = categories.reduce((s, c) => s + c.count, 0);
  document.getElementById('sideCats').innerHTML =
    `<li><a href="/products.html" class="${!category ? 'active' : ''}">All <span>${total}</span></a></li>` +
    categories
      .map(
        (c) => `<li><a href="/products.html?category=${c.slug}" class="${c.slug === category ? 'active' : ''}">
                  ${esc(c.name)} <span>${c.count}</span></a></li>`
      )
      .join('');

  // Page title
  const cat = categories.find((c) => c.slug === category);
  let title = 'All Products';
  if (cat) title = cat.name;
  if (search) title = `Search: "${search}"`;
  document.getElementById('pageTitle').textContent = title;
  document.getElementById('crumb').textContent = title;
  document.title = `${title} | Your Decor`;
}

async function loadProducts() {
  const grid = document.getElementById('productGrid');
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (search) params.set('search', search);
  const sort = document.getElementById('sortSelect').value;
  if (sort) params.set('sort', sort);

  try {
    const products = await api('/products?' + params.toString());
    document.getElementById('resultCount').textContent = `${products.length} product(s) found`;
    grid.innerHTML = products.length
      ? products.map(productCard).join('')
      : '<p class="empty">No products found.</p>';
  } catch (err) {
    grid.innerHTML = `<p class="empty">${esc(err.message)}</p>`;
  }
}

document.getElementById('sortSelect').addEventListener('change', loadProducts);
loadSidebar().catch(() => {});
loadProducts();
