-- Display settings for the overlay — one row, id=1.
-- Operator updates it, overlay subscribes for live position changes.

create table if not exists control_room_display (
  id integer primary key default 1,
  position text not null default 'bottom',     -- 'bottom' | 'middle' | 'top'
  vertical_offset integer not null default 8,  -- percentage of viewport height
  size text not null default 'medium',         -- 'small' | 'medium' | 'large'
  updated_at timestamptz not null default now(),
  updated_by text,
  constraint only_one_display_row check (id = 1),
  constraint valid_position check (position in ('bottom','middle','top')),
  constraint valid_size check (size in ('small','medium','large')),
  constraint valid_offset check (vertical_offset between 0 and 40)
);

insert into control_room_display (id, position, vertical_offset, size)
values (1, 'bottom', 8, 'medium')
on conflict (id) do nothing;

alter table control_room_display disable row level security;
grant select, insert, update on control_room_display to anon;

notify pgrst, 'reload schema';
