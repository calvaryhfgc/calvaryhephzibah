// ── CALVARY OS — SHARED SHELL ──────────────────────────────────────────────

// ── SUPABASE ──────────────────────────────────────────────────────────────────
const SUPA_URL = 'https://pfycvgbrsbecznkcikwt.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmeWN2Z2Jyc2JlY3pua2Npa3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNzY1NDgsImV4cCI6MjA5MDk1MjU0OH0.xw_DSmC0brKC7K9H-rxNG0HKKDi4I-dNSEoZKERvHcQ';

const sbHeaders = {
  'apikey': SUPA_KEY,
  'Authorization': `Bearer ${SUPA_KEY}`,
  'Content-Type': 'application/json'
};

async function sbFetch(path) {
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, { headers: sbHeaders });
    if (!res.ok) throw new Error(res.status);
    return res.json();
  } catch(e) { console.warn('sbFetch error:', e); return null; }
}

async function sbPost(table, data) {
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...sbHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(res.status);
    return res.json();
  } catch(e) { console.warn('sbPost error:', e); return null; }
}

async function sbPatch(table, match, data) {
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/${table}?${match}`, {
      method: 'PATCH',
      headers: { ...sbHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(res.status);
    return res.json();
  } catch(e) { console.warn('sbPatch error:', e); return null; }
}

async function sbDelete(table, match) {
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/${table}?${match}`, {
      method: 'DELETE',
      headers: sbHeaders
    });
    if (!res.ok) throw new Error(res.status);
    return true;
  } catch(e) { console.warn('sbDelete error:', e); return false; }
}

