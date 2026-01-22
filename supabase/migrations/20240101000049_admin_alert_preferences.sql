-- Admin & Manager Alert Preferences (S089)
-- Configurable alert settings for managers and admins on important events

-- Admin Alert Preferences table
CREATE TABLE admin_alert_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Global alert settings
  alerts_enabled BOOLEAN DEFAULT TRUE,
  delivery_mode TEXT DEFAULT 'immediate' CHECK (delivery_mode IN ('immediate', 'daily_digest')),
  digest_hour INTEGER DEFAULT 9 CHECK (digest_hour >= 0 AND digest_hour <= 23),
  digest_timezone TEXT DEFAULT 'America/New_York',

  -- Negative review alerts
  alert_negative_review BOOLEAN DEFAULT TRUE,
  negative_review_threshold INTEGER DEFAULT 2 CHECK (negative_review_threshold >= 1 AND negative_review_threshold <= 5),

  -- Team member performance alerts
  alert_team_struggling BOOLEAN DEFAULT TRUE,
  team_struggling_rating_threshold NUMERIC(2,1) DEFAULT 3.5,
  team_struggling_review_count_min INTEGER DEFAULT 3,

  -- Compliance violation alerts
  alert_compliance_violation BOOLEAN DEFAULT TRUE,

  -- Usage limit alerts
  alert_usage_limit BOOLEAN DEFAULT TRUE,
  usage_limit_threshold_percent INTEGER DEFAULT 80 CHECK (usage_limit_threshold_percent >= 50 AND usage_limit_threshold_percent <= 100),

  -- Team changes
  alert_team_member_joined BOOLEAN DEFAULT TRUE,
  alert_team_member_left BOOLEAN DEFAULT TRUE,

  -- Unusual activity alerts
  alert_unusual_activity BOOLEAN DEFAULT TRUE,
  unusual_activity_spike_percent INTEGER DEFAULT 200,

  -- Integration health alerts
  alert_integration_disconnected BOOLEAN DEFAULT TRUE,

  -- Last alert sent timestamps for rate limiting
  last_digest_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_admin_alert_prefs_user ON admin_alert_preferences(user_id);
CREATE INDEX idx_admin_alert_prefs_org ON admin_alert_preferences(organization_id);
CREATE INDEX idx_admin_alert_prefs_delivery ON admin_alert_preferences(delivery_mode, digest_hour)
  WHERE alerts_enabled = TRUE;

-- Admin Alert Queue table for batching/digest
CREATE TABLE admin_alert_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Alert type
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'negative_review',
    'team_struggling',
    'compliance_violation',
    'usage_limit',
    'team_member_joined',
    'team_member_left',
    'unusual_activity',
    'integration_disconnected'
  )),

  -- Alert details
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  -- Related entity IDs
  related_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  related_review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,

  -- Metadata for additional context
  metadata JSONB DEFAULT '{}',

  -- Deep link URL
  action_url TEXT,

  -- Processing status
  processed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for queue processing
CREATE INDEX idx_admin_alert_queue_pending ON admin_alert_queue(user_id, processed_at)
  WHERE processed_at IS NULL;
CREATE INDEX idx_admin_alert_queue_created ON admin_alert_queue(created_at DESC);
CREATE INDEX idx_admin_alert_queue_type ON admin_alert_queue(alert_type);

-- RLS Policies

ALTER TABLE admin_alert_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "admin_alert_prefs_select_own" ON admin_alert_preferences
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own preferences
CREATE POLICY "admin_alert_prefs_insert_own" ON admin_alert_preferences
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY "admin_alert_prefs_update_own" ON admin_alert_preferences
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can view all preferences in their organization
CREATE POLICY "admin_alert_prefs_select_org_admin" ON admin_alert_preferences
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.organization_id = admin_alert_preferences.organization_id
        AND users.role = 'admin'
    )
  );

ALTER TABLE admin_alert_queue ENABLE ROW LEVEL SECURITY;

-- Users can view their own queued alerts
CREATE POLICY "admin_alert_queue_select_own" ON admin_alert_queue
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Updated at trigger
CREATE TRIGGER update_admin_alert_preferences_updated_at
  BEFORE UPDATE ON admin_alert_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to get managers and admins for an organization
CREATE OR REPLACE FUNCTION get_org_managers_admins(p_organization_id UUID)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email, u.full_name, u.role
  FROM users u
  WHERE u.organization_id = p_organization_id
    AND u.role IN ('admin', 'manager')
    AND u.is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to queue an admin alert
