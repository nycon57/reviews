-- S111: Automated SMS Triggers & Scheduled Sends
-- Adds CRM trigger configuration to sms_settings and cost alert tracking.

-- ── CRM trigger configuration columns on sms_settings ──────────────────

ALTER TABLE sms_settings
  ADD COLUMN IF NOT EXISTS crm_trigger_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS crm_trigger_delay_hours integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS crm_trigger_template_id uuid REFERENCES sms_templates(id),
  ADD COLUMN IF NOT EXISTS crm_webhook_secret text,
  ADD COLUMN IF NOT EXISTS crm_field_mapping jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN sms_settings.crm_trigger_enabled IS 'Whether the CRM post-closing SMS trigger is active';
COMMENT ON COLUMN sms_settings.crm_trigger_delay_hours IS 'Hours to wait after closing before sending SMS (default 24)';
COMMENT ON COLUMN sms_settings.crm_trigger_template_id IS 'Template to use for CRM-triggered post-closing SMS';
COMMENT ON COLUMN sms_settings.crm_webhook_secret IS 'HMAC secret for validating CRM webhook payloads';
COMMENT ON COLUMN sms_settings.crm_field_mapping IS 'Maps CRM payload field names to internal merge fields';

-- ── Cost alert notification tracking ───────────────────────────────────
-- Tracks which alert thresholds have already been sent for a billing period
-- to prevent duplicate notifications.

CREATE TABLE IF NOT EXISTS sms_cost_alert_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  alert_level text NOT NULL CHECK (alert_level IN ('warning', 'critical', 'exceeded', 'overage')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, period_start, alert_level)
);

CREATE INDEX IF NOT EXISTS idx_sms_cost_alert_log_org
  ON sms_cost_alert_log(organization_id, period_start);

ALTER TABLE sms_cost_alert_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_read_cost_alerts"
  ON sms_cost_alert_log
  FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- ── Follow-up tracking column on sms_messages ──────────────────────────
-- Links a follow-up message to the original review request it follows up on.

ALTER TABLE sms_messages
  ADD COLUMN IF NOT EXISTS follow_up_of uuid REFERENCES sms_messages(id);

CREATE INDEX IF NOT EXISTS idx_sms_messages_follow_up_of
  ON sms_messages(follow_up_of)
  WHERE follow_up_of IS NOT NULL;

-- ── Index for efficient queued message lookup by the cron processor ────
-- (may already exist; IF NOT EXISTS prevents errors)

CREATE INDEX IF NOT EXISTS idx_sms_messages_queued_scheduled
  ON sms_messages(scheduled_at)
  WHERE status = 'queued' AND scheduled_at IS NOT NULL;

-- ── Index for follow-up eligibility scan ───────────────────────────────
-- Messages that are delivered, have a short_link, and no follow-up yet.

CREATE INDEX IF NOT EXISTS idx_sms_messages_followup_eligible
  ON sms_messages(organization_id, delivered_at)
  WHERE status = 'delivered'
    AND direction = 'outbound'
    AND short_link_id IS NOT NULL
    AND template_id IS NOT NULL;
