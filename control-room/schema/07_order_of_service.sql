-- Order of service — service moments tied to a plan
-- Each row is one item in the running order: who's leading what, when

create table if not exists control_room_plan_speakers (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references control_room_plans(id) on delete cascade,
  position integer not null,
  role text not null,                          -- 'Welcome & Bible Reading', 'Opening Prayer', etc.
  name text,                                    -- 'Pastor Gbenga Adebanjo' — null for "Worship Team" group items
  notes text,                                   -- e.g. 'Romans 6:1-23' for scripture readings
  created_at timestamptz not null default now()
);

create index if not exists idx_plan_speakers_plan on control_room_plan_speakers(plan_id, position);

alter table control_room_plan_speakers disable row level security;
grant select, insert, update, delete on control_room_plan_speakers to anon;

notify pgrst, 'reload schema';

-- Seed Sunday 26 April 2026 order of service
delete from control_room_plan_speakers
  where plan_id in (select id from control_room_plans where service_date = '2026-04-26');

insert into control_room_plan_speakers (plan_id, position, role, name, notes)
select p.id, v.position, v.role, v.name, v.notes
from control_room_plans p,
(values
  (1, 'Welcome & Bible Reading', 'Pastor Gbenga Adebanjo', null),
  (2, 'Opening Prayer',          'Sister Petty',           null),
  (3, 'Worship',                  null,                    'Worship Team'),
  (4, 'Communion',                'Brother Michael Kabalu', null),
  (5, 'Announcements',            'Pastor Kayode Ogungbenro', null),
  (6, 'Bible Reading',            'Dr Caster Martins',      'Romans 6:1-23'),
  (7, 'Sermon',                   'Brother Michael Kabalu', 'The Hope and Power of the Resurrection of Jesus Christ'),
  (8, 'Closing Prayer',           'Mummy Akintunde',        null),
  (9, 'Benediction',              'Sister Yinka Osipitan',  null)
) as v(position, role, name, notes)
where p.service_date = '2026-04-26';

-- Verify
select position, role, name, notes
from control_room_plan_speakers s
join control_room_plans p on p.id = s.plan_id
where p.service_date = '2026-04-26'
order by position;