CREATE OR REPLACE FUNCTION queue_admin_alert(
  p_organization_id UUID,
  p_alert_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_severity TEXT DEFAULT 'medium',
  p_related_user_id UUID DEFAULT NULL,
  p_related_review_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_action_url TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_user RECORD;
  v_prefs RECORD;
  v_count INTEGER := 0;
  v_alert_enabled BOOLEAN;
BEGIN
  -- Loop through all managers and admins in the organization
  FOR v_user IN
    SELECT * FROM get_org_managers_admins(p_organization_id)
  LOOP
    -- Get user's alert preferences
    SELECT * INTO v_prefs
    FROM admin_alert_preferences
    WHERE user_id = v_user.user_id;

    -- Check if alerts are enabled (default to true if no preferences set)
    IF v_prefs IS NULL THEN
      v_alert_enabled := TRUE;
    ELSIF NOT v_prefs.alerts_enabled THEN
      v_alert_enabled := FALSE;
    ELSE
      -- Check specific alert type preference
      v_alert_enabled := CASE p_alert_type
        WHEN 'negative_review' THEN v_prefs.alert_negative_review
        WHEN 'team_struggling' THEN v_prefs.alert_team_struggling
        WHEN 'compliance_violation' THEN v_prefs.alert_compliance_violation
        WHEN 'usage_limit' THEN v_prefs.alert_usage_limit
        WHEN 'team_member_joined' THEN v_prefs.alert_team_member_joined
        WHEN 'team_member_left' THEN v_prefs.alert_team_member_left
        WHEN 'unusual_activity' THEN v_prefs.alert_unusual_activity
        WHEN 'integration_disconnected' THEN v_prefs.alert_integration_disconnected
        ELSE TRUE
      END;
    END IF;

    IF v_alert_enabled THEN
      INSERT INTO admin_alert_queue (
        user_id,
        organization_id,
        alert_type,
        title,
        message,
        severity,
        related_user_id,
        related_review_id,
        metadata,
        action_url
      ) VALUES (
        v_user.user_id,
        p_organization_id,
        p_alert_type,
        p_title,
        p_message,
        p_severity,
        p_related_user_id,
        p_related_review_id,
        p_metadata,
        p_action_url
      );

      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get users needing daily digest alerts
CREATE OR REPLACE FUNCTION get_users_needing_admin_alert_digest()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  organization_id UUID,
  digest_timezone TEXT,
  pending_alerts_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    aap.user_id,
    u.email,
    u.full_name,
    aap.organization_id,
    aap.digest_timezone,
    COUNT(aaq.id) as pending_alerts_count
  FROM admin_alert_preferences aap
  JOIN users u ON u.id = aap.user_id
  JOIN admin_alert_queue aaq ON aaq.user_id = aap.user_id AND aaq.processed_at IS NULL
  WHERE aap.alerts_enabled = TRUE
    AND aap.delivery_mode = 'daily_digest'
    AND u.is_active = TRUE
    AND (
      aap.last_digest_sent_at IS NULL
      OR aap.last_digest_sent_at < NOW() - INTERVAL '20 hours'
    )
    AND EXTRACT(HOUR FROM NOW() AT TIME ZONE COALESCE(aap.digest_timezone, 'America/New_York')) = aap.digest_hour
  GROUP BY aap.user_id, u.email, u.full_name, aap.organization_id, aap.digest_timezone
  HAVING COUNT(aaq.id) > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending alerts for immediate delivery
CREATE OR REPLACE FUNCTION get_pending_admin_alerts_immediate()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  full_name TEXT,
  organization_id UUID,
  alert_type TEXT,
  title TEXT,
  message TEXT,
  severity TEXT,
  metadata JSONB,
  action_url TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    aaq.id,
    aaq.user_id,
    u.email,
    u.full_name,
    aaq.organization_id,
    aaq.alert_type,
    aaq.title,
    aaq.message,
    aaq.severity,
    aaq.metadata,
    aaq.action_url,
    aaq.created_at
  FROM admin_alert_queue aaq
  JOIN users u ON u.id = aaq.user_id
  JOIN admin_alert_preferences aap ON aap.user_id = aaq.user_id
  WHERE aaq.processed_at IS NULL
    AND aap.alerts_enabled = TRUE
    AND aap.delivery_mode = 'immediate'
    AND u.is_active = TRUE
  ORDER BY aaq.created_at ASC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
