# Calvary OS — Rehearsal Studio

**Phase 2 is live.** This folder contains the foundation + reference importer of the Rehearsal Studio module.

---

## What's here

| File | Purpose | Phase |
|------|---------|-------|
| `index.html` | Rehearsal Studio landing page — Sets tab, Arrangements tab, Song Library | 1 |
| `reference.html` | Manual reference importer (reference MP3 + 7 stems + sections) | 2 |
| `rehearsal-schema.sql` | Supabase schema for all 11 tables, RLS policies, seed data | 1 |
| `README.md` | This file | — |

Still to build in later phases:
- `arrangement.html` — drag-and-drop arrangement builder (Phase 4)
- `practice.html` — musician-facing practice view with stems (Phase 5)
- `set.html` — set builder (Phase 6)
- `rehearsal.js` / `rehearsal.css` — shared utilities (created as needed)

---

## Workflow (as of Phase 2)

The tool now supports a complete reference-import workflow using Moises's consumer web app:

### Step A — in Moises (once per song)

1. Sign in to https://moises.ai as `calvaryhfgc@gmail.com`
2. Upload the reference MP3 (from YouTube or wherever you source it)
3. Run stem separation — pick the 7-stem Hi-Fi option
4. Note the detected key, BPM, and section timestamps
5. Download all 7 stems as MP3s

### Step B — in Calvary OS

1. Go to Rehearsal Studio → find the song in the library
2. Click `+ Reference` on the song row
3. Drag in the reference MP3 and the 7 stem MP3s
4. Fill in key, BPM, duration
5. List the sections (label + start + end timestamps)
6. Click **Save reference**

The tool uploads everything to Supabase Storage, creates the database records (references + stems + sections), and links back to any pending arrangement.

---

## Setup (one-time, do this first)

### 1. Run the schema in Supabase

1. Open the Supabase dashboard: https://supabase.com/dashboard/project/pfycvgbrsbecznkcikwt
2. Go to **SQL Editor** → **New query**
3. Paste the contents of `rehearsal-schema.sql` (run Parts A and B separately if you hit the `DO $$` block parser issue)
4. Click **Run**

This creates 11 tables (prefixed `rs_`), sets permissive RLS policies, and seeds 7 starter songs including Trading My Sorrows.

### 2. Create the storage bucket

1. In Supabase dashboard → **Storage** → **New bucket**
2. Name: `rehearsal-studio`
3. Public bucket: **Yes**
4. File size limit: **50 MB**
5. Click **Create bucket**

### 3. Visit the module

- Dashboard: `https://calvaryhfgc.github.io/calvaryhephzibah/calvary-os/dashboard.html` → **🎶 Rehearsal Studio**
- Direct: `https://calvaryhfgc.github.io/calvaryhephzibah/calvary-os/rehearsal/`

---

## What works in Phase 2

- Everything from Phase 1 (landing page, create songs/sets/arrangements)
- **Upload a reference** (MP3) and its 7 stems via drag-and-drop
- **Manual section editor** — list start/end timestamps and labels
- **Auto-detect duration** from the reference MP3 once uploaded
- **Progress UI** during upload (8 files × several MB each can take 30-60s)
- **Linked to arrangement** — if you created an arrangement first, clicking its card with status "draft" (no reference yet) drops you into the reference importer, and on save it links the reference back to the arrangement

## What doesn't work yet

- Opening an arrangement with a linked reference goes to `arrangement.html` which is Phase 4 — 404 expected
- No YouTube URL import — you grab the MP3 yourself
- No waveform visualisation — Phase 3
- No practice view — Phase 5

---

## Access model

- **Admin** (Bolaji, Pastor Shade) — full access to everything
- **Lead** (Caster, Scott, Auntie Pauline, Pastor Gbenga, Pastor Kayode) — full read/write within the module
- **Team** (Morayo, Laolu, Tosin, BJ, Esther, etc.) — read-only access

Access is controlled by the `worship` section on each user.

---

## Phase 3+ roadmap

1. **Phase 3 — Waveform viewer.** Render the reference as a scrollable waveform with draggable section boundaries. Replaces the manual timestamp input with a visual editor.
2. **Phase 4 — Arrangement Builder.** Drag reference sections into "Our Version" sequence with per-slot notes, per-part notes, status.
3. **Phase 5 — Practice View.** Stem mixing in the browser via Web Audio API. Solo a part, loop a section, slow down for learning. The feature that raises the team's game.
4. **Phase 6 — Set Builder + Team View.** Compose arrangements into a set, share via WhatsApp link.

See `../../../calvary-os-rehearsal-studio.md` in the project for the full spec.

---

*Built: April 2026 · Bolaji Olatoye*
