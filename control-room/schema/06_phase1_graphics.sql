-- Phase 1: Lower thirds + Logo bug
-- 1. Speakers library (for lower thirds quick-pick)
create table if not exists control_room_speakers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_speakers_active on control_room_speakers(active, position);

alter table control_room_speakers disable row level security;
grant select, insert, update, delete on control_room_speakers to anon;

-- Seed common speakers
insert into control_room_speakers (name, role, position) values
  ('Pastor Shade Olatoye',     'General Overseer',  1),
  ('Pastor Gbenga Adebanjo',   'Leadership',        2),
  ('Pastor Funke Adebanjo',    'Senior Pastor',     3),
  ('Pastor Kayode Ogungbenro', 'Leadership',        4),
  ('Pastor Kemi Ogungbenro',   'Leadership',        5),
  ('Dr Ayo Olatoye',           'Trustee',           6),
  ('Brother Michael Kabalu',   'Worship',           7),
  ('Dr Caster Martins',        'Worship Leader',    8),
  ('Pastor Funke Adebanjo',    'Benediction',       9)
on conflict do nothing;

-- 2. Extend live state to include independent lower third
-- payload now also supports a `lower_third` key alongside mode-specific fields
-- e.g. { mode: 'lyric', payload: { line1, line2 }, lower_third: { name, role } }
-- We add a new top-level column instead of cramming into payload.

alter table control_room_live
  add column if not exists lower_third jsonb default null;

-- 3. Extend display settings for logo bug
alter table control_room_display
  add column if not exists logo_corner text default 'off',
  add column if not exists logo_opacity integer default 80,
  add column if not exists logo_size integer default 80;

-- Constraint values: 'off', 'tl', 'tr', 'bl', 'br'
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'valid_logo_corner') then
    alter table control_room_display
      add constraint valid_logo_corner check (logo_corner in ('off','tl','tr','bl','br'));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'valid_logo_opacity') then
    alter table control_room_display
      add constraint valid_logo_opacity check (logo_opacity between 20 and 100);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'valid_logo_size') then
    alter table control_room_display
      add constraint valid_logo_size check (logo_size between 40 and 200);
  end if;
end $$;

notify pgrst, 'reload schema';
