-- Employee Experience (EX) Survey System Migration
-- Implements internal culture and engagement measurement

-- Create departments table for team/department structure
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  manager_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_departments_organization ON departments(organization_id);
CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_id);
CREATE INDEX IF NOT EXISTS idx_departments_manager ON departments(manager_user_id);

-- Add department to users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);

-- EX Survey Templates table (separate from customer survey templates)
CREATE TABLE IF NOT EXISTS ex_survey_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  survey_type TEXT NOT NULL CHECK (survey_type IN ('engagement', 'pulse', 'exit', 'onboarding', 'custom')),
  frequency TEXT CHECK (frequency IN ('once', 'weekly', 'monthly', 'quarterly', 'annual')),
  is_anonymous BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  questions JSONB NOT NULL DEFAULT '[]',
  branding JSONB DEFAULT '{}',
  thank_you_config JSONB DEFAULT '{}',
  target_departments UUID[] DEFAULT '{}',
  target_roles TEXT[] DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}',
  benchmark_category TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ex_survey_templates_organization ON ex_survey_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_ex_survey_templates_type ON ex_survey_templates(survey_type);
CREATE INDEX IF NOT EXISTS idx_ex_survey_templates_active ON ex_survey_templates(is_active) WHERE is_active = TRUE;

-- EX Surveys table (individual survey campaigns)
CREATE TABLE IF NOT EXISTS ex_surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES ex_survey_templates(id),
  name TEXT NOT NULL,
  description TEXT,
  survey_type TEXT NOT NULL CHECK (survey_type IN ('engagement', 'pulse', 'exit', 'onboarding', 'custom')),
  is_anonymous BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'closed', 'archived')),
  target_departments UUID[] DEFAULT '{}',
  target_roles TEXT[] DEFAULT '{}',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  reminder_schedule JSONB DEFAULT '[]',
  total_invites INTEGER DEFAULT 0,
  total_responses INTEGER DEFAULT 0,
  response_rate DECIMAL(5,2) DEFAULT 0,
  enps_score INTEGER,
  average_rating DECIMAL(3,2),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ex_surveys_organization ON ex_surveys(organization_id);
CREATE INDEX IF NOT EXISTS idx_ex_surveys_template ON ex_surveys(template_id);
CREATE INDEX IF NOT EXISTS idx_ex_surveys_status ON ex_surveys(status);
CREATE INDEX IF NOT EXISTS idx_ex_surveys_type ON ex_surveys(survey_type);
CREATE INDEX IF NOT EXISTS idx_ex_surveys_dates ON ex_surveys(start_date, end_date);

