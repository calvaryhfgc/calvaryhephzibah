/* global React */
function Footer() {
  return (
    <footer style={{
      padding: '80px 64px 56px',
      borderTop: '1px solid rgba(244,239,230,0.06)',
      background: '#0B0B0E',
    }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid',
                    gridTemplateColumns: '1fr 2fr', gap: 64, alignItems: 'flex-start' }}>
        <img src="../../assets/logo-wordmark-dark.svg" alt="Calvary Anniversary" width="280"/>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {[
            { h: 'Anniversary', items: ['Vision', 'Timeline', 'Ministries', 'Watch Live'] },
            { h: 'Calvary', items: ['About', 'Sundays', 'Locations', 'Give'] },
            { h: 'Connect', items: ['Newsletter', 'Instagram', 'YouTube', 'Contact'] },
          ].map(col => (
            <div key={col.h}>
              <div style={{
                fontFamily: "'Inter Tight'", fontSize: 11, color: '#D0441C',
                textTransform: 'uppercase', letterSpacing: '0.24em', fontWeight: 600,
                marginBottom: 16,
              }}>{col.h}</div>
              {col.items.map(it => (
                <a key={it} href="#" style={{
                  display: 'block',
                  fontFamily: "'Inter Tight'", fontSize: 14, color: '#C9C3B6',
                  textDecoration: 'none', padding: '6px 0',
                  transition: 'color 160ms',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#D0441C'}
                onMouseLeave={e => e.currentTarget.style.color = '#C9C3B6'}>{it}</a>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div style={{
        maxWidth: 1240, margin: '64px auto 0', paddingTop: 32,
        borderTop: '1px solid rgba(244,239,230,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: "'Inter Tight'", fontSize: 12, color: '#A29C90',
        letterSpacing: '0.04em',
      }}>
        <div>&copy; 2026 Calvary Hephzibah Faith Gospel Church</div>
        <div style={{
          fontFamily: "'Instrument Serif'", fontStyle: 'italic',
          color: '#D0441C', fontSize: 14,
        }}>Excellence honors Him.</div>
      </div>
    </footer>
  );
}

window.Footer = Footer;
