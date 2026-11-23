// ===== orders.js: customer's orders with live tracking =====
if (!Auth.token()) location.href = '/login.html?redirect=/orders.html';

const successId = getParam('success');
if (successId) {
  const m = document.getElementById('successMsg');
  m.className = 'alert success';
  m.textContent = `🎉 Thank you! Your order #${successId.slice(-6).toUpperCase()} has been placed. Track its progress below.`;
}

const CAN_CANCEL = ['Pending', 'Confirmed'];

function orderCard(o) {
  return `
    <div class="order-card" id="order-${o._id}">
      <div class="order-head">
        <span><strong>Order #${o._id.slice(-6).toUpperCase()}</strong></span>
        <span>Placed: ${fmtDate(o.createdAt)}</span>
        <span class="status status-${o.status.replace(/\s+/g, '-').toLowerCase()}">${esc(stageLabel(o.status))}</span>
      </div>
      <div class="order-body">
        ${orderTracker(o)}

        <div class="order-items">
          ${o.items
            .map(
              (i) => `<div class="order-line">
                  <span class="oi">${imgTag(i.image, i.name)} ${esc(i.name)} × ${i.qty}</span>
                  <span>${money(i.price * i.qty)}</span></div>`
            )
            .join('')}
          <div class="order-line"><span>Delivery</span><span>${o.deliveryCharge ? money(o.deliveryCharge) : 'Free'}</span></div>
          <div class="order-line" style="font-weight:600"><span>Total (${esc(o.paymentMethod)}${o.isPaid ? ' · Paid' : ''})</span><span>${money(o.totalPrice)}</span></div>
        </div>
        <p style="font-size:13px;color:var(--muted);margin-top:6px">Ship to: ${esc(o.shipping.fullName)}, ${esc(o.shipping.address)}, ${esc(o.shipping.city)} · ${esc(o.shipping.phone)}</p>

        <details class="history">
          <summary>View tracking history</summary>
          ${orderTimeline(o)}
        </details>

        ${
          CAN_CANCEL.includes(o.status)
            ? `<button class="btn btn-outline btn-sm" onclick="cancelOrder('${o._id}')">Cancel Order</button>`
            : ''
        }
      </div>
    </div>`;
}

async function loadOrders() {
  const box = document.getElementById('ordersList');
  try {
    const orders = await api('/orders/my');
    if (!orders.length) {
      box.innerHTML = `<div class="empty"><p>You have no orders yet.</p><br><a href="/products.html" class="btn">Start Shopping</a></div>`;
      return;
    }
    box.innerHTML = orders.map(orderCard).join('');
  } catch (err) {
    box.innerHTML = `<p class="empty">${esc(err.message)} — <a href="/login.html?redirect=/orders.html" style="color:var(--brown)">Login</a></p>`;
  }
}

async function cancelOrder(id) {
  if (!confirm('Cancel this order?')) return;
  try {
    await api(`/orders/${id}/cancel`, { method: 'PATCH' });
    toast('Order cancelled');
    loadOrders();
  } catch (err) {
    toast(err.message);
  }
}

loadOrders();
// Refresh every 30 seconds so new stages appear automatically
setInterval(loadOrders, 30000);
