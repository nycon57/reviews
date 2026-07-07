-- Add failure reason columns for 10DLC registration tracking
ALTER TABLE sms_settings
  ADD COLUMN IF NOT EXISTS brand_failure_reason TEXT,
  ADD COLUMN IF NOT EXISTS campaign_failure_reason TEXT;

COMMENT ON COLUMN sms_settings.brand_failure_reason IS 'Rejection reason from Twilio if brand registration fails';
COMMENT ON COLUMN sms_settings.campaign_failure_reason IS 'Rejection reason from Twilio if campaign registration fails';
