// ── CALVARY OS — SHARED SHELL ──────────────────────────────────────────────

const COS = {

  // ── USERS ─────────────────────────────────────────────────────────────────
  users: [
    { id:1,  name:'Bolaji Olatoye',        role:'Chief of Staff',       level:'admin', pin:'bp_1kfu29s', sections:['sunday','worship','media','midweek','departments','admin'], active:true },
    { id:2,  name:'Pastor Shade Olatoye',  role:'General Overseer',     level:'admin', pin:'ps_a8vx3m2', sections:['sunday','worship','media','midweek','departments','admin'], active:true },
    { id:3,  name:'Scott Shokoya',         role:'Media Lead',           level:'lead',  pin:'ss_7kp4q1n', sections:['sunday','media'], active:true },
    { id:4,  name:'Caster Martins',        role:'Worship Leader',       level:'lead',  pin:'cm_3jw9s6t', sections:['sunday','worship'], active:true },
    { id:5,  name:'Morayo Ogungbenro',     role:'Worship — Guitar',     level:'team',  pin:'mo_6rb2x8y', sections:['sunday','worship'], active:true },
    { id:6,  name:'Laolu Ogungbenro',      role:'Worship — Drums',      level:'team',  pin:'lo_4nf7c3v', sections:['sunday','worship'], active:true },
    { id:7,  name:'Tosin Akindele',        role:'Session / Training',   level:'team',  pin:'ta_9wm5h1z', sections:['sunday','worship'], active:true },
    { id:8,  name:'Bolaji Adebanjo',       role:'Drums / MD Candidate', level:'team',  pin:'ba_2qs8d6k', sections:['sunday','worship'], active:true },
    { id:9,  name:'Auntie Pauline Tulloch',role:'Operations',           level:'lead',  pin:'pt_5xe1n4r', sections:['sunday','departments'], active:true },
    { id:10, name:'Pastor Gbenga Adebanjo',role:'Leadership',           level:'lead',  pin:'ga_8yt3m7p', sections:['sunday','departments','midweek'], active:true },
    { id:11, name:'Pastor Kayode Ogungbenro',role:'Leadership / Finance',level:'lead', pin:'ko_1bv6w9j', sections:['sunday','departments'], active:true },
    { id:12, name:'Sister Petty',          role:'Operations',           level:'team',  pin:'sp_7dn2k5q', sections:['sunday','departments'], active:true },
    { id:13, name:'Chinedu',               role:'Media Recruit',        level:'team',  pin:'ch_4gx8p3m', sections:['sunday','media'], active:true },
    { id:14, name:'Terrel',                role:'Media Recruit',        level:'team',  pin:'te_6hc1r7s', sections:['sunday','media'], active:true },
    { id:15, name:'Tavoy',                 role:'Media Recruit',        level:'team',  pin:'tv_3wf5n9b', sections:['sunday','media'], active:true },
    { id:16, name:'Noah',                  role:'Media Recruit',        level:'team',  pin:'no_9kz4v2x', sections:['sunday','media'], active:true },
  ],

  // ── AUTH ──────────────────────────────────────────────────────────────────
  currentUser: null,
  _pinEntry: '',
  _pinTarget: null,

  hashPin(p){ let h=5381; for(let i=0;i<p.length;i++) h=((h<<5)+h)^p.charCodeAt(i); return'bp_'+(h>>>0).toString(36); },

  init(requiredSection){
    // Restore session
    try {
      const s = sessionStorage.getItem('cos_session');
      if(s){ this.currentUser = JSON.parse(s); }
    } catch(e){}

    if(this.currentUser){
      if(requiredSection && !this.hasAccess(requiredSection)){
        window.location.href = 'index.html';
        return;
      }
      this._launchApp();
      return;
    }
    this._renderUsers();
    this._showAuthStep('step-who');
  },

  hasAccess(section){
    if(!this.currentUser) return false;
    if(this.currentUser.level === 'admin') return true;
    return (this.currentUser.sections||[]).includes(section);
  },

  _renderUsers(){
    const list = document.getElementById('user-grid');
    if(!list) return;
    const active = this.users.filter(u=>u.active);
    list.innerHTML = active.map(u=>`
      <button class="u-btn" onclick="COS._selectUser(${u.id})">
        <div class="u-av">${this._initials(u.name)}</div>
        <div>
          <div class="u-name">${u.name}</div>
          <div class="u-role">${u.role}</div>
        </div>
        <span class="u-badge ${u.level==='admin'?'ub-admin':u.level==='lead'?'ub-lead':'ub-team'}">${u.level}</span>
      </button>`).join('');
  },

  _selectUser(id){
    this._pinTarget = this.users.find(u=>u.id===id);
    if(!this._pinTarget) return;
    this._pinEntry = '';
    this._updateDots();
    const sub = document.getElementById('pin-user-name');
    if(sub) sub.textContent = `Hello ${this._pinTarget.name.split(' ')[0]} — enter your PIN`;
    document.getElementById('pin-msg').textContent='';
    this._showAuthStep('step-pin');
  },

  _goBack(){
    this._pinTarget = null;
    this._pinEntry = '';
    this._updateDots();
    this._showAuthStep('step-who');
  },

  pk(d){
    if(this._pinEntry.length>=4) return;
    this._pinEntry+=d;
    this._updateDots();
    if(this._pinEntry.length===4) setTimeout(()=>this._checkPin(),150);
  },

  pdel(){
    this._pinEntry=this._pinEntry.slice(0,-1);
    this._updateDots();
    document.getElementById('pin-msg').textContent='';
  },

  _updateDots(){
    for(let i=0;i<4;i++){
      const d = document.getElementById('pd'+i);
      if(d) d.classList.toggle('on', i<this._pinEntry.length);
    }
  },

  _checkPin(){
    if(!this._pinTarget) return;
    if(this.hashPin(this._pinEntry) !== this._pinTarget.pin){
      document.getElementById('pin-msg').textContent='Incorrect PIN — try again';
      this._pinEntry='';
      this._updateDots();
      return;
    }
    this.currentUser = this._pinTarget;
    sessionStorage.setItem('cos_session', JSON.stringify(this.currentUser));
    this._launchApp();
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

  signOut(){
    sessionStorage.removeItem('cos_session');
    this.currentUser = null;
    window.location.href = 'index.html';
  },

  _showAuthStep(id){
    document.querySelectorAll('.auth-step').forEach(s=>s.classList.remove('active'));
    const el = document.getElementById(id);
    if(el) el.classList.add('active');
  },

  // ── NAVIGATION ────────────────────────────────────────────────────────────
  navTo(page, el){
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.nav-item, .mob-nav-btn').forEach(n=>n.classList.remove('active'));
    const pg = document.getElementById('pg-'+page);
    if(pg) pg.classList.add('active');
    if(el) el.classList.add('active');
    // Sync sidebar
    document.querySelectorAll('.nav-item').forEach(n=>{
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
