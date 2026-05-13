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
  };

  const STATUS_LABELS = {
    pending:   { label: 'Open',     icon: '○',  color: '#86868B' },
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
  let currentUser = null;
  let state = {};   // line_ref -> purchase row
  let renderQueue = new Set();

  // ── INIT ───────────────────────────────────────────────────────────────────
  function init(opts) {
    config = Object.assign({}, DEFAULTS, opts || {});
    if (!config.poSlug) throw new Error('POTracker.init requires poSlug');

    // Load current user from Bridge session — try sessionStorage first (per-tab),
    // then localStorage (cross-tab). Bridge writes to both on login.
    try {
      let raw = sessionStorage.getItem('bridge_user');
      if (!raw) raw = localStorage.getItem('bridge_user');
      if (raw) currentUser = JSON.parse(raw);
    } catch(e) { /* ignore */ }

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

    // Initial hydrate
    if (config.autoRender) {
      hydrate();
      // Refresh when the tab regains focus — also re-checks login state
      if (config.pollOnFocus) {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            // Re-read session in case user logged in via another tab
            try {
              let raw = sessionStorage.getItem('bridge_user');
              if (!raw) raw = localStorage.getItem('bridge_user');
              if (raw) {
                const fresh = JSON.parse(raw);
                if (!currentUser || currentUser.id !== fresh.id) {
                  currentUser = fresh;
                  // Dismiss the read-only notice if it's showing
                  const notice = document.getElementById('po-auth-notice');
                  if (notice) notice.style.display = 'none';
                }
              }
            } catch(e) { /* ignore */ }
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

  async function upsertLine(lineRef, patch) {
    if (!supa) throw new Error('Supabase not available');
    // Try update first (will be a no-op if no row exists)
    const existing = state[lineRef];
    if (existing && existing.id) {
      const { data, error } = await supa
        .from(config.table)
        .update(patch)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      // Insert new row
      const row = Object.assign({
        po_slug: config.poSlug,
        line_ref: lineRef,
      }, patch);
      const { data, error } = await supa
        .from(config.table)
        .insert(row)
        .select()
        .single();
      if (error) {
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
    const rows = await fetchAll();
    state = {};
    rows.forEach(r => { state[r.line_ref] = r; });
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
    }
    cell.innerHTML = inner;
    const btn = cell.querySelector('.pot-pill');
    if (btn && canAct) {
      btn.addEventListener('click', () => openActionSheet(lineRef));
    }
  }

  function renderTallies() {
    // Per-supplier tally
    document.querySelectorAll('.supplier').forEach(block => {
      const lineRefs = Array.from(block.querySelectorAll('[data-line-ref]'))
        .map(el => el.getAttribute('data-line-ref'))
        .filter((v, i, a) => a.indexOf(v) === i);   // dedupe
      const tally = summarise(lineRefs);
      const tallyEl = block.querySelector('.supplier-tally');
      if (tallyEl) tallyEl.innerHTML = renderTallyHtml(tally, 'compact');
    });
    // Page tally
    const overall = document.getElementById('po-overall-tally');
    if (overall) {
      const allRefs = Array.from(document.querySelectorAll('[data-line-ref]'))
        .map(el => el.getAttribute('data-line-ref'))
        .filter((v, i, a) => a.indexOf(v) === i);
      const tally = summarise(allRefs);
      overall.innerHTML = renderTallyHtml(tally, 'full');
    }
  }

  function summarise(lineRefs) {
    const t = { total: lineRefs.length, pending: 0, claimed: 0, ordered: 0, received: 0, cancelled: 0, spent: 0 };
    lineRefs.forEach(ref => {
      const r = state[ref];
      const status = (r && r.status) || 'pending';
      t[status] = (t[status] || 0) + 1;
      if (r && r.final_amount && (status === 'ordered' || status === 'received')) {
        t.spent += Number(r.final_amount);
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
    } else {
      parts.push(`<span class="pot-tally-stat"><strong>${t.total}</strong> lines</span>`);
      parts.push(`<span class="pot-tally-stat"><strong>${t.claimed}</strong> claimed</span>`);
      parts.push(`<span class="pot-tally-stat"><strong>${t.ordered}</strong> ordered</span>`);
      parts.push(`<span class="pot-tally-stat"><strong>${t.received}</strong> received</span>`);
      parts.push(`<span class="pot-tally-stat"><strong>£${t.spent.toFixed(2)}</strong> spent</span>`);
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

  function openActionSheet(lineRef) {
    if (!currentUser) {
      alert('Please log in to The Bridge first.');
      return;
    }
    if (!ACTION_LEVELS.has(currentUser.level)) {
      alert('You need lead-level access to record purchases.');
      return;
    }
    const row = state[lineRef];
    const rowEl = document.querySelector(`tr[data-line-ref="${cssEscape(lineRef)}"]`);
    const lineName = rowEl ? (rowEl.getAttribute('data-line-name') || `Line ${lineRef}`) : `Line ${lineRef}`;
    const lineAmount = rowEl ? rowEl.getAttribute('data-line-amount') : null;
    const body = sheetEl.querySelector('.pot-sheet-body');

    const status = (row && row.status) || 'pending';
    const isMine = row && currentUser && row.purchaser_id === currentUser.id;
    const isAdmin = currentUser.level === 'admin';
    const canEdit = isMine || isAdmin;

    let html = `
      <div class="pot-sheet-header">
        <div class="pot-sheet-lineref">Line ${escapeHtml(lineRef)}</div>
        <div class="pot-sheet-linename">${escapeHtml(lineName)}</div>
        ${lineAmount ? `<div class="pot-sheet-est">Estimated: £${Number(lineAmount).toFixed(2)}</div>` : ''}
      </div>
    `;

    if (status === 'pending') {
      html += `
        <button class="pot-btn pot-btn-primary" data-action="claim">Claim — I'll order this</button>
        <button class="pot-btn pot-btn-secondary" data-action="ordered">I've already ordered it</button>
        <button class="pot-btn pot-btn-ghost" data-action="cancel">Cancel</button>
      `;
    } else if (status === 'claimed' && canEdit) {
      html += `
        <div class="pot-sheet-status">Claimed by <strong>${escapeHtml(row.purchaser)}</strong> · ${timeAgo(row.claimed_at)}</div>
        <div class="pot-form">
          <label>Final amount paid (£)</label>
          <input type="number" step="0.01" id="pot-final" placeholder="${lineAmount || '0.00'}" value="${row.final_amount || ''}">
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
        <div class="pot-sheet-status">Claimed by <strong>${escapeHtml(row.purchaser)}</strong> · ${timeAgo(row.claimed_at)}</div>
        <p class="pot-sheet-readonly">Only ${escapeHtml(row.purchaser.split(' ')[0])} can release this. Message them on WhatsApp if you need to take it over.</p>
        <button class="pot-btn pot-btn-ghost" data-action="cancel">Close</button>
      `;
    } else if (status === 'ordered' && canEdit) {
      html += `
        <div class="pot-sheet-status">Ordered by <strong>${escapeHtml(row.purchaser)}</strong> · ${timeAgo(row.ordered_at)}</div>
        ${row.final_amount ? `<div class="pot-sheet-est"><strong>Paid:</strong> £${Number(row.final_amount).toFixed(2)}</div>` : ''}
        ${row.order_ref ? `<div class="pot-sheet-est"><strong>Order ref:</strong> ${escapeHtml(row.order_ref)}</div>` : ''}
        ${row.notes ? `<div class="pot-sheet-est"><strong>Notes:</strong> ${escapeHtml(row.notes)}</div>` : ''}
        <button class="pot-btn pot-btn-primary" data-action="received">Mark received</button>
        <button class="pot-btn pot-btn-ghost" data-action="edit-ordered">Edit details</button>
        <button class="pot-btn pot-btn-ghost" data-action="cancel">Close</button>
      `;
    } else if (status === 'ordered' && !canEdit) {
      html += `
        <div class="pot-sheet-status">Ordered by <strong>${escapeHtml(row.purchaser)}</strong> · ${timeAgo(row.ordered_at)}</div>
        ${row.final_amount ? `<div class="pot-sheet-est"><strong>Paid:</strong> £${Number(row.final_amount).toFixed(2)}</div>` : ''}
        ${row.order_ref ? `<div class="pot-sheet-est"><strong>Order ref:</strong> ${escapeHtml(row.order_ref)}</div>` : ''}
        <p class="pot-sheet-readonly">Read-only — only ${escapeHtml(row.purchaser.split(' ')[0])} or an admin can edit.</p>
        <button class="pot-btn pot-btn-ghost" data-action="cancel">Close</button>
      `;
    } else if (status === 'received') {
      html += `
        <div class="pot-sheet-status">Received · ordered by <strong>${escapeHtml(row.purchaser)}</strong></div>
        ${row.final_amount ? `<div class="pot-sheet-est"><strong>Paid:</strong> £${Number(row.final_amount).toFixed(2)}</div>` : ''}
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
    sheetEl.classList.remove('pot-sheet-hidden');
  }

  function closeActionSheet() {
    if (sheetEl) sheetEl.classList.add('pot-sheet-hidden');
  }

  // ── ACTIONS ────────────────────────────────────────────────────────────────
  async function handleAction(action, lineRef) {
    if (action === 'cancel') { closeActionSheet(); return; }
    const now = new Date().toISOString();
    const userPatch = {
      purchaser:    currentUser.name,
      purchaser_id: currentUser.id,
    };
    try {
      let patch = null;
      let promptedAmount = null;
      switch(action) {
        case 'claim':
          patch = Object.assign({ status: 'claimed', claimed_at: now }, userPatch);
          break;
        case 'release':
          patch = { status: 'pending', purchaser: null, purchaser_id: null, claimed_at: null, final_amount: null, order_ref: null };
          break;
        case 'ordered': {
          const finalEl = document.getElementById('pot-final');
          const refEl = document.getElementById('pot-order-ref');
          const notesEl = document.getElementById('pot-notes');
          let final = finalEl ? parseFloat(finalEl.value) : NaN;
          // If the user is going straight from pending -> ordered (skipping claim),
          // prompt for the amount inline
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
          }, userPatch);
          break;
        }
        case 'received':
          patch = { status: 'received', received_at: now };
          break;
        case 'cancelled': {
          const reason = prompt('Reason for cancellation (optional):') || '';
          patch = Object.assign({
            status: 'cancelled',
            notes: reason || (state[lineRef] && state[lineRef].notes) || null,
          }, userPatch);
          break;
        }
        case 'reopen':
          patch = { status: 'pending', purchaser: null, purchaser_id: null, claimed_at: null, ordered_at: null, received_at: null, final_amount: null, order_ref: null };
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
      .pot-tally-stat { font-size: 12px; color: #555; margin-right: 14px; }
      .pot-tally-stat strong { color: #1D1D1F; font-size: 14px; }
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
    `;
    document.head.appendChild(style);
  }

  // ── EXPORT ─────────────────────────────────────────────────────────────────
  global.POTracker = {
    init,
    refresh: hydrate,
    state: () => state,
    user:  () => currentUser,
  };

})(window);
