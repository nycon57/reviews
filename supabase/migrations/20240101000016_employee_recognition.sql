-- Employee Recognition & Feedback System Migration
-- Implements peer-to-peer recognition, badges, and manager feedback

-- Recognition Badges table (badge definitions/templates)
CREATE TABLE IF NOT EXISTS recognition_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'teamwork', 'innovation', 'leadership', 'customer_focus',
    'excellence', 'growth', 'mentorship', 'positivity', 'reliability', 'custom'
  )),
  points INTEGER DEFAULT 10 CHECK (points >= 1 AND points <= 100),
  color TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recognition_badges_organization ON recognition_badges(organization_id);
CREATE INDEX IF NOT EXISTS idx_recognition_badges_category ON recognition_badges(category);
CREATE INDEX IF NOT EXISTS idx_recognition_badges_active ON recognition_badges(is_active) WHERE is_active = TRUE;

-- Recognitions table (kudos given from one employee to another)
CREATE TABLE IF NOT EXISTS recognitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES recognition_badges(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'team', 'private')),
  is_anonymous BOOLEAN DEFAULT FALSE,
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent self-recognition
  CONSTRAINT no_self_recognition CHECK (from_user_id != to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_recognitions_organization ON recognitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_recognitions_from_user ON recognitions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_recognitions_to_user ON recognitions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_recognitions_badge ON recognitions(badge_id);
CREATE INDEX IF NOT EXISTS idx_recognitions_created ON recognitions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recognitions_visibility ON recognitions(visibility);

-- Recognition reactions (likes, emojis on recognitions)
CREATE TABLE IF NOT EXISTS recognition_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recognition_id UUID NOT NULL REFERENCES recognitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL DEFAULT 'thumbsup',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recognition_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_recognition_reactions_recognition ON recognition_reactions(recognition_id);
CREATE INDEX IF NOT EXISTS idx_recognition_reactions_user ON recognition_reactions(user_id);

-- Manager Feedback table (continuous feedback from managers)
CREATE TABLE IF NOT EXISTS manager_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('praise', 'constructive', 'goal_progress', 'check_in', 'performance')),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT TRUE,
  linked_goal_id UUID, -- Can link to goals/OKRs if implemented
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_manager_feedback_organization ON manager_feedback(organization_id);
CREATE INDEX IF NOT EXISTS idx_manager_feedback_from_user ON manager_feedback(from_user_id);
CREATE INDEX IF NOT EXISTS idx_manager_feedback_to_user ON manager_feedback(to_user_id);
CREATE INDEX IF NOT EXISTS idx_manager_feedback_type ON manager_feedback(type);
CREATE INDEX IF NOT EXISTS idx_manager_feedback_created ON manager_feedback(created_at DESC);

-- Recognition summaries for monthly/quarterly reports
CREATE TABLE IF NOT EXISTS recognition_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  recognitions_given INTEGER DEFAULT 0,
  recognitions_received INTEGER DEFAULT 0,
  points_given INTEGER DEFAULT 0,
  points_received INTEGER DEFAULT 0,
  top_badge_id UUID REFERENCES recognition_badges(id) ON DELETE SET NULL,
  badges_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id, period_type, period_start)
);

CREATE INDEX IF NOT EXISTS idx_recognition_summaries_organization ON recognition_summaries(organization_id);
CREATE INDEX IF NOT EXISTS idx_recognition_summaries_user ON recognition_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_recognition_summaries_period ON recognition_summaries(period_type, period_start);

-- Enable Row Level Security
ALTER TABLE recognition_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE recognitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recognition_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE recognition_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recognition_badges
CREATE POLICY "org_users_view_badges" ON recognition_badges
  FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "admins_manage_badges" ON recognition_badges
  FOR ALL USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin'])
  );

-- RLS Policies for recognitions
CREATE POLICY "view_recognitions" ON recognitions
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    AND (
      visibility = 'public'
      OR from_user_id = auth.uid()
      OR to_user_id = auth.uid()
      OR user_has_role(ARRAY['admin', 'manager'])
    )
  );

CREATE POLICY "create_recognitions" ON recognitions
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
    AND from_user_id = auth.uid()
  );

CREATE POLICY "delete_own_recognitions" ON recognitions
  FOR DELETE USING (
    from_user_id = auth.uid()
    OR user_has_role(ARRAY['admin'])
  );

-- RLS Policies for recognition_reactions
CREATE POLICY "view_reactions" ON recognition_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recognitions r
      WHERE r.id = recognition_id
      AND r.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "manage_own_reactions" ON recognition_reactions
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for manager_feedback
CREATE POLICY "view_feedback" ON manager_feedback
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    AND (
      from_user_id = auth.uid()
      OR to_user_id = auth.uid()
      OR (user_has_role(ARRAY['admin']) AND NOT is_private)
    )
  );

CREATE POLICY "create_feedback" ON manager_feedback
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id()
    AND from_user_id = auth.uid()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

CREATE POLICY "update_own_feedback" ON manager_feedback
  FOR UPDATE USING (from_user_id = auth.uid());

CREATE POLICY "delete_own_feedback" ON manager_feedback
  FOR DELETE USING (
    from_user_id = auth.uid()
    OR user_has_role(ARRAY['admin'])
  );

-- RLS Policies for recognition_summaries
CREATE POLICY "view_summaries" ON recognition_summaries
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    AND (
      user_id = auth.uid()
      OR user_has_role(ARRAY['admin', 'manager'])
    )
  );

CREATE POLICY "manage_summaries" ON recognition_summaries
  FOR ALL USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin'])
  );

-- Function to set points when recognition is created
CREATE OR REPLACE FUNCTION set_recognition_points()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Get points from badge if provided
  IF NEW.badge_id IS NOT NULL THEN
    SELECT points INTO NEW.points_awarded
    FROM recognition_badges
    WHERE id = NEW.badge_id;
  ELSE
    NEW.points_awarded := 5; -- Default points without badge
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set points before insert
CREATE TRIGGER trigger_set_recognition_points
  BEFORE INSERT ON recognitions
  FOR EACH ROW
  EXECUTE FUNCTION set_recognition_points();

-- Apply updated_at triggers
CREATE TRIGGER update_recognition_badges_updated_at
  BEFORE UPDATE ON recognition_badges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_manager_feedback_updated_at
  BEFORE UPDATE ON manager_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Comments for documentation
COMMENT ON TABLE recognition_badges IS 'Badge definitions that can be attached to recognition posts';
COMMENT ON TABLE recognitions IS 'Peer-to-peer recognition posts between employees';
COMMENT ON TABLE recognition_reactions IS 'Reactions (likes, emojis) on recognition posts';
COMMENT ON TABLE manager_feedback IS 'Continuous feedback from managers to direct reports';
COMMENT ON TABLE recognition_summaries IS 'Aggregated recognition metrics per user per period';
COMMENT ON COLUMN recognitions.visibility IS 'public = all org, team = same department, private = only parties involved';
COMMENT ON COLUMN recognitions.is_anonymous IS 'If true, from_user is hidden in the feed';
COMMENT ON COLUMN manager_feedback.is_private IS 'If true, only visible to from/to users';
