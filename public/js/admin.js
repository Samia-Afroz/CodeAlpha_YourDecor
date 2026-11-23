// ===== admin.js: admin sees all orders and moves them through the stages =====
const me = Auth.user();
if (!me || !me.isAdmin) location.href = '/login.html?redirect=/admin.html';

let filterStatus = '';
const ALL_STATUSES = [...ORDER_STAGES.map((s) => s.key), 'Cancelled'];

async function loadStats() {
  try {
    const s = await api('/admin/stats');
    document.getElementById('stats').innerHTML = `
      <div class="stat"><span>Total orders</span><strong>${s.totalOrders}</strong></div>
      <div class="stat"><span>Waiting to confirm</span><strong>${s.byStatus.Pending || 0}</strong></div>
      <div class="stat"><span>In progress</span><strong>${(s.byStatus.Confirmed || 0) + (s.byStatus.Packed || 0) + (s.byStatus.Shipped || 0) + (s.byStatus['Out for Delivery'] || 0)}</strong></div>
      <div class="stat"><span>Delivered</span><strong>${s.byStatus.Delivered || 0}</strong></div>
      <div class="stat"><span>Revenue (delivered)</span><strong>${money(s.revenue)}</strong></div>`;

    document.getElementById('statusTabs').innerHTML =
      `<button class="${!filterStatus ? 'active' : ''}" onclick="setFilter('')">All (${s.totalOrders})</button>` +
      ALL_STATUSES.map(
        (st) => `<button class="${filterStatus === st ? 'active' : ''}" onclick="setFilter('${st}')">${stageLabel(st)} (${s.byStatus[st] || 0})</button>`
      ).join('');
  } catch (err) {
    document.getElementById('stats').innerHTML = `<p class="empty">${esc(err.message)}</p>`;
  }
}

function setFilter(st) {
  filterStatus = st;
  loadAll();
}

// Next logical stage, used as the default choice in the dropdown
function nextStage(status) {
  const i = ORDER_STAGES.findIndex((s) => s.key === status);
  return i >= 0 && i < ORDER_STAGES.length - 1 ? ORDER_STAGES[i + 1].key : status;
}

function adminOrderCard(o) {
  const locked = o.status === 'Delivered' || o.status === 'Cancelled';
  const next = nextStage(o.status);
  return `
    <div class="order-card">
      <div class="order-head">
        <span><strong>#${o._id.slice(-6).toUpperCase()}</strong></span>
        <span>${o.user ? esc(o.user.name) + ' · ' + esc(o.user.email) : 'Deleted user'}</span>
        <span>${fmtDate(o.createdAt)}</span>
        <span><strong>${money(o.totalPrice)}</strong></span>
        <span class="status status-${o.status.replace(/\s+/g, '-').toLowerCase()}">${esc(stageLabel(o.status))}</span>
      </div>
      <div class="order-body">
        ${orderTracker(o)}
        <div class="order-items">
          ${o.items.map((i) => `<div class="order-line"><span>${esc(i.name)} × ${i.qty}</span><span>${money(i.price * i.qty)}</span></div>`).join('')}
        </div>
        <p style="font-size:13px;color:var(--muted);margin:6px 0 12px">Ship to: ${esc(o.shipping.fullName)}, ${esc(o.shipping.address)}, ${esc(o.shipping.city)} · 📞 ${esc(o.shipping.phone)}</p>

        ${
          locked
            ? `<p style="font-size:13px;color:var(--muted)">This order is ${esc(o.status)} — no further changes.</p>`
            : `<div class="status-form">
                 <select id="st-${o._id}">
                   ${ALL_STATUSES.filter((s) => s !== o.status)
                     .map((s) => `<option value="${s}" ${s === next ? 'selected' : ''}>${stageLabel(s)}</option>`)
                     .join('')}
                 </select>
                 <input id="note-${o._id}" placeholder="Note for customer (optional)">
                 <button class="btn" onclick="updateStatus('${o._id}')">Update Status</button>
               </div>`
        }

        <details class="history">
          <summary>Tracking history</summary>
          ${orderTimeline(o)}
        </details>
      </div>
    </div>`;
}

async function loadOrders() {
  const box = document.getElementById('adminOrders');
  try {
    const orders = await api('/admin/orders' + (filterStatus ? '?status=' + encodeURIComponent(filterStatus) : ''));
    box.innerHTML = orders.length ? orders.map(adminOrderCard).join('') : '<p class="empty">No orders here.</p>';
  } catch (err) {
    box.innerHTML = `<p class="empty">${esc(err.message)}</p>`;
  }
}

async function updateStatus(id) {
  const status = document.getElementById('st-' + id).value;
  const note = document.getElementById('note-' + id).value;
  if (status === 'Cancelled' && !confirm('Cancel this order? Stock will be returned.')) return;
  try {
    await api(`/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, note }) });
    toast(`Order updated to "${stageLabel(status)}"`);
    loadAll();
  } catch (err) {
    toast(err.message);
  }
}

function loadAll() {
  loadStats();
  loadOrders();
}

loadAll();
