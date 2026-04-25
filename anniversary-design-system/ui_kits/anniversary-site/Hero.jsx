/* global React */
const { useState, useEffect } = React;

function useCountdown(targetISO) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, new Date(targetISO).getTime() - now.getTime());
  const days = Math.floor(diff / 86400000);
  const hrs  = Math.floor(diff / 3600000) % 24;
  const mins = Math.floor(diff / 60000) % 60;
  const secs = Math.floor(diff / 1000) % 60;
  return { days, hrs, mins, secs };
}

function HeroCountdownChip({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{
        fontFamily: "'Anton', Impact, sans-serif",
        fontSize: 56, lineHeight: 1, color: '#F4EFE6',
        letterSpacing: '-0.02em',
        fontVariantNumeric: 'tabular-nums',
      }}>{String(value).padStart(2, '0')}</div>
      <div style={{
        fontFamily: "'Inter Tight'", fontSize: 10, color: '#D0441C',
        textTransform: 'uppercase', letterSpacing: '0.24em', fontWeight: 600,
      }}>{label}</div>
    </div>
  );
}

function Hero() {
  const { days, hrs, mins, secs } = useCountdown('2026-05-17T10:30:00');

  return (
    <section id="top" style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '120px 32px 80px',
      overflow: 'hidden',
      isolation: 'isolate',
    }}>
      <img src="../../assets/bg-stage.svg" alt=""
           style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: 'cover', zIndex: -1 }}/>

      <img src="../../assets/logo-eagle.png" alt="Calvary"
           style={{ width: 96, height: 96, objectFit: 'contain', marginBottom: 24,
                    filter: 'drop-shadow(0 8px 24px rgba(208,68,28,0.35))' }}/>

      <div style={{
        fontFamily: "'Inter Tight'", fontSize: 12, color: '#D0441C',
        textTransform: 'uppercase', letterSpacing: '0.24em', fontWeight: 600,
        marginBottom: 32,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <span style={{ width: 32, height: 1, background: '#D0441C' }}/>
        Calvary Anniversary 2026
        <span style={{ width: 32, height: 1, background: '#D0441C' }}/>
      </div>

      <h1 style={{
        fontFamily: "'Anton', Impact, sans-serif",
        fontSize: 'clamp(96px, 22vw, 360px)',
        lineHeight: 0.85, letterSpacing: '-0.04em',
        color: '#F4EFE6', textTransform: 'uppercase',
        margin: 0, textAlign: 'center',
      }}>THANKFUL</h1>

      <div style={{
        fontFamily: "'Instrument Serif'", fontStyle: 'italic',
        fontSize: 'clamp(20px, 2.4vw, 32px)', color: '#D0441C',
        marginTop: 24, marginBottom: 12, letterSpacing: '0.02em',
      }}>Reasons to be Thankful</div>

      <div style={{
        fontFamily: "'Inter Tight'", fontSize: 14, color: '#C9C3B6',
        textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 500,
        marginBottom: 56,
      }}>May 17, 2026 · 10:30 AM</div>

      <div style={{ display: 'flex', gap: 56, marginBottom: 80 }}>
        <HeroCountdownChip label="Days" value={days}/>
        <HeroCountdownChip label="Hours" value={hrs}/>
        <HeroCountdownChip label="Minutes" value={mins}/>
        <HeroCountdownChip label="Seconds" value={secs}/>
      </div>

      <div style={{
        position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        fontFamily: "'Inter Tight'", fontSize: 11, color: '#A29C90',
        textTransform: 'uppercase', letterSpacing: '0.24em', fontWeight: 600,
      }}>
        Scroll to explore
        <span style={{
          width: 1, height: 48,
          background: 'linear-gradient(to bottom, #D0441C, transparent)',
          animation: 'pulse 2.4s ease-in-out infinite'
        }}/>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}`}</style>
    </section>
  );
}

window.Hero = Hero;
