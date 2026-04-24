// ═══════════════════════════════════════════════════════════════════
// PHRASE ENGINE
// Shared multi-voice playback engine for Calvary OS phrases.
//
// Usage:
//   await PhraseEngine.play(phrase, tracks, notes, {
//     clickTrack: true,
//     countIn: true,
//     loop: false,
//     onNoteStart: (trackId, noteId) => { ... },
//     onNoteEnd:   (trackId, noteId) => { ... },
//     onEnd:       () => { ... }
//   });
//
// The engine is a global singleton — only one phrase plays at a time across
// the whole page. Call PhraseEngine.stop() to interrupt.
//
// Depends on Tone.js, which is lazy-loaded from a CDN the first time play()
// is called. No build step; no bundler.
// ═══════════════════════════════════════════════════════════════════

(function(global) {
  'use strict';

  // ── State ────────────────────────────────────────────────────
  var toneLoadPromise = null;
  var synths = {};          // cache: { trackId: { synth, reverb } }
  var clickSynth = null;
  var activeSession = null; // { timers: [], endTimer, loopTimer, options }

  // ── Tone.js loader ───────────────────────────────────────────
  function loadTone() {
    if (toneLoadPromise) return toneLoadPromise;
    toneLoadPromise = new Promise(function(resolve, reject) {
      if (global.Tone) { resolve(global.Tone); return; }
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js';
      s.onload = function() { resolve(global.Tone); };
      s.onerror = function() { reject(new Error('Tone.js failed to load')); };
      document.head.appendChild(s);
    });
    return toneLoadPromise;
  }

  // ── Synth factory ────────────────────────────────────────────
  // Instrument identifiers come from rs_phrase_tracks.instrument.
  // Keep these in sync with the <select> options in phrase-editor.html.
  function buildSynth(Tone, instrument) {
    var synth, reverb, config;

    if (instrument === 'synth_bass') {
      config = {
        oscillator: { type: 'square8' },
        envelope: { attack: 0.01, decay: 0.15, sustain: 0.6, release: 0.2 }
      };
      synth = new Tone.PolySynth(Tone.Synth, config).toDestination();
      synth.volume.value = -6;
      // Bass doesn't need much reverb; skip
      return { synth: synth, reverb: null };
    }

    if (instrument === 'piano') {
      // Approximation — Tone's Sampler is ideal but requires loading
      // audio samples over the network. Using a tuned Synth keeps us
      // dependency-free and fast.
      config = {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.005, decay: 0.2, sustain: 0.3, release: 0.8 }
      };
      synth = new Tone.PolySynth(Tone.Synth, config).toDestination();
      reverb = new Tone.Reverb({ decay: 2.0, wet: 0.2 }).toDestination();
      synth.connect(reverb);
      synth.volume.value = -6;
      return { synth: synth, reverb: reverb };
    }

    if (instrument === 'click') {
      // Click tracks use the shared clickSynth. Return it here so the
      // track-level plumbing is uniform; playback still uses the shared
      // instance.
      return { synth: getClickSynth(Tone), reverb: null, isClick: true };
    }

    // Default: synth_lead
    config = {
      oscillator: { type: 'triangle8' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.3 }
    };
    synth = new Tone.PolySynth(Tone.Synth, config).toDestination();
    reverb = new Tone.Reverb({ decay: 1.4, wet: 0.15 }).toDestination();
    synth.connect(reverb);
    synth.volume.value = -6;
    return { synth: synth, reverb: reverb };
  }

  function getClickSynth(Tone) {
    if (clickSynth) return clickSynth;
    clickSynth = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      octaves: 2,
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 }
    }).toDestination();
    clickSynth.volume.value = -14;
    return clickSynth;
  }

  function getOrCreateTrackSynth(Tone, track) {
    // Cache per-track so repeated plays don't churn synth objects.
    // Cache key includes instrument so a mid-session instrument change
    // invalidates the old synth.
    var key = track.id + ':' + track.instrument;
    if (synths[key]) return synths[key];
    // If we have an older cached synth for this track under a different
    // instrument, dispose it to free resources.
    for (var k in synths) {
      if (k.indexOf(track.id + ':') === 0 && k !== key) {
        try {
          var old = synths[k];
          if (old.synth && old.synth.dispose) old.synth.dispose();
          if (old.reverb && old.reverb.dispose) old.reverb.dispose();
        } catch (e) { /* ignore */ }
        delete synths[k];
      }
    }
    synths[key] = buildSynth(Tone, track.instrument);
    return synths[key];
  }

  // ── Time maths ───────────────────────────────────────────────
  // Grid unit duration in seconds.
  //   phrase.tempo = BPM (quarter notes per minute)
  //   phrase.time_signature = 'N/D'
  //   phrase.grid_resolution = subdivisions per BAR (total)
  //
  // secondsPerBeat = 60 / tempo
  // secondsPerBar = secondsPerBeat * beatsPerBar
  // secondsPerGridUnit = secondsPerBar / grid_resolution
  function gridUnitSeconds(phrase) {
    var bpm = phrase.tempo || 120;
    var timeSig = phrase.time_signature || '4/4';
    var beatsPerBar = parseInt(timeSig.split('/')[0], 10) || 4;
    var gridRes = phrase.grid_resolution || 16;
    var secondsPerBeat = 60 / bpm;
    var secondsPerBar = secondsPerBeat * beatsPerBar;
    return secondsPerBar / gridRes;
  }

  function secondsPerBeat(phrase) {
    return 60 / (phrase.tempo || 120);
  }

  function beatsPerBar(phrase) {
    var timeSig = phrase.time_signature || '4/4';
    return parseInt(timeSig.split('/')[0], 10) || 4;
  }

  function gridPerBeat(phrase) {
    var gridRes = phrase.grid_resolution || 16;
    return Math.round(gridRes / beatsPerBar(phrase));
  }

  // ── Main play() ──────────────────────────────────────────────
  //
  // phrase: rs_phrases row
  // tracks: array of rs_phrase_tracks rows
  // notesByTrackId: { [trackId]: rs_phrase_notes[] }
  // options: { clickTrack, countIn, loop, onNoteStart, onNoteEnd, onEnd }
  function play(phrase, tracks, notesByTrackId, options) {
    options = options || {};

    // If something is already playing, stop first. Never overlap two phrases.
    if (activeSession) stop();

    return loadTone().then(function(Tone) {
      return Tone.start().then(function() {
        return scheduleAndPlay(Tone, phrase, tracks, notesByTrackId, options);
      });
    });
  }

  function scheduleAndPlay(Tone, phrase, tracks, notesByTrackId, options) {
    var gridSec = gridUnitSeconds(phrase);
    var beatSec = secondsPerBeat(phrase);
    var bpBar = beatsPerBar(phrase);
    var gBeat = gridPerBeat(phrase);

    var countInBars = options.countIn ? 1 : 0;
    var countInSec = countInBars * bpBar * beatSec;

    // Compute phrase duration: max (start_position + duration) across all tracks
    var maxEndUnits = 0;
    for (var i = 0; i < tracks.length; i++) {
      var tnotes = notesByTrackId[tracks[i].id] || [];
      for (var j = 0; j < tnotes.length; j++) {
        var n = tnotes[j];
        var end = (n.start_position || 0) + (n.duration || 0);
        if (end > maxEndUnits) maxEndUnits = end;
      }
    }
    if (maxEndUnits === 0) {
      // Nothing to play
      if (options.onEnd) options.onEnd();
      return;
    }
    var phraseSec = maxEndUnits * gridSec;

    // Small lead time so we never try to schedule in the past
    var LEAD = 0.08;
    var now = Tone.now() + LEAD;
    var phraseStart = now + countInSec;

    var timers = [];
    activeSession = {
      timers: timers,
      endTimer: null,
      loopTimer: null,
      options: options
    };

    // Schedule count-in clicks
    if (options.countIn) {
      var click = getClickSynth(Tone);
      for (var b = 0; b < countInBars * bpBar; b++) {
        var ct = now + b * beatSec;
        var pitch = (b % bpBar === 0) ? 'C5' : 'G4';
        click.triggerAttackRelease(pitch, '32n', ct);
      }
    }

    // Schedule the phrase itself (all voices in parallel)
    for (var t = 0; t < tracks.length; t++) {
      var track = tracks[t];
      if (track.muted) continue;
      var trackNotes = notesByTrackId[track.id] || [];
      if (trackNotes.length === 0) continue;

      var voice = getOrCreateTrackSynth(Tone, track);
      // Apply per-track volume (dB). For the click voice, use the track's volume
      // scaled down a bit so it doesn't overpower.
      if (voice.synth && typeof voice.synth.volume === 'object') {
        try { voice.synth.volume.value = (track.volume_db != null) ? track.volume_db : -6; } catch (e) {}
      }

      // Schedule each note
      for (var k = 0; k < trackNotes.length; k++) {
        var note = trackNotes[k];
        var startAt = phraseStart + (note.start_position || 0) * gridSec;
        var durSec = Math.max((note.duration || 1) * gridSec, 0.05);
        scheduleNote(voice, note, startAt, durSec, track, options, timers, now);
      }
    }

    // Schedule phrase's own continuous click track (if click enabled)
    // NOTE: this is different from count-in — count-in is BEFORE the phrase,
    // this runs during the phrase underneath to help hear the grid.
    if (options.clickTrack) {
      var click2 = getClickSynth(Tone);
      var totalBeats = Math.ceil(maxEndUnits / gBeat);
      for (var bb = 0; bb < totalBeats; bb++) {
        var tt = phraseStart + bb * beatSec;
        var isDown = (bb % bpBar === 0);
        click2.triggerAttackRelease(isDown ? 'C5' : 'G4', '32n', tt);
      }
    }

    // End-of-phrase callback (and loop scheduling)
    var endDelayMs = (countInSec + phraseSec) * 1000 + 100;
    activeSession.endTimer = setTimeout(function() {
      if (!activeSession) return;
      if (options.loop) {
        // Restart with the same options.
        // Use onEnd hook to signal iteration end before restart.
        if (options.onIterationEnd) {
          try { options.onIterationEnd(); } catch (e) {}
        }
        var loopOptions = Object.assign({}, options);
        // Don't play count-in again on subsequent iterations
        loopOptions.countIn = false;
        // Play again (will call stop() internally to clear state)
        play(phrase, tracks, notesByTrackId, loopOptions);
      } else {
        if (options.onEnd) {
          try { options.onEnd(); } catch (e) {}
        }
        // Clear session
        if (activeSession) {
          activeSession.timers.forEach(function(tm) { clearTimeout(tm); });
          activeSession = null;
        }
      }
    }, endDelayMs);
  }

  function scheduleNote(voice, note, startAt, durSec, track, options, timers, scheduleBase) {
    // Click-track voice: use the MembraneSynth with a fixed pitch
    if (voice.isClick) {
      voice.synth.triggerAttackRelease(note.pitch || 'C4', '32n', startAt);
    } else {
      // Regular pitched voice
      if (!note.pitch) return;
      try {
        voice.synth.triggerAttackRelease(note.pitch, durSec * 0.92, startAt);
      } catch (e) {
        // Tone throws if pitch is malformed; swallow so one bad note doesn't
        // abort the whole phrase.
        console.warn('Bad note pitch:', note.pitch, e);
        return;
      }
    }

    // Fire visual callbacks for note-start and note-end
    if (options.onNoteStart || options.onNoteEnd) {
      var ctx = (global.Tone && global.Tone.context) ? global.Tone.context : null;
      // Tone.now() is relative to the AudioContext's currentTime.
      // We compute setTimeout delays from now (wall clock).
      var nowTone = global.Tone.now();
      var startDelayMs = Math.max(0, (startAt - nowTone) * 1000);
      var endDelayMs = Math.max(0, (startAt + durSec - nowTone) * 1000);

      if (options.onNoteStart) {
        timers.push(setTimeout(function() {
          try { options.onNoteStart(track.id, note.id); } catch (e) {}
        }, startDelayMs));
      }
      if (options.onNoteEnd) {
        timers.push(setTimeout(function() {
          try { options.onNoteEnd(track.id, note.id); } catch (e) {}
        }, endDelayMs));
      }
    }
  }

  // ── Stop ─────────────────────────────────────────────────────
  function stop() {
    if (!activeSession) return;

    // Cancel all scheduled UI timers
    activeSession.timers.forEach(function(t) { clearTimeout(t); });
    if (activeSession.endTimer) clearTimeout(activeSession.endTimer);
    if (activeSession.loopTimer) clearTimeout(activeSession.loopTimer);

    // Release all playing notes from every cached synth
    for (var k in synths) {
      var voice = synths[k];
      if (voice && voice.synth && voice.synth.releaseAll) {
        try { voice.synth.releaseAll(); } catch (e) {}
      }
    }
    if (clickSynth) {
      try { clickSynth.triggerRelease(); } catch (e) {}
    }

    // Fire user's onStop if provided
    if (activeSession.options && activeSession.options.onStop) {
      try { activeSession.options.onStop(); } catch (e) {}
    }

    activeSession = null;
  }

  function isPlaying() {
    return !!activeSession;
  }

  // ── Public API ──────────────────────────────────────────────
  global.PhraseEngine = {
    play: play,
    stop: stop,
    isPlaying: isPlaying,
    // Exposed time helpers for callers that need to convert positions/durations
    gridUnitSeconds: gridUnitSeconds,
    secondsPerBeat: secondsPerBeat,
    beatsPerBar: beatsPerBar,
    gridPerBeat: gridPerBeat
  };

})(typeof window !== 'undefined' ? window : this);
