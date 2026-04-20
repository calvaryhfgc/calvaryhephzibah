-- ──────────────────────────────────────────────────────────────────────────
-- CALVARY OS — REHEARSAL STUDIO — SUPABASE SCHEMA
-- Version 1.0 | April 2026
-- Run this in the Supabase SQL Editor for project: pfycvgbrsbecznkcikwt
-- ──────────────────────────────────────────────────────────────────────────

-- ── SONGS ────────────────────────────────────────────────────────────────
-- One row per song title. Immortal — never deleted, only archived.
CREATE TABLE IF NOT EXISTS public.rs_songs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  original_artist  text,
  ccli_number      text,
  default_key      text,
  default_bpm      integer,
  tags             text[] DEFAULT '{}',
  status           text NOT NULL DEFAULT 'active',   -- 'active' | 'archived'
  created_by       text,                             -- Calvary OS user name
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rs_songs_status_idx ON public.rs_songs (status);
CREATE INDEX IF NOT EXISTS rs_songs_title_idx  ON public.rs_songs (title);

-- ── REFERENCES ───────────────────────────────────────────────────────────
-- One row per source recording imported for a song.
CREATE TABLE IF NOT EXISTS public.rs_references (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id            uuid NOT NULL REFERENCES public.rs_songs(id) ON DELETE CASCADE,
  source_type        text NOT NULL,              -- 'youtube' | 'upload'
  source_url         text,                       -- YouTube URL or original filename
  audio_path         text,                       -- Supabase Storage path to reference MP3
  duration_seconds   numeric,
  detected_key       text,
  detected_bpm       integer,
  moises_job_id      text,
  status             text NOT NULL DEFAULT 'pending',  -- 'pending'|'processing'|'ready'|'failed'
  error_message      text,
  created_by         text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rs_references_song_idx   ON public.rs_references (song_id);
CREATE INDEX IF NOT EXISTS rs_references_status_idx ON public.rs_references (status);

-- ── STEMS ────────────────────────────────────────────────────────────────
-- One row per stem separated from a reference.
CREATE TABLE IF NOT EXISTS public.rs_stems (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id   uuid NOT NULL REFERENCES public.rs_references(id) ON DELETE CASCADE,
  stem_type      text NOT NULL,   -- 'vocals'|'drums'|'bass'|'keys'|'guitar'|'strings'|'other'
  audio_path     text NOT NULL
);

CREATE INDEX IF NOT EXISTS rs_stems_reference_idx ON public.rs_stems (reference_id);

-- ── SECTIONS ─────────────────────────────────────────────────────────────
-- Sections detected or marked on a reference.
CREATE TABLE IF NOT EXISTS public.rs_sections (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id   uuid NOT NULL REFERENCES public.rs_references(id) ON DELETE CASCADE,
  label          text NOT NULL,      -- 'Intro' | 'Verse 1' | 'Chorus' | etc.
  start_seconds  numeric NOT NULL,
  end_seconds    numeric NOT NULL,
  position       integer NOT NULL,   -- display order on the reference
  notes          text
);

CREATE INDEX IF NOT EXISTS rs_sections_reference_idx  ON public.rs_sections (reference_id);
CREATE INDEX IF NOT EXISTS rs_sections_position_idx   ON public.rs_sections (reference_id, position);

-- ── ARRANGEMENTS ─────────────────────────────────────────────────────────
-- Calvary's version of a song, derived from one reference.
CREATE TABLE IF NOT EXISTS public.rs_arrangements (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id               uuid NOT NULL REFERENCES public.rs_songs(id) ON DELETE CASCADE,
  reference_id          uuid REFERENCES public.rs_references(id) ON DELETE SET NULL,  -- null until a reference is imported (Phase 2)
  name                  text NOT NULL,
  version               integer NOT NULL DEFAULT 1,
  key                   text,
  bpm                   integer,
  status                text NOT NULL DEFAULT 'draft',  -- 'draft'|'ready'|'archived'
  worship_leader_notes  text,
  created_by            text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rs_arrangements_song_idx   ON public.rs_arrangements (song_id);
CREATE INDEX IF NOT EXISTS rs_arrangements_status_idx ON public.rs_arrangements (status);

-- ── ARRANGEMENT SECTIONS ─────────────────────────────────────────────────
-- The ordered sequence of sections making up an arrangement.
CREATE TABLE IF NOT EXISTS public.rs_arrangement_sections (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arrangement_id   uuid NOT NULL REFERENCES public.rs_arrangements(id) ON DELETE CASCADE,
  section_id       uuid NOT NULL REFERENCES public.rs_sections(id) ON DELETE CASCADE,
  position         integer NOT NULL,
  notes            text
);

CREATE INDEX IF NOT EXISTS rs_arr_sections_arr_idx ON public.rs_arrangement_sections (arrangement_id, position);

-- ── ARRANGEMENT PARTS ────────────────────────────────────────────────────
-- Per-instrument guidance for an arrangement.
CREATE TABLE IF NOT EXISTS public.rs_arrangement_parts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arrangement_id   uuid NOT NULL REFERENCES public.rs_arrangements(id) ON DELETE CASCADE,
  part             text NOT NULL,   -- 'drums'|'bass'|'keys'|'electric'|'acoustic'|'lead_vocal'|'bv'
  notes            text,
  UNIQUE (arrangement_id, part)
);

-- ── SETS ─────────────────────────────────────────────────────────────────
-- A Sunday service (or Wednesday, or anniversary) set.
CREATE TABLE IF NOT EXISTS public.rs_sets (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  service_date   date NOT NULL,
  service_type   text,               -- 'sunday' | 'midweek' | 'special'
  notes          text,
  created_by     text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rs_sets_date_idx ON public.rs_sets (service_date);

-- ── SET ARRANGEMENTS ─────────────────────────────────────────────────────
-- Ordered arrangements in a set.
CREATE TABLE IF NOT EXISTS public.rs_set_arrangements (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id            uuid NOT NULL REFERENCES public.rs_sets(id) ON DELETE CASCADE,
  arrangement_id    uuid NOT NULL REFERENCES public.rs_arrangements(id) ON DELETE CASCADE,
  position          integer NOT NULL,
  transition_note   text
);

CREATE INDEX IF NOT EXISTS rs_set_arr_set_idx ON public.rs_set_arrangements (set_id, position);

-- ── PRACTICE SESSIONS ────────────────────────────────────────────────────
-- Gentle practice tracking. "Esther has practised this 4 times this week."
CREATE TABLE IF NOT EXISTS public.rs_practice_sessions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arrangement_id     uuid NOT NULL REFERENCES public.rs_arrangements(id) ON DELETE CASCADE,
  user_name          text NOT NULL,     -- Calvary OS user name (PIN-based; no auth user UUID)
  part               text NOT NULL,
  duration_seconds   integer,
  completed_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rs_practice_arr_idx    ON public.rs_practice_sessions (arrangement_id);
CREATE INDEX IF NOT EXISTS rs_practice_user_idx   ON public.rs_practice_sessions (user_name);
CREATE INDEX IF NOT EXISTS rs_practice_recent_idx ON public.rs_practice_sessions (completed_at DESC);

-- ── ASSIGNMENTS ──────────────────────────────────────────────────────────
-- Which team member is playing which part for which set.
CREATE TABLE IF NOT EXISTS public.rs_assignments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id           uuid NOT NULL REFERENCES public.rs_sets(id) ON DELETE CASCADE,
  arrangement_id   uuid REFERENCES public.rs_arrangements(id) ON DELETE CASCADE,  -- null = all arrangements in set
  user_name        text NOT NULL,
  part             text NOT NULL
);

CREATE INDEX IF NOT EXISTS rs_assignments_set_idx ON public.rs_assignments (set_id);

-- ── ROW-LEVEL SECURITY ───────────────────────────────────────────────────
-- v1: permissive — the anon key is only distributed to authenticated
-- Calvary OS users via the PIN gate. Tighten when we introduce Supabase Auth.
ALTER TABLE public.rs_songs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rs_references           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rs_stems                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rs_sections             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rs_arrangements         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rs_arrangement_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rs_arrangement_parts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rs_sets                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rs_set_arrangements     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rs_practice_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rs_assignments          ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'rs_songs','rs_references','rs_stems','rs_sections',
    'rs_arrangements','rs_arrangement_sections','rs_arrangement_parts',
    'rs_sets','rs_set_arrangements','rs_practice_sessions','rs_assignments'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "anon read"  ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "anon write" ON public.%I', t);
    EXECUTE format('CREATE POLICY "anon read"  ON public.%I FOR SELECT TO anon USING (true)', t);
    EXECUTE format('CREATE POLICY "anon write" ON public.%I FOR ALL    TO anon USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- ── STORAGE BUCKET ───────────────────────────────────────────────────────
-- Run separately in the Supabase Dashboard → Storage:
--   1. Create bucket: "rehearsal-studio"
--   2. Set to PUBLIC for v1 (signed URLs are better for v2)
--   3. File size limit: 50 MB (stems are ~7 MB each, references ~10 MB)
-- Path convention:
--   rehearsal-studio/references/{reference_id}/reference.mp3
--   rehearsal-studio/references/{reference_id}/peaks.json
--   rehearsal-studio/references/{reference_id}/stems/{stem_type}.mp3

-- ── SEED DATA ────────────────────────────────────────────────────────────
-- Only inserted if table is empty (so re-running this script is safe).
INSERT INTO public.rs_songs (title, original_artist, default_key, default_bpm, tags, created_by)
SELECT * FROM (VALUES
  ('Trading My Sorrows',                  'Darrell Evans',       'E',  132, ARRAY['praise','anniversary'],   'Bolaji Olatoye'),
  ('Friend of God',                       'Israel Houghton',     'G',  108, ARRAY['worship'],                'Bolaji Olatoye'),
  ('Here I Am to Worship',                'Tim Hughes',          'E',   72, ARRAY['worship'],                'Bolaji Olatoye'),
  ('Ancient of Days',                     'CityAlight',          'A',   76, ARRAY['worship'],                'Bolaji Olatoye'),
  ('Days of Elijah',                      'Robin Mark',          'D',  128, ARRAY['praise'],                 'Bolaji Olatoye'),
  ('Guide Me O Thou Great Jehovah',       'Traditional',         'G',   98, ARRAY['hymn','afro'],            'Bolaji Olatoye'),
  ('Praise The Name of Jesus',            'Roy Hicks Jr.',       'D',  108, ARRAY['praise','offering'],      'Bolaji Olatoye')
) AS t(title, original_artist, default_key, default_bpm, tags, created_by)
WHERE NOT EXISTS (SELECT 1 FROM public.rs_songs);

-- ── DONE ─────────────────────────────────────────────────────────────────
