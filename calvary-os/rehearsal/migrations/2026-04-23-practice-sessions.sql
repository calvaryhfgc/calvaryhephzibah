-- Migration: rs_practice_sessions
-- Purpose: lightweight log of "I practised this" actions from team members.
--
-- Triggered by the "Mark as practised" button in practice.html. One row
-- per tap. Worship leaders read aggregated counts on the set editor;
-- team members see their own count on the team view.
--
-- Identity model: user_name is the display name from Calvary OS (e.g.
-- 'Morayo Ogungbenro'), not a FK. The PIN-auth system doesn't assign
-- UUIDs to users, so we store the name verbatim. If a user is renamed
-- in shell.js, their historical sessions stay under the old name until
-- cleaned up.
--
-- Duration_seconds is optional; we leave it null for the MVP. Hook can
-- be added later if we decide time-in-practice matters.

create table if not exists rs_practice_sessions (
  id                uuid        primary key default gen_random_uuid(),
  arrangement_id    uuid        not null references rs_arrangements(id) on delete cascade,
  user_name         text        not null,
  part              text        not null,
  duration_seconds  integer,
  completed_at      timestamptz not null default now()
);

-- Indexes for the three aggregate queries:
--   per-arrangement count (set editor)
--   per-user count        (team view)
--   recent sessions       (week-window filter)
create index if not exists rs_practice_arr_idx    on rs_practice_sessions (arrangement_id);
create index if not exists rs_practice_user_idx   on rs_practice_sessions (user_name);
create index if not exists rs_practice_recent_idx on rs_practice_sessions (completed_at desc);

-- RLS — same pattern as other rs_* tables: public read, permissive write
-- (auth is gated at the app level via PIN, not DB RLS).
alter table rs_practice_sessions enable row level security;

drop policy if exists "rs_practice read"  on rs_practice_sessions;
drop policy if exists "rs_practice write" on rs_practice_sessions;

create policy "rs_practice read"  on rs_practice_sessions for select using (true);
create policy "rs_practice write" on rs_practice_sessions for all    using (true) with check (true);
