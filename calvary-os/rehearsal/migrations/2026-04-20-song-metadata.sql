-- ═══════════════════════════════════════════════════════════════════════════
-- Rehearsal Studio — Phase 4.5 Migration: Song-level metadata fields
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Adds the "full hub" fields to rs_songs so the song detail page (song.html)
-- has proper columns to read from and write to. All new columns are nullable
-- so existing rows are unaffected.
--
-- Run this once in the Supabase SQL editor:
--   https://supabase.com/dashboard/project/pfycvgbrsbecznkcikwt/sql/new
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.rs_songs
  ADD COLUMN IF NOT EXISTS default_time_sig      text,
  ADD COLUMN IF NOT EXISTS ccli_number           text,
  ADD COLUMN IF NOT EXISTS youtube_url           text,
  ADD COLUMN IF NOT EXISTS spotify_url           text,
  ADD COLUMN IF NOT EXISTS chord_chart_url       text,
  ADD COLUMN IF NOT EXISTS lyrics                text,
  ADD COLUMN IF NOT EXISTS pastoral_notes        text,
  ADD COLUMN IF NOT EXISTS first_used_at         date,
  ADD COLUMN IF NOT EXISTS calvary_keys          text[],
  ADD COLUMN IF NOT EXISTS calvary_bpm_range     text,
  ADD COLUMN IF NOT EXISTS preferred_arrangement_id uuid;

-- FK for preferred arrangement, deferrable so chicken-and-egg doesn't bite
-- (create an arrangement, then mark it preferred). ON DELETE SET NULL so
-- deleting an arrangement doesn't cascade-null the song.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'rs_songs_preferred_arrangement_fk'
  ) THEN
    ALTER TABLE public.rs_songs
      ADD CONSTRAINT rs_songs_preferred_arrangement_fk
      FOREIGN KEY (preferred_arrangement_id)
      REFERENCES public.rs_arrangements(id)
      ON DELETE SET NULL
      DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

-- Verify the columns were added (returns column info for rs_songs)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'rs_songs'
ORDER BY ordinal_position;