-- EX Survey Invitations (tracks who was invited)
CREATE TABLE IF NOT EXISTS ex_survey_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES ex_surveys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'completed', 'expired')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(survey_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ex_survey_invitations_survey ON ex_survey_invitations(survey_id);
CREATE INDEX IF NOT EXISTS idx_ex_survey_invitations_user ON ex_survey_invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_ex_survey_invitations_token ON ex_survey_invitations(token);
CREATE INDEX IF NOT EXISTS idx_ex_survey_invitations_status ON ex_survey_invitations(status);

-- EX Survey Responses
-- Note: For anonymous surveys, user_id will be NULL after response processing
CREATE TABLE IF NOT EXISTS ex_survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES ex_surveys(id) ON DELETE CASCADE,
  invitation_id UUID REFERENCES ex_survey_invitations(id) ON DELETE SET NULL,
  -- For anonymous surveys, these fields capture aggregate info without identifying the employee
  department_id UUID REFERENCES departments(id),
  tenure_range TEXT, -- e.g., '0-6 months', '6-12 months', '1-2 years', '2-5 years', '5+ years'
  role_category TEXT, -- Generalized role category, not actual role
  is_anonymous BOOLEAN DEFAULT TRUE,
  answers JSONB NOT NULL DEFAULT '{}',
  enps_score INTEGER,
  overall_rating INTEGER,
  sentiment_score DECIMAL(3,2),
  sentiment_label TEXT,
  themes TEXT[],
  key_phrases TEXT[],
  ai_summary TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  -- For anonymous surveys, do not store identifying info
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ex_survey_responses_survey ON ex_survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_ex_survey_responses_department ON ex_survey_responses(department_id);
CREATE INDEX IF NOT EXISTS idx_ex_survey_responses_submitted ON ex_survey_responses(submitted_at);
CREATE INDEX IF NOT EXISTS idx_ex_survey_responses_enps ON ex_survey_responses(enps_score);

-- EX Metrics Snapshots for trend analysis
CREATE TABLE IF NOT EXISTS ex_metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  survey_id UUID REFERENCES ex_surveys(id) ON DELETE SET NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('survey', 'weekly', 'monthly', 'quarterly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  enps_score INTEGER,
  engagement_score DECIMAL(5,2),
  response_rate DECIMAL(5,2),
  total_responses INTEGER DEFAULT 0,
  benchmark_comparison JSONB,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ex_metrics_unique
  ON ex_metrics_snapshots(organization_id, COALESCE(department_id, '00000000-0000-0000-0000-000000000000'::uuid), period_type, period_start);
CREATE INDEX IF NOT EXISTS idx_ex_metrics_department ON ex_metrics_snapshots(department_id);
CREATE INDEX IF NOT EXISTS idx_ex_metrics_survey ON ex_metrics_snapshots(survey_id);

-- EX Action Plans for improvement tracking
CREATE TABLE IF NOT EXISTS ex_action_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  survey_id UUID REFERENCES ex_surveys(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_date DATE,
  completed_date DATE,
  success_metrics JSONB DEFAULT '{}',
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ex_action_plans_organization ON ex_action_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_ex_action_plans_survey ON ex_action_plans(survey_id);
CREATE INDEX IF NOT EXISTS idx_ex_action_plans_department ON ex_action_plans(department_id);
CREATE INDEX IF NOT EXISTS idx_ex_action_plans_status ON ex_action_plans(status);
CREATE INDEX IF NOT EXISTS idx_ex_action_plans_owner ON ex_action_plans(owner_user_id);

-- Industry Benchmarks table for comparison
CREATE TABLE IF NOT EXISTS ex_benchmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL, -- e.g., 'financial_services', 'technology', 'healthcare'
  year INTEGER NOT NULL,
  quarter INTEGER,
  metrics JSONB NOT NULL DEFAULT '{}',
  -- Example metrics: enps_avg, engagement_avg, response_rate_avg, by_company_size
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, year, COALESCE(quarter, 0))
);

CREATE INDEX IF NOT EXISTS idx_ex_benchmarks_category ON ex_benchmarks(category);
CREATE INDEX IF NOT EXISTS idx_ex_benchmarks_year ON ex_benchmarks(year);

-- Enable Row Level Security
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ex_survey_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ex_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ex_survey_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ex_survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ex_metrics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ex_action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ex_benchmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for departments
CREATE POLICY "org_users_view_departments" ON departments
  FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "admins_manage_departments" ON departments
  FOR ALL USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin'])
  );

-- RLS Policies for ex_survey_templates
CREATE POLICY "org_users_view_ex_templates" ON ex_survey_templates
  FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "admins_managers_manage_ex_templates" ON ex_survey_templates
  FOR ALL USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

-- RLS Policies for ex_surveys
CREATE POLICY "org_users_view_ex_surveys" ON ex_surveys
  FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "admins_managers_manage_ex_surveys" ON ex_surveys
  FOR ALL USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

-- RLS Policies for ex_survey_invitations
CREATE POLICY "users_view_own_invitations" ON ex_survey_invitations
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM ex_surveys s
      WHERE s.id = survey_id
      AND s.organization_id = get_user_organization_id()
      AND user_has_role(ARRAY['admin', 'manager'])
    )
  );

CREATE POLICY "admins_managers_manage_invitations" ON ex_survey_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ex_surveys s
      WHERE s.id = survey_id
      AND s.organization_id = get_user_organization_id()
      AND user_has_role(ARRAY['admin', 'manager'])
    )
  );

-- RLS Policies for ex_survey_responses (restricted for anonymity)
-- Managers can only see aggregate data, not individual responses for anonymous surveys
CREATE POLICY "view_responses" ON ex_survey_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ex_surveys s
      WHERE s.id = survey_id
      AND s.organization_id = get_user_organization_id()
      AND user_has_role(ARRAY['admin', 'manager'])
    )
  );

CREATE POLICY "insert_responses" ON ex_survey_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ex_surveys s
      WHERE s.id = survey_id
      AND s.organization_id = get_user_organization_id()
    )
  );

-- RLS Policies for ex_metrics_snapshots
CREATE POLICY "view_ex_metrics" ON ex_metrics_snapshots
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

