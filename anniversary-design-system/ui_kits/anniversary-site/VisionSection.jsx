/* global React, lucide */
const { useEffect, useRef } = React;

function PillarCard({ icon, title, body }) {
  const ref = useRef(null);
  useEffect(() => { if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': '1.5' } }); }, []);
  return (
    <article style={{
      background: '#1C1C22', padding: '40px 36px',
      borderRadius: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
      display: 'flex', flexDirection: 'column', gap: 18,
      transition: 'transform 320ms cubic-bezier(0.22,1,0.36,1), background 320ms',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = '#22222A'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = '#1C1C22'; e.currentTarget.style.transform = 'none'; }}>
      <div ref={ref} style={{ color: '#D0441C' }}>
        <i data-lucide={icon} width="32" height="32"></i>
      </div>
      <span style={{ width: 24, height: 1, background: '#D0441C' }}/>
      <h3 style={{
        fontFamily: "'Instrument Serif'", fontStyle: 'italic',
        fontSize: 28, lineHeight: 1.2, color: '#F4EFE6', margin: 0, fontWeight: 400,
      }}>{title}</h3>
      <p style={{
        fontFamily: "'Inter Tight'", fontSize: 15, lineHeight: 1.6,
        color: '#C9C3B6', margin: 0,
      }}>{body}</p>
    </article>
  );
}

function VisionSection() {
  return (
    <section id="vision" style={{ padding: '160px 64px', position: 'relative' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{
          fontFamily: "'Inter Tight'", fontSize: 12, color: '#D0441C',
          textTransform: 'uppercase', letterSpacing: '0.24em', fontWeight: 600,
          marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <span style={{ width: 32, height: 1, background: '#D0441C' }}/> Our Vision
        </div>

        <h2 style={{
          fontFamily: "'Anton', Impact, sans-serif",
          fontSize: 'clamp(48px, 6.5vw, 96px)',
          lineHeight: 1, letterSpacing: '-0.03em',
          color: '#F4EFE6', textTransform: 'uppercase',
          margin: 0, maxWidth: 980,
        }}>More Than Celebration</h2>

        <p style={{
          fontFamily: "'Inter Tight'", fontSize: 20, lineHeight: 1.55,
          color: '#C9C3B6', maxWidth: 720, marginTop: 32, marginBottom: 80,
        }}>
          This is declaration. We acknowledge what God has done through Calvary
          and position for what He's building. Excellence in every detail because
          this honors Him.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 20,
        }}>
          <PillarCard icon="mic-vocal"
            title="Powerful Proclamation"
            body={'"Reasons to be Thankful" delivered with authority by Pastor Gbenga Adebanjo. Biblical foundation for confident thanksgiving.'}/>
          <PillarCard icon="music"
            title="Worship Excellence"
            body="Enhanced band with special guest vocalist. Building on worship team progress with elevated artistry and anointing."/>
          <PillarCard icon="sparkles"
            title="Visual Impact"
            body={'Professional "THANKFUL" banners designed for lasting impact. Premium staging that reflects our commitment to excellence.'}/>
          <PillarCard icon="users-round"
            title="Ministry Showcase"
            body="Department presentations highlighting God's work through every area. Demonstrating kingdom impact across all ministries."/>
        </div>
      </div>
    </section>
  );
}

window.VisionSection = VisionSection;
