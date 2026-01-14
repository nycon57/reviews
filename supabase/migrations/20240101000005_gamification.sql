-- Gamification System Schema
-- Adds badges, achievements, leaderboard tracking, and reputation history

-- Badge definitions table
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'award',
  category TEXT NOT NULL CHECK (category IN ('milestone', 'performance', 'streak', 'special')),
  tier TEXT CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  criteria JSONB NOT NULL DEFAULT '{}',
  is_system BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);

CREATE INDEX idx_badges_organization ON badges(organization_id);
CREATE INDEX idx_badges_category ON badges(category);
CREATE INDEX idx_badges_slug ON badges(slug);

-- User badges (achievements earned)
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_officer_id UUID NOT NULL REFERENCES loan_officers(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  progress JSONB DEFAULT '{}',
  earned_at TIMESTAMPTZ,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(loan_officer_id, badge_id)
);

CREATE INDEX idx_user_badges_loan_officer ON user_badges(loan_officer_id);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX idx_user_badges_earned ON user_badges(earned_at) WHERE earned_at IS NOT NULL;

-- Leaderboard snapshots for historical ranking
CREATE TABLE leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  loan_officer_id UUID NOT NULL REFERENCES loan_officers(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly', 'all_time')),
  period_key TEXT NOT NULL,
  rank INTEGER NOT NULL,
  reputation_score INTEGER NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  nps_score INTEGER,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, loan_officer_id, period_type, period_key)
);

CREATE INDEX idx_leaderboard_snapshots_org ON leaderboard_snapshots(organization_id);
CREATE INDEX idx_leaderboard_snapshots_lo ON leaderboard_snapshots(loan_officer_id);
CREATE INDEX idx_leaderboard_snapshots_period ON leaderboard_snapshots(period_type, period_key);
CREATE INDEX idx_leaderboard_snapshots_date ON leaderboard_snapshots(snapshot_date);

-- Reputation history for tracking changes over time
CREATE TABLE reputation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_officer_id UUID NOT NULL REFERENCES loan_officers(id) ON DELETE CASCADE,
  previous_score INTEGER NOT NULL,
  new_score INTEGER NOT NULL,
  change_amount INTEGER NOT NULL,
  change_reason TEXT,
  breakdown JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reputation_history_lo ON reputation_history(loan_officer_id);
CREATE INDEX idx_reputation_history_date ON reputation_history(recorded_at);

-- Gamification settings per organization
CREATE TABLE gamification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  is_enabled BOOLEAN DEFAULT TRUE,
  public_leaderboard BOOLEAN DEFAULT FALSE,
  show_badges_on_profile BOOLEAN DEFAULT TRUE,
  leaderboard_refresh_interval TEXT DEFAULT 'daily',
  badge_notification_enabled BOOLEAN DEFAULT TRUE,
  custom_settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gamification_settings_org ON gamification_settings(organization_id);

-- Insert system badges (available to all organizations)
INSERT INTO badges (slug, name, description, icon, category, tier, criteria, is_system, display_order) VALUES
-- Milestone badges
('first-review', 'First Review', 'Earned your first customer review', 'star', 'milestone', 'bronze', '{"type": "review_count", "threshold": 1}', TRUE, 1),
('rising-star', 'Rising Star', 'Collected 5 customer reviews', 'trending-up', 'milestone', 'bronze', '{"type": "review_count", "threshold": 5}', TRUE, 2),
('review-pro', 'Review Pro', 'Collected 10 customer reviews', 'award', 'milestone', 'silver', '{"type": "review_count", "threshold": 10}', TRUE, 3),
('review-champion', 'Review Champion', 'Collected 25 customer reviews', 'trophy', 'milestone', 'silver', '{"type": "review_count", "threshold": 25}', TRUE, 4),
('review-legend', 'Review Legend', 'Collected 50 customer reviews', 'crown', 'milestone', 'gold', '{"type": "review_count", "threshold": 50}', TRUE, 5),
('centurion', 'Centurion', 'Collected 100 customer reviews', 'shield', 'milestone', 'platinum', '{"type": "review_count", "threshold": 100}', TRUE, 6),

