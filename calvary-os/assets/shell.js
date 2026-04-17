// Calvary OS — shared shell
// Included by every module page

const COS = {

  SECTIONS: [
    { id:'sunday',      label:'Sunday Service', icon:'☀️' },
    { id:'worship',     label:'Worship',        icon:'🎵' },
    { id:'media',       label:'Media',          icon:'🎥' },
    { id:'midweek',     label:'Mid-week',       icon:'📅' },
    { id:'departments', label:'Departments',    icon:'🏛️' },
  ],

  // Get current user from session
  getUser(){
    const sess = localStorage.getItem('cos_session');
    if(!sess) return null;
    try{ return JSON.parse(sess); } catch(e){ return null; }
  },

  // Get URL params
  getParams(){
    const p = new URLSearchParams(window.location.search);
    return {
      uid: p.get('uid'),
      name: p.get('name'),
      level: p.get('level'),
      sections: (p.get('sections')||'').split(',').filter(Boolean),
    };
  },

  // Check access — redirect to login if not authorised
  requireAccess(sectionId){
    const user = this.getUser();
    if(!user){ window.location.href = 'index.html'; return null; }
    const params = this.getParams();
    const sections = params.sections.length ? params.sections : (user.sections||[]);
    if(user.level !== 'full' && !sections.includes(sectionId)){
      window.location.href = 'index.html';
      return null;
    }
    return { ...user, sections };
  },

  // Render the top nav bar
  renderNav(activeSectionId){
    const user = this.getUser();
    if(!user) return;
    const sections = user.level === 'full' ? this.SECTIONS : this.SECTIONS.filter(s => (user.sections||[]).includes(s.id));
    const params = new URLSearchParams({
      uid: user.id,
      name: user.name,
      level: user.level,
      sections: (user.sections||[]).join(',')
    });

    const nav = document.getElementById('cos-nav');
    if(!nav) return;

    nav.innerHTML = `
      <div class="cos-nav-inner">
        <a href="sunday.html?${params}" class="cos-brand">
          <div class="cos-brand-icon">
            <svg viewBox="0 0 16 16" fill="none"><rect x="6.5" y="1" width="3" height="14" rx="0.5" fill="white"/><rect x="1" y="5.5" width="14" height="3" rx="0.5" fill="white"/></svg>
          </div>
          <span>Calvary OS</span>
        </a>
        <div class="cos-nav-links">
          ${sections.map(s=>`
            <a href="${s.id}.html?${params}" class="cos-nav-link${s.id===activeSectionId?' active':''}">
              ${s.icon} ${s.label}
            </a>`).join('')}
        </div>
        <div class="cos-nav-right">
          <div class="cos-user-chip">
            <div class="cos-user-av">${this.initials(user.name)}</div>
            <span class="cos-user-name">${user.name.split(' ')[0]}</span>
          </div>
          <button class="cos-signout" onclick="COS.signOut()">Sign out</button>
        </div>
      </div>
    `;

    // Mobile bottom nav
    const mob = document.getElementById('cos-mob-nav');
    if(mob){
      mob.innerHTML = sections.map(s=>`
        <a href="${s.id}.html?${params}" class="cos-mob-item${s.id===activeSectionId?' active':''}">
          <span style="font-size:18px;">${s.icon}</span>
          <span>${s.label.split(' ')[0]}</span>
        </a>`).join('');
    }
  },

  signOut(){
    localStorage.removeItem('cos_session');
    window.location.href = 'index.html';
  },

  initials(name){
    return name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
  },

  // Shared toast
  toast(msg, type='default'){
    let t = document.getElementById('cos-toast');
    if(!t){ t=document.createElement('div'); t.id='cos-toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.className = 'cos-toast show' + (type==='error'?' error':'');
    clearTimeout(t._timer);
    t._timer = setTimeout(()=>t.classList.remove('show'), 2500);
  }
};
