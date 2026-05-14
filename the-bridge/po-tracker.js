/* ============================================================================
   The Bridge — PO Tracker (reusable component)
   ============================================================================
   Drop-in purchase coordination for any PO page.

   USAGE:
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     <script src="po-tracker.js"></script>
     <script>
       POTracker.init({
         poSlug: 'anniversary-2026-gear',
         // optional overrides:
         //   supabaseUrl, supabaseKey, statusCellSelector, autoRender
       });
     </script>

   ROW MARKUP (the tracker hydrates these automatically):
     <td class="status-col" data-line-ref="5.19"><div class="status-box"></div></td>
     <tr data-line-ref="5.19" data-line-amount="260.00" data-line-name="Tenveo VHD10U PTZ camera">
       ...
     </tr>

   SUPPLIER BLOCK MARKUP (for per-supplier tally):
     <div class="supplier" data-supplier-name="Amazon UK">
       ...
       <div class="supplier-tally"></div>   <!-- optional, tracker fills it -->
     </div>

   PAGE-LEVEL TALLY (optional, tracker fills it):
     <div id="po-overall-tally"></div>

   AUTH:
     Reads sessionStorage 'bridge_user' (set by Bridge login flow).
     Falls back to anonymous read-only mode if no user.
   ============================================================================ */

