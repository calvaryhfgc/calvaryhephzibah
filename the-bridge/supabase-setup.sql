-- THE BRIDGE — Calvary Hephzibah
-- Run this in Supabase → SQL Editor to set up the database
-- Project: pfycvgbrsbecznkcikwt

-- 1. Ministry status table (stores RAG status per ministry area)
create table if not exists bridge_ministry_status (
  ministry_id text primary key,
  status text not null default 'grey',
  updated_at timestamptz default now()
);

-- 2. Priorities table
create table if not exists bridge_priorities (
  id bigserial primary key,
  title text not null,
  description text,
  urgency text not null default 'high',
  owner text,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Notes table (single shared notes doc)
create table if not exists bridge_notes (
  id integer primary key default 1,
  content text default '',
  updated_at timestamptz default now()
);

-- 4. Enable Row Level Security (RLS) — open read/write for now
-- You can tighten this later with auth
alter table bridge_ministry_status enable row level security;
alter table bridge_priorities enable row level security;
alter table bridge_notes enable row level security;

create policy "Allow all" on bridge_ministry_status for all using (true) with check (true);
create policy "Allow all" on bridge_priorities for all using (true) with check (true);
create policy "Allow all" on bridge_notes for all using (true) with check (true);
