/* global React */
const { useState, useEffect } = React;

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 64px',
      background: scrolled ? 'rgba(11,11,14,0.72)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(244,239,230,0.06)' : '1px solid transparent',
      transition: 'all 320ms cubic-bezier(0.22,1,0.36,1)',
    }}>
      <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
        <img src="../../assets/logo-eagle.png" width="40" height="40" alt="" style={{ display: 'block', objectFit: 'contain' }}/>
        <span style={{
          fontFamily: "'Anton', Impact, sans-serif",
          fontSize: 18, letterSpacing: '0.04em',
          color: '#F4EFE6', textTransform: 'uppercase'
        }}>Calvary</span>
      </a>
      <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
        {['Vision', 'Timeline', 'Ministries', 'Watch Live'].map(item => (
          <a key={item} href={`#${item.toLowerCase().replace(' ','-')}`}
             style={{
               fontFamily: "'Inter Tight', sans-serif", fontSize: 12,
               color: '#C9C3B6', textTransform: 'uppercase',
               letterSpacing: '0.18em', fontWeight: 600, textDecoration: 'none',
               transition: 'color 160ms'
             }}
             onMouseEnter={e => e.currentTarget.style.color = '#D0441C'}
             onMouseLeave={e => e.currentTarget.style.color = '#C9C3B6'}>
            {item}
          </a>
        ))}
        <a className="cv-btn cv-btn-primary" href="#cta" style={{ padding: '12px 20px', fontSize: 12 }}>
          Begin Planning
        </a>
      </div>
    </nav>
  );
}

window.Nav = Nav;
