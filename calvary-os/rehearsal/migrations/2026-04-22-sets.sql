-- Migration: rs_sets + rs_set_arrangements
-- Purpose: service-level grouping of arrangements.
--
-- A "set" is an ordered list of arrangements for a specific service
-- (Sunday, Wednesday Bible Study, anniversary). Sets are the container
-- that ties arrangements to a specific date and worship context.
--
-- Data model:
--   rs_sets              — one row per service. Name + date + type + notes.
--   rs_set_arrangements  — ordered arrangements within a set. Each row
--                          references one arrangement with a position and
--                          optional transition note (e.g. "key change to F",
--                          "segue direct", "MC bridge between songs").
--
-- Tables are defined in rehearsal-schema.sql too; this migration applies
-- them idempotently in case the schema file hasn't been run against this
-- Supabase instance.

-- ── SETS ─────────────────────────────────────────────────────────────
-- A Sunday service (or Wednesday, or anniversary) set.
create table if not exists rs_sets (
  id             uuid        primary key default gen_random_uuid(),
  name           text        not null,
  service_date   date        not null,
  service_type   text,                  -- 'sunday' | 'midweek' | 'special'
  notes          text,
  created_by     text,                  -- username from bridge_users_v2
  created_at     timestamptz not null default now()
);

create index if not exists rs_sets_date_idx on rs_sets (service_date);

-- ── SET ARRANGEMENTS ─────────────────────────────────────────────────
-- Ordered arrangements in a set.
create table if not exists rs_set_arrangements (
  id                uuid        primary key default gen_random_uuid(),
  set_id            uuid        not null references rs_sets(id) on delete cascade,
  arrangement_id    uuid        not null references rs_arrangements(id) on delete cascade,
  position          integer     not null,
  transition_note   text
);

create index if not exists rs_set_arr_set_idx on rs_set_arrangements (set_id, position);

-- ── RLS ──────────────────────────────────────────────────────────────
-- Same pattern as other rs_* tables: public read, permissive write
-- (auth is gated at the app level via PIN, not DB RLS).

alter table rs_sets                 enable row level security;
alter table rs_set_arrangements     enable row level security;

drop policy if exists "rs_sets read"             on rs_sets;
drop policy if exists "rs_sets write"            on rs_sets;
drop policy if exists "rs_set_arrangements read"  on rs_set_arrangements;
drop policy if exists "rs_set_arrangements write" on rs_set_arrangements;

create policy "rs_sets read"            on rs_sets              for select using (true);
create policy "rs_sets write"           on rs_sets              for all    using (true) with check (true);
create policy "rs_set_arrangements read"  on rs_set_arrangements for select using (true);
create policy "rs_set_arrangements write" on rs_set_arrangements for all    using (true) with check (true);
