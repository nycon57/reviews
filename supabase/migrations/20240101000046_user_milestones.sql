-- User Milestones & Achievement Email Notifications (S081)
-- Tracks milestones achieved by users and email notification status

-- Milestone types enum (kept as text for flexibility)
-- Types: first_review, review_milestone, first_5_star, rating_improvement,
-- nps_improvement, streak, leaderboard_achievement, badge_earned,
-- profile_completion, video_milestone

-- User milestones table
CREATE TABLE user_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL,
  milestone_key TEXT NOT NULL, -- e.g., 'review_count_10', 'leaderboard_top_10', 'streak_7'
  milestone_value INTEGER, -- Optional numeric value (e.g., 10 for 10 reviews)
  milestone_metadata JSONB DEFAULT '{}', -- Additional context data
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email_sent_at TIMESTAMPTZ, -- When celebration email was sent
  email_status TEXT DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'failed', 'skipped')),
  email_message_id TEXT, -- Resend message ID for tracking
  social_shared_at TIMESTAMPTZ, -- When user shared to social
  social_platform TEXT, -- Platform shared to (linkedin, twitter, facebook)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, milestone_key) -- Prevent duplicate milestones
);

-- Indexes for efficient queries
CREATE INDEX idx_user_milestones_user ON user_milestones(user_id);
CREATE INDEX idx_user_milestones_org ON user_milestones(organization_id);
CREATE INDEX idx_user_milestones_type ON user_milestones(milestone_type);
CREATE INDEX idx_user_milestones_key ON user_milestones(milestone_key);
CREATE INDEX idx_user_milestones_achieved ON user_milestones(achieved_at);
CREATE INDEX idx_user_milestones_email_pending ON user_milestones(email_status) WHERE email_status = 'pending';

-- Milestone email preferences per user
CREATE TABLE milestone_email_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  enabled BOOLEAN DEFAULT TRUE,
  review_milestones BOOLEAN DEFAULT TRUE,
  rating_milestones BOOLEAN DEFAULT TRUE,
  streak_milestones BOOLEAN DEFAULT TRUE,
  leaderboard_milestones BOOLEAN DEFAULT TRUE,
  badge_milestones BOOLEAN DEFAULT TRUE,
  profile_milestones BOOLEAN DEFAULT TRUE,
  video_milestones BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_milestone_email_prefs_user ON milestone_email_preferences(user_id);

-- RLS Policies

-- User milestones: users can view their own, managers/admins can view org
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_milestones_select_own" ON user_milestones
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_milestones_select_org" ON user_milestones
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = auth.uid()
        AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "user_milestones_insert" ON user_milestones
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "user_milestones_update_own" ON user_milestones
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Milestone email preferences: users manage their own
ALTER TABLE milestone_email_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "milestone_prefs_select_own" ON milestone_email_preferences
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "milestone_prefs_insert_own" ON milestone_email_preferences
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "milestone_prefs_update_own" ON milestone_email_preferences
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_milestone_email_preferences_updated_at
  BEFORE UPDATE ON milestone_email_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to record a milestone achievement
CREATE OR REPLACE FUNCTION record_milestone(
  p_user_id UUID,
  p_organization_id UUID,
  p_milestone_type TEXT,
  p_milestone_key TEXT,
  p_milestone_value INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_milestone_id UUID;
  v_prefs_enabled BOOLEAN;
BEGIN
  -- Check if milestone already exists (prevent duplicates)
  SELECT id INTO v_milestone_id
  FROM user_milestones
  WHERE user_id = p_user_id AND milestone_key = p_milestone_key;

  IF v_milestone_id IS NOT NULL THEN
    RETURN v_milestone_id; -- Already achieved
  END IF;

  -- Check user preferences
  SELECT enabled INTO v_prefs_enabled
  FROM milestone_email_preferences
  WHERE user_id = p_user_id;

  -- Insert the milestone
  INSERT INTO user_milestones (
    user_id,
    organization_id,
    milestone_type,
    milestone_key,
    milestone_value,
    milestone_metadata,
    email_status
  ) VALUES (
    p_user_id,
    p_organization_id,
    p_milestone_type,
    p_milestone_key,
    p_milestone_value,
    p_metadata,
    CASE WHEN COALESCE(v_prefs_enabled, TRUE) THEN 'pending' ELSE 'skipped' END
  )
  RETURNING id INTO v_milestone_id;

  RETURN v_milestone_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending milestone emails for a user
CREATE OR REPLACE FUNCTION get_pending_milestone_emails(p_user_id UUID)
RETURNS TABLE (
  milestone_id UUID,
  milestone_type TEXT,
  milestone_key TEXT,
  milestone_value INTEGER,
  milestone_metadata JSONB,
  achieved_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    um.id,
    um.milestone_type,
    um.milestone_key,
    um.milestone_value,
    um.milestone_metadata,
    um.achieved_at
  FROM user_milestones um
  WHERE um.user_id = p_user_id
    AND um.email_status = 'pending'
  ORDER BY um.achieved_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark milestone email as sent
CREATE OR REPLACE FUNCTION mark_milestone_email_sent(
  p_milestone_id UUID,
  p_message_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_milestones
  SET
    email_status = 'sent',
    email_sent_at = NOW(),
    email_message_id = p_message_id
  WHERE id = p_milestone_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
