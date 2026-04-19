-- Today's set list (Sunday 19th April 2026)
-- Placeholder slides — replace with real lyrics later

-- Clear any existing plan for today (idempotent — safe to re-run)
delete from control_room_plans where service_date = '2026-04-19';

-- Create the plan and grab its ID
with new_plan as (
  insert into control_room_plans (service_date, notes)
  values ('2026-04-19', 'Easter Sunday — The Case for the Resurrection (Brother Michael Kabalu)')
  returning id
)
insert into control_room_plan_items (plan_id, position, kind, title, section, slides)
select
  (select id from new_plan),
  position, kind, title, section, slides::jsonb
from (values
  (1, 'song', 'Lord You Are Good', 'praise',
    '[
      {"line1":"[placeholder slide 1]","line2":"[replace with real lyrics]"},
      {"line1":"[placeholder slide 2]","line2":"[replace with real lyrics]"},
      {"line1":"[placeholder slide 3]","line2":"[replace with real lyrics]"},
      {"line1":"[placeholder slide 4]","line2":"[replace with real lyrics]"}
    ]'),

  (2, 'song', 'Trading My Sorrows', 'praise',
    '[
      {"line1":"[placeholder slide 1]","line2":"[replace with real lyrics]"},
      {"line1":"[placeholder slide 2]","line2":"[replace with real lyrics]"},
      {"line1":"[placeholder slide 3]","line2":"[replace with real lyrics]"}
    ]'),

  (3, 'song', 'All Things Are Possible (Almighty God)', 'praise',
    '[
      {"line1":"[placeholder slide 1]","line2":"[replace with real lyrics]"},
      {"line1":"[placeholder slide 2]","line2":"[replace with real lyrics]"},
      {"line1":"[placeholder slide 3]","line2":"[replace with real lyrics]"}
    ]'),

  (4, 'song', 'Friend of God', 'praise',
    '[
      {"line1":"[placeholder slide 1]","line2":"[replace with real lyrics]"},
      {"line1":"[placeholder slide 2]","line2":"[replace with real lyrics]"},
      {"line1":"[placeholder slide 3]","line2":"[replace with real lyrics]"}
    ]'),

  (5, 'song', 'My Jesus (Shout to the Lord)', 'worship',
    '[
      {"line1":"[placeholder slide 1]","line2":"[replace with real lyrics]"},
      {"line1":"[placeholder slide 2]","line2":"[replace with real lyrics]"},
      {"line1":"[placeholder slide 3]","line2":"[replace with real lyrics]"},
      {"line1":"[placeholder slide 4]","line2":"[replace with real lyrics]"}
    ]'),

  (6, 'song', 'Here I Am to Worship', 'worship',
    '[
      {"line1":"[placeholder slide 1]","line2":"[replace with real lyrics]"},
      {"line1":"[placeholder slide 2]","line2":"[replace with real lyrics]"},
      {"line1":"[placeholder slide 3]","line2":"[replace with real lyrics]"}
    ]'),

  (7, 'song', 'Ancient of Days', 'offering',
    '[
      {"line1":"[placeholder slide 1]","line2":"[replace with real lyrics]"},
      {"line1":"[placeholder slide 2]","line2":"[replace with real lyrics]"},
      {"line1":"[placeholder slide 3]","line2":"[replace with real lyrics]"}
    ]'),

  (8, 'song', 'Here I Am to Worship (reprise)', 'end',
    '[
      {"line1":"[placeholder slide 1]","line2":"[replace with real lyrics]"},
      {"line1":"[placeholder slide 2]","line2":"[replace with real lyrics]"}
    ]')
) as v(position, kind, title, section, slides);

-- Verify
select
  p.service_date,
  p.notes,
  count(i.id) as songs,
  sum(jsonb_array_length(i.slides)) as total_slides
from control_room_plans p
left join control_room_plan_items i on i.plan_id = p.id
where p.service_date = '2026-04-19'
group by p.service_date, p.notes;
