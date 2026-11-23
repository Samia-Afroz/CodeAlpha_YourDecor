// ===== home.js: slider + categories + featured products =====

// ---- Hero slider ----
(function slider() {
  const slides = document.querySelectorAll('.slide');
  const dots = document.getElementById('dots');
  let current = 0;
  let timer;

  slides.forEach((_, i) => {
    const d = document.createElement('span');
    d.onclick = () => show(i);
    dots.appendChild(d);
  });

  function show(i) {
    slides[current].classList.remove('active');
    dots.children[current].classList.remove('active');
    current = (i + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots.children[current].classList.add('active');
    clearInterval(timer);
    timer = setInterval(() => show(current + 1), 5000);
  }

  document.getElementById('prevSlide').onclick = () => show(current - 1);
  document.getElementById('nextSlide').onclick = () => show(current + 1);
  show(0);
})();

// ---- Categories ----
async function loadCategories() {
  const grid = document.getElementById('categoryGrid');
  try {
    const cats = await api('/products/categories');
    grid.innerHTML = cats
      .map(
        (c) => `
        <a class="category-card" href="/products.html?category=${c.slug}">
          ${imgTag(c.image, c.name, 'loading="lazy"')}
          <h3>${esc(c.name)}</h3>
          <p>${c.count} products</p>
        </a>`
      )
      .join('');
  } catch (err) {
    grid.innerHTML = `<p class="empty">${esc(err.message)}</p>`;
  }
}

// ---- Featured products ----
async function loadFeatured() {
  const grid = document.getElementById('featuredGrid');
  try {
    const products = await api('/products?featured=true');
    grid.innerHTML = products.length
      ? products.slice(0, 8).map(productCard).join('')
      : '<p class="empty">No featured products yet. Run "npm run seed".</p>';
  } catch (err) {
    grid.innerHTML = `<p class="empty">${esc(err.message)}</p>`;
  }
}

loadCategories();
loadFeatured();
