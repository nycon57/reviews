-- MS Teams Integration for Notifications
-- Mirrors Slack integration pattern with Adaptive Cards format

-- Add MS Teams columns to notification_preferences
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS teams_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS teams_webhook_url TEXT,
ADD COLUMN IF NOT EXISTS teams_new_review BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS teams_negative_review BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS teams_digest BOOLEAN DEFAULT FALSE;

-- Create Teams webhook logs table (mirrors slack_webhook_logs)
CREATE TABLE IF NOT EXISTS teams_webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
  webhook_url TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  success BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_webhook_logs_user ON teams_webhook_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_teams_webhook_logs_created ON teams_webhook_logs(created_at DESC);

-- RLS Policies (mirror Slack)
ALTER TABLE teams_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teams_webhook_logs_select_own" ON teams_webhook_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Add comments for documentation
COMMENT ON TABLE teams_webhook_logs IS 'Logs all MS Teams webhook calls for debugging and monitoring';
COMMENT ON COLUMN notification_preferences.teams_webhook_url IS 'MS Teams Incoming Webhook URL (channel-specific)';
COMMENT ON COLUMN notification_preferences.teams_enabled IS 'Whether MS Teams notifications are enabled';
COMMENT ON COLUMN notification_preferences.teams_new_review IS 'Send Teams notification for new reviews';
COMMENT ON COLUMN notification_preferences.teams_negative_review IS 'Send Teams notification for negative reviews (instant alert)';
COMMENT ON COLUMN notification_preferences.teams_digest IS 'Include in Teams digest notifications';
