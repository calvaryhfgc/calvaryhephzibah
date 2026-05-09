-- =====================================================
-- 11_backdrops.sql — Backdrop layer + saved playlists
-- =====================================================
-- Adds a "backdrop" layer that renders behind everything
-- on the overlay (lyrics, verses, lower thirds, graphics).
-- Backdrops are playlists of images/videos that auto-cycle.
-- =====================================================

-- Add `backdrop` column to live state.
-- Shape when active:
--   {
--     "playlist_id": uuid | null,    -- if loaded from saved playlist
--     "name":        text,           -- display name
--     "items":       [ { media_id, media_url, media_type, duration_seconds } ],
--     "started_at":  timestamp,      -- when this run began (drives auto-advance sync)
--     "current_idx": int,            -- which item is currently showing (manual override)
--     "manual":      bool,           -- true = paused on current_idx, false = auto-advance
--     "loop":        bool            -- if false, stop after last item; default true
--   }
-- When null: no backdrop on screen.
alter table public.control_room_live
  add column if not exists backdrop jsonb;

-- Saved playlists, so operators can rebuild quickly.
create table if not exists public.control_room_backdrops (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  items       jsonb not null default '[]'::jsonb,
  -- items is an array of { media_id (uuid), duration_seconds (int) }
  -- media_url and media_type are looked up from control_room_images at play time
  notes       text,
  created_by  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Disable RLS, grant access to anon (consistent with the rest of the schema)
alter table public.control_room_backdrops disable row level security;
grant select, insert, update, delete on public.control_room_backdrops to anon;

-- Realtime: include in publication so operator changes propagate to overlay
alter publication supabase_realtime add table public.control_room_backdrops;
alter table public.control_room_backdrops replica identity full;

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
