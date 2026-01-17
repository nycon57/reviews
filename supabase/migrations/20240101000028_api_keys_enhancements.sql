-- API Keys Enhancements Migration
-- Adds usage logging, rotation support, and validation function

-- ============================================================================
-- 1. API Key Usage Logs Table (Audit Trail)
-- ============================================================================
CREATE TABLE api_key_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  status_code INTEGER,
  request_id TEXT,
  ip_address INET,
  user_agent TEXT,
  response_time_ms INTEGER,
  request_body_size INTEGER,
  response_body_size INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_api_key_usage_logs_api_key ON api_key_usage_logs(api_key_id);
CREATE INDEX idx_api_key_usage_logs_org ON api_key_usage_logs(organization_id);
CREATE INDEX idx_api_key_usage_logs_created ON api_key_usage_logs(created_at);
CREATE INDEX idx_api_key_usage_logs_endpoint ON api_key_usage_logs(endpoint);

-- Partitioning hint: For production, consider partitioning by month
-- ALTER TABLE api_key_usage_logs SET (timescaledb.compress);

-- ============================================================================
-- 2. Enhance api_keys Table
-- ============================================================================
-- Add rotation tracking columns
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS rotated_from UUID REFERENCES api_keys(id);
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS rotated_at TIMESTAMPTZ;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS environment TEXT DEFAULT 'live' CHECK (environment IN ('live', 'test'));
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS scopes TEXT[] DEFAULT ARRAY['read'];
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS request_count BIGINT DEFAULT 0;

-- Add index for quick lookup by environment
CREATE INDEX IF NOT EXISTS idx_api_keys_environment ON api_keys(organization_id, environment);

-- ============================================================================
-- 3. Rate Limit Windows Table
-- ============================================================================
CREATE TABLE api_rate_limit_windows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  request_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint to prevent duplicate windows
CREATE UNIQUE INDEX idx_api_rate_limit_windows_unique
  ON api_rate_limit_windows(api_key_id, window_start);

-- Index for cleanup of old windows
CREATE INDEX idx_api_rate_limit_windows_end ON api_rate_limit_windows(window_end);

