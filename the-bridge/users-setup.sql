-- THE BRIDGE — Simple PIN-based user table
-- Run in Supabase SQL Editor
-- https://supabase.com/dashboard/project/pfycvgbrsbecznkcikwt/sql/new

create table if not exists bridge_users_v2 (
  id        bigserial primary key,
  name      text not null,
  level     text not null default 'functional', -- 'cos' | 'functional'
  pin_hash  text not null,
  sections  text[] default '{}',
  active    boolean default true,
  created_at timestamptz default now()
);

alter table bridge_users_v2 enable row level security;

create policy "Allow all" on bridge_users_v2
  for all using (true) with check (true);

-- Bolaji — CoS level, PIN: 2610
insert into bridge_users_v2 (name, level, pin_hash, sections, active)
values (
  'Bolaji Olatoye',
  'cos',
  'bp_yhwbc0',
  ARRAY['priorities','actions','overview','finance','vision','protocols','media','worship','pastoral','cos','notes'],
  true
);