-- Performance badges
('five-star-hero', 'Five Star Hero', 'Achieved 5.0 average rating with 5+ reviews', 'star', 'performance', 'gold', '{"type": "rating_threshold", "rating": 5.0, "min_reviews": 5}', TRUE, 10),
('highly-rated', 'Highly Rated', 'Maintained 4.5+ average rating with 10+ reviews', 'thumbs-up', 'performance', 'silver', '{"type": "rating_threshold", "rating": 4.5, "min_reviews": 10}', TRUE, 11),
('nps-champion', 'NPS Champion', 'Achieved NPS score of 60 or higher', 'heart', 'performance', 'gold', '{"type": "nps_threshold", "threshold": 60}', TRUE, 12),
('response-master', 'Response Master', 'Achieved 80% survey response rate', 'mail-check', 'performance', 'silver', '{"type": "response_rate", "threshold": 80}', TRUE, 13),

-- Streak badges
('consistent-performer', 'Consistent Performer', 'Maintained excellent performance for 3 consecutive months', 'flame', 'streak', 'gold', '{"type": "streak", "months": 3, "status": "excellent"}', TRUE, 20),
('steady-climber', 'Steady Climber', 'Improved reputation score for 3 consecutive months', 'trending-up', 'streak', 'silver', '{"type": "improvement_streak", "months": 3}', TRUE, 21),

-- Special badges
('top-performer', 'Top Performer', 'Ranked #1 in the team leaderboard', 'crown', 'special', 'platinum', '{"type": "leaderboard_rank", "rank": 1}', TRUE, 30),
('top-three', 'Podium Finisher', 'Ranked in the top 3 of the team leaderboard', 'medal', 'special', 'gold', '{"type": "leaderboard_rank", "rank": 3}', TRUE, 31),
('top-ten', 'Top Ten', 'Ranked in the top 10 of the team leaderboard', 'award', 'special', 'silver', '{"type": "leaderboard_rank", "rank": 10}', TRUE, 32);

-- RLS Policies for gamification tables

-- Badges: readable by all authenticated users in the organization
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badges_select_system" ON badges
  FOR SELECT TO authenticated
  USING (is_system = TRUE OR organization_id IS NULL);

CREATE POLICY "badges_select_org" ON badges
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "badges_manage_admin" ON badges
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role = 'admin'
        AND organization_id = badges.organization_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role = 'admin'
        AND organization_id = badges.organization_id
    )
  );

