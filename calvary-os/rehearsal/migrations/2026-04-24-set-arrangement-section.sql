-- Migration: Section labels for set arrangements
-- Date: 2026-04-24
-- Scope: Powers section grouping in the band-facing Sunday view
--        (Praise / Worship / Offering / End of service).
--
-- Stored values are snake_case identifiers, not display labels:
--   'praise', 'worship', 'offering', 'end_of_service'
-- Renderers map these to pretty labels.

alter table public.rs_set_arrangements
  add column if not exists section text;

comment on column public.rs_set_arrangements.section is
  'Where this arrangement sits in the service flow: praise | worship | offering | end_of_service. Null = unassigned (renderer will group under a generic "Songs" heading).';
