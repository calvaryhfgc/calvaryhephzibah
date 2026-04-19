-- Song library — persistent across weeks
-- Admin pastes lyrics once, reuses forever

create table if not exists control_room_songs (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  slides jsonb not null default '[]',
  section_default text,              -- suggested section (praise/worship/offering/end)
  artist text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_songs_title on control_room_songs(lower(title));

alter table control_room_songs disable row level security;
grant select, insert, update, delete on control_room_songs to anon;
