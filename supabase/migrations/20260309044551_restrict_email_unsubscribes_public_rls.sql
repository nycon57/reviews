-- Mirrors the production hardening applied to the Reviews Supabase project on
-- 2026-03-09. Public inserts remain allowed for unsubscribe links, but public
-- reads and deletes are removed because the live app now handles those
-- operations through server-side admin routes and RPCs.

DROP POLICY IF EXISTS "Allow selecting own unsubscribe" ON public.email_unsubscribes;
DROP POLICY IF EXISTS "Allow resubscribe with token" ON public.email_unsubscribes;