-- User badges: users can see their own, managers/admins can see all in org
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_badges_select_own" ON user_badges
  FOR SELECT TO authenticated
  USING (
    loan_officer_id IN (
      SELECT lo.id FROM loan_officers lo
      JOIN users u ON u.id = lo.user_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "user_badges_select_org" ON user_badges
  FOR SELECT TO authenticated
  USING (
    loan_officer_id IN (
      SELECT lo.id FROM loan_officers lo
      JOIN users u ON u.organization_id = lo.organization_id
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "user_badges_insert" ON user_badges
  FOR INSERT TO authenticated
  WITH CHECK (
    loan_officer_id IN (
      SELECT lo.id FROM loan_officers lo
      JOIN users u ON u.organization_id = lo.organization_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "user_badges_update" ON user_badges
  FOR UPDATE TO authenticated
  USING (
    loan_officer_id IN (
      SELECT lo.id FROM loan_officers lo
      JOIN users u ON u.organization_id = lo.organization_id
      WHERE u.id = auth.uid()
    )
  );

-- Leaderboard snapshots: viewable by org members
ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leaderboard_snapshots_select" ON leaderboard_snapshots
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "leaderboard_snapshots_insert" ON leaderboard_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Reputation history: users see own, managers/admins see org
ALTER TABLE reputation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reputation_history_select_own" ON reputation_history
  FOR SELECT TO authenticated
  USING (
    loan_officer_id IN (
      SELECT lo.id FROM loan_officers lo
      JOIN users u ON u.id = lo.user_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "reputation_history_select_org" ON reputation_history
  FOR SELECT TO authenticated
  USING (
    loan_officer_id IN (
      SELECT lo.id FROM loan_officers lo
      JOIN users u ON u.organization_id = lo.organization_id
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "reputation_history_insert" ON reputation_history
  FOR INSERT TO authenticated
  WITH CHECK (
    loan_officer_id IN (
      SELECT lo.id FROM loan_officers lo
      JOIN users u ON u.organization_id = lo.organization_id
      WHERE u.id = auth.uid()
    )
  );

-- Gamification settings: org members can read, admins can manage
ALTER TABLE gamification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gamification_settings_select" ON gamification_settings
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "gamification_settings_manage" ON gamification_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role = 'admin'
        AND organization_id = gamification_settings.organization_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role = 'admin'
        AND organization_id = gamification_settings.organization_id
    )
  );

-- Function to calculate and update reputation scores
CREATE OR REPLACE FUNCTION calculate_and_update_reputation(p_loan_officer_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_nps_score INTEGER;
  v_csat_score INTEGER;
  v_response_rate INTEGER;
  v_total_reviews INTEGER;
  v_avg_rating DECIMAL;
  v_reputation_score INTEGER;
  v_old_score INTEGER;
BEGIN
  -- Get current reputation score
  SELECT reputation_score INTO v_old_score
  FROM loan_officers WHERE id = p_loan_officer_id;

  -- Get total reviews and average rating
  SELECT COALESCE(total_reviews, 0), COALESCE(average_rating, 0)
  INTO v_total_reviews, v_avg_rating
  FROM loan_officers WHERE id = p_loan_officer_id;

  -- Calculate NPS from survey responses
  SELECT COALESCE(
    ROUND(
      (SUM(CASE WHEN sr.nps_score >= 9 THEN 1 ELSE 0 END)::DECIMAL * 100 / NULLIF(COUNT(*), 0)) -
      (SUM(CASE WHEN sr.nps_score <= 6 THEN 1 ELSE 0 END)::DECIMAL * 100 / NULLIF(COUNT(*), 0))
    ),
    0
  )
  INTO v_nps_score
  FROM survey_responses sr
  JOIN surveys s ON s.id = sr.survey_id
  WHERE s.loan_officer_id = p_loan_officer_id
    AND sr.nps_score IS NOT NULL;

  -- Calculate CSAT (% satisfied)
  SELECT COALESCE(
    ROUND(
      SUM(CASE WHEN sr.overall_rating >= 4 THEN 1 ELSE 0 END)::DECIMAL * 100 / NULLIF(COUNT(*), 0)
    ),
    0
  )
  INTO v_csat_score
  FROM survey_responses sr
  JOIN surveys s ON s.id = sr.survey_id
  WHERE s.loan_officer_id = p_loan_officer_id
    AND sr.overall_rating IS NOT NULL;

  -- Calculate response rate
  SELECT COALESCE(
    ROUND(
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::DECIMAL * 100 /
      NULLIF(SUM(CASE WHEN status IN ('sent', 'opened', 'completed', 'expired') THEN 1 ELSE 0 END), 0)
    ),
    0
  )
  INTO v_response_rate
  FROM surveys
  WHERE loan_officer_id = p_loan_officer_id;

  -- Calculate weighted reputation score
  -- NPS: 30% (normalize from -100..100 to 0..100)
  -- CSAT: 25%
  -- Response Rate: 15%
  -- Volume: 15% (cap at 50 reviews = 100%)
  -- Rating: 15% (normalize from 1..5 to 0..100)
  v_reputation_score := ROUND(
    ((v_nps_score + 100) / 2) * 0.30 +
    v_csat_score * 0.25 +
    v_response_rate * 0.15 +
    LEAST(v_total_reviews * 2, 100) * 0.15 +
    ((v_avg_rating - 1) * 25) * 0.15
  );

  -- Update loan officer record
  UPDATE loan_officers
  SET reputation_score = v_reputation_score,
      nps_score = v_nps_score,
      updated_at = NOW()
  WHERE id = p_loan_officer_id;

  -- Record history if score changed
  IF v_old_score IS DISTINCT FROM v_reputation_score THEN
    INSERT INTO reputation_history (
      loan_officer_id,
      previous_score,
      new_score,
      change_amount,
      change_reason,
      breakdown
    ) VALUES (
      p_loan_officer_id,
      COALESCE(v_old_score, 0),
      v_reputation_score,
      v_reputation_score - COALESCE(v_old_score, 0),
      'Automatic recalculation',
      jsonb_build_object(
        'nps', v_nps_score,
        'csat', v_csat_score,
        'response_rate', v_response_rate,
        'total_reviews', v_total_reviews,
        'average_rating', v_avg_rating
      )
    );
  END IF;

  RETURN v_reputation_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award badges for a loan officer
CREATE OR REPLACE FUNCTION check_badges_for_loan_officer(p_loan_officer_id UUID)
RETURNS TABLE(badge_slug TEXT, badge_name TEXT, newly_earned BOOLEAN) AS $$
DECLARE
  v_lo RECORD;
  v_badge RECORD;
  v_criteria JSONB;
  v_earned BOOLEAN;
  v_response_rate INTEGER;
  v_org_id UUID;
  v_rank INTEGER;
BEGIN
  -- Get loan officer data
  SELECT
    lo.id,
    lo.organization_id,
    lo.total_reviews,
    lo.average_rating,
    lo.nps_score,
    lo.reputation_score
  INTO v_lo
  FROM loan_officers lo
  WHERE lo.id = p_loan_officer_id;

  IF v_lo IS NULL THEN
    RETURN;
  END IF;

  v_org_id := v_lo.organization_id;

  -- Calculate response rate
  SELECT COALESCE(
    ROUND(
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::DECIMAL * 100 /
      NULLIF(SUM(CASE WHEN status IN ('sent', 'opened', 'completed', 'expired') THEN 1 ELSE 0 END), 0)
    ),
    0
  )
  INTO v_response_rate
  FROM surveys
  WHERE loan_officer_id = p_loan_officer_id;

  -- Get current rank in organization
  SELECT COUNT(*) + 1 INTO v_rank
  FROM loan_officers
  WHERE organization_id = v_org_id
    AND is_active = TRUE
    AND reputation_score > v_lo.reputation_score;

  -- Check each badge
  FOR v_badge IN
    SELECT b.*
    FROM badges b
    WHERE (b.is_system = TRUE OR b.organization_id = v_org_id)
      AND b.is_active = TRUE
    ORDER BY b.display_order
  LOOP
    v_earned := FALSE;
    v_criteria := v_badge.criteria;

    -- Check criteria based on type
    CASE v_criteria->>'type'
      WHEN 'review_count' THEN
        v_earned := v_lo.total_reviews >= (v_criteria->>'threshold')::INTEGER;

      WHEN 'rating_threshold' THEN
        v_earned := v_lo.average_rating >= (v_criteria->>'rating')::DECIMAL
          AND v_lo.total_reviews >= (v_criteria->>'min_reviews')::INTEGER;

      WHEN 'nps_threshold' THEN
        v_earned := COALESCE(v_lo.nps_score, 0) >= (v_criteria->>'threshold')::INTEGER;

      WHEN 'response_rate' THEN
        v_earned := v_response_rate >= (v_criteria->>'threshold')::INTEGER;

      WHEN 'leaderboard_rank' THEN
        v_earned := v_rank <= (v_criteria->>'rank')::INTEGER;

      ELSE
        v_earned := FALSE;
    END CASE;

    -- If badge is earned, insert or update
    IF v_earned THEN
      INSERT INTO user_badges (loan_officer_id, badge_id, earned_at, progress)
      VALUES (p_loan_officer_id, v_badge.id, NOW(), v_criteria)
      ON CONFLICT (loan_officer_id, badge_id)
      DO UPDATE SET
        progress = v_criteria,
        earned_at = COALESCE(user_badges.earned_at, NOW());
    END IF;

    -- Return badge status
    badge_slug := v_badge.slug;
    badge_name := v_badge.name;
    newly_earned := v_earned AND NOT EXISTS (
      SELECT 1 FROM user_badges ub
      WHERE ub.loan_officer_id = p_loan_officer_id
        AND ub.badge_id = v_badge.id
        AND ub.earned_at IS NOT NULL
    );

    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to recalculate reputation and check badges after review changes
CREATE OR REPLACE FUNCTION trigger_gamification_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate reputation score
  PERFORM calculate_and_update_reputation(COALESCE(NEW.loan_officer_id, OLD.loan_officer_id));

  -- Check badges
  PERFORM check_badges_for_loan_officer(COALESCE(NEW.loan_officer_id, OLD.loan_officer_id));

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on reviews table
CREATE TRIGGER trigger_gamification_on_review
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_gamification_update();

-- Create trigger on survey_responses table
CREATE TRIGGER trigger_gamification_on_survey_response
  AFTER INSERT OR UPDATE ON survey_responses
  FOR EACH ROW
  EXECUTE FUNCTION trigger_gamification_update();

-- Apply updated_at triggers
CREATE TRIGGER update_badges_updated_at BEFORE UPDATE ON badges FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_gamification_settings_updated_at BEFORE UPDATE ON gamification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
