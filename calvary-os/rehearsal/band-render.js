// ═══════════════════════════════════════════════════════════════════
// BAND-VIEW RENDERER
//
// Renders the simple, on-Sunday band-facing view of a worship set.
// Big legible key per song. One-line direction. Nothing else.
//
// Used by:
//   - band-sunday.html (public, no auth)
//   - calvary-os/rehearsal/band.html (Calvary OS, PIN-gated)
//
// Both pages call BandView.render({ container, setId? }). When setId
// is omitted, the renderer resolves the most relevant set using
// nearest-upcoming-then-most-recent logic.
//
// This file owns its own Supabase calls because the public host page
// doesn't load shell.js. The Supabase URL + anon key are duplicated from
// shell.js for that reason — anon key is safe to expose, RLS handles
// access at the row level.
// ═══════════════════════════════════════════════════════════════════

(function(global){
  'use strict';

  var SUPA_URL = 'https://pfycvgbrsbecznkcikwt.supabase.co';
  var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmeWN2Z2Jyc2JlY3pua2Npa3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNzY1NDgsImV4cCI6MjA5MDk1MjU0OH0.xw_DSmC0brKC7K9H-rxNG0HKKDi4I-dNSEoZKERvHcQ';

  // Use the parent shell's Supabase helpers when present, otherwise spin up
  // our own. Avoids two anon keys flying around when running inside Calvary OS.
  function sb(path){
    if(typeof global.sbFetch === 'function') return global.sbFetch(path);
    return fetch(SUPA_URL + '/rest/v1/' + path, {
      headers: { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY }
    }).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; });
  }

  // ─── Resolve which set to render ───────────────────────────────
  // Priority:
  //   1. ?id=… in the URL — explicit override
  //   2. Nearest upcoming set (service_date >= today)
  //   3. Most recent past set
  async function resolveSetId(explicitId){
    if(explicitId) return explicitId;

    var today = new Date();
    var todayISO = today.toISOString().slice(0, 10);

    // Try upcoming first (today or future)
    var upcoming = await sb('rs_sets?service_date=gte.' + todayISO + '&order=service_date.asc&limit=1');
    if(upcoming && upcoming.length) return upcoming[0].id;

    // Fall back to most recent past
    var past = await sb('rs_sets?service_date=lt.' + todayISO + '&order=service_date.desc&limit=1');
    if(past && past.length) return past[0].id;

    return null;
  }

  // ─── Fetch set + arrangements + songs in three queries ──────────
  // PostgREST embedding could fold this into one round trip, but the
  // schema's foreign keys haven't been registered with PostgREST's
  // schema cache for arrangements (they were added late). Three explicit
  // queries are reliable.
  async function fetchSetData(setId){
    var setRows = await sb('rs_sets?id=eq.' + setId + '&select=*');
    if(!setRows || !setRows.length) return null;
    var set = setRows[0];

    var setArrs = await sb('rs_set_arrangements?set_id=eq.' + setId + '&order=position.asc');
    if(!setArrs) return { set: set, items: [] };

    if(setArrs.length === 0) return { set: set, items: [] };

    // Pull the arrangements referenced
    var arrIds = setArrs.map(function(sa){ return sa.arrangement_id; }).filter(Boolean);
    var arrs = arrIds.length
      ? await sb('rs_arrangements?id=in.(' + arrIds.join(',') + ')')
      : [];

    // Pull the songs referenced by those arrangements
    var songIds = (arrs || []).map(function(a){ return a.song_id; }).filter(Boolean);
    var uniqueSongIds = Array.from(new Set(songIds));
    var songs = uniqueSongIds.length
      ? await sb('rs_songs?id=in.(' + uniqueSongIds.join(',') + ')')
      : [];

    // Stitch into ordered items
    var arrById = {};
    (arrs || []).forEach(function(a){ arrById[a.id] = a; });
    var songById = {};
    (songs || []).forEach(function(s){ songById[s.id] = s; });

    var items = setArrs.map(function(sa){
      var arr = arrById[sa.arrangement_id] || null;
      var song = arr ? (songById[arr.song_id] || null) : null;
      // Resolution rule for direction:
      //   per-service override → arrangement default → null
      var direction = sa.band_direction_override || (arr && arr.band_direction) || null;
      return {
        position: sa.position,
        section: sa.section || null,    // 'praise'|'worship'|'offering'|'end_of_service'|null
        transitionNote: sa.transition_note || null,
        arrangement: arr,
        song: song,
        direction: direction
      };
    }).filter(function(it){ return it.arrangement && it.song; });

    return { set: set, items: items };
  }

  // ─── Render ─────────────────────────────────────────────────────
  function render(opts){
    opts = opts || {};
    var container = opts.container;
    if(!container){ console.warn('BandView.render: container required'); return; }

    container.innerHTML = '<div class="bv-loading">Loading set…</div>';

    var explicitId = opts.setId || (new URLSearchParams(location.search)).get('id');

    resolveSetId(explicitId).then(function(setId){
      if(!setId){
        renderEmpty(container, 'No upcoming services found.');
        return;
      }
      fetchSetData(setId).then(function(data){
        if(!data){
          renderEmpty(container, 'Set not found.');
          return;
        }
        renderSet(container, data, opts);
      });
    });
  }

  function renderEmpty(container, msg){
    container.innerHTML = '<div class="bv-empty"><h2>Nothing scheduled</h2><p>' + escapeHtml(msg) + '</p></div>';
  }

  // Canonical section order for the band view. Items without a section
  // fall through into a final "Songs" bucket so the page never silently
  // drops a row just because the worship leader hasn't assigned it yet.
  var SECTION_ORDER = ['praise', 'worship', 'offering', 'end_of_service', null];
  var SECTION_LABELS = {
    'praise':         'Praise',
    'worship':        'Worship',
    'offering':       'Offering',
    'end_of_service': 'End of service',
    null:             'Songs'
  };

  function groupBySection(items){
    // Group items into the canonical order while preserving the position
    // ordering inside each section.
    var buckets = {};
    items.forEach(function(it){
      var key = it.section || null;
      if(!buckets[key]) buckets[key] = [];
      buckets[key].push(it);
    });
    var groups = [];
    SECTION_ORDER.forEach(function(key){
      if(buckets[key] && buckets[key].length){
        groups.push({ section: key, label: SECTION_LABELS[key], items: buckets[key] });
      }
    });
    return groups;
  }

  function renderSet(container, data, opts){
    var set = data.set;
    var items = data.items;
    var dateLabel = formatLongDate(set.service_date);

    // Assign a 1-based song number across the whole set, in section order
    var groups = groupBySection(items);
    var counter = 0;
    groups.forEach(function(g){
      g.items.forEach(function(it){
        counter += 1;
        it._number = counter;
      });
    });

    // ── Pill nav: one continuous strip, but section breaks visible
    var listHtml = groups.map(function(g, gi){
      var separator = gi > 0
        ? '<span class="bv-pill-sep" aria-hidden="true"></span>'
        : '';
      var label = '<span class="bv-pill-section" aria-hidden="false">' + escapeHtml(g.label) + '</span>';
      var pillsForGroup = g.items.map(function(it){
        return '<a href="#song-' + it._number + '" class="bv-pill" data-song="' + it._number + '">' +
          '<span class="bv-pill-num">' + it._number + '</span>' +
          '<span class="bv-pill-title">' + escapeHtml(it.song.title) + '</span>' +
          '<span class="bv-pill-key">' + escapeHtml(it.arrangement.key || '') + '</span>' +
          '</a>';
      }).join('');
      return separator + label + pillsForGroup;
    }).join('');

    // ── Cards: rendered in section blocks with a heading per section
    var cardsHtml = groups.map(function(g){
      var headHtml = '<div class="bv-section">' +
        '<div class="bv-section-rule"></div>' +
        '<div class="bv-section-label">' + escapeHtml(g.label) + '</div>' +
        '<div class="bv-section-rule"></div>' +
      '</div>';
      var inner = g.items.map(function(it){
        return renderCard(it, it._number, opts);
      }).join('');
      return headHtml + inner;
    }).join('');

    var emptyState = items.length === 0
      ? '<div class="bv-empty"><h2>No songs in this set yet</h2><p>The worship leader hasn\'t added arrangements. Check back closer to the service.</p></div>'
      : '';

    var editLink = (opts.editLink && set.id)
      ? '<a class="bv-edit-link" href="' + opts.editLink + '?id=' + set.id + '">Edit set</a>'
      : '';

    container.innerHTML =
      '<header class="bv-header">' +
        '<div class="bv-eyebrow">For the band</div>' +
        '<h1 class="bv-title">' + escapeHtml(set.name) + '</h1>' +
        '<div class="bv-date">' + escapeHtml(dateLabel) + '</div>' +
        editLink +
      '</header>' +
      (items.length > 0 ? '<nav class="bv-list" id="bv-list">' + listHtml + '</nav>' : '') +
      '<main class="bv-cards">' + cardsHtml + emptyState + '</main>';

    wireScrollSpy(container);
  }

  function renderCard(item, number, opts){
    var key = item.arrangement.key || '—';
    var direction = item.direction;
    var songId = 'song-' + number;
    var titleHtml = escapeHtml(item.song.title);
    var artistHtml = item.song.original_artist
      ? '<div class="bv-card-artist">' + escapeHtml(item.song.original_artist) + '</div>'
      : '';

    // Tempo, only if set, used as a quiet signal in the corner
    var tempoHtml = item.arrangement.bpm
      ? '<span class="bv-card-tempo">' + escapeHtml(String(item.arrangement.bpm)) + ' BPM</span>'
      : '';

    var directionHtml = direction
      ? '<div class="bv-card-direction">' + escapeHtml(direction) + '</div>'
      : '<div class="bv-card-direction bv-card-direction-empty">No direction set yet.</div>';

    var transitionHtml = item.transitionNote
      ? '<div class="bv-card-transition"><span class="bv-card-transition-arrow">↓</span> ' + escapeHtml(item.transitionNote) + '</div>'
      : '';

    return '<section class="bv-card" id="' + songId + '">' +
      '<div class="bv-card-num">' + number + '</div>' +
      '<div class="bv-card-body">' +
        '<div class="bv-card-titleblock">' +
          '<h2 class="bv-card-title">' + titleHtml + '</h2>' +
          artistHtml +
        '</div>' +
        '<div class="bv-card-keyblock">' +
          '<span class="bv-card-key">' + escapeHtml(key) + '</span>' +
          tempoHtml +
        '</div>' +
        directionHtml +
      '</div>' +
    '</section>' + transitionHtml;
  }

  function wireScrollSpy(container){
    var pills = container.querySelectorAll('.bv-pill');
    var cards = container.querySelectorAll('.bv-card');
    if(!pills.length || !cards.length) return;

    var pillByNum = {};
    pills.forEach(function(p){ pillByNum[p.getAttribute('data-song')] = p; });

    // Smooth scroll on pill tap (avoids hash jump-to behaviour)
    pills.forEach(function(p){
      p.addEventListener('click', function(e){
        e.preventDefault();
        var num = p.getAttribute('data-song');
        var card = container.querySelector('#song-' + num);
        if(card){
          var headerOffset = 90; // approx height of sticky list
          var top = card.getBoundingClientRect().top + window.scrollY - headerOffset;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      });
    });

    // Scroll-spy: highlight the pill matching the most-visible card
    if('IntersectionObserver' in window){
      var observer = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){
            var card = entry.target;
            var num = (card.id || '').replace('song-', '');
            pills.forEach(function(p){ p.classList.remove('active'); });
            if(pillByNum[num]) pillByNum[num].classList.add('active');
          }
        });
      }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
      cards.forEach(function(c){ observer.observe(c); });
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────
  function escapeHtml(s){
    if(s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatLongDate(iso){
    if(!iso) return '';
    // 'YYYY-MM-DD' → 'Sunday 26 April 2026'
    var d = new Date(iso + 'T12:00:00');
    if(isNaN(d.getTime())) return iso;
    var days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return days[d.getDay()] + ' ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  // ─── Public API ────────────────────────────────────────────────
  global.BandView = {
    render: render,
    // Exposed for callers that want to fetch without rendering
    resolveSetId: resolveSetId,
    fetchSetData: fetchSetData,
    // Exposed for the set editor (so it has the same options + labels)
    SECTION_ORDER: SECTION_ORDER.filter(function(s){ return s !== null; }),
    SECTION_LABELS: SECTION_LABELS
  };

})(typeof window !== 'undefined' ? window : this);
