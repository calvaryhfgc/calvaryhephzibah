-- Migration: add rehearsal_review_url to rs_sets
-- Purpose: each set can optionally link to a rehearsal review page
-- (e.g. the hosted HTML review of a recorded rehearsal with timestamped clips).
--
-- Surfaced in the team view as a prominent "Watch rehearsal review" button,
-- so team members landing on the set page can review the rehearsal in context.
--
-- Column: text (nullable). Expected to be a full https:// URL pointing to
-- a hosted rehearsal review page. Validation is client-side only.

alter table rs_sets
  add column if not exists rehearsal_review_url text;

comment on column rs_sets.rehearsal_review_url is
  'Optional URL to a rehearsal review page (e.g. YouTube clip navigator). Surfaced as a button in set-view.';
