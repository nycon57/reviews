-- RPC functions for campaign workflow locking.
-- Bypasses PostgREST schema cache issues with the locked_by/locked_at columns.

CREATE OR REPLACE FUNCTION acquire_campaign_lock(
  p_campaign_id UUID,
  p_user_id UUID,
  p_organization_id UUID,
  p_lock_ttl_ms INT DEFAULT 900000
)
RETURNS TABLE(acquired BOOLEAN, current_locked_by UUID, current_locked_at TIMESTAMPTZ, locked_by_name TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_lock_expiry TIMESTAMPTZ := NOW() - (p_lock_ttl_ms || ' milliseconds')::INTERVAL;
  v_updated INT;
BEGIN
  UPDATE campaign_workflows
  SET locked_by = p_user_id,
      locked_at = NOW(),
      updated_by = p_user_id,
      updated_at = NOW()
  WHERE id = p_campaign_id
    AND organization_id = p_organization_id
    AND (locked_by IS NULL OR locked_by = p_user_id OR locked_at < v_lock_expiry);

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated > 0 THEN
    RETURN QUERY SELECT TRUE, NULL::UUID, NOW(), NULL::TEXT;
  ELSE
    RETURN QUERY
      SELECT FALSE, cw.locked_by, cw.locked_at, u.full_name
      FROM campaign_workflows cw
      LEFT JOIN users u ON u.id = cw.locked_by
      WHERE cw.id = p_campaign_id AND cw.organization_id = p_organization_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION release_campaign_lock(
  p_campaign_id UUID,
  p_user_id UUID,
  p_organization_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE campaign_workflows
  SET locked_by = NULL,
      locked_at = NULL,
      updated_by = p_user_id,
      updated_at = NOW()
  WHERE id = p_campaign_id
    AND organization_id = p_organization_id
    AND locked_by = p_user_id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;
