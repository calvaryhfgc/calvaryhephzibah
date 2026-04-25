-- ============================================================
-- Wave 4: Move media to Supabase Storage
-- ============================================================
-- This migrates from base64-in-table to proper file storage.
-- Old `data_url` field is preserved for backward compat;
-- new uploads write to Storage and populate `storage_path` instead.

-- 1. Add storage_path column
alter table control_room_images
  add column if not exists storage_path text;

-- 2. Make data_url nullable (it's required currently — relax that for new rows)
alter table control_room_images
  alter column data_url drop not null;

-- 3. Create the bucket programmatically.
-- This runs once; subsequent runs no-op via on conflict.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'control-room-media',
  'control-room-media',
  true,                          -- public read
  52428800,                      -- 50 MB per file
  array[
    'image/jpeg','image/png','image/gif','image/webp',
    'video/mp4','video/webm','video/quicktime'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 4. Storage RLS policies
-- The objects table has RLS enabled by default; we add policies for the bucket
-- so that anon (i.e. our PIN-authed users) can read, upload, and manage files
-- in the 'control-room-media' bucket only.

-- Allow anon to SELECT (read) anything in this bucket
drop policy if exists "control_room_media_select" on storage.objects;
create policy "control_room_media_select" on storage.objects
  for select to anon
  using (bucket_id = 'control-room-media');

-- Allow anon to INSERT (upload) into this bucket
drop policy if exists "control_room_media_insert" on storage.objects;
create policy "control_room_media_insert" on storage.objects
  for insert to anon
  with check (bucket_id = 'control-room-media');

-- Allow anon to UPDATE files in this bucket (e.g. replace existing)
drop policy if exists "control_room_media_update" on storage.objects;
create policy "control_room_media_update" on storage.objects
  for update to anon
  using (bucket_id = 'control-room-media')
  with check (bucket_id = 'control-room-media');

-- Allow anon to DELETE files in this bucket
drop policy if exists "control_room_media_delete" on storage.objects;
create policy "control_room_media_delete" on storage.objects
  for delete to anon
  using (bucket_id = 'control-room-media');

notify pgrst, 'reload schema';

-- Verify
select 'bucket exists' as check, count(*) as result
  from storage.buckets where id = 'control-room-media'
union all
select 'policies count', count(*)
  from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'control_room_media_%';
