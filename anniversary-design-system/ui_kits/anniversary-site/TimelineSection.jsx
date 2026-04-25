/* global React */
const TIMELINE = [
  { dow: 'Sun', num: '26', tag: 'Critical', tagKind: 'ember',
    title: 'Ministry Confirmation Deadline',
    body: 'All department leaders confirm special presentations. No extensions. Final answers required this Sunday.' },
  { dow: 'Wed', num: '29', tag: 'Talent', tagKind: 'gold',
    title: 'Guest Vocalist Secured',
    body: 'Contact and confirm singer from Pastor Shade\u2019s birthday. Song selection and integration planned.' },
  { dow: 'Fri', num: '01', tag: 'Production', tagKind: 'gold',
    title: 'Visual Production Complete',
    body: 'Professional THANKFUL banners designed, produced, and tested. Premium quality for lasting impact.' },
  { dow: 'Sun', num: '04', tag: 'Rehearsal', tagKind: 'gold',
    title: 'Final Rehearsal',
    body: 'Full production rehearsal. Enhanced band, guest vocalist, all elements synchronized to perfection.' },
  { dow: 'Wed', num: '07', tag: 'Lock', tagKind: 'gold',
    title: 'Presentation Lock',
    body: 'All ministry presentations polished. Tech requirements confirmed. Seamless flow guaranteed.' },
  { dow: 'Sun', num: '11', tag: 'Day Of', tagKind: 'ember',
    title: 'ANNIVERSARY CELEBRATION',
    body: 'Excellence executed. Vision realized. God glorified through every detail of this milestone celebration.',
    isFinal: true },
];

function TimelineRow({ item }) {
  const tagColor = item.tagKind === 'ember' ? '#E55A30' : '#D0441C';
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '120px 1fr',
      gap: 48, padding: '40px 0',
      borderBottom: '1px solid rgba(244,239,230,0.06)',
      alignItems: 'flex-start',
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', width: 96, height: 96, borderRadius: 999,
        border: `1px solid ${item.isFinal ? '#E55A30' : '#D0441C'}`,
        color: item.isFinal ? '#E55A30' : '#D0441C',
      }}>
        <span style={{
          fontFamily: "'Inter Tight'", fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '0.24em', fontWeight: 600,
          opacity: 0.85,
        }}>{item.dow}</span>
        <span style={{
          fontFamily: "'Anton', Impact, sans-serif", fontSize: 36,
          lineHeight: 1, letterSpacing: '-0.02em', marginTop: 4,
        }}>{item.num}</span>
      </div>
      <div>
        <span style={{
          display: 'inline-block', padding: '5px 11px',
          fontFamily: "'Inter Tight'", fontSize: 10,
          textTransform: 'uppercase', letterSpacing: '0.24em', fontWeight: 600,
          border: `1px solid ${tagColor}`, color: tagColor,
          borderRadius: 999, marginBottom: 14,
        }}>{item.tag}</span>
        <h3 style={{
          fontFamily: item.isFinal ? "'Anton', Impact, sans-serif" : "'Instrument Serif'",
          fontStyle: item.isFinal ? 'normal' : 'italic',
          fontSize: item.isFinal ? 44 : 28,
          lineHeight: 1.1, color: '#F4EFE6', margin: 0, fontWeight: 400,
          textTransform: item.isFinal ? 'uppercase' : 'none',
          letterSpacing: item.isFinal ? '-0.02em' : 0,
        }}>{item.title}</h3>
        <p style={{
          fontFamily: "'Inter Tight'", fontSize: 16, lineHeight: 1.6,
          color: '#C9C3B6', marginTop: 14, marginBottom: 0, maxWidth: 720,
        }}>{item.body}</p>
      </div>
    </div>
  );
}

function TimelineSection() {
  return (
    <section id="timeline" style={{
      padding: '160px 64px', position: 'relative',
      borderTop: '1px solid rgba(244,239,230,0.06)',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          fontFamily: "'Inter Tight'", fontSize: 12, color: '#D0441C',
          textTransform: 'uppercase', letterSpacing: '0.24em', fontWeight: 600,
          marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <span style={{ width: 32, height: 1, background: '#D0441C' }}/> Critical Path
        </div>

        <h2 style={{
          fontFamily: "'Anton', Impact, sans-serif",
          fontSize: 'clamp(48px, 6vw, 88px)', lineHeight: 1,
          letterSpacing: '-0.03em', color: '#F4EFE6', textTransform: 'uppercase',
          margin: 0, maxWidth: 900,
        }}>Countdown to Excellence</h2>

        <p style={{
          fontFamily: "'Inter Tight'", fontSize: 18, lineHeight: 1.55,
          color: '#C9C3B6', maxWidth: 680, marginTop: 24, marginBottom: 64,
        }}>
          Every detail planned, every deadline strategic. This timeline ensures
          flawless execution worthy of the celebration.
        </p>

        <div>
          {TIMELINE.map((item, i) => <TimelineRow key={i} item={item}/>)}
        </div>
      </div>
    </section>
  );
}

window.TimelineSection = TimelineSection;
