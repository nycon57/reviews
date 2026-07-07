BEGIN;

-- Tighten access patterns for analytics queries.
CREATE INDEX IF NOT EXISTS idx_proof_link_events_org_type_created
  ON public.proof_link_events (organization_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_proof_link_events_created_at
  ON public.proof_link_events (created_at DESC);

-- Lightweight retention helper for scheduled cleanup jobs.
CREATE OR REPLACE FUNCTION public.prune_proof_link_events(retention_days integer DEFAULT 365)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.proof_link_events
  WHERE created_at < (now() - make_interval(days => retention_days));

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.prune_proof_link_events(integer)
IS 'Deletes proof_link_events older than retention_days and returns deleted row count.';

-- Read-friendly aggregate view for dashboard rollups.
CREATE OR REPLACE VIEW public.proof_link_events_daily AS
SELECT
  organization_id,
  proof_link_id,
  event_type,
  date_trunc('day', created_at)::date AS event_date,
  count(*)::bigint AS event_count
FROM public.proof_link_events
GROUP BY organization_id, proof_link_id, event_type, date_trunc('day', created_at);

GRANT SELECT ON public.proof_link_events_daily TO authenticated;
GRANT SELECT ON public.proof_link_events_daily TO service_role;

COMMIT;
