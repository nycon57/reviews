-- Add 'role_onboarding' to email_sequences.sequence_type CHECK constraint
-- Required for S077: Role-Based Feature Onboarding Sequences

-- Drop the existing constraint and recreate with the new value
ALTER TABLE email_sequences DROP CONSTRAINT IF EXISTS email_sequences_sequence_type_check;

ALTER TABLE email_sequences ADD CONSTRAINT email_sequences_sequence_type_check
  CHECK (sequence_type IN (
    'welcome',
    'onboarding',
    'win_back',
    'feature_announcement',
    'milestone',
    'role_onboarding'
  ));

COMMENT ON COLUMN email_sequences.sequence_type IS 'Type of email sequence (welcome, onboarding, win_back, feature_announcement, milestone, role_onboarding)';
