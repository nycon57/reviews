BEGIN;

-- Make dashboard rollups honor the caller's RLS policies on proof_link_events.
ALTER VIEW public.proof_link_events_daily
  SET (security_invoker = true);

REVOKE ALL ON TABLE public.proof_link_events_daily
  FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.proof_link_events_daily TO authenticated;
GRANT SELECT ON TABLE public.proof_link_events_daily TO service_role;

-- auto_reply_queue is an internal workflow queue. Keep writes server-side, but
-- allow scoped reads for authenticated users if the Data API path is used.
ALTER TABLE public.auto_reply_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_view_scoped_auto_reply_queue"
  ON public.auto_reply_queue;
CREATE POLICY "users_view_scoped_auto_reply_queue"
  ON public.auto_reply_queue
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.get_user_organization_id()
    AND (
      user_id = public.get_current_user_id()
      OR public.user_has_role(ARRAY['admin', 'manager'])
    )
  );

REVOKE ALL ON TABLE public.auto_reply_queue
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.auto_reply_queue TO authenticated;
GRANT ALL ON TABLE public.auto_reply_queue TO service_role;

-- Restore audit-log RLS from the original multi-tenant migration and avoid
-- public/browser writes. Inserts are performed by trusted server code/triggers.
ALTER TABLE public.organization_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_view_audit_logs"
  ON public.organization_audit_logs;
DROP POLICY IF EXISTS "system_insert_audit_logs"
  ON public.organization_audit_logs;
CREATE POLICY "admins_view_audit_logs"
  ON public.organization_audit_logs
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.get_user_organization_id()
    AND public.user_has_role(ARRAY['admin'])
  );

REVOKE ALL ON TABLE public.organization_audit_logs
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.organization_audit_logs TO authenticated;
GRANT ALL ON TABLE public.organization_audit_logs TO service_role;

COMMIT;
