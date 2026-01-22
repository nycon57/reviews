-- Email Preferences Center
-- Extends notification_preferences table with email category controls

-- Add new email category preference columns
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS email_onboarding_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_weekly_summary_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_milestones_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_product_updates_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_marketing_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_timezone TEXT DEFAULT 'America/New_York';

-- Add frequency_mode column for granular frequency control per category
-- Values: 'immediate', 'daily', 'weekly', 'none'
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS email_frequency_mode TEXT DEFAULT 'immediate'
  CHECK (email_frequency_mode IN ('immediate', 'daily', 'weekly', 'none'));

-- Create email preferences tokens table for public access
-- Allows users to manage email preferences from email links without authentication
CREATE TABLE IF NOT EXISTS email_preference_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Indexes for email_preference_tokens
CREATE INDEX IF NOT EXISTS idx_email_preference_tokens_user ON email_preference_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_preference_tokens_token ON email_preference_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_preference_tokens_email ON email_preference_tokens(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_email_preference_tokens_expires ON email_preference_tokens(expires_at);

-- RLS for email_preference_tokens
ALTER TABLE email_preference_tokens ENABLE ROW LEVEL SECURITY;

-- Users can see their own tokens
CREATE POLICY "email_preference_tokens_select_own" ON email_preference_tokens
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can create tokens for themselves
CREATE POLICY "email_preference_tokens_insert_own" ON email_preference_tokens
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own tokens
CREATE POLICY "email_preference_tokens_delete_own" ON email_preference_tokens
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Function to get or create email preference token for a user
CREATE OR REPLACE FUNCTION get_or_create_email_preference_token(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
  v_email TEXT;
BEGIN
  -- Get user email
  SELECT email INTO v_email FROM users WHERE id = p_user_id;

  IF v_email IS NULL THEN
    RETURN NULL;
  END IF;

  -- Check for existing valid token
  SELECT token INTO v_token
  FROM email_preference_tokens
  WHERE user_id = p_user_id
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  -- If no valid token exists, create one
  IF v_token IS NULL THEN
    INSERT INTO email_preference_tokens (user_id, email)
    VALUES (p_user_id, v_email)
    RETURNING token INTO v_token;
  END IF;

  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate email preference token and get user preferences
CREATE OR REPLACE FUNCTION validate_email_preference_token(p_token TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  is_valid BOOLEAN,
  email_enabled BOOLEAN,
  email_onboarding_enabled BOOLEAN,
  email_weekly_summary_enabled BOOLEAN,
  email_milestones_enabled BOOLEAN,
  email_product_updates_enabled BOOLEAN,
  email_marketing_enabled BOOLEAN,
  email_frequency_mode TEXT,
  email_timezone TEXT,
  quiet_hours_enabled BOOLEAN,
  quiet_hours_start TIME,
  quiet_hours_end TIME
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.user_id,
    t.email,
    (t.expires_at > NOW()) as is_valid,
    COALESCE(np.email_enabled, TRUE) as email_enabled,
    COALESCE(np.email_onboarding_enabled, TRUE) as email_onboarding_enabled,
    COALESCE(np.email_weekly_summary_enabled, TRUE) as email_weekly_summary_enabled,
    COALESCE(np.email_milestones_enabled, TRUE) as email_milestones_enabled,
    COALESCE(np.email_product_updates_enabled, TRUE) as email_product_updates_enabled,
    COALESCE(np.email_marketing_enabled, FALSE) as email_marketing_enabled,
    COALESCE(np.email_frequency_mode, 'immediate') as email_frequency_mode,
    COALESCE(np.email_timezone, 'America/New_York') as email_timezone,
    COALESCE(np.quiet_hours_enabled, FALSE) as quiet_hours_enabled,
    np.quiet_hours_start,
    np.quiet_hours_end
  FROM email_preference_tokens t
  LEFT JOIN notification_preferences np ON np.user_id = t.user_id
  WHERE t.token = p_token;

  -- Update last_used_at
  UPDATE email_preference_tokens
  SET last_used_at = NOW()
  WHERE token = p_token AND expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update email preferences via token
CREATE OR REPLACE FUNCTION update_email_preferences_by_token(
  p_token TEXT,
  p_email_enabled BOOLEAN DEFAULT NULL,
  p_email_onboarding_enabled BOOLEAN DEFAULT NULL,
  p_email_weekly_summary_enabled BOOLEAN DEFAULT NULL,
  p_email_milestones_enabled BOOLEAN DEFAULT NULL,
  p_email_product_updates_enabled BOOLEAN DEFAULT NULL,
  p_email_marketing_enabled BOOLEAN DEFAULT NULL,
  p_email_frequency_mode TEXT DEFAULT NULL,
  p_email_timezone TEXT DEFAULT NULL,
  p_quiet_hours_enabled BOOLEAN DEFAULT NULL,
  p_quiet_hours_start TIME DEFAULT NULL,
  p_quiet_hours_end TIME DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_is_valid BOOLEAN;
BEGIN
  -- Validate token and get user_id
  SELECT t.user_id, (t.expires_at > NOW())
  INTO v_user_id, v_is_valid
  FROM email_preference_tokens t
  WHERE t.token = p_token;

  IF v_user_id IS NULL OR NOT v_is_valid THEN
    RETURN FALSE;
  END IF;

  -- Upsert notification_preferences
  INSERT INTO notification_preferences (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Update only non-null parameters
  UPDATE notification_preferences
  SET
    email_enabled = COALESCE(p_email_enabled, email_enabled),
    email_onboarding_enabled = COALESCE(p_email_onboarding_enabled, email_onboarding_enabled),
    email_weekly_summary_enabled = COALESCE(p_email_weekly_summary_enabled, email_weekly_summary_enabled),
    email_milestones_enabled = COALESCE(p_email_milestones_enabled, email_milestones_enabled),
    email_product_updates_enabled = COALESCE(p_email_product_updates_enabled, email_product_updates_enabled),
    email_marketing_enabled = COALESCE(p_email_marketing_enabled, email_marketing_enabled),
    email_frequency_mode = COALESCE(p_email_frequency_mode, email_frequency_mode),
    email_timezone = COALESCE(p_email_timezone, email_timezone),
    quiet_hours_enabled = COALESCE(p_quiet_hours_enabled, quiet_hours_enabled),
    quiet_hours_start = COALESCE(p_quiet_hours_start, quiet_hours_start),
    quiet_hours_end = COALESCE(p_quiet_hours_end, quiet_hours_end),
    updated_at = NOW()
  WHERE user_id = v_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unsubscribe from all emails via token
CREATE OR REPLACE FUNCTION unsubscribe_all_by_token(p_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_is_valid BOOLEAN;
BEGIN
  -- Validate token and get user_id
  SELECT t.user_id, t.email, (t.expires_at > NOW())
  INTO v_user_id, v_email, v_is_valid
  FROM email_preference_tokens t
  WHERE t.token = p_token;

  IF v_user_id IS NULL OR NOT v_is_valid THEN
    RETURN FALSE;
  END IF;

  -- Upsert notification_preferences with all emails disabled
  INSERT INTO notification_preferences (
    user_id,
    email_enabled,
    email_onboarding_enabled,
    email_weekly_summary_enabled,
    email_milestones_enabled,
    email_product_updates_enabled,
    email_marketing_enabled,
    email_frequency_mode
  )
  VALUES (
    v_user_id,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    'none'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email_enabled = FALSE,
    email_onboarding_enabled = FALSE,
    email_weekly_summary_enabled = FALSE,
    email_milestones_enabled = FALSE,
    email_product_updates_enabled = FALSE,
    email_marketing_enabled = FALSE,
    email_frequency_mode = 'none',
    updated_at = NOW();

  -- Also add to email_unsubscribes for backwards compatibility
  INSERT INTO email_unsubscribes (email, reason)
  VALUES (v_email, 'preferences_center_unsubscribe')
  ON CONFLICT (email, organization_id) DO NOTHING;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on new columns
COMMENT ON COLUMN notification_preferences.email_onboarding_enabled IS 'Enable onboarding sequence emails';
COMMENT ON COLUMN notification_preferences.email_weekly_summary_enabled IS 'Enable weekly summary emails';
COMMENT ON COLUMN notification_preferences.email_milestones_enabled IS 'Enable milestone celebration emails';
COMMENT ON COLUMN notification_preferences.email_product_updates_enabled IS 'Enable product update announcement emails';
COMMENT ON COLUMN notification_preferences.email_marketing_enabled IS 'Enable marketing and promotional emails';
COMMENT ON COLUMN notification_preferences.email_timezone IS 'User timezone for email delivery timing';
COMMENT ON COLUMN notification_preferences.email_frequency_mode IS 'Email delivery frequency: immediate, daily, weekly, or none';
