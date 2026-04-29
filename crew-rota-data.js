// ── CREW ROTA — SHARED DATA ────────────────────────────────────────────────
//
// Single source of truth for the Crew rota. Loaded by:
//   - calvary-os/crew.html (internal Calvary OS view, with auth)
//   - crew-rota.html       (public shareable page, no auth)
//
// To update the rota:
//   - Edit individual entries below
//   - Add new Sundays at the BOTTOM (chronological order)
//   - When a Sunday passes, leave it in for one week then remove
//
// Status values: 'pending' | 'confirmed'
// ───────────────────────────────────────────────────────────────────────────

const CREW_ROTA = [
  {
    date: 'Sunday 3rd May 2026',
    lead: 'Brother Ernest',
    team: ['Brother Stephen', 'Sister Petty'],
    status: 'pending',
    note: 'Brother Stephen\'s arrival time and Sister Petty\'s arrival (depends on Noah\'s media call time) being confirmed by Brother Ernest this Sunday.',
  },
  {
    date: 'Sunday 10th May 2026',
    lead: 'Brother Ernest',
    team: ['Brother Stephen', 'Sister Lisa'],
    status: 'pending',
    note: 'Sister Lisa\'s availability and transport being confirmed by Brother Ernest.',
  },
  {
    date: 'Sunday 17th May 2026',
    lead: 'Brother Ernest',
    team: ['Brother Stephen', 'Sister Petty'],
    status: 'pending',
    note: '',
  },
  {
    date: 'Sunday 24th May 2026',
    lead: 'Brother Ernest',
    team: ['Brother Stephen', 'Sister Lisa'],
    status: 'pending',
    note: '',
  },
];

// Standard — the rota's operating principles. Used on both the internal and
// public pages so the rules don't drift.
const CREW_ROTA_STANDARD = [
  '3 people on Crew most weeks: Brother Ernest + Brother Stephen permanently, with Sister Petty and Sister Lisa alternating',
  'Minimum 2 people if someone is off — the alternating pattern means there\'s always cover',
  'Brother Ernest leads every week — accountable for everything happening on time',
  'Crew arrive early enough to set up before Band needs the stage (exact time to be confirmed)',
  'If you can\'t make your Sunday, message Brother Ernest as early as possible so a swap can be arranged',
];