CREATE POLICY "manage_ex_metrics" ON ex_metrics_snapshots
  FOR ALL USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

-- RLS Policies for ex_action_plans
CREATE POLICY "org_users_view_action_plans" ON ex_action_plans
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    AND (
      user_has_role(ARRAY['admin', 'manager'])
      OR owner_user_id = auth.uid()
    )
  );

CREATE POLICY "admins_managers_manage_action_plans" ON ex_action_plans
  FOR ALL USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

-- RLS Policies for ex_benchmarks (public read for authenticated users)
CREATE POLICY "authenticated_view_benchmarks" ON ex_benchmarks
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Function to update ex_survey metrics
CREATE OR REPLACE FUNCTION update_ex_survey_metrics()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE ex_surveys
  SET
    total_responses = (
      SELECT COUNT(*) FROM ex_survey_responses WHERE survey_id = NEW.survey_id
    ),
    response_rate = (
      SELECT
        CASE WHEN total_invites > 0
        THEN (COUNT(r.id)::DECIMAL / total_invites * 100)
        ELSE 0 END
      FROM ex_survey_responses r, ex_surveys s
      WHERE r.survey_id = s.id AND s.id = NEW.survey_id
      GROUP BY s.total_invites
    ),
    enps_score = (
      SELECT
        ROUND(
          (COUNT(CASE WHEN enps_score >= 9 THEN 1 END)::DECIMAL -
           COUNT(CASE WHEN enps_score <= 6 THEN 1 END)::DECIMAL) /
          NULLIF(COUNT(enps_score), 0) * 100
        )
      FROM ex_survey_responses WHERE survey_id = NEW.survey_id
    ),
    average_rating = (
      SELECT AVG(overall_rating) FROM ex_survey_responses
      WHERE survey_id = NEW.survey_id AND overall_rating IS NOT NULL
    ),
    updated_at = NOW()
  WHERE id = NEW.survey_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update survey metrics on response
CREATE TRIGGER trigger_update_ex_survey_metrics
  AFTER INSERT ON ex_survey_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_ex_survey_metrics();

-- Function to anonymize response after submission
-- This removes the link between invitation and response for anonymous surveys
CREATE OR REPLACE FUNCTION anonymize_ex_response()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_anonymous BOOLEAN;
BEGIN
  -- Check if the survey is anonymous
  SELECT is_anonymous INTO v_is_anonymous
  FROM ex_surveys WHERE id = NEW.survey_id;

  -- If anonymous, clear the invitation_id after a short delay to prevent correlation
  IF v_is_anonymous THEN
    -- Update the response to remove direct link (done in application layer for timing)
    NEW.invitation_id := NULL;
    -- Don't store IP for anonymous surveys
    NEW.ip_address := NULL;
    NEW.user_agent := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to anonymize response before insert
CREATE TRIGGER trigger_anonymize_ex_response
  BEFORE INSERT ON ex_survey_responses
  FOR EACH ROW
  EXECUTE FUNCTION anonymize_ex_response();

-- Apply updated_at triggers
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ex_survey_templates_updated_at
  BEFORE UPDATE ON ex_survey_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ex_surveys_updated_at
  BEFORE UPDATE ON ex_surveys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ex_action_plans_updated_at
  BEFORE UPDATE ON ex_action_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Comments for documentation
COMMENT ON TABLE departments IS 'Organization departments for EX survey targeting and reporting';
COMMENT ON TABLE ex_survey_templates IS 'EX survey template definitions with question configurations';
COMMENT ON TABLE ex_surveys IS 'Individual EX survey campaigns sent to employees';
COMMENT ON TABLE ex_survey_invitations IS 'Tracks employee survey invitations and completion status';
COMMENT ON TABLE ex_survey_responses IS 'Employee survey responses with anonymity support';
COMMENT ON TABLE ex_metrics_snapshots IS 'Aggregated EX metrics for trend analysis';
COMMENT ON TABLE ex_action_plans IS 'Action plans created from EX survey insights';
COMMENT ON TABLE ex_benchmarks IS 'Industry benchmark data for comparison';
COMMENT ON COLUMN ex_survey_responses.is_anonymous IS 'If true, response is not linked to any user';
COMMENT ON COLUMN ex_survey_responses.tenure_range IS 'Anonymized tenure category for demographic filtering';
COMMENT ON COLUMN ex_survey_responses.role_category IS 'Generalized role category (not actual role) for anonymity';
