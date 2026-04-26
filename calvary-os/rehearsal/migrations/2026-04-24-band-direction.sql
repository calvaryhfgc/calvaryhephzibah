-- Migration: Band direction one-liner for the band-facing Sunday view
-- Date: 2026-04-24
-- Scope: Powers the simple band view at band-sunday.html and
--        calvary-os/rehearsal/band.html
--
-- Two columns. The set_arrangements override is rare — most Sundays we want
-- the same direction we use any Sunday for that arrangement.
--
--   render order: set_arrangement.band_direction_override
--               || arrangement.band_direction
--               || (empty)

alter table public.rs_arrangements
  add column if not exists band_direction text;

alter table public.rs_set_arrangements
  add column if not exists band_direction_override text;

comment on column public.rs_arrangements.band_direction is
  'Single-line top-level direction shown on the band-facing Sunday view (e.g. "Sustain on the word ''sor'' — Uncle B''s correction"). Keep under ~200 chars. Sentence case, no emoji.';

comment on column public.rs_set_arrangements.band_direction_override is
  'Per-service override of the arrangement''s band_direction. Use sparingly — only when this specific service needs different guidance for the same arrangement.';
