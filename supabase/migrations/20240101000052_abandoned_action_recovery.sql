-- Abandoned Action Recovery System (S093)
-- Tracks user actions that were started but not completed and sends recovery emails

-- =============================================================================
-- 1. Create abandoned_actions table for tracking action starts/completions
-- =============================================================================

CREATE TABLE abandoned_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Action identification
  action_type TEXT NOT NULL CHECK (action_type IN (
    'survey_creation',     -- Started creating a survey template
    'survey_send',         -- Started sending a survey (selected contacts)
    'video_request',       -- Started video testimonial request form
    'billing_upgrade',     -- Visited pricing/upgrade page
    'profile_completion',  -- Started editing profile
    'integration_setup'    -- Started OAuth/integration setup
  )),

  -- Action state
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN (
    'started',           -- Action was initiated
    'completed',         -- Action was successfully completed
    'abandoned',         -- Action was abandoned (recovery email eligible)
    'recovered',         -- User returned and completed after recovery email
    'expired'            -- Recovery period expired without completion
  )),

  -- Context data for deep linking and personalization
  context JSONB NOT NULL DEFAULT '{}',
  -- Example contexts:
  -- survey_creation: { "template_name": "...", "step": 2, "last_field": "questions" }
  -- survey_send: { "contacts_selected": 5, "template_id": "..." }
  -- video_request: { "customer_email": "...", "step": "upload" }
  -- billing_upgrade: { "target_plan": "professional", "source_page": "/pricing" }
  -- profile_completion: { "fields_incomplete": ["bio", "photo"], "completion_percent": 60 }
  -- integration_setup: { "integration_type": "google", "oauth_step": "authorize" }

  -- Deep link URL to resume the action
  resume_url TEXT,

  -- Recovery tracking
  recovery_email_1_sent_at TIMESTAMPTZ,
  recovery_email_2_sent_at TIMESTAMPTZ,
  recovery_email_1_id UUID,
  recovery_email_2_id UUID,

  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  abandoned_at TIMESTAMPTZ,
  recovered_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_abandoned_actions_user ON abandoned_actions(user_id);
CREATE INDEX idx_abandoned_actions_org ON abandoned_actions(organization_id);
CREATE INDEX idx_abandoned_actions_type ON abandoned_actions(action_type);
CREATE INDEX idx_abandoned_actions_status ON abandoned_actions(status);
CREATE INDEX idx_abandoned_actions_started ON abandoned_actions(started_at);

-- Index for finding actions ready for recovery emails
-- Email 1: 1 hour after start, status still 'started' or 'abandoned', no email_1 sent
CREATE INDEX idx_abandoned_actions_recovery_1 ON abandoned_actions(started_at)
  WHERE status IN ('started', 'abandoned') AND recovery_email_1_sent_at IS NULL;

-- Email 2: 24 hours after start, status 'abandoned', email_1 sent, no email_2 sent
CREATE INDEX idx_abandoned_actions_recovery_2 ON abandoned_actions(started_at)
  WHERE status = 'abandoned' AND recovery_email_1_sent_at IS NOT NULL AND recovery_email_2_sent_at IS NULL;

-- Unique constraint: Only one active (non-completed/expired) action per user per type
CREATE UNIQUE INDEX idx_abandoned_actions_active_per_user_type ON abandoned_actions(user_id, action_type)
  WHERE status IN ('started', 'abandoned');

-- =============================================================================
-- 2. Add RLS policies
-- =============================================================================

ALTER TABLE abandoned_actions ENABLE ROW LEVEL SECURITY;

-- Users can view their own abandoned actions
CREATE POLICY "Users can view own abandoned actions" ON abandoned_actions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all abandoned actions in their organization
CREATE POLICY "Admins can view organization abandoned actions" ON abandoned_actions
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role has full access (for cron jobs and server actions)
CREATE POLICY "Service role full access to abandoned actions" ON abandoned_actions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 3. Add updated_at trigger
-- =============================================================================

CREATE TRIGGER update_abandoned_actions_updated_at
  BEFORE UPDATE ON abandoned_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- 4. Add abandoned_action_recovery to email_sequences sequence_type
-- =============================================================================

