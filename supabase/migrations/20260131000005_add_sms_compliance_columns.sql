-- Add compliance-related columns to sms_settings
ALTER TABLE sms_settings
  ADD COLUMN IF NOT EXISTS stop_response text NOT NULL DEFAULT 'You have been unsubscribed from {{company_name}} messages. Reply START to resubscribe.',
  ADD COLUMN IF NOT EXISTS help_response text NOT NULL DEFAULT 'Reply STOP to unsubscribe. For help, contact {{company_name}} support. Msg&data rates may apply.',
  ADD COLUMN IF NOT EXISTS double_opt_in_message text NOT NULL DEFAULT 'Reply YES to confirm you want to receive messages from {{company_name}}. Msg&data rates may apply.',
  ADD COLUMN IF NOT EXISTS consent_language_text text NOT NULL DEFAULT 'By providing your phone number, you consent to receive SMS messages from {{company_name}} regarding your mortgage experience. Message frequency varies. Msg&data rates may apply. Reply STOP to opt out at any time.';
