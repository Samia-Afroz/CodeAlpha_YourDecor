// ===== product.js: single product details page =====
const slug = getParam('slug');

async function loadProduct() {
  const box = document.getElementById('productDetail');
  if (!slug) {
    box.innerHTML = '<p class="empty">No product selected.</p>';
    return;
  }
  try {
    const p = await api('/products/' + encodeURIComponent(slug));
    productCache[p._id] = p;
    document.title = `${p.name} | Your Decor`;
    document.getElementById('crumb').innerHTML =
      `<a href="/index.html">Home</a> / <a href="/products.html?category=${p.category}">${esc(p.category)}</a> / ${esc(p.name)}`;

    const sale = p.oldPrice > p.price;
    const inStock = p.stock > 0;

    box.innerHTML = `
      <div class="detail">
        <div>${imgTag(p.image, p.name)}</div>
        <div>
          <span class="cat" style="text-transform:uppercase;color:var(--muted);font-size:12px;letter-spacing:1px">${esc(p.category)}</span>
          <h1>${esc(p.name)}</h1>
          <div class="price">${money(p.price)}${sale ? `<span class="old-price">${money(p.oldPrice)}</span>` : ''}</div>
          <p class="desc">${esc(p.description)}</p>
          <p class="stock ${inStock ? 'in' : 'out'}">${inStock ? `✔ In stock (${p.stock} available)` : '✖ Out of stock'}</p>

          ${
            inStock
              ? `<div class="qty-row">
                   <span>Quantity:</span>
                   <div class="qty-box">
                     <button type="button" id="minus">−</button>
                     <input type="number" id="qty" value="1" min="1" max="${p.stock}">
                     <button type="button" id="plus">+</button>
                   </div>
                 </div>
                 <button class="btn" id="addBtn">Add to Cart</button>
                 <button class="btn btn-outline" id="buyBtn">Buy Now</button>`
              : ''
          }
        </div>
      </div>`;

    if (inStock) {
      const qtyInput = document.getElementById('qty');
      const readQty = () => Math.min(Math.max(parseInt(qtyInput.value, 10) || 1, 1), p.stock);
      document.getElementById('minus').onclick = () => (qtyInput.value = Math.max(readQty() - 1, 1));
      document.getElementById('plus').onclick = () => (qtyInput.value = Math.min(readQty() + 1, p.stock));
      document.getElementById('addBtn').onclick = () => Cart.add(p, readQty());
      document.getElementById('buyBtn').onclick = () => {
        Cart.add(p, readQty());
        location.href = '/cart.html';
      };
    }

    loadRelated(p);
  } catch (err) {
    box.innerHTML = `<p class="empty">${esc(err.message)}</p>`;
  }
}

async function loadRelated(p) {
  const list = (await api('/products?category=' + p.category)).filter((x) => x._id !== p._id).slice(0, 4);
  if (!list.length) return;
  document.getElementById('relatedGrid').innerHTML = list.map(productCard).join('');
  document.getElementById('relatedSection').style.display = 'block';
}

loadProduct();
