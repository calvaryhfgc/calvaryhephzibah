-- Add media_type to images table so it can hold both images and silent looping videos
alter table control_room_images
  add column if not exists media_type text not null default 'image';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'valid_media_type') then
    alter table control_room_images
      add constraint valid_media_type check (media_type in ('image','video'));
  end if;
end $$;

-- Rename the table conceptually — keep the same name for backward compat,
-- but it now holds both images and videos. The data_url column carries either.

notify pgrst, 'reload schema';

-- Verify
select media_type, count(*) from control_room_images group by media_type;
