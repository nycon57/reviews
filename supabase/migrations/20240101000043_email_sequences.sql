-- Email Sequences table for tracking automated email sequence progress
-- Used for welcome sequences, onboarding flows, win-back campaigns, etc.

-- Create the email_sequences table
CREATE TABLE email_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sequence_type TEXT NOT NULL CHECK (sequence_type IN (
    'welcome',
    'onboarding',
    'win_back',
    'feature_announcement',
    'milestone'
  )),

  -- Sequence state
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',      -- Currently receiving emails
    'paused',      -- Temporarily paused (user request, system pause)
    'completed',   -- All emails sent or exit condition met
    'cancelled',   -- Manually cancelled
    'exited'       -- Exited early due to activation milestone
  )),

  -- Progress tracking
  current_step INTEGER NOT NULL DEFAULT 0,
  total_steps INTEGER NOT NULL DEFAULT 5,

  -- Step tracking with timestamps
  steps_completed JSONB NOT NULL DEFAULT '[]',
  -- Format: [{"step": 1, "email_id": "uuid", "sent_at": "iso_timestamp", "variant": "A"}]

  -- A/B testing
  ab_test_assignments JSONB DEFAULT '{}',
  -- Format: {"email_1": "A", "email_3": "B"}

  -- Conditional branching tracking
  skipped_steps JSONB NOT NULL DEFAULT '[]',
  -- Format: [{"step": 2, "reason": "action_completed", "skipped_at": "iso_timestamp"}]

  -- Exit tracking
  exit_reason TEXT,
  exit_milestone TEXT,  -- e.g., "first_survey_sent"
  exited_at TIMESTAMPTZ,

  -- Scheduling
  next_email_at TIMESTAMPTZ,
  last_email_at TIMESTAMPTZ,

  -- Metadata for personalization
  metadata JSONB DEFAULT '{}',
  -- Stores: first_name, organization_name, role, etc.

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_email_sequences_user ON email_sequences(user_id);
CREATE INDEX idx_email_sequences_org ON email_sequences(organization_id);
CREATE INDEX idx_email_sequences_type ON email_sequences(sequence_type);
CREATE INDEX idx_email_sequences_status ON email_sequences(status);
CREATE INDEX idx_email_sequences_next_email ON email_sequences(next_email_at) WHERE status = 'active';
CREATE UNIQUE INDEX idx_email_sequences_active_per_user ON email_sequences(user_id, sequence_type)
  WHERE status IN ('active', 'paused');

-- Add RLS policies
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;

-- Admins can see all sequences in their organization
CREATE POLICY "Admins can view organization sequences" ON email_sequences
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view their own sequences
CREATE POLICY "Users can view own sequences" ON email_sequences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- System can insert/update sequences (via service role)
CREATE POLICY "Service role full access" ON email_sequences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER update_email_sequences_updated_at
  BEFORE UPDATE ON email_sequences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Add comments for documentation
COMMENT ON TABLE email_sequences IS 'Tracks automated email sequence progress for users';
COMMENT ON COLUMN email_sequences.sequence_type IS 'Type of email sequence (welcome, onboarding, win_back, etc.)';
COMMENT ON COLUMN email_sequences.status IS 'Current state: active, paused, completed, cancelled, or exited';
COMMENT ON COLUMN email_sequences.current_step IS 'Current step in the sequence (0-indexed)';
COMMENT ON COLUMN email_sequences.steps_completed IS 'JSON array of completed steps with timestamps and variants';
COMMENT ON COLUMN email_sequences.ab_test_assignments IS 'A/B test variant assignments per email';
COMMENT ON COLUMN email_sequences.skipped_steps IS 'JSON array of skipped steps with reasons';
COMMENT ON COLUMN email_sequences.exit_reason IS 'Reason for early exit (e.g., activation_milestone_reached)';
COMMENT ON COLUMN email_sequences.exit_milestone IS 'Specific milestone that triggered exit (e.g., first_survey_sent)';
COMMENT ON COLUMN email_sequences.next_email_at IS 'Scheduled time for next email in sequence';
COMMENT ON COLUMN email_sequences.metadata IS 'Personalization data: first_name, org_name, role, etc.';

-- Create a function to check if user has completed activation milestone
CREATE OR REPLACE FUNCTION check_user_activation_milestone(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_sent_survey BOOLEAN;
BEGIN
  -- Check if user has sent at least one survey
  SELECT EXISTS(
    SELECT 1
    FROM surveys s
    JOIN users u ON u.id = p_user_id
    WHERE s.organization_id = u.organization_id
    AND s.status IN ('sent', 'opened', 'completed')
    AND s.created_at >= (
      SELECT created_at FROM users WHERE id = p_user_id
    )
  ) INTO has_sent_survey;

  RETURN has_sent_survey;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get user's completed onboarding actions
CREATE OR REPLACE FUNCTION get_user_onboarding_status(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  user_record RECORD;
BEGIN
  SELECT
    u.id,
    u.full_name,
    u.photo_url,
    u.bio,
    u.phone,
    u.organization_id,
    u.role,
    o.name as organization_name
  INTO user_record
  FROM users u
  JOIN organizations o ON o.id = u.organization_id
  WHERE u.id = p_user_id;

  IF NOT FOUND THEN
    RETURN '{"error": "User not found"}'::JSONB;
  END IF;

  result := jsonb_build_object(
    'profile_completed', (
      user_record.full_name IS NOT NULL
      AND user_record.photo_url IS NOT NULL
    ),
    'bio_added', user_record.bio IS NOT NULL AND user_record.bio != '',
    'phone_added', user_record.phone IS NOT NULL AND user_record.phone != '',
    'first_survey_sent', (
      SELECT EXISTS(
        SELECT 1 FROM surveys
        WHERE organization_id = user_record.organization_id
        AND status IN ('sent', 'opened', 'completed')
      )
    ),
    'first_video_requested', (
      SELECT EXISTS(
        SELECT 1 FROM video_testimonial_requests
        WHERE organization_id = user_record.organization_id
      )
    ),
    'first_review_received', (
      SELECT EXISTS(
        SELECT 1 FROM reviews
        WHERE organization_id = user_record.organization_id
        AND status = 'approved'
      )
    )
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_user_activation_milestone IS 'Checks if user has completed the activation milestone (sent first survey)';
COMMENT ON FUNCTION get_user_onboarding_status IS 'Returns JSON object with user onboarding action completion status';
