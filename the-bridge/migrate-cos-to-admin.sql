-- ============================================================================
-- THE BRIDGE — Rename 'cos' level to 'admin'
-- ============================================================================
-- Run in Supabase SQL Editor after deploying the code changes that strip
-- Chief of Staff terminology from the Bridge UI.
--
-- https://supabase.com/dashboard/project/pfycvgbrsbecznkcikwt/sql/new
-- ============================================================================

-- Rename the level for all existing users
update bridge_users_v2
set level = 'admin'
where level = 'cos';

-- Remove the 'cos' section entry from any user's sections array
-- (the Chief of Staff section page has been deleted)
update bridge_users_v2
set sections = array_remove(sections, 'cos')
where 'cos' = any(sections);

-- Verify
select id, name, level, sections from bridge_users_v2 order by id;
