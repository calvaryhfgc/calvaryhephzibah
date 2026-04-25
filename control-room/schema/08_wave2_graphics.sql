-- ============================================================
-- Wave 2: Images, People, Announcements
-- ============================================================

-- 1. Image library — base64 stored inline for simplicity
create table if not exists control_room_images (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'general',  -- 'offering' | 'communion' | 'sermon' | 'announcement' | 'general'
  data_url text not null,                     -- 'data:image/jpeg;base64,...'
  width integer,
  height integer,
  created_at timestamptz not null default now(),
  constraint valid_image_category check (category in ('offering','communion','sermon','announcement','general'))
);

create index if not exists idx_images_category on control_room_images(category, created_at desc);

alter table control_room_images disable row level security;
grant select, insert, update, delete on control_room_images to anon;

-- 2. People (for birthdays and anniversaries)
create table if not exists control_room_people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  birthday_month integer,           -- 1-12
  birthday_day integer,             -- 1-31
  anniversary_month integer,
  anniversary_day integer,
  anniversary_year integer,         -- year of marriage (for "X years today")
  spouse_name text,                 -- for anniversaries
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint valid_birthday_month check (birthday_month is null or birthday_month between 1 and 12),
  constraint valid_birthday_day   check (birthday_day   is null or birthday_day   between 1 and 31),
  constraint valid_anniversary_month check (anniversary_month is null or anniversary_month between 1 and 12),
  constraint valid_anniversary_day   check (anniversary_day   is null or anniversary_day   between 1 and 31)
);

create index if not exists idx_people_birthday    on control_room_people(birthday_month, birthday_day) where active;
create index if not exists idx_people_anniversary on control_room_people(anniversary_month, anniversary_day) where active;

alter table control_room_people disable row level security;
grant select, insert, update, delete on control_room_people to anon;

-- 3. Saved announcements (recurring midweek meetings, special one-offs)
create table if not exists control_room_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,                       -- e.g. 'Wednesday 7pm via Zoom'
  category text not null default 'midweek',  -- 'midweek' | 'special'
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint valid_announcement_category check (category in ('midweek','special'))
);

create index if not exists idx_announcements_active on control_room_announcements(active, position);

alter table control_room_announcements disable row level security;
grant select, insert, update, delete on control_room_announcements to anon;

-- 4. Extend plan_speakers with image_id (for sermon thumbnails)
alter table control_room_plan_speakers
  add column if not exists image_id uuid references control_room_images(id) on delete set null;

-- ============================================================
-- Seed midweek announcements (regular ones)
-- ============================================================
insert into control_room_announcements (title, body, category, position) values
  ('Bible Study',     'Wednesdays · 7:30pm · via Zoom',         'midweek', 1),
  ('Prayer Meeting',  'Fridays · 7:30pm · via Zoom',            'midweek', 2),
  ('Sunday Service',  'Sundays · 11:00am · in person & online', 'midweek', 3)
on conflict do nothing;

notify pgrst, 'reload schema';

-- Verify
select 'images'        as t, count(*)::text as n from control_room_images
union all
select 'people',        count(*)::text from control_room_people
union all
select 'announcements', count(*)::text from control_room_announcements;
