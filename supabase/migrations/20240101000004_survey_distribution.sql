-- Survey Distribution System Migration
-- Adds tables and functions for automated survey distribution

-- Survey Distribution Queue table
-- Used for scheduling and tracking survey email sends with rate limiting
CREATE TABLE survey_distribution_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('initial', 'reminder_3day', 'reminder_7day')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_distribution_queue_status ON survey_distribution_queue(status);
CREATE INDEX idx_distribution_queue_scheduled ON survey_distribution_queue(scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_distribution_queue_survey ON survey_distribution_queue(survey_id);
CREATE INDEX idx_distribution_queue_org ON survey_distribution_queue(organization_id);

-- Distribution Rate Limits table
-- Tracks rate limiting per organization
CREATE TABLE distribution_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  emails_sent INTEGER DEFAULT 0,
  max_emails_per_hour INTEGER DEFAULT 100,
  max_emails_per_day INTEGER DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_rate_limits_org_window ON distribution_rate_limits(organization_id, window_start);

-- Webhook Configurations table
-- Stores webhook settings for external integrations
CREATE TABLE webhook_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  secret_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  allowed_ips TEXT[],
  default_template_id UUID REFERENCES survey_templates(id),
  settings JSONB DEFAULT '{}',
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_configs_org ON webhook_configs(organization_id);
CREATE INDEX idx_webhook_configs_secret ON webhook_configs(secret_key);

-- Webhook Logs table
-- Tracks incoming webhook requests
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  webhook_config_id UUID REFERENCES webhook_configs(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB,
  ip_address INET,
  user_agent TEXT,
  status TEXT DEFAULT 'received' CHECK (status IN ('received', 'processed', 'failed', 'ignored')),
  error_message TEXT,
  survey_id UUID REFERENCES surveys(id) ON DELETE SET NULL,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_org ON webhook_logs(organization_id);
CREATE INDEX idx_webhook_logs_config ON webhook_logs(webhook_config_id);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX idx_webhook_logs_created ON webhook_logs(created_at);

-- Function to get pending queue items that are ready to send
CREATE OR REPLACE FUNCTION get_pending_distribution_items(
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  survey_id UUID,
  organization_id UUID,
  type TEXT,
  scheduled_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.survey_id,
    q.organization_id,
    q.type,
    q.scheduled_at
  FROM survey_distribution_queue q
  WHERE q.status = 'pending'
    AND q.scheduled_at <= NOW()
    AND q.retry_count < q.max_retries
  ORDER BY q.priority DESC, q.scheduled_at ASC
  LIMIT p_limit
  FOR UPDATE SKIP LOCKED;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limits for an organization
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_organization_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_hourly_count INTEGER;
  v_daily_count INTEGER;
  v_max_per_hour INTEGER := 100;
  v_max_per_day INTEGER := 1000;
BEGIN
  -- Count emails sent in last hour
  SELECT COUNT(*) INTO v_hourly_count
  FROM email_logs
  WHERE organization_id = p_organization_id
    AND sent_at > NOW() - INTERVAL '1 hour';

  -- Count emails sent today
  SELECT COUNT(*) INTO v_daily_count
  FROM email_logs
  WHERE organization_id = p_organization_id
    AND sent_at > DATE_TRUNC('day', NOW());

  -- Check org-specific limits if they exist
  SELECT COALESCE(max_emails_per_hour, 100), COALESCE(max_emails_per_day, 1000)
  INTO v_max_per_hour, v_max_per_day
  FROM distribution_rate_limits
  WHERE organization_id = p_organization_id
    AND window_start <= NOW()
    AND window_end > NOW()
  LIMIT 1;

  RETURN v_hourly_count < v_max_per_hour AND v_daily_count < v_max_per_day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to schedule reminders for a survey
CREATE OR REPLACE FUNCTION schedule_survey_reminders(
  p_survey_id UUID,
  p_organization_id UUID,
  p_send_3day BOOLEAN DEFAULT TRUE,
  p_send_7day BOOLEAN DEFAULT TRUE
)
RETURNS VOID AS $$
DECLARE
  v_sent_at TIMESTAMPTZ;
BEGIN
  -- Get the sent_at time for the survey
  SELECT sent_at INTO v_sent_at
  FROM surveys
  WHERE id = p_survey_id;

  IF v_sent_at IS NULL THEN
    v_sent_at := NOW();
  END IF;

  -- Schedule 3-day reminder
  IF p_send_3day THEN
    INSERT INTO survey_distribution_queue (
      organization_id,
      survey_id,
      type,
      scheduled_at,
      priority
    ) VALUES (
      p_organization_id,
      p_survey_id,
      'reminder_3day',
      v_sent_at + INTERVAL '3 days',
      -1  -- Lower priority than initial sends
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Schedule 7-day reminder
  IF p_send_7day THEN
    INSERT INTO survey_distribution_queue (
      organization_id,
      survey_id,
      type,
      scheduled_at,
      priority
    ) VALUES (
      p_organization_id,
      p_survey_id,
      'reminder_7day',
      v_sent_at + INTERVAL '7 days',
      -2  -- Even lower priority
    )
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to atomically increment webhook trigger count
CREATE OR REPLACE FUNCTION increment_webhook_trigger_count(
  config_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE webhook_configs
  SET
    trigger_count = COALESCE(trigger_count, 0) + 1,
    last_triggered_at = NOW()
  WHERE id = config_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply updated_at trigger to new tables
CREATE TRIGGER update_webhook_configs_updated_at BEFORE UPDATE ON webhook_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_rate_limits_updated_at BEFORE UPDATE ON distribution_rate_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS Policies for new tables
ALTER TABLE survey_distribution_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Survey Distribution Queue policies
CREATE POLICY "Users can view their org's distribution queue"
  ON survey_distribution_queue FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert into their org's distribution queue"
  ON survey_distribution_queue FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update their org's distribution queue"
  ON survey_distribution_queue FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- Distribution Rate Limits policies
CREATE POLICY "Users can view their org's rate limits"
  ON distribution_rate_limits FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Webhook Configs policies
CREATE POLICY "Users can view their org's webhook configs"
  ON webhook_configs FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can manage webhook configs"
  ON webhook_configs FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin'])
  );

-- Webhook Logs policies
CREATE POLICY "Users can view their org's webhook logs"
  ON webhook_logs FOR SELECT
  USING (organization_id = get_user_organization_id());
