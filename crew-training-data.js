// ── CREW TRAINING PLAYBOOK — SHARED DATA ───────────────────────────────────
//
// This file is the single source of truth for Crew training videos.
// It's loaded by:
//   - calvary-os/crew.html (internal Calvary OS view, with auth)
//   - crew-training.html  (public shareable page, no auth)
//
// To add a new video, add a new entry at the TOP of CREW_TRAINING so it
// surfaces as the latest one. Each entry needs:
//   - icon, title, summary
//   - taughtBy, videoUrl, videoLabel
//   - steps[]    — instructions, drawn from the actual transcript
//   - warnings[] — safety/care callouts, drawn from what's said on camera
//
// Source for every entry must be a real video. Do not invent steps.
// ───────────────────────────────────────────────────────────────────────────

const CREW_TRAINING = [
  {
    icon: '🎛️',
    title: 'How to wind up the multicore cable',
    summary: 'The long, heavy cable that runs from the stage to the mixer at the back. Sit down to do it — your back will thank you. Done in pairs, one rolling and one guiding.',
    taughtBy: 'Brother Michael & BJ (rolling)',
    videoUrl: 'https://youtu.be/s1kAYIHIOHo',
    videoLabel: 'Calvary CREW Training (5)',
    steps: [
      'First: unravel the entire cable so there are no kinks. Kinks damage the cable — and this one is already old, so be extra careful.',
      'If kinks remain at the start of your roll, stop and restart from the beginning. Pull everything out and try again — sometimes kinks are at the very start and you need to fully reset.',
      'Sit down on a chair before you start rolling. The cable is heavy, and trying to do this on your legs will do your back in.',
      'On the back of the multicore drum, find the knob that locks the rolling mechanism. Loosen it so the drum can rotate freely.',
      'There\'s also a handle on the drum to help you roll. Use one hand on the handle to roll, and your other hand near the drum to guide the cable on.',
      'As you roll, pull the cable tight. The tighter you keep it, the less the wires overlap each other.',
      'Aim for the cable to lay side-by-side as it winds on — no gaps. You\'ll see "lines" forming as the wires sit next to each other cleanly.',
      'Anytime the cable wants to drift out of line, push it back into place with your guiding hand.',
      'Once you\'ve completed one row, the cable will start overlapping onto itself. That\'s normal and expected — should only be about two rows total.',
      'When fully rolled, go back to the knob on the back and tighten it again. The drum is now locked and can\'t move.',
      'Roll the drum forward just slightly (BJ\'s tip — Michael agreed) so the wires can\'t flip over during transport. Not too deep — just a small forward turn.',
      'Pack it away.',
    ],
    warnings: [
      'If the cable comes to you already tangled or wrapped strangely, get someone to help you straighten and detangle it first. Do NOT try to wind a tangled cable solo — Brother Michael\'s words: "Don\'t try it."',
      'Don\'t let the cable get trapped on anything during the roll. The connectors and the cable itself will break.',
      'Sit down. Don\'t do this standing on your legs — the cable\'s weight is real, and your back will go.',
    ],
  },
  {
    icon: '🤝',
    title: 'How to put the speaker on — two-person method',
    summary: 'The alternative method for when nobody is tall enough to lift the speaker over the top of the stand. One person mounts the speaker on a lowered stand, the second raises the stand back up using the height pin.',
    taughtBy: 'Brother Michael & BJ (assistant)',
    videoUrl: 'https://youtube.com/shorts/EyB_6EQ-nHk',
    videoLabel: 'Calvary CREW Training (4)',
    steps: [
      'Use this method when nobody on Crew that day is tall enough to lift the speaker over the top of the stand in one go (the one-person method).',
      'Lower the stand first — it should be noticeably lower than usual before the mounter starts.',
      'Mounter: grab the speaker with both hands — one on top, one on the back handle.',
      'Mounter: put your other hand underneath and aim the back hole onto the stand. Slot it in.',
      'Lifter: now put your hand underneath the speaker to support it.',
      'Lifter: remove the height pin from the stand.',
      'Lifter: raise the stand (with the speaker on it) up to standing position.',
      'Lifter: put the pin back in to lock the height.',
      'Lifter: bring the stand back down to its final settled position. Done.',
    ],
    warnings: [
      'Two people. Always. Brother Michael\'s words: "Don\'t be a Superman. Don\'t try it. Two people."',
      'Stay close to the speaker the whole time — both people. Hands stay near the body, not extended out. Do NOT do this from a distance.',
      'Same back-hole rule as the one-person method — make sure the speaker slots onto the BACK hole, not the front.',
    ],
  },
  {
    icon: '🎚️',
    title: 'How to set up the speaker stand & put the speaker on',
    summary: 'The one-person method. Stand first, then mount the speaker — uses the back hole, lifted via shoulder press. If nobody on Crew is tall enough to lift it over the stand in one go, use the two-person method instead.',
    taughtBy: 'Brother Michael',
    videoUrl: 'https://youtube.com/shorts/_gzPxww0XC8',
    videoLabel: 'Calvary CREW Training (3)',
    steps: [
      'Open the stand legs to a good base — about just outside your shoulder width.',
      'Rotate the knob to tighten the legs in place.',
      'Push the side pin into the holes on the stand to lock it. The stand will wobble a bit — that\'s normal, it won\'t fall as long as you don\'t do anything silly.',
      'Pick up the speaker by the side handle and tilt it so the bottom faces you.',
      'You\'ll see two holes on the bottom of the speaker. Use the BACK hole, not the front one.',
      'Get underneath the speaker, put the weight on your shoulder, and press up so the back hole slots onto the stand.',
      'Make sure the speaker is facing straight out into the room.',
    ],
    warnings: [
      'Use the back hole — not the front. Picking the wrong hole will leave the speaker tilting forward off the stand.',
      'Same strength check as taking it down: only do this if you\'re confident in your strength and you don\'t have any shoulder issues. Tag out if in doubt.',
    ],
  },
  {
    icon: '🔊',
    title: 'How to take a speaker down',
    summary: 'Lifting a speaker off its stand during pack-down. Light enough to handle solo if you\'re confident — but Brother Michael flags strength and shoulder safety as a check first.',
    taughtBy: 'Brother Michael',
    videoUrl: 'https://youtube.com/shorts/93z-xrwWzns',
    videoLabel: 'Calvary CREW Training (2)',
    steps: [
      'Grab the handle on the speaker.',
      'Put your other hand underneath to support it.',
      'Push up to lift it clear of the stand.',
      'Catch it as it comes down — it\'s light, but you still need both hands on it.',
    ],
    warnings: [
      'Only do this if you\'re confident in your strength and you don\'t have any shoulder issues. If in doubt, ask someone else to handle it — there\'s no shame in tagging out.',
    ],
  },
  {
    icon: '🔌',
    title: 'How to fold cables',
    summary: 'Coiling XLR and jack cables for safe storage. Same technique works for keyboard cables (XLR-to-jack) — just adjust loop size for shorter cables.',
    taughtBy: 'Brother Michael',
    videoUrl: 'https://youtube.com/shorts/Pb46eU33tes',
    videoLabel: 'Calvary CREW Training (1) · 2 min',
    steps: [
      'Hold the cable at one end. You can use either hand — depends on the angle you want.',
      'Use your fingers to rotate the cable as you bring it in to form a loop. Get some slack, rotate, bring it round.',
      'Alternate the loops — one goes round one way, the next goes the opposite way. Round, grab, bring it in. Then the other side. Round, grab, bring it in.',
      'If a loop doesn\'t sit straight, loosen it and rotate again. You want the cable as straight as you can — no kinks.',
      'For shorter cables, use smaller loops so they fit better.',
      'Secure with the velcro tie. The tie should already be on the cable — if it\'s missing, fresh velcro ties are in the red bag.',
    ],
    warnings: [
      'Do NOT slam the cable down when you take it apart. Put it down softly. The connector heads (both ends) are sensitive and can break.',
    ],
  },
];