const COS = {

  // ── USERS ─────────────────────────────────────────────────────────────────
  // Users log in with username + PIN. Display names (`name`) are used in the
  // UI for admins/leads but never shown on the login screen itself — so team
  // members don't see who else is on the platform.
  users: [
    { id:1,  name:'Bolaji Olatoye',          username:'bolatoye',  role:'Operations Lead',  level:'admin', pin:'bp_yhwbc0',  sections:['sunday','worship','media','midweek','departments','admin'], active:true },
    { id:2,  name:'Pastor Shade Olatoye',    username:'pshade',    role:'General Overseer', level:'admin', pin:'bp_yhvw22',  sections:['sunday','worship','media','midweek','departments','admin'], active:true },
    { id:3,  name:'Scott Shokoya',           username:'sshokoya',  role:'Media Lead',       level:'lead',  pin:'bp_yhu7vp',  sections:['sunday','media'], active:true },
    { id:4,  name:'Caster Martins',          username:'cmartins',  role:'Worship Lead',     level:'lead',  pin:'bp_yhsq3p',  sections:['sunday','worship'], active:true },
    { id:5,  name:'Morayo Ogungbenro',       username:'morayo',    role:'Worship',          level:'team',  pin:'bp_yhu1z9',  sections:['sunday','worship'], active:true },
    { id:6,  name:'Laolu Ogungbenro',        username:'laolu',     role:'Worship',          level:'team',  pin:'bp_yhu4ed',  sections:['sunday','worship'], active:true },
    { id:7,  name:'Bolaji Adebanjo',         username:'badebanjo', role:'Worship',          level:'team',  pin:'bp_yhrx9h',  sections:['sunday','worship'], active:true },
    { id:8,  name:'Auntie Pauline Tulloch',  username:'pauline',   role:'Operations Lead',  level:'lead',  pin:'bp_yhwnt1',  sections:['sunday','departments'], active:true },
    { id:9,  name:'Pastor Gbenga Adebanjo',  username:'pgbenga',   role:'Leadership',       level:'lead',  pin:'bp_yhtdhh',  sections:['sunday','departments','midweek'], active:true },
    { id:10, name:'Pastor Kayode Ogungbenro',username:'pkayode',   role:'Leadership',       level:'lead',  pin:'bp_yhruv9',  sections:['sunday','departments'], active:true },
    { id:11, name:'Sister Petty',            username:'petty',     role:'Operations',       level:'team',  pin:'bp_yhxd39',  sections:['sunday','departments'], active:true },
    { id:12, name:'Chinedu',                 username:'chinedu',   role:'Media',            level:'team',  pin:'bp_yi1slh',  sections:['sunday','media'], active:true },
    { id:13, name:'Terrel',                  username:'terrel',    role:'Media',            level:'team',  pin:'bp_yi1v0l',  sections:['sunday','media'], active:true },
    { id:14, name:'Tavoy',                   username:'tavoy',     role:'Media',            level:'team',  pin:'bp_yi1u9x',  sections:['sunday','media'], active:true },
    { id:15, name:'Noah',                    username:'noah',      role:'Media',            level:'team',  pin:'bp_yi1wp1',  sections:['sunday','media'], active:true },
    { id:16, name:'Esther',                  username:'esther',    role:'Worship',          level:'team',  pin:'bp_yhsmkl',  sections:['sunday','worship'], active:true },
    { id:17, name:'Michael Kabalu',          username:'mkabalu',   role:'Worship',          level:'team',  pin:'bp_yhtbwl',  sections:['sunday','worship'], active:true },
    { id:18, name:'Edmund',                  username:'edmund',    role:'Worship',          level:'team',  pin:'bp_yhu5z9',  sections:['sunday','worship'], active:true },
  ],

  // ── AUTH ──────────────────────────────────────────────────────────────────
  currentUser: null,
  originalUser: null,        // when impersonating, this is the real admin
  _pinEntry: '',
  _pinTarget: null,

  hashPin(p){ let h=5381; for(let i=0;i<p.length;i++) h=((h<<5)+h)^p.charCodeAt(i); return'bp_'+(h>>>0).toString(36); },

  init(requiredSection){
    // Restore session
    try {
      const s = sessionStorage.getItem('cos_session');
      if(s){ this.currentUser = JSON.parse(s); }
      const orig = sessionStorage.getItem('cos_original');
      if(orig){ this.originalUser = JSON.parse(orig); }
    } catch(e){}

    if(this.currentUser){
      if(requiredSection && !this.hasAccess(requiredSection)){
        window.location.href = 'index.html';
        return;
      }
      this._launchApp();
      return;
    }
    // No session — render the login form. This replaces the inline auth-screen
    // HTML in every page with a username+PIN form, so team members never see
    // the list of users on the platform.
    this._renderLoginForm();
  },

  hasAccess(section){
    if(!this.currentUser) return false;
    if(this.currentUser.level === 'admin') return true;
    // Rehearsal Studio is available to anyone with worship access
    if(section === 'rehearsal') return (this.currentUser.sections||[]).includes('worship');
    // Control Room is available to anyone with media or sunday access
    if(section === 'controlroom') {
      const s = this.currentUser.sections || [];
      return s.includes('media') || s.includes('sunday') || s.includes('worship');
    }
    // Crew is available to anyone authenticated — visible to band, media,
    // leadership and operations so they can see who's setting up. Edit-gating
    // (admin/lead vs team) happens inside crew.html itself.
    if(section === 'crew') return true;
    return (this.currentUser.sections||[]).includes(section);
  },

  // ── LOGIN FORM ─────────────────────────────────────────────────
  // Single screen: Username + PIN + Sign in. Replaces the old user gallery
  // so no user sees a directory of other users. Admins can still see the
  // full list on the admin page.
  //
  // Mobile-specific considerations handled here:
  //  - Inputs are 16px font-size to prevent iOS Safari auto-zoom on focus
  //  - Inputs and button are min 48px tall for reliable tap targets
  //  - autocapitalize=none + autocorrect=off so mobile keyboards don't mangle
  //    'pshade' into 'Pshade' or 'P shade'
  //  - Autofill styling overridden with an inset box-shadow hack so Safari's
  //    yellow autofill background doesn't wreck the clean look
  //  - Logo block margin collapses below 600px to avoid wasting vertical
  //    space when the virtual keyboard is up
  _renderLoginForm(){
    const auth = document.getElementById('auth-screen');
    if(!auth) return;
    auth.innerHTML = `
      <style>
        .cos-login-wrap{width:100%;max-width:380px;}
        .cos-login-logo{display:flex;align-items:center;gap:12px;margin-bottom:28px;}
        @media(max-width:600px){ .cos-login-logo{margin-bottom:20px;} }
        .cos-login-logo-icon{width:46px;height:46px;background:var(--red);border-radius:var(--r12);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .cos-login-logo-icon svg{width:20px;height:20px;}
        .cos-login-logo-name{font-size:18px;font-weight:700;color:var(--ink);line-height:1.1;}
        .cos-login-logo-sub{font-size:12px;color:var(--ink-4);margin-top:1px;}
        .cos-login-heading{font-size:22px;font-weight:700;color:var(--ink);margin-bottom:4px;line-height:1.2;}
        .cos-login-sub{font-size:14px;color:var(--ink-3);margin-bottom:22px;line-height:1.5;}
        .cos-login-form{display:flex;flex-direction:column;gap:14px;}
        .cos-login-field{display:flex;flex-direction:column;gap:6px;}
        .cos-login-label{font-size:11px;font-weight:700;color:var(--ink-3);letter-spacing:0.5px;text-transform:uppercase;}
        .cos-login-input{padding:14px 16px;border:1.5px solid var(--ink-5);border-radius:var(--r12);font-family:'Poppins',sans-serif;font-size:16px;background:var(--white);color:var(--ink);min-height:48px;-webkit-appearance:none;box-sizing:border-box;width:100%;transition:border-color 0.15s;}
        .cos-login-input:focus{outline:none;border-color:var(--red);box-shadow:0 0 0 3px rgba(196,30,42,0.12);}
        .cos-login-input-pin{letter-spacing:6px;font-variant-numeric:tabular-nums;text-align:center;font-size:18px;}
        .cos-login-input-pin::placeholder{letter-spacing:6px;color:var(--ink-5);}
        /* Override iOS Safari's yellow autofill background */
        .cos-login-input:-webkit-autofill,
        .cos-login-input:-webkit-autofill:hover,
        .cos-login-input:-webkit-autofill:focus{
          -webkit-box-shadow:0 0 0 1000px var(--white) inset !important;
          -webkit-text-fill-color:var(--ink) !important;
          caret-color:var(--ink);
        }
        .cos-login-btn{padding:14px 16px;border:none;background:var(--red);color:white;border-radius:var(--r12);font-family:'Poppins',sans-serif;font-size:15px;font-weight:600;cursor:pointer;min-height:48px;margin-top:4px;transition:background 0.1s;}
        .cos-login-btn:hover{background:var(--red-d);}
        .cos-login-btn:active{transform:scale(0.98);}
        .cos-login-msg{font-size:13px;color:var(--red);min-height:18px;text-align:center;margin-top:6px;font-weight:500;}
      </style>
      <div class="cos-login-wrap">
        <div class="cos-login-logo">
          <div class="cos-login-logo-icon">
            <svg viewBox="0 0 16 16" fill="none"><rect x="6.5" y="1" width="3" height="14" rx="0.5" fill="white"/><rect x="1" y="5.5" width="14" height="3" rx="0.5" fill="white"/></svg>
          </div>
          <div>
            <div class="cos-login-logo-name">Calvary OS</div>
            <div class="cos-login-logo-sub">Calvary Hephzibah</div>
          </div>
        </div>
        <div class="cos-login-heading">Welcome back</div>
        <div class="cos-login-sub">Sign in with your username and PIN.</div>
        <div class="cos-login-form">
          <div class="cos-login-field">
            <label class="cos-login-label" for="login-username">Username</label>
            <input type="text" id="login-username" class="cos-login-input"
                   autocomplete="username"
                   autocapitalize="none" autocorrect="off" spellcheck="false"
                   placeholder="yourname"
                   onkeydown="if(event.key==='Enter'){document.getElementById('login-pin').focus();}">
          </div>
          <div class="cos-login-field">
            <label class="cos-login-label" for="login-pin">PIN</label>
            <input type="password" id="login-pin" class="cos-login-input cos-login-input-pin"
                   autocomplete="current-password"
                   inputmode="numeric" pattern="[0-9]*" maxlength="4"
                   placeholder="••••"
                   onkeydown="if(event.key==='Enter'){COS._submitLogin();}"
                   oninput="this.value=this.value.replace(/[^0-9]/g,'');if(this.value.length===4){setTimeout(()=>COS._submitLogin(),80);}">
          </div>
          <button type="button" class="cos-login-btn" onclick="COS._submitLogin()">Sign in</button>
          <div id="login-msg" class="cos-login-msg"></div>
        </div>
      </div>`;
    // Focus username on desktop; skip on mobile to let the user tap first
    // (prevents keyboard springing up before the user is ready)
    if(window.innerWidth > 600){
      setTimeout(() => {
        const u = document.getElementById('login-username');
        if(u) u.focus();
      }, 50);
    }
  },

  _submitLogin(){
    const userInput = document.getElementById('login-username');
    const pinInput = document.getElementById('login-pin');
    const msg = document.getElementById('login-msg');
    if(!userInput || !pinInput) return;
    const username = userInput.value.trim().toLowerCase();
    const pin = pinInput.value.trim();
    if(!username || !pin){
      msg.textContent = 'Enter both username and PIN';
      return;
    }
    // Look up user by username. Never reveal whether the username exists —
    // show the same error for 'wrong username' and 'wrong PIN'.
    const target = this.users.find(u => u.active && u.username.toLowerCase() === username);
    if(!target || this.hashPin(pin) !== target.pin){
      msg.textContent = 'Invalid username or PIN';
      pinInput.value = '';
      pinInput.focus();
      return;
    }
    msg.textContent = '';
    this.currentUser = target;
    sessionStorage.setItem('cos_session', JSON.stringify(this.currentUser));
    this._launchApp();
  },

  // ── LEGACY AUTH HELPERS (retained for backwards compat) ────────
  // These are kept so any inline onclick calls in old HTML stubs don't throw,
  // but they're effectively no-ops now since the login form replaces the stub.
  _renderUsers(){ /* superseded by _renderLoginForm */ },
  _selectUser(id){ /* superseded */ },
  _goBack(){ /* superseded */ },
  pk(d){ /* superseded */ },
  pdel(){ /* superseded */ },
  _updateDots(){ /* superseded */ },
  _checkPin(){ /* superseded */ },

  _showAuthStep(stepId){
    // Only used by legacy HTML stubs. The new login form manages its own DOM.
    document.querySelectorAll('.auth-step').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(stepId);
    if(el) el.classList.add('active');
  },

  _launchApp(){
    const auth = document.getElementById('auth-screen');
    const app = document.getElementById('app');
    if(auth) auth.classList.add('gone');
    if(app) app.classList.add('visible');
    // Set user in topbar
    const av = document.getElementById('tb-av');
    const nm = document.getElementById('tb-name');
    if(av) av.textContent = this._initials(this.currentUser.name);
    if(nm) nm.textContent = this.currentUser.name.split(' ')[0];
    // Apply nav visibility
    this._applyNav();
    // Render impersonation banner if active
    this._renderImpersonationBanner();
    // Call page init if defined
    if(typeof pageInit === 'function') pageInit();
  },

  _applyNav(){
    if(!this.currentUser) return;
    document.querySelectorAll('[data-section]').forEach(el=>{
      const s = el.getAttribute('data-section');
      if(s && !this.hasAccess(s)) el.style.display='none';
    });
  },

  // ── IMPERSONATION ─────────────────────────────────────────────────────────
  // Admins can view the app as another user to see what they see. The real
  // admin identity is preserved in originalUser so they can exit cleanly.
  impersonate(userId){
    // Guard: only real admins can impersonate, and only non-admins
    const actor = this.originalUser || this.currentUser;
    if(!actor || actor.level !== 'admin'){
      this.toast('Only admins can do that');
      return;
    }
    const target = this.users.find(u => u.id === userId && u.active);
    if(!target){ this.toast('User not found'); return; }
    if(target.level === 'admin'){
      this.toast("Can't impersonate another admin");
      return;
    }
    if(target.id === actor.id){
      this.toast("That's you");
      return;
    }
    // Save original (only if not already impersonating — we don't overwrite it)
    if(!this.originalUser){
      this.originalUser = this.currentUser;
      sessionStorage.setItem('cos_original', JSON.stringify(this.originalUser));
    }
    this.currentUser = target;
    sessionStorage.setItem('cos_session', JSON.stringify(target));
    // Full page reload so all access-gated UI re-renders cleanly
    window.location.reload();
  },

  exitImpersonation(){
    if(!this.originalUser) return;
    this.currentUser = this.originalUser;
    sessionStorage.setItem('cos_session', JSON.stringify(this.originalUser));
    sessionStorage.removeItem('cos_original');
    this.originalUser = null;
    window.location.reload();
  },

  _renderImpersonationBanner(){
    // Remove any existing banner
    const existing = document.getElementById('imp-banner');
    if(existing) existing.remove();
    document.body.classList.remove('has-imp-banner');

    if(!this.originalUser) return;  // not impersonating — no banner

    // Inject banner at top of body
    const bar = document.createElement('div');
    bar.id = 'imp-banner';
    bar.innerHTML = `
      <span class="imp-dot">●</span>
      <span class="imp-msg">
        Viewing as <strong>${this.currentUser.name}</strong>
        <span class="imp-sub">· You are logged in as ${this.originalUser.name}</span>
      </span>
      <button class="imp-btn" onclick="COS.exitImpersonation()">← Exit view</button>
      <button class="imp-btn imp-btn-ghost" onclick="COS.signOut()">Log out</button>
    `;
    document.body.insertBefore(bar, document.body.firstChild);
    document.body.classList.add('has-imp-banner');
  },

  signOut(){
    sessionStorage.removeItem('cos_session');
    sessionStorage.removeItem('cos_original');
    this.currentUser = null;
    this.originalUser = null;
    window.location.href = 'index.html';
  },

  // ── NAVIGATION ────────────────────────────────────────────────────────────
  navTo(page, el){
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    // Only remove active from onclick nav items — not from <a href> module links
    document.querySelectorAll('.nav-item[onclick], .mob-nav-btn').forEach(n=>n.classList.remove('active'));
    const pg = document.getElementById('pg-'+page);
    if(pg) pg.classList.add('active');
    if(el) el.classList.add('active');
    // Sync sidebar — only onclick items
    document.querySelectorAll('.nav-item[onclick]').forEach(n=>{
      if((n.getAttribute('onclick')||'').includes("'"+page+"'")) n.classList.add('active');
    });
    // Update topbar section label
    const lbl = document.getElementById('tb-section');
    if(lbl && el) lbl.textContent = el.textContent?.trim()||'';
  },

  // ── UTILS ─────────────────────────────────────────────────────────────────
  _initials(name){
    return name.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase();
  },

  toast(msg){
    const t = document.getElementById('toast');
    if(!t) return;
    t.textContent=msg;
    t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'),2500);
  },

  openModal(id){ const m=document.getElementById(id); if(m) m.classList.add('open'); },
  closeModal(id){ const m=document.getElementById(id); if(m) m.classList.remove('open'); },

  fmt(n){ return'£'+Math.abs(n).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2}); },
  fmtDate(d){ return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); },
  fmtDateShort(d){ return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short'}); },

  // ── SLIDE VIEWER ──────────────────────────────────────────────────────────
  _svBriefs: [],
  _svCurrent: 0,
  _svSlide: 0,

  openSlides(briefs, id){
    this._svBriefs = Array.isArray(briefs) ? briefs : [briefs];
    this._svCurrent = id !== undefined ? id : 0;
    this._svSlide = 0;
    this._renderSlide();
    document.getElementById('slide-viewer').classList.add('open');
  },

  closeSlides(){
    document.getElementById('slide-viewer').classList.remove('open');
  },

  svNext(){
    const brief = this._svBriefs[this._svCurrent];
    if(!brief) return;
    if(this._svSlide >= brief.slides.length-1){ this.closeSlides(); return; }
    this._svSlide++;
    this._renderSlide();
  },

  svPrev(e){
    if(e) e.stopPropagation();
    if(this._svSlide<=0) return;
    this._svSlide--;
    this._renderSlide();
  },

  _renderSlide(){
    const brief = this._svBriefs[this._svCurrent];
    if(!brief) return;
    const slide = brief.slides[this._svSlide];
    const total = brief.slides.length;
    document.getElementById('sv-title').textContent = brief.title||'';
    document.getElementById('sv-counter').textContent = `${this._svSlide+1} / ${total}`;
    // Dots
    document.getElementById('sv-dots').innerHTML = brief.slides.map((_,i)=>
      `<div class="sv-dot${i===this._svSlide?' on':''}" style="width:${i===this._svSlide?20:4}px;"></div>`
    ).join('');
    // Buttons
    document.querySelector('.sv-prev').style.opacity = this._svSlide===0?'0.3':'1';
    document.querySelector('.sv-next').textContent = this._svSlide===total-1?'Done ✓':'Next →';
    // Content
    let html='';
    if(slide.type==='say'){
      html=`<div class="sv-say"><div class="sv-say-label">${slide.label||'Say this'}</div><div class="sv-say-text">"${slide.content}"</div></div>`;
    } else {
      if(slide.content) html+=`<div class="sv-slide-heading">${slide.content.replace(/\n/g,'<br>')}</div>`;
      if(slide.bullets?.length) html+=`<ul class="sv-slide-bullets">${slide.bullets.map(b=>`<li>${b}</li>`).join('')}</ul>`;
    }
    if(slide.note) html+=`<div class="sv-note">${slide.note}</div>`;
    document.getElementById('sv-slide-content').innerHTML=html;
  },

};

// Keyboard support for PIN
document.addEventListener('keydown', e=>{
  const pinActive = document.getElementById('step-pin')?.classList.contains('active');
  if(pinActive){
    if(e.key>='0'&&e.key<='9') COS.pk(e.key);
    if(e.key==='Backspace') COS.pdel();
  }
  // Slide viewer
  const svOpen = document.getElementById('slide-viewer')?.classList.contains('open');
  if(svOpen){
    if(e.key==='ArrowRight'||e.key===' ') COS.svNext();
    if(e.key==='ArrowLeft') COS.svPrev();
    if(e.key==='Escape') COS.closeSlides();
  }
});
