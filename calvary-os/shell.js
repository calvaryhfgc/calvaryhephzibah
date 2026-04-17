// ── CALVARY OS SHARED SHELL ───────────────────────────────────────────────────
// Included by every page. Handles: auth check, nav rendering, user context.

function hashPin(p){let h=5381;for(let i=0;i<p.length;i++)h=((h<<5)+h)^p.charCodeAt(i);return'cos_'+(h>>>0).toString(36);}

const COS_SECTIONS = [
  { id:'sunday',      label:'Sunday Service', icon:'☀️' },
  { id:'worship',     label:'Worship',        icon:'🎵' },
  { id:'media',       label:'Media',          icon:'🎥' },
  { id:'midweek',     label:'Mid-week',       icon:'📅' },
  { id:'departments', label:'Departments',    icon:'🏛️' },
];

// Get current user from session
function getUser(){
  const sess = sessionStorage.getItem('calvary_os_user');
  if(!sess) return null;
  try{ return JSON.parse(sess); }catch(e){ return null; }
}

// Redirect to login if not authenticated
function requireAuth(){
  const u = getUser();
  if(!u){ window.location.href='index.html'; return null; }
  return u;
}

// Check if user has access to a section
function canAccess(user, sectionId){
  if(user.level === 'admin') return true;
  return (user.sections||[]).includes(sectionId);
}

// Sign out
function signOut(){
  sessionStorage.removeItem('calvary_os_user');
  window.location.href = 'index.html';
}

// Render the top nav bar
function renderNav(currentSection){
  const user = getUser();
  if(!user) return;

  const nav = document.getElementById('cos-nav');
  if(!nav) return;

  const accessible = COS_SECTIONS.filter(s => canAccess(user, s.id));
  const initials = user.name.split(' ').map(n=>n[0]).slice(0,2).join('');

  nav.innerHTML = `
    <div class="nav-inner">
      <a href="sunday.html" class="nav-logo">
        <div class="nav-logo-icon">
          <svg viewBox="0 0 16 16" fill="none"><rect x="6.5" y="1" width="3" height="14" rx="0.5" fill="white"/><rect x="1" y="5.5" width="14" height="3" rx="0.5" fill="white"/></svg>
        </div>
        <span class="nav-logo-text">Calvary OS</span>
      </a>
      <div class="nav-links">
        ${accessible.map(s=>`
          <a href="${s.id}.html" class="nav-link ${s.id===currentSection?'active':''}">
            ${s.label}
          </a>`).join('')}
      </div>
      <div class="nav-user" onclick="toggleUserMenu()">
        <div class="nav-av">${initials}</div>
        <div class="nav-user-menu" id="user-menu" style="display:none;">
          <div class="num-name">${user.name}</div>
          <div class="num-role">${user.role||''}</div>
          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:8px 0;">
          ${user.level==='admin'?'<a href="admin.html" class="num-link">Admin panel</a>':''}
          <button onclick="signOut()" class="num-signout">Sign out</button>
        </div>
      </div>
      <button class="nav-hamburger" id="nav-hamburger" onclick="toggleMobileNav()">
        <span></span><span></span><span></span>
      </button>
    </div>
    <div class="nav-mobile" id="nav-mobile" style="display:none;">
      ${accessible.map(s=>`<a href="${s.id}.html" class="nav-mobile-link ${s.id===currentSection?'active':''}">${s.icon} ${s.label}</a>`).join('')}
      <button onclick="signOut()" style="background:none;border:none;color:rgba(255,255,255,0.4);font-size:13px;padding:12px 20px;text-align:left;width:100%;cursor:pointer;font-family:inherit;">Sign out</button>
    </div>
  `;
}

function toggleUserMenu(){
  const m = document.getElementById('user-menu');
  if(m) m.style.display = m.style.display==='none' ? 'block' : 'none';
}

function toggleMobileNav(){
  const m = document.getElementById('nav-mobile');
  if(m) m.style.display = m.style.display==='none' ? 'flex' : 'none';
}

// Close menus on outside click
document.addEventListener('click', e=>{
  const m = document.getElementById('user-menu');
  const nav = document.querySelector('.nav-user');
  if(m && nav && !nav.contains(e.target)) m.style.display='none';
});

// Toast utility
function showToast(msg, type='default'){
  let t = document.getElementById('cos-toast');
  if(!t){ t=document.createElement('div'); t.id='cos-toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = 'cos-toast show' + (type==='error'?' error':'');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>t.classList.remove('show'), 2500);
}