ALTER TABLE email_sequences DROP CONSTRAINT IF EXISTS email_sequences_sequence_type_check;

ALTER TABLE email_sequences ADD CONSTRAINT email_sequences_sequence_type_check
  CHECK (sequence_type IN (
    'welcome',
    'onboarding',
    'win_back',
    'feature_announcement',
    'milestone',
    'role_onboarding',
    'profile-setup-reminder',
    'reengagement',
    'trial_ending',
    'dunning',
    'abandoned_action_recovery'
  ));

COMMENT ON COLUMN email_sequences.sequence_type IS 'Type of email sequence (welcome, onboarding, win_back, feature_announcement, milestone, role_onboarding, profile-setup-reminder, reengagement, trial_ending, dunning, abandoned_action_recovery)';

-- =============================================================================
-- 5. Helper functions
-- =============================================================================

-- Function to mark an action as started
CREATE OR REPLACE FUNCTION track_action_started(
  p_user_id UUID,
  p_organization_id UUID,
  p_action_type TEXT,
  p_context JSONB DEFAULT '{}',
  p_resume_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_action_id UUID;
  v_existing_id UUID;
  v_user_org_id UUID;
BEGIN
  -- Only the action owner (or service role) can track starts
  IF auth.role() <> 'service_role' AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized to track action for another user'
      USING ERRCODE = '42501';
  END IF;

  -- Validate user organization scope
  SELECT organization_id INTO v_user_org_id
  FROM users
  WHERE id = p_user_id;

  IF v_user_org_id IS NULL THEN
    RAISE EXCEPTION 'User not found'
      USING ERRCODE = '22023';
  END IF;

  IF v_user_org_id <> p_organization_id THEN
    RAISE EXCEPTION 'Organization does not match user organization'
      USING ERRCODE = '42501';
  END IF;

  -- Check for existing active action of same type
  SELECT id INTO v_existing_id
  FROM abandoned_actions
  WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND status IN ('started', 'abandoned');

  IF v_existing_id IS NOT NULL THEN
    -- Update existing action with new context
    UPDATE abandoned_actions
    SET context = p_context,
        resume_url = COALESCE(p_resume_url, resume_url),
        started_at = NOW(),
        updated_at = NOW()
    WHERE id = v_existing_id;

    RETURN v_existing_id;
  END IF;

  -- Insert new action
  INSERT INTO abandoned_actions (
    user_id,
    organization_id,
    action_type,
    status,
    context,
    resume_url,
    started_at
  )
  VALUES (
    p_user_id,
    p_organization_id,
    p_action_type,
    'started',
    p_context,
    p_resume_url,
    NOW()
  )
  RETURNING id INTO v_action_id;

  RETURN v_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to mark an action as completed
CREATE OR REPLACE FUNCTION track_action_completed(
  p_user_id UUID,
  p_action_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_action_id UUID;
  v_previous_status TEXT;
BEGIN
  -- Only the action owner (or service role) can mark completion
  IF auth.role() <> 'service_role' AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized to complete action for another user'
      USING ERRCODE = '42501';
  END IF;

  -- Find the active action
  SELECT id, status INTO v_action_id, v_previous_status
  FROM abandoned_actions
  WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND status IN ('started', 'abandoned');

  IF v_action_id IS NULL THEN
    -- No active action found, but that's okay - action completed without tracking
    RETURN TRUE;
  END IF;

  -- Determine if this was a recovery (completed after being abandoned and receiving emails)
  UPDATE abandoned_actions
  SET status = CASE
        WHEN v_previous_status = 'abandoned' THEN 'recovered'
        ELSE 'completed'
      END,
      completed_at = NOW(),
      recovered_at = CASE WHEN v_previous_status = 'abandoned' THEN NOW() ELSE NULL END,
      updated_at = NOW()
  WHERE id = v_action_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get actions ready for recovery email 1 (1 hour after start)
CREATE OR REPLACE FUNCTION get_actions_for_recovery_email_1(
  p_batch_size INTEGER DEFAULT 50
)
RETURNS TABLE (
  action_id UUID,
  user_id UUID,
  organization_id UUID,
  action_type TEXT,
  context JSONB,
  resume_url TEXT,
  started_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Queue processing is service-only
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized to access recovery email queue'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    aa.id,
    aa.user_id,
    aa.organization_id,
    aa.action_type,
    aa.context,
    aa.resume_url,
    aa.started_at
  FROM abandoned_actions aa
  JOIN users u ON u.id = aa.user_id
  WHERE aa.status IN ('started', 'abandoned')
    AND aa.recovery_email_1_sent_at IS NULL
    AND aa.started_at < NOW() - INTERVAL '1 hour'
    AND u.receive_notifications = TRUE
    AND u.is_active = TRUE
  ORDER BY aa.started_at ASC
  LIMIT p_batch_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get actions ready for recovery email 2 (24 hours after start)
CREATE OR REPLACE FUNCTION get_actions_for_recovery_email_2(
  p_batch_size INTEGER DEFAULT 50
)
RETURNS TABLE (
  action_id UUID,
  user_id UUID,
  organization_id UUID,
  action_type TEXT,
  context JSONB,
  resume_url TEXT,
  started_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Queue processing is service-only
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized to access recovery email queue'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    aa.id,
    aa.user_id,
    aa.organization_id,
    aa.action_type,
    aa.context,
    aa.resume_url,
    aa.started_at
  FROM abandoned_actions aa
  JOIN users u ON u.id = aa.user_id
  WHERE aa.status = 'abandoned'
    AND aa.recovery_email_1_sent_at IS NOT NULL
    AND aa.recovery_email_2_sent_at IS NULL
    AND aa.started_at < NOW() - INTERVAL '24 hours'
    AND u.receive_notifications = TRUE
    AND u.is_active = TRUE
  ORDER BY aa.started_at ASC
  LIMIT p_batch_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to expire old abandoned actions (after 7 days without completion)
CREATE OR REPLACE FUNCTION expire_old_abandoned_actions()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Expiration is service-only
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized to expire abandoned actions'
      USING ERRCODE = '42501';
  END IF;

  UPDATE abandoned_actions
  SET status = 'expired',
      expired_at = NOW(),
      updated_at = NOW()
  WHERE status IN ('started', 'abandoned')
    AND started_at < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Restrict function execution privileges explicitly
REVOKE EXECUTE ON FUNCTION track_action_started(UUID, UUID, TEXT, JSONB, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION track_action_completed(UUID, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION get_actions_for_recovery_email_1(INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_actions_for_recovery_email_2(INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION expire_old_abandoned_actions() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION track_action_started(UUID, UUID, TEXT, JSONB, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION track_action_completed(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_actions_for_recovery_email_1(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_actions_for_recovery_email_2(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION expire_old_abandoned_actions() TO service_role;

-- =============================================================================
-- 6. Comments for documentation
-- =============================================================================

COMMENT ON TABLE abandoned_actions IS 'Tracks user actions that were started but not completed for recovery emails';
COMMENT ON COLUMN abandoned_actions.action_type IS 'Type of action: survey_creation, survey_send, video_request, billing_upgrade, profile_completion, integration_setup';
COMMENT ON COLUMN abandoned_actions.status IS 'Current state: started, completed, abandoned, recovered, expired';
COMMENT ON COLUMN abandoned_actions.context IS 'JSON context for deep linking and email personalization';
COMMENT ON COLUMN abandoned_actions.resume_url IS 'Deep link URL to resume the abandoned action';
COMMENT ON COLUMN abandoned_actions.recovery_email_1_sent_at IS 'Timestamp when 1-hour recovery email was sent';
COMMENT ON COLUMN abandoned_actions.recovery_email_2_sent_at IS 'Timestamp when 24-hour recovery email was sent';

COMMENT ON FUNCTION track_action_started IS 'Records when a user starts a trackable action';
COMMENT ON FUNCTION track_action_completed IS 'Records when a user completes an action, preventing recovery emails';
COMMENT ON FUNCTION get_actions_for_recovery_email_1 IS 'Returns actions ready for 1-hour recovery email';
COMMENT ON FUNCTION get_actions_for_recovery_email_2 IS 'Returns actions ready for 24-hour recovery email';
COMMENT ON FUNCTION expire_old_abandoned_actions IS 'Marks old abandoned actions as expired';
