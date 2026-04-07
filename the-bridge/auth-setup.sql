-- THE BRIDGE — Multi-user auth setup
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/pfycvgbrsbecznkcikwt/sql/new

-- 1. Bridge users (linked to Supabase auth.users)
create table if not exists bridge_users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'coordinator', -- 'super' | 'leadership' | 'coordinator'
  pin_hash text,                             -- bcrypt hash of their PIN
  pin_set boolean default false,
  sections text[] default '{}',             -- array of page ids they can access
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_login timestamptz,
  active boolean default true
);

-- 2. Session pins (device trust after magic link auth)
create table if not exists bridge_sessions (
  id bigserial primary key,
  user_id uuid references bridge_users(id) on delete cascade,
  device_token text not null,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '30 days')
);

-- 3. Access log
create table if not exists bridge_access_log (
  id bigserial primary key,
  user_id uuid references bridge_users(id) on delete cascade,
  action text not null,
  detail text,
  created_at timestamptz default now()
);

-- RLS
alter table bridge_users enable row level security;
alter table bridge_sessions enable row level security;
alter table bridge_access_log enable row level security;

-- Policies: users can read/update their own record; service role can do everything
create policy "Users can read own profile" on bridge_users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on bridge_users
  for update using (auth.uid() = id);

create policy "Super users can read all" on bridge_users
  for select using (
    exists (select 1 from bridge_users where id = auth.uid() and role = 'super')
  );

create policy "Super users can insert" on bridge_users
  for insert with check (
    exists (select 1 from bridge_users where id = auth.uid() and role = 'super')
  );

create policy "Super users can update all" on bridge_users
  for update using (
    exists (select 1 from bridge_users where id = auth.uid() and role = 'super')
  );

create policy "Users manage own sessions" on bridge_sessions
  for all using (auth.uid() = user_id);

create policy "Users write own log" on bridge_access_log
  for insert with check (auth.uid() = user_id);

create policy "Super read all logs" on bridge_access_log
  for select using (
    exists (select 1 from bridge_users where id = auth.uid() and role = 'super')
  );

-- Insert the super user (Bolaji) — update the UUID after first login
-- You'll need to run this after your first magic link login to set your role
-- UPDATE bridge_users SET role = 'super' WHERE email = 'your@email.com';

