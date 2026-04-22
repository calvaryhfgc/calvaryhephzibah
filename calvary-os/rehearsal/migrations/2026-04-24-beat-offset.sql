-- Migration: beat_offset_seconds on rs_references
-- Purpose: store a per-reference timing offset so the beat grid can be
-- aligned to the actual downbeat of the recording.
--
-- Moises returns BPM but doesn't tell us where beat 1 of bar 1 actually
-- falls in the audio — it could be anywhere in the first few seconds
-- depending on pickup notes, studio timing, or how the recording was
-- topped-and-tailed. The user aligns the grid manually in reference.html
-- and we persist the offset here so every future load (plus any
-- arrangements derived from this reference) inherits the correct
-- alignment.
--
-- Units: seconds (float). Can be negative if beat 1 lands before t=0
-- of the recording (rare but possible with trimmed intros).
-- Typical range: -0.5 to +2.0.
-- Default: 0 (no alignment adjustment).

alter table rs_references
  add column if not exists beat_offset_seconds numeric not null default 0;

comment on column rs_references.beat_offset_seconds is
  'Seconds to offset the beat grid by, so beat 1 of every bar lines up with the actual downbeat. Can be negative.';