(function(global) {
  'use strict';

  // ── CONFIG ─────────────────────────────────────────────────────────────────
  const DEFAULTS = {
    supabaseUrl: 'https://pfycvgbrsbecznkcikwt.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmeWN2Z2Jyc2JlY3pua2Npa3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNzY1NDgsImV4cCI6MjA5MDk1MjU0OH0.xw_DSmC0brKC7K9H-rxNG0HKKDi4I-dNSEoZKERvHcQ',
    table: 'po_line_purchases',
    autoRender: true,
    pollOnFocus: true,
    authMode: 'bridge',          // 'bridge' (default) or 'pin'
    pin: null,                   // required when authMode === 'pin'
    purchasers: null,            // required when authMode === 'pin' — array of names
  };

  const STATUS_LABELS = {
    pending:   { label: 'Record purchase',     icon: '○',  color: '#86868B' },
    claimed:   { label: 'Claimed',  icon: '◐',  color: '#0071E3' },
    ordered:   { label: 'Ordered',  icon: '◑',  color: '#BF9B30' },
    received:  { label: 'Received', icon: '●',  color: '#34C759' },
    cancelled: { label: 'Cancelled',icon: '✕',  color: '#FF3B30' },
  };

  // Levels permitted to act (claim/order/receive). All others are read-only.
  // Aligns with bridge_users_v2.level values: 'admin' = full access.
  const ACTION_LEVELS = new Set(['admin', 'lead']);

  let config = null;
  let supa = null;
  let currentUser = null;       // { id, name, level } in bridge mode; { name:'pin-unlocked', level:'admin' } in pin mode
  let state = {};               // line_ref -> purchase row
  let orders = {};              // order_id -> order row
  let pinUnlocked = false;      // pin auth gate
  let renderQueue = new Set();

  // ── INIT ───────────────────────────────────────────────────────────────────
  function init(opts) {
    config = Object.assign({}, DEFAULTS, opts || {});
    if (!config.poSlug) throw new Error('POTracker.init requires poSlug');

    if (config.authMode === 'pin') {
      if (!config.pin) throw new Error('POTracker.init: pin required when authMode=pin');
      if (!Array.isArray(config.purchasers) || config.purchasers.length === 0) {
        throw new Error('POTracker.init: purchasers array required when authMode=pin');
      }
      // PIN mode: gate is the page itself. No bridge user.
      // Check if PIN already entered this tab.
      pinUnlocked = sessionStorage.getItem('po_pin_unlocked_' + config.poSlug) === '1';
      console.log('[POTracker] PIN mode init. pinUnlocked from storage:', pinUnlocked, '(slug:', config.poSlug + ')');
      if (pinUnlocked) {
        // Synthesise a "user" that satisfies the action-permission checks.
        // Real purchaser identity is captured at action time via the dropdown.
        currentUser = { id: null, name: null, level: 'admin' };
      }
    } else {
      // Bridge auth: load current user from sessionStorage / localStorage
      try {
        let raw = sessionStorage.getItem('bridge_user');
        if (!raw) raw = localStorage.getItem('bridge_user');
        if (raw) currentUser = JSON.parse(raw);
      } catch(e) { /* ignore */ }
    }

    // Inject styles once
    injectStyles();

    // Build Supabase client
    if (typeof global.supabase !== 'undefined' && global.supabase.createClient) {
      supa = global.supabase.createClient(config.supabaseUrl, config.supabaseKey);
    } else {
      console.warn('[POTracker] supabase-js not loaded — tracker will run in read-only fallback');
    }

    // Build the action sheet (one shared instance)
    buildActionSheet();

    // PIN mode: show the gate overlay if not yet unlocked
    if (config.authMode === 'pin' && !pinUnlocked) {
      console.log('[POTracker] Building PIN gate overlay');
      try {
        buildPinGate();
      } catch(e) {
        console.error('[POTracker] PIN gate build failed:', e);
        alert('PIN gate failed to render. Open the browser console for details, or run POTracker.lock() to reset.');
      }
    } else if (config.authMode === 'pin' && pinUnlocked) {
      console.log('[POTracker] PIN already unlocked, skipping gate. To re-show, run: POTracker.lock()');
    }

    // Initial hydrate
    if (config.autoRender) {
      hydrate();
      if (config.pollOnFocus) {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            if (config.authMode === 'bridge') {
              // Re-read session in case user logged in via another tab
              try {
                let raw = sessionStorage.getItem('bridge_user');
                if (!raw) raw = localStorage.getItem('bridge_user');
                if (raw) {
                  const fresh = JSON.parse(raw);
                  if (!currentUser || currentUser.id !== fresh.id) {
                    currentUser = fresh;
                    const notice = document.getElementById('po-auth-notice');
                    if (notice) notice.style.display = 'none';
                  }
                }
              } catch(e) { /* ignore */ }
            }
            hydrate();
          }
        });
      }
    }
  }

  // ── DATA ───────────────────────────────────────────────────────────────────
  async function fetchAll() {
    if (!supa) return [];
    const { data, error } = await supa
      .from(config.table)
      .select('*')
      .eq('po_slug', config.poSlug);
    if (error) {
      console.error('[POTracker] fetch error', error);
      return [];
    }
    return data || [];
  }

  async function fetchAllOrders() {
    if (!supa) return [];
    const { data, error } = await supa
      .from('po_orders')
      .select('*')
      .eq('po_slug', config.poSlug);
    if (error) {
      // Common case: po_orders table not yet migrated. Don't blow up.
      console.warn('[POTracker] fetchAllOrders failed (po_orders table may not exist yet):', error.message);
      return [];
    }
    return data || [];
  }

  /**
   * Create an order, then update each line to point to it.
   * @param {object} orderData — supplier, order_ref, purchaser, payment_method,
   *                             lines_total, extras_total, grand_total, extras, notes
   * @param {Array<{lineRef:string, final_amount:number, order_ref?:string}>} lineEntries
   */
  async function createOrder(orderData, lineEntries) {
    if (!supa) throw new Error('Supabase not available');
    const now = new Date().toISOString();

    // 1. Insert the order
    const orderRow = Object.assign({
      po_slug: config.poSlug,
      placed_at: now,
      status: 'placed',
    }, orderData);
    console.log('[POTracker] Creating order:', orderRow);
    const { data: order, error: orderErr } = await supa
      .from('po_orders')
      .insert(orderRow)
      .select()
      .single();
    if (orderErr) {
      console.error('[POTracker] Order insert failed:', orderErr);
      throw orderErr;
    }

    // 2. Update each line. Mix of update-existing-claim and insert-new.
    for (const entry of lineEntries) {
      const patch = {
        status: 'ordered',
        ordered_at: now,
        claimed_at: now,
        final_amount: entry.final_amount,
        order_ref: orderData.order_ref || null,
        order_id: order.id,
        purchaser: orderData.purchaser,
        purchaser_id: null,
        payment_method: orderData.payment_method || null,
      };
      const existing = state[entry.lineRef];
      if (existing && existing.id) {
        const { error } = await supa
          .from(config.table)
          .update(patch)
          .eq('id', existing.id);
        if (error) { console.error('[POTracker] line update failed', entry.lineRef, error); throw error; }
      } else {
        const row = Object.assign({
          po_slug: config.poSlug,
          line_ref: entry.lineRef,
        }, patch);
        const { error } = await supa
          .from(config.table)
          .insert(row);
        if (error) { console.error('[POTracker] line insert failed', entry.lineRef, error); throw error; }
      }
    }
    return order;
  }

  async function deleteOrder(orderId) {
    if (!supa) throw new Error('Supabase not available');
    // First detach all lines (set them back to pending, clear order_id)
    const { error: detachErr } = await supa
      .from(config.table)
      .update({
        status: 'pending',
        order_id: null,
        ordered_at: null,
        claimed_at: null,
        final_amount: null,
        order_ref: null,
        purchaser: null,
        purchaser_id: null,
        payment_method: null,
      })
      .eq('order_id', orderId);
    if (detachErr) throw detachErr;
    const { error } = await supa.from('po_orders').delete().eq('id', orderId);
    if (error) throw error;
  }

  async function markOrderReceived(orderId) {
    if (!supa) throw new Error('Supabase not available');
    const now = new Date().toISOString();
    const { error: oErr } = await supa
      .from('po_orders')
      .update({ status: 'received', received_at: now })
      .eq('id', orderId);
    if (oErr) throw oErr;
    const { error: lErr } = await supa
      .from(config.table)
      .update({ status: 'received', received_at: now })
      .eq('order_id', orderId);
    if (lErr) throw lErr;
  }

  async function upsertLine(lineRef, patch) {
    if (!supa) throw new Error('Supabase not available');
    console.log('[POTracker] upsertLine called — line_ref:', lineRef, 'patch:', JSON.stringify(patch));
    // Try update first (will be a no-op if no row exists)
    const existing = state[lineRef];
    if (existing && existing.id) {
      console.log('[POTracker] UPDATE path, existing.id:', existing.id);
      const { data, error } = await supa
        .from(config.table)
        .update(patch)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) {
        console.error('[POTracker] UPDATE failed. Patch was:', patch, 'Error:', error);
        throw error;
      }
      return data;
    } else {
      // Insert new row
      const row = Object.assign({
        po_slug: config.poSlug,
        line_ref: lineRef,
      }, patch);
      console.log('[POTracker] INSERT path, full row:', JSON.stringify(row));
      const { data, error } = await supa
        .from(config.table)
        .insert(row)
        .select()
        .single();
      if (error) {
        console.error('[POTracker] INSERT failed. Row was:', row, 'Error:', error);
        // 23505 = unique_violation — someone else claimed it microseconds ago
        if (error.code === '23505') {
          await hydrate();
          throw new Error('Already claimed by someone else — refresh to see who.');
        }
        throw error;
      }
      return data;
    }
  }

  async function hydrate() {
    const [rows, orderRows] = await Promise.all([fetchAll(), fetchAllOrders()]);
    state = {};
    rows.forEach(r => { state[r.line_ref] = r; });
    orders = {};
    orderRows.forEach(o => { orders[o.id] = o; });
    renderAll();
  }

  // ── RENDER ─────────────────────────────────────────────────────────────────
  function renderAll() {
    document.querySelectorAll('[data-line-ref]').forEach(el => {
      const lineRef = el.getAttribute('data-line-ref');
      if (el.matches('.status-col')) renderStatusCell(el, state[lineRef]);
    });
    renderTallies();
    renderLastUpdated();
  }

  function renderStatusCell(cell, row) {
    const lineRef = cell.getAttribute('data-line-ref');
    const status = (row && row.status) || 'pending';
    const meta = STATUS_LABELS[status] || STATUS_LABELS.pending;
    const canAct = currentUser && ACTION_LEVELS.has(currentUser.level);

    let inner = `
      <button class="pot-pill pot-pill-${status}" data-line-ref="${escapeAttr(lineRef)}" ${canAct ? '' : 'disabled'} title="${meta.label}">
        <span class="pot-pill-icon">${meta.icon}</span>
        <span class="pot-pill-label">${meta.label}</span>
      </button>
    `;
    if (row && row.purchaser && status !== 'pending') {
      const who = escapeHtml(row.purchaser.split(' ')[0]); // first name only
      inner += `<div class="pot-purchaser">${who}${row.final_amount ? ` · £${Number(row.final_amount).toFixed(2)}` : ''}</div>`;
      if (row.payment_method) {
        const pmClass = row.payment_method === 'pocket' ? 'pot-paid-pocket' : 'pot-paid-church';
        const pmLabel = row.payment_method === 'pocket' ? 'Out of pocket' : 'Church';
        inner += `<div class="pot-paid-badge ${pmClass}">${pmLabel}</div>`;
      }
      if (row.order_id && orders[row.order_id]) {
        const order = orders[row.order_id];
        const siblingCount = Object.values(state).filter(r => r.order_id === row.order_id).length - 1;
        if (siblingCount > 0) {
          inner += `<div class="pot-order-link" title="Part of group order with ${siblingCount} other line${siblingCount === 1 ? '' : 's'}">⛓ + ${siblingCount}</div>`;
        }
      }
    }
    cell.innerHTML = inner;
    const btn = cell.querySelector('.pot-pill');
    if (btn && canAct) {
      btn.addEventListener('click', () => openActionSheet(lineRef));
    }
  }

  function renderTallies() {
    // Per-supplier tally + group-order entry point
    document.querySelectorAll('.supplier').forEach(block => {
      const lineRefs = Array.from(block.querySelectorAll('[data-line-ref]'))
        .map(el => el.getAttribute('data-line-ref'))
        .filter((v, i, a) => a.indexOf(v) === i);   // dedupe
      const tally = summariseWithOrders(block, lineRefs);
      const tallyEl = block.querySelector('.supplier-tally');
      if (tallyEl) tallyEl.innerHTML = renderTallyHtml(tally, 'compact');

      // Group-order button — only show when there's at least one pending line and user can act
      const canAct = currentUser && ACTION_LEVELS.has(currentUser.level);
      const pendingCount = lineRefs.filter(ref => {
        const r = state[ref];
        return !r || r.status === 'pending';
      }).length;
      ensureGroupOrderButton(block, canAct && pendingCount >= 2, pendingCount);
    });
    // Page tally
    const overall = document.getElementById('po-overall-tally');
    if (overall) {
      const allRefs = Array.from(document.querySelectorAll('[data-line-ref]'))
        .map(el => el.getAttribute('data-line-ref'))
        .filter((v, i, a) => a.indexOf(v) === i);
      const tally = summarise(allRefs);
      // Roll in extras_total from all orders for the page-level view
      tally.extras_total = Object.values(orders).reduce((sum, o) => sum + Number(o.extras_total || 0), 0);
      tally.order_count = Object.keys(orders).length;
      overall.innerHTML = renderTallyHtml(tally, 'full');
    }
  }

  function ensureGroupOrderButton(block, visible, pendingCount) {
    const supplierName = extractSupplierName(block);
    let btn = block.querySelector('.pot-group-order-btn');
    if (!visible) {
      if (btn) btn.remove();
      return;
    }
    if (!btn) {
      btn = document.createElement('button');
      btn.className = 'pot-group-order-btn';
      btn.type = 'button';
      // Attach to the supplier-tally container if present, otherwise at top of supplier block
      const tallyEl = block.querySelector('.supplier-tally');
      if (tallyEl) {
        tallyEl.parentNode.insertBefore(btn, tallyEl.nextSibling);
      } else {
        block.insertBefore(btn, block.firstChild);
      }
    }
    btn.textContent = `+ Record group order for ${supplierName} (${pendingCount} open)`;
    btn.onclick = () => openGroupOrderSheet(supplierName, block);
  }

  function extractSupplierName(block) {
    const nameEl = block.querySelector('.supplier-name');
    if (!nameEl) return 'Supplier';
    // The name is the text before any inner span (e.g. <span class="supplier-tag">1 order</span>)
    return nameEl.childNodes[0] && nameEl.childNodes[0].nodeValue
      ? nameEl.childNodes[0].nodeValue.trim()
      : nameEl.textContent.replace(/\d+\s*orders?$/i, '').trim();
  }

  // Like summarise() but also folds in extras_total from any orders that
  // have lines in this supplier block. Lets per-supplier tallies show
  // postage/warranty money alongside the line totals.
  function summariseWithOrders(block, lineRefs) {
    const t = summarise(lineRefs);
    // Find orders that include any of this block's lines
    const orderIds = new Set();
    lineRefs.forEach(ref => {
      const r = state[ref];
      if (r && r.order_id) orderIds.add(r.order_id);
    });
    let extras = 0;
    orderIds.forEach(id => {
      const o = orders[id];
      if (o) extras += Number(o.extras_total || 0);
    });
    t.extras_total = extras;
    return t;
  }

  function summarise(lineRefs) {
    const t = { total: lineRefs.length, pending: 0, claimed: 0, ordered: 0, received: 0, cancelled: 0, spent: 0, church_spent: 0, pocket_owed: 0 };
    lineRefs.forEach(ref => {
      const r = state[ref];
      const status = (r && r.status) || 'pending';
      t[status] = (t[status] || 0) + 1;
      if (r && r.final_amount && (status === 'ordered' || status === 'received')) {
        const amt = Number(r.final_amount);
        t.spent += amt;
        if (r.payment_method === 'pocket') {
          t.pocket_owed += amt;
        } else if (r.payment_method === 'church') {
          t.church_spent += amt;
        }
      }
    });
    return t;
  }

  function renderTallyHtml(t, mode) {
    const parts = [];
    if (mode === 'compact') {
      const done = t.ordered + t.received;
      parts.push(`<span class="pot-tally-chip">${done}/${t.total} ordered</span>`);
      if (t.claimed) parts.push(`<span class="pot-tally-chip pot-tally-claimed">${t.claimed} claimed</span>`);
      if (t.spent) parts.push(`<span class="pot-tally-chip pot-tally-spent">£${t.spent.toFixed(2)} spent</span>`);
      if (t.extras_total) parts.push(`<span class="pot-tally-chip pot-tally-extras">+ £${Number(t.extras_total).toFixed(2)} extras</span>`);
      if (t.pocket_owed) parts.push(`<span class="pot-tally-chip pot-tally-owed">£${t.pocket_owed.toFixed(2)} owed</span>`);
    } else {
      parts.push(`<span class="pot-tally-stat"><strong>${t.total}</strong> lines</span>`);
      parts.push(`<span class="pot-tally-stat"><strong>${t.claimed}</strong> claimed</span>`);
      parts.push(`<span class="pot-tally-stat"><strong>${t.ordered}</strong> ordered</span>`);
      parts.push(`<span class="pot-tally-stat"><strong>${t.received}</strong> received</span>`);
      parts.push(`<span class="pot-tally-stat"><strong>£${t.spent.toFixed(2)}</strong> on lines</span>`);
      if (t.extras_total) {
        parts.push(`<span class="pot-tally-stat pot-tally-stat-extras"><strong>£${Number(t.extras_total).toFixed(2)}</strong> in extras</span>`);
      }
      if (t.order_count != null) {
        parts.push(`<span class="pot-tally-stat"><strong>${t.order_count}</strong> ${t.order_count === 1 ? 'order' : 'orders'}</span>`);
      }
      if (t.pocket_owed) {
        parts.push(`<span class="pot-tally-stat pot-tally-stat-owed"><strong>£${t.pocket_owed.toFixed(2)}</strong> owed to volunteers</span>`);
      }
    }
    return parts.join(' ');
  }

  function renderLastUpdated() {
    const el = document.getElementById('po-last-updated');
    if (el) {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2,'0');
      const mm = String(now.getMinutes()).padStart(2,'0');
      el.textContent = `Last refreshed ${hh}:${mm}`;
    }
  }

  // ── ACTION SHEET ───────────────────────────────────────────────────────────
  let sheetEl = null;

  function buildActionSheet() {
    if (document.getElementById('pot-sheet')) {
      sheetEl = document.getElementById('pot-sheet');
      return;
    }
    sheetEl = document.createElement('div');
    sheetEl.id = 'pot-sheet';
    sheetEl.className = 'pot-sheet pot-sheet-hidden';
    sheetEl.innerHTML = `
      <div class="pot-sheet-backdrop"></div>
      <div class="pot-sheet-card">
        <div class="pot-sheet-handle"></div>
        <div class="pot-sheet-body"></div>
      </div>
    `;
    document.body.appendChild(sheetEl);
    sheetEl.querySelector('.pot-sheet-backdrop').addEventListener('click', closeActionSheet);
  }

  // ── PIN GATE ───────────────────────────────────────────────────────────────
  let pinGateEl = null;

  function buildPinGate() {
    if (document.getElementById('pot-pin-gate')) return;
    pinGateEl = document.createElement('div');
    pinGateEl.id = 'pot-pin-gate';
    pinGateEl.className = 'pot-pin-gate';
    pinGateEl.innerHTML = `
      <div class="pot-pin-card">
        <div class="pot-pin-title">PO Access</div>
        <div class="pot-pin-sub">Enter the 4-digit PIN to view and update this purchase order.</div>
        <div class="pot-pin-dots">
          <span class="pot-pin-dot"></span>
          <span class="pot-pin-dot"></span>
          <span class="pot-pin-dot"></span>
          <span class="pot-pin-dot"></span>
        </div>
        <div class="pot-pin-msg" id="pot-pin-msg"></div>
        <div class="pot-pin-keypad">
          <button class="pot-pin-key" data-d="1">1</button>
          <button class="pot-pin-key" data-d="2">2</button>
          <button class="pot-pin-key" data-d="3">3</button>
          <button class="pot-pin-key" data-d="4">4</button>
          <button class="pot-pin-key" data-d="5">5</button>
          <button class="pot-pin-key" data-d="6">6</button>
          <button class="pot-pin-key" data-d="7">7</button>
          <button class="pot-pin-key" data-d="8">8</button>
          <button class="pot-pin-key" data-d="9">9</button>
          <button class="pot-pin-key pot-pin-key-blank"></button>
          <button class="pot-pin-key" data-d="0">0</button>
          <button class="pot-pin-key pot-pin-key-del" data-action="del">⌫</button>
        </div>
      </div>
    `;
    document.body.appendChild(pinGateEl);

    let entry = '';
    const dots = pinGateEl.querySelectorAll('.pot-pin-dot');
    const msg = pinGateEl.querySelector('#pot-pin-msg');

    function updateDots() {
      dots.forEach((d, i) => d.classList.toggle('on', i < entry.length));
    }
    function tryPin() {
      if (entry === String(config.pin)) {
        sessionStorage.setItem('po_pin_unlocked_' + config.poSlug, '1');
        pinUnlocked = true;
        currentUser = { id: null, name: null, level: 'admin' };
        pinGateEl.style.opacity = '0';
        setTimeout(() => { pinGateEl.remove(); pinGateEl = null; renderAll(); }, 180);
      } else {
        msg.textContent = 'Incorrect PIN. Try again.';
        dots.forEach(d => d.classList.add('shake'));
        setTimeout(() => { entry = ''; updateDots(); dots.forEach(d => d.classList.remove('shake')); }, 320);
      }
    }

    pinGateEl.addEventListener('click', e => {
      const k = e.target.closest('.pot-pin-key');
      if (!k) return;
      msg.textContent = '';
      if (k.getAttribute('data-action') === 'del') {
        entry = entry.slice(0, -1);
        updateDots();
        return;
      }
      const d = k.getAttribute('data-d');
      if (!d) return;
      if (entry.length >= 4) return;
      entry += d;
      updateDots();
      if (entry.length === 4) setTimeout(tryPin, 120);
    });

    // Hardware keyboard support
    pinGateEl._keydown = function(e) {
      if (!pinGateEl || pinGateEl.style.opacity === '0') return;
      if (/^[0-9]$/.test(e.key) && entry.length < 4) {
        msg.textContent = '';
        entry += e.key; updateDots();
        if (entry.length === 4) setTimeout(tryPin, 120);
      } else if (e.key === 'Backspace') {
        entry = entry.slice(0, -1); updateDots();
      } else if (e.key === 'Enter' && entry.length === 4) {
        tryPin();
      }
    };
    document.addEventListener('keydown', pinGateEl._keydown);
  }

  function openActionSheet(lineRef) {
    if (config.authMode === 'pin' && !pinUnlocked) {
      // PIN not entered yet — gate is still up
      return;
    }
    if (config.authMode === 'bridge') {
      if (!currentUser) {
        alert('Please log in to The Bridge first.');
        return;
      }
      if (!ACTION_LEVELS.has(currentUser.level)) {
        alert('You need lead-level access to record purchases.');
        return;
      }
    }
    // If this line is part of an order, show the order detail view instead.
    const lineRow = state[lineRef];
    if (lineRow && lineRow.order_id && orders[lineRow.order_id]) {
      openOrderDetailSheet(lineRow.order_id);
      return;
    }
    const isPinMode = config.authMode === 'pin';
    const row = state[lineRef];
    const rowEl = document.querySelector(`tr[data-line-ref="${cssEscape(lineRef)}"]`);
    const lineName = rowEl ? (rowEl.getAttribute('data-line-name') || `Line ${lineRef}`) : `Line ${lineRef}`;
    const lineAmount = rowEl ? rowEl.getAttribute('data-line-amount') : null;
    const body = sheetEl.querySelector('.pot-sheet-body');

    const status = (row && row.status) || 'pending';
    // In PIN mode anyone with the PIN can edit any row. In Bridge mode, only your own or admin.
    const isMine = !isPinMode && row && currentUser && row.purchaser_id === currentUser.id;
    const isAdmin = isPinMode || (currentUser && currentUser.level === 'admin');
    const canEdit = isPinMode || isMine || isAdmin;

    // Build the purchaser dropdown HTML for PIN mode actions that record a purchaser.
    // The current purchaser (if any) is pre-selected; otherwise the first option.
    function purchaserSelect(idPrefix) {
      if (!isPinMode) return '';
      const current = row && row.purchaser ? row.purchaser : '';
      const options = config.purchasers.map(p =>
        `<option value="${escapeAttr(p)}"${p === current ? ' selected' : ''}>${escapeHtml(p)}</option>`
      ).join('');
      return `
        <label>Recorded by</label>
        <select id="${idPrefix}-purchaser">
          ${current && !config.purchasers.includes(current) ? `<option value="${escapeAttr(current)}" selected>${escapeHtml(current)}</option>` : ''}
          ${options}
        </select>
      `;
    }

    let html = `
      <div class="pot-sheet-header">
        <div class="pot-sheet-lineref">Line ${escapeHtml(lineRef)}</div>
        <div class="pot-sheet-linename">${escapeHtml(lineName)}</div>
        ${lineAmount ? `<div class="pot-sheet-est">Estimated: £${Number(lineAmount).toFixed(2)}</div>` : ''}
      </div>
    `;

    if (status === 'pending') {
      if (isPinMode) {
        // Combined claim-or-order form. User picks purchaser + optionally fills final/ref to skip straight to ordered.
        html += `
          <div class="pot-form">
            ${purchaserSelect('pot')}
            <label>Final amount paid (£) — optional, leave blank to just claim</label>
            <input type="number" step="0.01" id="pot-final" placeholder="${lineAmount || '0.00'}">
            <label>Paid by</label>
            <div class="pot-segmented" id="pot-payment-method-group">
              <button type="button" class="pot-seg-opt" data-value="church">Church</button>
              <button type="button" class="pot-seg-opt" data-value="pocket">Out of pocket</button>
            </div>
            <label>Order reference (optional)</label>
            <input type="text" id="pot-order-ref" placeholder="Order #, eBay item ID, etc">
            <label>Notes (optional)</label>
            <textarea id="pot-notes" placeholder="Substitutions, comments, condition..."></textarea>
          </div>
          <button class="pot-btn pot-btn-primary" data-action="ordered">Record purchase</button>
          <button class="pot-btn pot-btn-secondary" data-action="claim">Just claim — I'll order later</button>
          <button class="pot-btn pot-btn-ghost" data-action="cancel">Cancel</button>
        `;
      } else {
        html += `
          <button class="pot-btn pot-btn-primary" data-action="claim">Claim — I'll order this</button>
          <button class="pot-btn pot-btn-secondary" data-action="ordered">I've already ordered it</button>
          <button class="pot-btn pot-btn-ghost" data-action="cancel">Cancel</button>
        `;
      }
    } else if (status === 'claimed' && canEdit) {
      html += `
        <div class="pot-sheet-status">Claimed by <strong>${escapeHtml(row.purchaser || '—')}</strong> · ${timeAgo(row.claimed_at)}</div>
        <div class="pot-form">
          ${purchaserSelect('pot')}
          <label>Final amount paid (£)</label>
          <input type="number" step="0.01" id="pot-final" placeholder="${lineAmount || '0.00'}" value="${row.final_amount || ''}">
          <label>Paid by</label>
          <div class="pot-segmented" id="pot-payment-method-group" data-current="${row.payment_method ? escapeAttr(row.payment_method) : ''}">
            <button type="button" class="pot-seg-opt${row.payment_method === 'church' ? ' pot-seg-opt-active' : ''}" data-value="church">Church</button>
            <button type="button" class="pot-seg-opt${row.payment_method === 'pocket' ? ' pot-seg-opt-active' : ''}" data-value="pocket">Out of pocket</button>
          </div>
          <label>Order reference (optional)</label>
          <input type="text" id="pot-order-ref" placeholder="Order #, eBay item ID, etc" value="${row.order_ref ? escapeAttr(row.order_ref) : ''}">
          <label>Notes (optional)</label>
          <textarea id="pot-notes" placeholder="Substitutions, comments, condition...">${row.notes ? escapeHtml(row.notes) : ''}</textarea>
        </div>
        <button class="pot-btn pot-btn-primary" data-action="ordered">Mark ordered</button>
        <button class="pot-btn pot-btn-ghost" data-action="release">Release claim</button>
        <button class="pot-btn pot-btn-danger" data-action="cancelled">Cancel this line</button>
        <button class="pot-btn pot-btn-ghost" data-action="cancel">Close</button>
      `;
    } else if (status === 'claimed' && !canEdit) {
      html += `
        <div class="pot-sheet-status">Claimed by <strong>${escapeHtml(row.purchaser || '—')}</strong> · ${timeAgo(row.claimed_at)}</div>
        <p class="pot-sheet-readonly">Only ${escapeHtml((row.purchaser || '').split(' ')[0] || 'the claimer')} can release this. Message them on WhatsApp if you need to take it over.</p>
        <button class="pot-btn pot-btn-ghost" data-action="cancel">Close</button>
      `;
    } else if (status === 'ordered' && canEdit) {
      html += `
        <div class="pot-sheet-status">Ordered by <strong>${escapeHtml(row.purchaser || '—')}</strong> · ${timeAgo(row.ordered_at)}</div>
        ${row.final_amount ? `<div class="pot-sheet-est"><strong>Paid:</strong> £${Number(row.final_amount).toFixed(2)}${paymentMethodLabel(row.payment_method)}</div>` : ''}
        ${row.order_ref ? `<div class="pot-sheet-est"><strong>Order ref:</strong> ${escapeHtml(row.order_ref)}</div>` : ''}
        ${row.notes ? `<div class="pot-sheet-est"><strong>Notes:</strong> ${escapeHtml(row.notes)}</div>` : ''}
        <button class="pot-btn pot-btn-primary" data-action="received">Mark received</button>
        <button class="pot-btn pot-btn-ghost" data-action="edit-ordered">Edit details</button>
        <button class="pot-btn pot-btn-ghost" data-action="cancel">Close</button>
      `;
    } else if (status === 'ordered' && !canEdit) {
      html += `
        <div class="pot-sheet-status">Ordered by <strong>${escapeHtml(row.purchaser || '—')}</strong> · ${timeAgo(row.ordered_at)}</div>
        ${row.final_amount ? `<div class="pot-sheet-est"><strong>Paid:</strong> £${Number(row.final_amount).toFixed(2)}${paymentMethodLabel(row.payment_method)}</div>` : ''}
        ${row.order_ref ? `<div class="pot-sheet-est"><strong>Order ref:</strong> ${escapeHtml(row.order_ref)}</div>` : ''}
        <p class="pot-sheet-readonly">Read-only — only ${escapeHtml((row.purchaser || '').split(' ')[0] || 'the purchaser')} or an admin can edit.</p>
        <button class="pot-btn pot-btn-ghost" data-action="cancel">Close</button>
      `;
    } else if (status === 'received') {
      html += `
        <div class="pot-sheet-status">Received · ordered by <strong>${escapeHtml(row.purchaser || '—')}</strong></div>
        ${row.final_amount ? `<div class="pot-sheet-est"><strong>Paid:</strong> £${Number(row.final_amount).toFixed(2)}${paymentMethodLabel(row.payment_method)}</div>` : ''}
        ${row.order_ref ? `<div class="pot-sheet-est"><strong>Order ref:</strong> ${escapeHtml(row.order_ref)}</div>` : ''}
        ${isAdmin ? `<button class="pot-btn pot-btn-ghost" data-action="reopen">Reopen (admin)</button>` : ''}
        <button class="pot-btn pot-btn-ghost" data-action="cancel">Close</button>
      `;
    } else if (status === 'cancelled') {
      html += `
        <div class="pot-sheet-status">Cancelled by <strong>${escapeHtml(row.purchaser || '—')}</strong></div>
        ${row.notes ? `<div class="pot-sheet-est"><strong>Reason:</strong> ${escapeHtml(row.notes)}</div>` : ''}
        ${isAdmin ? `<button class="pot-btn pot-btn-primary" data-action="reopen">Reopen line</button>` : ''}
        <button class="pot-btn pot-btn-ghost" data-action="cancel">Close</button>
      `;
    }

    body.innerHTML = html;
    body.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => handleAction(e.target.getAttribute('data-action'), lineRef));
    });
    // Segmented control: payment method toggle
    body.querySelectorAll('.pot-segmented .pot-seg-opt').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const group = e.currentTarget.closest('.pot-segmented');
        if (!group) return;
        const wasActive = e.currentTarget.classList.contains('pot-seg-opt-active');
        group.querySelectorAll('.pot-seg-opt').forEach(b => b.classList.remove('pot-seg-opt-active'));
        // Allow toggle-off so payment_method can be cleared
        if (!wasActive) e.currentTarget.classList.add('pot-seg-opt-active');
      });
    });
    sheetEl.classList.remove('pot-sheet-hidden');
  }

  function closeActionSheet() {
    if (sheetEl) sheetEl.classList.add('pot-sheet-hidden');
  }

  // ── GROUP ORDER SHEET ──────────────────────────────────────────────────────
  function openGroupOrderSheet(supplierName, supplierBlock) {
    if (config.authMode === 'pin' && !pinUnlocked) return;
    const isPinMode = config.authMode === 'pin';

    // Gather candidate lines: pending lines in this supplier block
    const candidates = Array.from(supplierBlock.querySelectorAll('tr[data-line-ref]')).map(tr => {
      const ref = tr.getAttribute('data-line-ref');
      const r = state[ref];
      const status = (r && r.status) || 'pending';
      if (status !== 'pending') return null;
      return {
        ref,
        name: tr.getAttribute('data-line-name') || `Line ${ref}`,
        amount: parseFloat(tr.getAttribute('data-line-amount') || '0') || 0,
      };
    }).filter(Boolean);

    if (candidates.length === 0) {
      alert('No open lines to group for this supplier.');
      return;
    }

    const body = sheetEl.querySelector('.pot-sheet-body');
    const purchaserOptions = isPinMode
      ? config.purchasers.map(p => `<option value="${escapeAttr(p)}">${escapeHtml(p)}</option>`).join('')
      : '';

    body.innerHTML = `
      <div class="pot-sheet-header">
        <div class="pot-sheet-lineref">Group Order</div>
        <div class="pot-sheet-linename">${escapeHtml(supplierName)}</div>
        <div class="pot-sheet-est">Tick the lines included in this checkout. Add postage / warranties as extras.</div>
      </div>

      <div class="pot-group-lines">
        ${candidates.map(c => `
          <label class="pot-group-line">
            <input type="checkbox" class="pot-group-line-check" data-ref="${escapeAttr(c.ref)}" data-est="${c.amount}" checked>
            <span class="pot-group-line-info">
              <span class="pot-group-line-ref">${escapeHtml(c.ref)}</span>
              <span class="pot-group-line-name">${escapeHtml(c.name)}</span>
            </span>
            <span class="pot-group-line-amt">
              <span class="pot-group-line-est">est £${c.amount.toFixed(2)}</span>
              <input type="number" step="0.01" class="pot-group-line-final" data-ref="${escapeAttr(c.ref)}" placeholder="${c.amount.toFixed(2)}" value="${c.amount.toFixed(2)}">
            </span>
          </label>
        `).join('')}
      </div>

      <div class="pot-form">
        ${isPinMode ? `
          <label>Recorded by</label>
          <select id="pot-go-purchaser">
            <option value="">— pick —</option>
            ${purchaserOptions}
          </select>
        ` : ''}

        <label>Order reference</label>
        <input type="text" id="pot-go-order-ref" placeholder="Order #, Amazon order ID, eBay confirmation, etc">

        <label>Payment method</label>
        <div class="pot-segmented" id="pot-go-payment-group">
          <button type="button" class="pot-seg-opt" data-value="church">Church</button>
          <button type="button" class="pot-seg-opt" data-value="pocket">Out of pocket</button>
        </div>

        <label>Notes (optional)</label>
        <textarea id="pot-go-notes" placeholder="Substitutions, comments, anything finance team should know..."></textarea>

        <label style="margin-top:24px;">Extras (postage, warranty, tax, fees)</label>
        <div id="pot-extras-list" class="pot-extras-list"></div>
        <button type="button" class="pot-btn pot-btn-ghost pot-add-extra-btn" data-action="add-extra" style="margin-top:8px;">+ Add extra item</button>
      </div>

      <div class="pot-group-summary">
        <div class="pot-group-summary-row">
          <span>Lines selected</span>
          <span id="pot-go-lines-count">${candidates.length}</span>
        </div>
        <div class="pot-group-summary-row">
          <span>Lines total</span>
          <span id="pot-go-lines-total">£0.00</span>
        </div>
        <div class="pot-group-summary-row">
          <span>Extras total</span>
          <span id="pot-go-extras-total">£0.00</span>
        </div>
        <div class="pot-group-summary-row pot-group-summary-grand">
          <span>Grand total</span>
          <span id="pot-go-grand-total">£0.00</span>
        </div>
      </div>

      <button class="pot-btn pot-btn-primary" data-action="create-order">Record this order</button>
      <button class="pot-btn pot-btn-ghost" data-action="cancel">Cancel</button>
    `;

    // Wire up: payment segmented control
    body.querySelectorAll('#pot-go-payment-group .pot-seg-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const group = btn.parentNode;
        const currentValue = group.getAttribute('data-current');
        const newValue = btn.getAttribute('data-value');
        if (currentValue === newValue) {
          group.setAttribute('data-current', '');
          group.querySelectorAll('.pot-seg-opt').forEach(b => b.classList.remove('pot-seg-opt-active'));
        } else {
          group.setAttribute('data-current', newValue);
          group.querySelectorAll('.pot-seg-opt').forEach(b => b.classList.toggle('pot-seg-opt-active', b === btn));
        }
      });
    });

    // Wire up: line checkboxes + per-line final amount edits => recalc totals
    body.querySelectorAll('.pot-group-line-check, .pot-group-line-final').forEach(el => {
      el.addEventListener('input', recalcGroupOrderTotals);
      el.addEventListener('change', recalcGroupOrderTotals);
    });

    // Wire up: add-extra and create-order buttons
    body.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');
        if (action === 'add-extra') {
          addExtraRow();
        } else if (action === 'create-order') {
          submitGroupOrder(supplierName);
        } else if (action === 'cancel') {
          closeActionSheet();
        }
      });
    });

    sheetEl.classList.remove('pot-sheet-hidden');
    recalcGroupOrderTotals();
  }

  function addExtraRow(presetLabel = '', presetAmount = '') {
    const list = document.getElementById('pot-extras-list');
    if (!list) return;
    const row = document.createElement('div');
    row.className = 'pot-extra-row';
    row.innerHTML = `
      <input type="text" class="pot-extra-label" placeholder="Postage, warranty, VAT, etc" value="${escapeAttr(presetLabel)}">
      <span class="pot-extra-currency">£</span>
      <input type="number" step="0.01" class="pot-extra-amount" placeholder="0.00" value="${presetAmount}">
      <button type="button" class="pot-extra-remove" aria-label="Remove">×</button>
    `;
    row.querySelector('.pot-extra-amount').addEventListener('input', recalcGroupOrderTotals);
    row.querySelector('.pot-extra-remove').addEventListener('click', () => {
      row.remove();
      recalcGroupOrderTotals();
    });
    list.appendChild(row);
    recalcGroupOrderTotals();
  }

  function recalcGroupOrderTotals() {
    const body = sheetEl.querySelector('.pot-sheet-body');
    if (!body) return;
    let linesTotal = 0;
    let checkedCount = 0;
    body.querySelectorAll('.pot-group-line').forEach(label => {
      const check = label.querySelector('.pot-group-line-check');
      const final = label.querySelector('.pot-group-line-final');
      if (check && check.checked) {
        checkedCount++;
        const v = parseFloat(final.value) || 0;
        linesTotal += v;
        label.classList.remove('pot-group-line-unchecked');
      } else {
        label.classList.add('pot-group-line-unchecked');
      }
    });
    let extrasTotal = 0;
    body.querySelectorAll('.pot-extra-row').forEach(r => {
      const amt = parseFloat(r.querySelector('.pot-extra-amount').value) || 0;
      extrasTotal += amt;
    });
    const grand = linesTotal + extrasTotal;
    const countEl = document.getElementById('pot-go-lines-count');
    const linesEl = document.getElementById('pot-go-lines-total');
    const extrasEl = document.getElementById('pot-go-extras-total');
    const grandEl = document.getElementById('pot-go-grand-total');
    if (countEl) countEl.textContent = checkedCount;
    if (linesEl) linesEl.textContent = '£' + linesTotal.toFixed(2);
    if (extrasEl) extrasEl.textContent = '£' + extrasTotal.toFixed(2);
    if (grandEl) grandEl.textContent = '£' + grand.toFixed(2);
  }

  async function submitGroupOrder(supplierName) {
    const isPinMode = config.authMode === 'pin';
    const body = sheetEl.querySelector('.pot-sheet-body');

    // Gather purchaser
    let purchaser;
    if (isPinMode) {
      const sel = document.getElementById('pot-go-purchaser');
      purchaser = sel ? sel.value : null;
      if (!purchaser) {
        alert('Please pick who is recording this order.');
        return;
      }
    } else {
      purchaser = currentUser && currentUser.name;
    }

    // Gather lines
    const lineEntries = [];
    let linesTotal = 0;
    body.querySelectorAll('.pot-group-line').forEach(label => {
      const check = label.querySelector('.pot-group-line-check');
      if (!check.checked) return;
      const ref = check.getAttribute('data-ref');
      const final = parseFloat(label.querySelector('.pot-group-line-final').value);
      if (isNaN(final) || final < 0) return;
      lineEntries.push({ lineRef: ref, final_amount: final });
      linesTotal += final;
    });
    if (lineEntries.length === 0) {
      alert('Tick at least one line to include in the order.');
      return;
    }

    // Gather extras
    const extras = [];
    let extrasTotal = 0;
    body.querySelectorAll('.pot-extra-row').forEach(r => {
      const label = r.querySelector('.pot-extra-label').value.trim();
      const amt = parseFloat(r.querySelector('.pot-extra-amount').value);
      if (isNaN(amt) || amt === 0) return;
      extras.push({ label: label || 'Extra', amount: amt });
      extrasTotal += amt;
    });

    const orderRef = (document.getElementById('pot-go-order-ref').value || '').trim() || null;
    const notes = (document.getElementById('pot-go-notes').value || '').trim() || null;
    const pmGroup = document.getElementById('pot-go-payment-group');
    const paymentMethod = pmGroup ? (pmGroup.getAttribute('data-current') || null) : null;

    const grandTotal = linesTotal + extrasTotal;

    const orderData = {
      supplier: supplierName,
      order_ref: orderRef,
      purchaser,
      payment_method: paymentMethod,
      lines_total: linesTotal,
      extras_total: extrasTotal,
      grand_total: grandTotal,
      extras,
      notes,
    };

    // Disable the button so a double-tap can't create two orders
    const submitBtn = body.querySelector('[data-action="create-order"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Recording…'; }

    try {
      await createOrder(orderData, lineEntries);
      await hydrate();
      closeActionSheet();
    } catch(err) {
      console.error('[POTracker] Group order failed:', err);
      alert('Could not save the order: ' + (err.message || 'unknown error') + '\n\nIf this mentions a missing column, the po_orders table migration may not have run yet.');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Record this order'; }
    }
  }

  // ── ORDER DETAIL VIEW ──────────────────────────────────────────────────────
  function openOrderDetailSheet(orderId) {
    const order = orders[orderId];
    if (!order) {
      alert('Order not found. Refresh and try again.');
      return;
    }
    const body = sheetEl.querySelector('.pot-sheet-body');
    const isPinMode = config.authMode === 'pin';
    const isAdmin = isPinMode || (currentUser && currentUser.level === 'admin');

    // Find all lines linked to this order
    const linkedLines = Object.values(state).filter(r => r.order_id === order.id);
    const extrasArr = Array.isArray(order.extras) ? order.extras : [];

    body.innerHTML = `
      <div class="pot-sheet-header">
        <div class="pot-sheet-lineref">Order</div>
        <div class="pot-sheet-linename">${escapeHtml(order.supplier || 'Supplier')}</div>
        ${order.order_ref ? `<div class="pot-sheet-est"><strong>Ref:</strong> ${escapeHtml(order.order_ref)}</div>` : ''}
        <div class="pot-sheet-est"><strong>Placed by:</strong> ${escapeHtml(order.purchaser || '—')} · ${timeAgo(order.placed_at)}${paymentMethodLabel(order.payment_method)}</div>
        ${order.notes ? `<div class="pot-sheet-est"><strong>Notes:</strong> ${escapeHtml(order.notes)}</div>` : ''}
      </div>

      <div class="pot-order-section-title">Lines (${linkedLines.length})</div>
      <ul class="pot-order-line-list">
        ${linkedLines.map(r => `
          <li>
            <span class="pot-order-line-ref">${escapeHtml(r.line_ref)}</span>
            <span class="pot-order-line-amount">£${Number(r.final_amount || 0).toFixed(2)}</span>
          </li>
        `).join('')}
      </ul>

      ${extrasArr.length ? `
        <div class="pot-order-section-title">Extras</div>
        <ul class="pot-order-line-list">
          ${extrasArr.map(e => `
            <li>
              <span class="pot-order-line-ref">${escapeHtml(e.label || 'Extra')}</span>
              <span class="pot-order-line-amount">£${Number(e.amount || 0).toFixed(2)}</span>
            </li>
          `).join('')}
        </ul>
      ` : ''}

      <div class="pot-group-summary" style="margin-top:16px;">
        <div class="pot-group-summary-row"><span>Lines total</span><span>£${Number(order.lines_total || 0).toFixed(2)}</span></div>
        <div class="pot-group-summary-row"><span>Extras total</span><span>£${Number(order.extras_total || 0).toFixed(2)}</span></div>
        <div class="pot-group-summary-row pot-group-summary-grand"><span>Grand total</span><span>£${Number(order.grand_total || 0).toFixed(2)}</span></div>
      </div>

      ${order.status !== 'received' ? `<button class="pot-btn pot-btn-primary" data-action="order-received">Mark whole order received</button>` : ''}
      ${isAdmin ? `<button class="pot-btn pot-btn-danger" data-action="order-delete">Delete order (un-link lines)</button>` : ''}
      <button class="pot-btn pot-btn-ghost" data-action="cancel">Close</button>
    `;

    body.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const action = e.target.getAttribute('data-action');
        if (action === 'cancel') { closeActionSheet(); return; }
        if (action === 'order-received') {
          try { await markOrderReceived(order.id); await hydrate(); closeActionSheet(); }
          catch(err) { alert('Could not mark received: ' + err.message); }
        } else if (action === 'order-delete') {
          if (!confirm('Delete this order? All its lines will be reset to pending.')) return;
          try { await deleteOrder(order.id); await hydrate(); closeActionSheet(); }
          catch(err) { alert('Could not delete: ' + err.message); }
        }
      });
    });

    sheetEl.classList.remove('pot-sheet-hidden');
  }

  // ── ACTIONS ────────────────────────────────────────────────────────────────
  async function handleAction(action, lineRef) {
    if (action === 'cancel') { closeActionSheet(); return; }
    const isPinMode = config.authMode === 'pin';
    const now = new Date().toISOString();

    // In PIN mode the purchaser comes from the dropdown in the sheet.
    // In Bridge mode it comes from the logged-in user.
    function getPinPurchaser() {
      const sel = document.getElementById('pot-purchaser');
      if (!sel) return null;
      return sel.value || null;
    }

    function buildUserPatch() {
      if (isPinMode) {
        const p = getPinPurchaser();
        if (!p) {
          alert('Please pick who is recording this purchase.');
          return null;
        }
        return { purchaser: p, purchaser_id: null };
      }
      return { purchaser: currentUser.name, purchaser_id: currentUser.id };
    }

    try {
      let patch = null;
      switch(action) {
        case 'claim': {
          const userPatch = buildUserPatch();
          if (!userPatch) return;
          patch = Object.assign({ status: 'claimed', claimed_at: now }, userPatch);
          break;
        }
        case 'release':
          patch = { status: 'pending', purchaser: null, purchaser_id: null, claimed_at: null, final_amount: null, order_ref: null, payment_method: null };
          break;
        case 'ordered': {
          const userPatch = buildUserPatch();
          if (!userPatch) return;
          const finalEl = document.getElementById('pot-final');
          const refEl = document.getElementById('pot-order-ref');
          const notesEl = document.getElementById('pot-notes');
          const pmEl = document.querySelector('.pot-segmented .pot-seg-opt-active');
          let final = finalEl ? parseFloat(finalEl.value) : NaN;
          if (!finalEl) {
            const v = prompt('Final amount paid in £:');
            if (v === null) return;
            final = parseFloat(v);
          }
          if (isNaN(final) || final < 0) {
            alert('Please enter a valid final amount.');
            return;
          }
          patch = Object.assign({
            status: 'ordered',
            ordered_at: now,
            claimed_at: state[lineRef] && state[lineRef].claimed_at ? state[lineRef].claimed_at : now,
            final_amount: final,
            order_ref: refEl ? refEl.value.trim() || null : (state[lineRef] && state[lineRef].order_ref) || null,
            notes:     notesEl ? notesEl.value.trim() || null : (state[lineRef] && state[lineRef].notes) || null,
            payment_method: pmEl ? pmEl.getAttribute('data-value') : (state[lineRef] && state[lineRef].payment_method) || null,
          }, userPatch);
          break;
        }
        case 'received':
          patch = { status: 'received', received_at: now };
          break;
        case 'cancelled': {
          const userPatch = buildUserPatch() || { purchaser: 'Finance team', purchaser_id: null };
          const reason = prompt('Reason for cancellation (optional):') || '';
          patch = Object.assign({
            status: 'cancelled',
            notes: reason || (state[lineRef] && state[lineRef].notes) || null,
          }, userPatch);
          break;
        }
        case 'reopen':
          patch = { status: 'pending', purchaser: null, purchaser_id: null, claimed_at: null, ordered_at: null, received_at: null, final_amount: null, order_ref: null, payment_method: null };
          break;
        case 'edit-ordered':
          // Re-open the sheet in "claimed" edit mode so they can revise final_amount/ref/notes
          state[lineRef].status = 'claimed';   // local-only flip
          openActionSheet(lineRef);
          return;
        default:
          console.warn('Unknown action', action);
          return;
      }
      await upsertLine(lineRef, patch);
      await hydrate();
      closeActionSheet();
    } catch(err) {
      console.error('[POTracker] action failed', err);
      alert('Could not save: ' + (err.message || 'unknown error'));
      await hydrate();
    }
  }

  // ── HELPERS ────────────────────────────────────────────────────────────────
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }
  function escapeAttr(s) { return escapeHtml(s); }
  function cssEscape(s) {
    return String(s).replace(/(["\\])/g, '\\$1');
  }
  function paymentMethodLabel(pm) {
    if (pm === 'pocket') return ' <span class="pot-paid-inline pot-paid-pocket">Out of pocket</span>';
    if (pm === 'church') return ' <span class="pot-paid-inline pot-paid-church">Church</span>';
    return '';
  }
  function timeAgo(iso) {
    if (!iso) return '';
    const t = new Date(iso).getTime();
    const diff = Math.floor((Date.now() - t) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff/60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  }

  // ── STYLES ─────────────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('pot-styles')) return;
    const style = document.createElement('style');
    style.id = 'pot-styles';
    style.textContent = `
      .pot-pill {
        font-family: inherit;
        font-size: 11px;
        font-weight: 600;
        padding: 5px 10px;
        border-radius: 12px;
        border: 1px solid rgba(0,0,0,0.08);
        background: #fff;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        white-space: nowrap;
        transition: transform 0.08s, box-shadow 0.12s;
      }
      .pot-pill:hover:not(:disabled) { box-shadow: 0 1px 4px rgba(0,0,0,0.08); transform: translateY(-1px); }
      .pot-pill:disabled { cursor: not-allowed; opacity: 0.7; }
      .pot-pill-icon { font-size: 13px; line-height: 1; }
      .pot-pill-pending   { color: #86868B; }
      .pot-pill-claimed   { color: #0071E3; background: #E8F2FE; border-color: #B8DAFB; }
      .pot-pill-ordered   { color: #8B6914; background: #FFF8E1; border-color: #F5D78A; }
      .pot-pill-received  { color: #1E7E34; background: #E0F5E5; border-color: #97DDA8; }
      .pot-pill-cancelled { color: #C41E2A; background: #FBE5E7; border-color: #F0A8AE; text-decoration: line-through; }
      .pot-purchaser {
        font-size: 10px;
        color: #86868B;
        margin-top: 3px;
        line-height: 1.2;
      }
      .pot-tally-chip {
        display: inline-block;
        font-size: 10.5px;
        font-weight: 600;
        padding: 3px 8px;
        border-radius: 6px;
        background: rgba(0,0,0,0.04);
        color: #555;
        margin-right: 6px;
      }
      .pot-tally-claimed { background: #E8F2FE; color: #0071E3; }
      .pot-tally-spent   { background: #FFF8E1; color: #8B6914; }
      .pot-tally-owed    { background: #FBE5E7; color: #C41E2A; }
      .pot-tally-stat { font-size: 12px; color: #555; margin-right: 14px; }
      .pot-tally-stat strong { color: #1D1D1F; font-size: 14px; }
      .pot-tally-stat-owed strong { color: #C41E2A; }

      /* Paid-by badge on the row (under the purchaser line) */
      .pot-paid-badge {
        display: inline-block;
        font-size: 9.5px;
        font-weight: 700;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        padding: 2px 6px;
        border-radius: 4px;
        margin-top: 3px;
        line-height: 1.3;
      }
      .pot-paid-church { background: #E0F5E5; color: #1E7E34; }
      .pot-paid-pocket { background: #FBE5E7; color: #C41E2A; }

      /* Inline paid-by tag (in sheet read-only display) */
      .pot-paid-inline {
        display: inline-block;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.4px;
        text-transform: uppercase;
        padding: 1px 6px;
        border-radius: 4px;
        margin-left: 8px;
        vertical-align: middle;
      }

      /* Segmented control for payment method in the order sheet */
      .pot-segmented {
        display: inline-flex;
        border: 1px solid rgba(0,0,0,0.12);
        border-radius: 8px;
        overflow: hidden;
        background: rgba(0,0,0,0.02);
      }
      .pot-seg-opt {
        appearance: none;
        background: transparent;
        border: none;
        font-family: inherit;
        font-size: 13px;
        font-weight: 500;
        color: #555;
        padding: 9px 16px;
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
      }
      .pot-seg-opt + .pot-seg-opt {
        border-left: 1px solid rgba(0,0,0,0.12);
      }
      .pot-seg-opt:hover:not(.pot-seg-opt-active) {
        background: rgba(0,0,0,0.04);
      }
      .pot-seg-opt-active {
        background: #1D1D1F;
        color: white;
      }
      .pot-sheet {
        position: fixed; inset: 0; z-index: 9999;
        display: flex; align-items: flex-end; justify-content: center;
        transition: opacity 0.2s;
      }
      .pot-sheet-hidden { display: none; }
      .pot-sheet-backdrop {
        position: absolute; inset: 0;
        background: rgba(0,0,0,0.4);
      }
      .pot-sheet-card {
        position: relative;
        background: #fff;
        width: 100%; max-width: 520px;
        border-radius: 20px 20px 0 0;
        padding: 8px 24px 32px;
        animation: pot-slide-up 0.25s ease-out;
        max-height: 88vh;
        overflow-y: auto;
        box-shadow: 0 -10px 50px rgba(0,0,0,0.2);
      }
      @media (min-width: 521px) {
        .pot-sheet { align-items: center; }
        .pot-sheet-card { border-radius: 20px; max-height: 80vh; }
      }
      @keyframes pot-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
      .pot-sheet-handle {
        width: 40px; height: 4px; background: rgba(0,0,0,0.15);
        border-radius: 2px; margin: 4px auto 18px;
      }
      .pot-sheet-header { margin-bottom: 20px; }
      .pot-sheet-lineref { font-size: 11px; font-weight: 700; color: #86868B; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
      .pot-sheet-linename { font-family: 'Instrument Serif', 'Cormorant Garamond', Georgia, serif; font-size: 22px; line-height: 1.25; color: #1D1D1F; margin-bottom: 6px; }
      .pot-sheet-est { font-size: 13px; color: #555; }
      .pot-sheet-status { font-size: 13px; color: #555; margin-bottom: 16px; padding: 12px 14px; background: rgba(0,0,0,0.03); border-radius: 8px; }
      .pot-sheet-readonly { font-size: 13px; color: #86868B; margin: 12px 0 20px; }
      .pot-form { margin: 16px 0; }
      .pot-form label { display: block; font-size: 11px; font-weight: 600; color: #555; text-transform: uppercase; letter-spacing: 0.5px; margin: 14px 0 6px; }
      .pot-form input, .pot-form textarea {
        width: 100%; padding: 10px 12px;
        border: 1px solid rgba(0,0,0,0.12);
        border-radius: 8px;
        font-family: inherit; font-size: 14px;
        background: #FAFAFA;
        box-sizing: border-box;
      }
      .pot-form input:focus, .pot-form textarea:focus { outline: none; border-color: #0071E3; background: #fff; }
      .pot-form textarea { min-height: 60px; resize: vertical; }
      .pot-btn {
        display: block; width: 100%;
        padding: 13px 20px; margin-top: 10px;
        font-family: inherit; font-size: 15px; font-weight: 600;
        border: none; border-radius: 12px;
        cursor: pointer;
        transition: opacity 0.15s;
      }
      .pot-btn:hover { opacity: 0.9; }
      .pot-btn-primary   { background: #0071E3; color: #fff; }
      .pot-btn-secondary { background: rgba(0,0,0,0.06); color: #1D1D1F; }
      .pot-btn-ghost     { background: transparent; color: #555; }
      .pot-btn-danger    { background: #FBE5E7; color: #C41E2A; }
      .pot-refresh-bar {
        display: flex; justify-content: space-between; align-items: center;
        padding: 14px 20px; margin: 16px 0;
        background: rgba(0,0,0,0.03); border-radius: 10px;
        font-size: 12px; color: #555;
      }
      .pot-refresh-btn {
        font-family: inherit; font-size: 12px; font-weight: 600;
        padding: 6px 12px; border: 1px solid rgba(0,0,0,0.1);
        background: #fff; border-radius: 6px; cursor: pointer;
        color: #1D1D1F;
      }
      .pot-refresh-btn:hover { background: #F5F5F5; }

      /* PIN gate */
      .pot-pin-gate {
        position: fixed; inset: 0; z-index: 10000;
        background: rgba(15, 15, 18, 0.85);
        backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        transition: opacity 0.18s;
      }
      .pot-pin-card {
        background: #fff; border-radius: 24px;
        padding: 32px 28px 28px;
        width: calc(100% - 32px); max-width: 360px;
        text-align: center;
        box-shadow: 0 30px 80px rgba(0,0,0,0.4);
      }
      .pot-pin-title {
        font-family: 'Instrument Serif', 'Cormorant Garamond', Georgia, serif;
        font-size: 28px; color: #1D1D1F; margin-bottom: 6px;
      }
      .pot-pin-sub { font-size: 13px; color: #86868B; margin-bottom: 26px; line-height: 1.5; }
      .pot-pin-dots {
        display: flex; justify-content: center; gap: 14px; margin-bottom: 8px;
      }
      .pot-pin-dot {
        width: 14px; height: 14px; border-radius: 50%;
        background: rgba(0,0,0,0.08); transition: background 0.12s, transform 0.12s;
      }
      .pot-pin-dot.on { background: #0071E3; }
      .pot-pin-dot.shake { animation: pot-shake 0.32s; background: #FF3B30; }
      @keyframes pot-shake {
        0%,100% { transform: translateX(0); }
        20%,60% { transform: translateX(-4px); }
        40%,80% { transform: translateX(4px); }
      }
      .pot-pin-msg { font-size: 12px; color: #FF3B30; min-height: 18px; margin: 6px 0 14px; }
      .pot-pin-keypad {
        display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;
        margin-top: 6px;
      }
      .pot-pin-key {
        font-family: inherit; font-size: 22px; font-weight: 500;
        height: 56px; border-radius: 14px;
        border: 1px solid rgba(0,0,0,0.06); background: #FAFAFA;
        color: #1D1D1F; cursor: pointer;
        transition: background 0.08s, transform 0.05s;
      }
      .pot-pin-key:hover { background: #F0F0F0; }
      .pot-pin-key:active { transform: scale(0.96); background: #E8E8E8; }
      .pot-pin-key-blank { visibility: hidden; pointer-events: none; }
      .pot-pin-key-del { font-size: 18px; color: #86868B; }

      /* Select dropdown */
      .pot-form select {
        width: 100%; padding: 10px 12px;
        border: 1px solid rgba(0,0,0,0.12);
        border-radius: 8px;
        font-family: inherit; font-size: 14px;
        background: #FAFAFA;
        box-sizing: border-box;
        appearance: none;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'><path fill='%23555' d='M5 6L0 0h10z'/></svg>");
        background-repeat: no-repeat; background-position: right 14px center; background-size: 10px;
        padding-right: 36px;
      }
      .pot-form select:focus { outline: none; border-color: #0071E3; background-color: #fff; }

      /* ── Group order button on supplier blocks ── */
      .pot-group-order-btn {
        display: block; width: calc(100% - 36px);
        margin: 0 18px 14px;
        padding: 11px 16px;
        font-family: inherit; font-size: 13px; font-weight: 600;
        color: #0071E3; background: #F4F8FE;
        border: 1px dashed #B8DAFB; border-radius: 10px;
        cursor: pointer; text-align: left;
        transition: background 0.12s, border-color 0.12s;
      }
      .pot-group-order-btn:hover { background: #E8F2FE; border-style: solid; }

      /* ── Group order sheet ── */
      .pot-group-lines {
        margin: 16px 0; max-height: 320px; overflow-y: auto;
        border: 1px solid rgba(0,0,0,0.07); border-radius: 10px;
        background: #FAFAFA;
      }
      .pot-group-line {
        display: flex; align-items: center; gap: 12px;
        padding: 12px 14px; cursor: pointer;
        border-bottom: 1px solid rgba(0,0,0,0.05);
      }
      .pot-group-line:last-child { border-bottom: none; }
      .pot-group-line:hover { background: rgba(0,113,227,0.04); }
      .pot-group-line-unchecked { opacity: 0.42; }
      .pot-group-line input[type="checkbox"] {
        width: 18px; height: 18px; flex-shrink: 0;
        accent-color: #0071E3;
      }
      .pot-group-line-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
      .pot-group-line-ref { font-size: 10px; font-weight: 700; color: #86868B; letter-spacing: 0.5px; }
      .pot-group-line-name { font-size: 13px; color: #1D1D1F; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .pot-group-line-amt { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
      .pot-group-line-est { font-size: 10px; color: #AEAEB2; }
      .pot-group-line-final {
        width: 80px; padding: 6px 8px;
        border: 1px solid rgba(0,0,0,0.12); border-radius: 6px;
        font-family: inherit; font-size: 13px; text-align: right;
        background: #fff; box-sizing: border-box;
      }
      .pot-group-line-final:focus { outline: none; border-color: #0071E3; }

      /* ── Extras list ── */
      .pot-extras-list { display: flex; flex-direction: column; gap: 8px; }
      .pot-extra-row {
        display: flex; gap: 8px; align-items: center;
      }
      .pot-extra-label {
        flex: 1; padding: 9px 11px;
        border: 1px solid rgba(0,0,0,0.12); border-radius: 8px;
        font-family: inherit; font-size: 13px;
        background: #FAFAFA; box-sizing: border-box;
      }
      .pot-extra-currency { color: #86868B; font-size: 13px; }
      .pot-extra-amount {
        width: 80px; padding: 9px 11px;
        border: 1px solid rgba(0,0,0,0.12); border-radius: 8px;
        font-family: inherit; font-size: 13px; text-align: right;
        background: #FAFAFA; box-sizing: border-box;
      }
      .pot-extra-label:focus, .pot-extra-amount:focus { outline: none; border-color: #0071E3; background: #fff; }
      .pot-extra-remove {
        width: 30px; height: 30px;
        border: none; background: rgba(0,0,0,0.04); color: #86868B;
        border-radius: 6px; cursor: pointer; font-size: 18px; line-height: 1;
        flex-shrink: 0;
      }
      .pot-extra-remove:hover { background: #FBE5E7; color: #C41E2A; }

      /* ── Group summary panel ── */
      .pot-group-summary {
        background: #F5F5F7; border-radius: 12px;
        padding: 14px 18px; margin: 20px 0 12px;
      }
      .pot-group-summary-row {
        display: flex; justify-content: space-between;
        font-size: 13px; color: #555; padding: 4px 0;
      }
      .pot-group-summary-grand {
        margin-top: 8px; padding-top: 12px;
        border-top: 1px solid rgba(0,0,0,0.08);
        font-size: 16px; font-weight: 700; color: #1D1D1F;
      }

      /* ── Order detail link on status pill ── */
      .pot-order-link {
        display: inline-block; margin-top: 4px;
        font-size: 10px; font-weight: 700;
        color: #0071E3; background: #E8F2FE;
        padding: 2px 7px; border-radius: 5px;
      }

      /* ── Order detail sheet sections ── */
      .pot-order-section-title {
        font-size: 11px; font-weight: 700; text-transform: uppercase;
        letter-spacing: 1px; color: #86868B; margin: 22px 0 10px;
      }
      .pot-order-line-list {
        list-style: none; margin: 0; padding: 0;
        background: #FAFAFA; border-radius: 10px;
        border: 1px solid rgba(0,0,0,0.06);
      }
      .pot-order-line-list li {
        display: flex; justify-content: space-between; align-items: center;
        padding: 10px 14px; font-size: 13px;
        border-bottom: 1px solid rgba(0,0,0,0.04);
      }
      .pot-order-line-list li:last-child { border-bottom: none; }
      .pot-order-line-ref { font-weight: 600; color: #1D1D1F; }
      .pot-order-line-amount { font-variant-numeric: tabular-nums; color: #555; }

      /* ── Extras chip in tally ── */
      .pot-tally-chip.pot-tally-extras { background: #FFF8E1; color: #8B6914; }
      .pot-tally-stat-extras strong { color: #8B6914; }
    `;
    document.head.appendChild(style);
  }

  // ── EXPORT ─────────────────────────────────────────────────────────────────
  global.POTracker = {
    init,
    refresh: hydrate,
    state: () => state,
    user:  () => currentUser,
    lock: () => {
      if (!config) return;
      sessionStorage.removeItem('po_pin_unlocked_' + config.poSlug);
      pinUnlocked = false;
      currentUser = null;
      location.reload();
    },
  };

})(window);