-- ============================================================================
-- 4. Validate API Key Function
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_api_key(
  p_key_hash TEXT,
  p_required_scopes TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS TABLE (
  api_key_id UUID,
  organization_id UUID,
  scopes TEXT[],
  rate_limit INTEGER,
  is_valid BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_key RECORD;
BEGIN
  -- Look up the key by hash
  SELECT
    ak.id,
    ak.organization_id,
    COALESCE(ak.scopes, ak.permissions) AS scopes,
    ak.rate_limit,
    ak.is_active,
    ak.expires_at
  INTO v_key
  FROM api_keys ak
  WHERE ak.key_hash = p_key_hash;

  -- Key not found
  IF v_key IS NULL THEN
    RETURN QUERY SELECT
      NULL::UUID,
      NULL::UUID,
      ARRAY[]::TEXT[],
      0,
      FALSE,
      'Invalid API key'::TEXT;
    RETURN;
  END IF;

  -- Key is inactive
  IF NOT v_key.is_active THEN
    RETURN QUERY SELECT
      v_key.id,
      v_key.organization_id,
      v_key.scopes,
      v_key.rate_limit,
      FALSE,
      'API key is inactive'::TEXT;
    RETURN;
  END IF;

  -- Key is expired
  IF v_key.expires_at IS NOT NULL AND v_key.expires_at < NOW() THEN
    RETURN QUERY SELECT
      v_key.id,
      v_key.organization_id,
      v_key.scopes,
      v_key.rate_limit,
      FALSE,
      'API key has expired'::TEXT;
    RETURN;
  END IF;

  -- Check required scopes
  IF array_length(p_required_scopes, 1) > 0 THEN
    IF NOT (p_required_scopes <@ v_key.scopes OR 'admin' = ANY(v_key.scopes)) THEN
      RETURN QUERY SELECT
        v_key.id,
        v_key.organization_id,
        v_key.scopes,
        v_key.rate_limit,
        FALSE,
        'Insufficient permissions'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Update last_used_at
  UPDATE api_keys SET last_used_at = NOW() WHERE id = v_key.id;

  -- Valid key
  RETURN QUERY SELECT
    v_key.id,
    v_key.organization_id,
    v_key.scopes,
    v_key.rate_limit,
    TRUE,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. Check API Rate Limit Function
-- ============================================================================
CREATE OR REPLACE FUNCTION check_api_rate_limit(
  p_api_key_id UUID,
  p_rate_limit INTEGER DEFAULT 1000
)
RETURNS TABLE (
  is_allowed BOOLEAN,
  current_count INTEGER,
  limit_count INTEGER,
  reset_at TIMESTAMPTZ
) AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  -- Calculate current hour window
  v_window_start := DATE_TRUNC('hour', NOW());
  v_window_end := v_window_start + INTERVAL '1 hour';

  -- Get or create rate limit window (with upsert)
  INSERT INTO api_rate_limit_windows (api_key_id, window_start, window_end, request_count)
  VALUES (p_api_key_id, v_window_start, v_window_end, 1)
  ON CONFLICT (api_key_id, window_start)
  DO UPDATE SET request_count = api_rate_limit_windows.request_count + 1
  RETURNING api_rate_limit_windows.request_count INTO v_count;

  -- Return rate limit status
  RETURN QUERY SELECT
    v_count <= p_rate_limit,
    v_count,
    p_rate_limit,
    v_window_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. Increment API Key Request Count Function
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_api_key_request_count(
  p_api_key_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE api_keys
  SET request_count = COALESCE(request_count, 0) + 1
  WHERE id = p_api_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. Cleanup Old Rate Limit Windows Function
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_old_rate_limit_windows()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM api_rate_limit_windows
  WHERE window_end < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. RLS Policies
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE api_key_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_rate_limit_windows ENABLE ROW LEVEL SECURITY;

-- API Key Usage Logs policies (admin only)
CREATE POLICY "Admins can view their org's API key usage logs"
  ON api_key_usage_logs FOR SELECT
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin'])
  );

CREATE POLICY "Service role can manage API key usage logs"
  ON api_key_usage_logs FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Rate Limit Windows policies (service role only - internal use)
CREATE POLICY "Service role can manage rate limit windows"
  ON api_rate_limit_windows FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- ============================================================================
-- 9. Update API Keys RLS Policies
-- ============================================================================
-- Drop and recreate api_keys policies for better admin management
DROP POLICY IF EXISTS "Users can view their org's API keys" ON api_keys;
DROP POLICY IF EXISTS "Admins can manage API keys" ON api_keys;

CREATE POLICY "Admins can view their org's API keys"
  ON api_keys FOR SELECT
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin'])
  );

CREATE POLICY "Admins can create API keys"
  ON api_keys FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin'])
  );

CREATE POLICY "Admins can update their org's API keys"
  ON api_keys FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin'])
  );

CREATE POLICY "Admins can delete their org's API keys"
  ON api_keys FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin'])
  );

-- ============================================================================
-- 10. Add webhook_configs columns for migration support
-- ============================================================================
ALTER TABLE webhook_configs ADD COLUMN IF NOT EXISTS api_key_id UUID REFERENCES api_keys(id);
ALTER TABLE webhook_configs ADD COLUMN IF NOT EXISTS integration_settings JSON;
ALTER TABLE webhook_configs ADD COLUMN IF NOT EXISTS integration_type TEXT;

-- Index for API key lookup
CREATE INDEX IF NOT EXISTS idx_webhook_configs_api_key ON webhook_configs(api_key_id);

-- ============================================================================
-- 11. Grants for service role
-- ============================================================================
-- Grant execute permissions on functions to service role
GRANT EXECUTE ON FUNCTION validate_api_key(TEXT, TEXT[]) TO service_role;
GRANT EXECUTE ON FUNCTION check_api_rate_limit(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION increment_api_key_request_count(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_rate_limit_windows() TO service_role;
