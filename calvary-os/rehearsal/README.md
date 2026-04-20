# Calvary OS — Rehearsal Studio

**Phase 1 is live.** This folder contains the foundation of the Rehearsal Studio module.

---

## What's here

| File | Purpose |
|------|---------|
| `index.html` | Rehearsal Studio landing page — Sets tab, Arrangements tab, Song Library below |
| `rehearsal-schema.sql` | Supabase schema for all 11 tables, RLS policies, storage bucket notes, seed data |
| `README.md` | This file |

Still to build in later phases:
- `reference.html` — reference importer + section editor (Phase 2–3)
- `arrangement.html` — drag-and-drop arrangement builder (Phase 4)
- `practice.html` — musician-facing practice view with stems (Phase 5)
- `set.html` — set builder (Phase 6)
- `rehearsal.js` / `rehearsal.css` — shared utilities (created as needed)

---

## Setup (one-time, do this first)

### 1. Run the schema in Supabase

1. Open the Supabase dashboard: https://supabase.com/dashboard/project/pfycvgbrsbecznkcikwt
2. Go to **SQL Editor** → **New query**
3. Paste the contents of `rehearsal-schema.sql`
4. Click **Run**

This creates 11 tables (prefixed `rs_`), sets permissive RLS policies, and seeds 7 starter songs including Trading My Sorrows. Re-running the script is safe — it uses `CREATE TABLE IF NOT EXISTS` and only seeds if the songs table is empty.

### 2. Create the storage bucket

1. In Supabase dashboard → **Storage** → **New bucket**
2. Name: `rehearsal-studio`
3. Public bucket: **Yes** (for v1 — signed URLs come in v2)
4. File size limit: **50 MB**
5. Click **Create bucket**

No folders need creating — the app creates them as needed on upload (`references/{id}/reference.mp3`, `references/{id}/stems/{type}.mp3`, etc.)

### 3. Visit the module

- Dashboard: `https://calvaryhfgc.github.io/calvaryhephzibah/calvary-os/dashboard.html` → click **🎶 Rehearsal Studio**
- Direct: `https://calvaryhfgc.github.io/calvaryhephzibah/calvary-os/rehearsal/`

Log in with any Calvary OS user who has `worship` access (Bolaji, Caster, BJ, Morayo, Laolu, Tosin).

---

## What works in Phase 1

- Log in via existing PIN auth — no new user setup needed
- See the 7 seed songs in the Song Library
- Add a new song (admin/lead only)
- Create a new set (Sunday, mid-week, special)
- Create a new arrangement against any song
- Search sets and arrangements
- Team members (Morayo, Laolu, Esther etc.) can view everything but not edit

## What doesn't work yet

- Opening a set or arrangement card goes to `set.html` / `arrangement.html` which don't exist yet (404 until Phase 4 and 6). The landing page itself is fully functional.
- No audio anywhere — no references yet (Phase 2), no stems (Phase 2), no practice view (Phase 5)
- Arrangements are created with `reference_id` null — linking a reference happens in Phase 2

---

## Access model

- **Admin** (Bolaji, Pastor Shade) — full access to everything
- **Lead** (Caster, Scott, Auntie Pauline, Pastor Gbenga, Pastor Kayode) — full read/write within the module
- **Team** (Morayo, Laolu, Esther, Tosin, BJ, etc.) — read-only access. Can see sets, arrangements, and songs. Cannot create or edit. Phase 5 Practice View is where they get their value.

Access is controlled by the `worship` section on each user. If you add new worship team members to `shell.js`, make sure they have `'worship'` in their sections array.

---

## Phase 2 next steps

When ready to move forward:

1. Confirm Moises API plan and get the API key
2. Decide on the YouTube download service host (recommend Fly.io)
3. Build the reference importer (`reference.html`) with upload + YouTube URL inputs
4. Build the Supabase Edge Function that orchestrates: YouTube download → Moises job → stem storage → section creation
5. Add the status-polling UI on the reference page

See `../../../calvary-os-rehearsal-studio.md` in the project for the full spec.

---

*Built: April 2026 · Bolaji Olatoye*
