/* global React */
function CTASection() {
  return (
    <section id="cta" style={{
      padding: '180px 32px',
      position: 'relative',
      overflow: 'hidden',
      borderTop: '1px solid rgba(244,239,230,0.06)',
      textAlign: 'center',
    }}>
      <img src="../../assets/bg-worship.svg" alt=""
           style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: 'cover', zIndex: -1, opacity: 0.85 }}/>

      <div style={{
        fontFamily: "'Instrument Serif'", fontStyle: 'italic',
        fontSize: 22, color: '#D0441C',
        marginBottom: 32, letterSpacing: '0.04em',
      }}>"Enter His gates with thanksgiving"</div>

      <h2 style={{
        fontFamily: "'Anton', Impact, sans-serif",
        fontSize: 'clamp(56px, 8vw, 128px)', lineHeight: 0.95,
        letterSpacing: '-0.03em', color: '#F4EFE6', textTransform: 'uppercase',
        margin: 0, maxWidth: 1200, marginInline: 'auto',
      }}>Ready to Build Something Extraordinary?</h2>

      <p style={{
        fontFamily: "'Inter Tight'", fontSize: 20, lineHeight: 1.55,
        color: '#C9C3B6', maxWidth: 640, marginInline: 'auto',
        marginTop: 28, marginBottom: 56,
      }}>
        This anniversary sets the standard for everything that follows.
        Excellence is not optional&mdash;it&rsquo;s our calling.
      </p>

      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        <a className="cv-btn cv-btn-primary" href="#">Begin Planning Now</a>
        <a className="cv-btn cv-btn-ghost" href="#">Read the Vision Brief</a>
      </div>
    </section>
  );
}

window.CTASection = CTASection;
