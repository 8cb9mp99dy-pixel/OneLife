-- ============================================================
-- Fix: 0001_init.sql created RLS policies but never granted the
-- base table privileges those policies filter. RLS restricts which
-- *rows* a role can see/touch; the role still needs a plain GRANT
-- to attempt the operation at all. Without this, every request came
-- back "permission denied" (42501) before RLS was even evaluated.
--
-- Only `authenticated` gets access — `anon` stays fully locked out,
-- since every screen in this app requires sign-in.
-- ============================================================

grant usage on schema public to authenticated;

grant select, insert, update, delete on public.area to authenticated;
grant select, insert, update, delete on public.task to authenticated;
grant select, insert, update, delete on public.habit to authenticated;
grant select, insert, update, delete on public.habit_log to authenticated;
