-- Migration: rs_stem_variants
-- Purpose: pre-computed pitch-shifted variants of each stem, per reference.
--
-- Rationale: real-time pitch shifting in the browser (Phase 1 attempt)
-- introduced sync latency and quality artefacts that made vocals unusable
-- for rehearsal. Phase 2 takes the opposite approach: shift each stem
-- once offline (OfflineAudioContext + SoundTouch), store the result in
-- Supabase Storage, and swap which audio files play based on user's key
-- selection. Playback engine stays simple. Sync is perfect.
--
-- One row per (reference, stem, semitone-shift). semitone=0 rows are
-- never stored — the original stem is used directly.
--
-- Primary key intentionally composite: prevents duplicate variants for
-- the same reference+stem+semitone combination.

create table if not exists rs_stem_variants (
  reference_id   uuid        not null references rs_references(id) on delete cascade,
  stem_type      text        not null,  -- 'vocals', 'drums', 'bass', 'keys', 'guitar', 'strings', 'other'
  semitones      integer     not null,  -- -7..+7, excluding 0
  audio_path     text        not null,  -- Supabase Storage path
  created_at     timestamptz not null default now(),
  created_by     text,                  -- username from bridge_users_v2
  primary key (reference_id, stem_type, semitones),
  check (semitones between -7 and 7 and semitones <> 0)
);

-- Index for the main query: "list all variants for this reference"
create index if not exists rs_stem_variants_reference_idx
  on rs_stem_variants (reference_id);

-- RLS: same pattern as the other rs_* tables — allow public read, admins/leads write.
alter table rs_stem_variants enable row level security;

-- Read policy: any authenticated session can read (we gate by PIN at app level,
-- not at DB level, consistent with other rs_* tables)
drop policy if exists "rs_stem_variants read" on rs_stem_variants;
create policy "rs_stem_variants read"
  on rs_stem_variants for select
  using (true);

-- Write policy: insert/update/delete allowed for all (gated at app level).
-- Matches existing rs_* tables' permissive pattern. If we tighten auth later,
-- tighten here too.
drop policy if exists "rs_stem_variants write" on rs_stem_variants;
create policy "rs_stem_variants write"
  on rs_stem_variants for all
  using (true)
  with check (true);
