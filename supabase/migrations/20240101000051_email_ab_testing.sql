-- Email A/B Testing System
-- Enables A/B testing for email campaigns with statistical significance tracking
-- Story S092: Email A/B Testing System

-- ============================================
-- MAIN A/B TESTS TABLE
-- ============================================

CREATE TABLE email_ab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Test configuration
  name TEXT NOT NULL,
  description TEXT,
  email_type TEXT NOT NULL, -- Template name (e.g., 'survey_invitation', 'welcome_1_access')
  test_type TEXT NOT NULL CHECK (test_type IN (
    'subject_line',    -- Test different subject lines
    'preview_text',    -- Test different preview/preheader text
    'content',         -- Test different email body content/templates
    'send_time'        -- Test different send times
  )),
  winning_metric TEXT NOT NULL DEFAULT 'open_rate' CHECK (winning_metric IN (
    'open_rate',       -- Optimize for email opens
    'click_rate'       -- Optimize for link clicks
  )),

  -- Variants configuration (2-4 variants)
  variants JSONB NOT NULL,
  -- Format: [
  --   { "id": "A", "name": "Control", "isControl": true, "subjectLine": "...", "previewText": "..." },
  --   { "id": "B", "name": "Variant 1", "isControl": false, "subjectLine": "...", "previewText": "..." }
  -- ]

  -- Traffic split (must sum to 100)
  traffic_split JSONB NOT NULL,
  -- Format: { "A": 50, "B": 50 } or { "A": 33, "B": 33, "C": 34 }

  -- Auto-winner selection settings
  auto_winner_enabled BOOLEAN NOT NULL DEFAULT true,
  min_sample_size INTEGER NOT NULL DEFAULT 100,
  test_duration_hours INTEGER NOT NULL DEFAULT 24,
  confidence_level NUMERIC(3,2) NOT NULL DEFAULT 0.95 CHECK (confidence_level BETWEEN 0.80 AND 0.99),

  -- Test state
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',           -- Test created but not activated
    'active',          -- Test is running
    'paused',          -- Test temporarily paused
    'completed',       -- Winner determined, test complete
    'archived'         -- Test archived for historical reference
  )),

  -- Winner information
  winner_variant TEXT,
  winner_declared_at TIMESTAMPTZ,
  winner_declared_by UUID REFERENCES users(id) ON DELETE SET NULL,
  winner_auto BOOLEAN DEFAULT false,
  winner_reason TEXT, -- e.g., 'Statistical significance achieved', 'Manual selection'

  -- Timestamps
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_sample_size CHECK (min_sample_size >= 30),
  CONSTRAINT valid_duration CHECK (test_duration_hours >= 1 AND test_duration_hours <= 720)
);

-- Indexes for email_ab_tests
CREATE INDEX idx_email_ab_tests_org ON email_ab_tests(organization_id);
CREATE INDEX idx_email_ab_tests_status ON email_ab_tests(status);
CREATE INDEX idx_email_ab_tests_email_type ON email_ab_tests(email_type);
CREATE INDEX idx_email_ab_tests_created_by ON email_ab_tests(created_by);
CREATE INDEX idx_email_ab_tests_active ON email_ab_tests(organization_id, status)
  WHERE status = 'active';

-- ============================================
-- TEST RESULTS TABLE (AGGREGATED METRICS)
-- ============================================

CREATE TABLE email_ab_test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ab_test_id UUID NOT NULL REFERENCES email_ab_tests(id) ON DELETE CASCADE,
  variant TEXT NOT NULL, -- 'A', 'B', 'C', or 'D'

  -- Email delivery metrics
  emails_sent INTEGER NOT NULL DEFAULT 0,
  emails_delivered INTEGER NOT NULL DEFAULT 0,
  emails_opened INTEGER NOT NULL DEFAULT 0,
  emails_clicked INTEGER NOT NULL DEFAULT 0,
  emails_bounced INTEGER NOT NULL DEFAULT 0,
  emails_failed INTEGER NOT NULL DEFAULT 0,

  -- Calculated rates (stored as decimals, e.g., 0.2534 for 25.34%)
  delivery_rate NUMERIC(5,4) DEFAULT 0,
  open_rate NUMERIC(5,4) DEFAULT 0,
  click_rate NUMERIC(5,4) DEFAULT 0,
  click_to_open_rate NUMERIC(5,4) DEFAULT 0,

  -- Statistical significance (vs control variant)
  is_statistically_significant BOOLEAN DEFAULT false,
  p_value NUMERIC(10,8),
  z_score NUMERIC(10,4),
  confidence_interval_lower NUMERIC(5,4),
  confidence_interval_upper NUMERIC(5,4),

  -- Timestamps
  first_email_sent_at TIMESTAMPTZ,
  last_email_sent_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(ab_test_id, variant)
);

-- Indexes for email_ab_test_results
CREATE INDEX idx_email_ab_test_results_test ON email_ab_test_results(ab_test_id);
CREATE INDEX idx_email_ab_test_results_variant ON email_ab_test_results(ab_test_id, variant);

-- ============================================
-- ALTER email_logs TABLE
-- ============================================

-- Add A/B test tracking columns to existing email_logs table
ALTER TABLE email_logs
  ADD COLUMN ab_test_id UUID REFERENCES email_ab_tests(id) ON DELETE SET NULL,
  ADD COLUMN ab_test_variant TEXT;

-- Indexes for A/B test lookups
CREATE INDEX idx_email_logs_ab_test ON email_logs(ab_test_id)
  WHERE ab_test_id IS NOT NULL;
CREATE INDEX idx_email_logs_ab_test_variant ON email_logs(ab_test_id, ab_test_variant)
  WHERE ab_test_id IS NOT NULL;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE email_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_ab_test_results ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: email_ab_tests
-- ============================================

-- Admins can view tests in their organization
CREATE POLICY "Admins can view organization ab tests" ON email_ab_tests
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can create tests
CREATE POLICY "Admins can create ab tests" ON email_ab_tests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update tests
CREATE POLICY "Admins can update ab tests" ON email_ab_tests
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete tests
CREATE POLICY "Admins can delete ab tests" ON email_ab_tests
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role gets full access for system operations
CREATE POLICY "Service role full access ab tests" ON email_ab_tests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- RLS POLICIES: email_ab_test_results
-- ============================================

-- Admins can view results for tests in their organization
CREATE POLICY "Admins can view ab test results" ON email_ab_test_results
  FOR SELECT
  TO authenticated
  USING (
    ab_test_id IN (
      SELECT id FROM email_ab_tests
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Service role gets full access for aggregation updates
CREATE POLICY "Service role full access ab test results" ON email_ab_test_results
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

CREATE TRIGGER update_email_ab_tests_updated_at
  BEFORE UPDATE ON email_ab_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- HELPER FUNCTION: ASSIGN VARIANT
-- ============================================

-- Function to assign a variant based on traffic split
CREATE OR REPLACE FUNCTION assign_ab_test_variant(p_ab_test_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_traffic_split JSONB;
  v_random INTEGER;
  v_cumulative INTEGER := 0;
  v_variant TEXT;
  v_percentage INTEGER;
BEGIN
  -- Get traffic split for this test
  SELECT traffic_split INTO v_traffic_split
  FROM email_ab_tests
  WHERE id = p_ab_test_id AND status = 'active';

  IF v_traffic_split IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get random number between 1 and 100
  v_random := floor(random() * 100 + 1)::INTEGER;

  -- Iterate through variants in order
  FOR v_variant, v_percentage IN
    SELECT key, value::INTEGER FROM jsonb_each_text(v_traffic_split) ORDER BY key
  LOOP
    v_cumulative := v_cumulative + v_percentage;

    IF v_random <= v_cumulative THEN
      RETURN v_variant;
    END IF;
  END LOOP;

  -- Fallback to first variant (should never reach here if percentages sum to 100)
  SELECT key INTO v_variant FROM jsonb_each_text(v_traffic_split) ORDER BY key LIMIT 1;
  RETURN v_variant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: UPDATE RESULTS
-- ============================================

-- Function to recalculate results for a variant
CREATE OR REPLACE FUNCTION update_ab_test_results(p_ab_test_id UUID, p_variant TEXT)
RETURNS VOID AS $$
DECLARE
  v_sent INTEGER;
  v_delivered INTEGER;
  v_opened INTEGER;
  v_clicked INTEGER;
  v_bounced INTEGER;
  v_failed INTEGER;
  v_first_sent TIMESTAMPTZ;
  v_last_sent TIMESTAMPTZ;
BEGIN
  -- Aggregate metrics from email_logs for this variant
  SELECT
    COUNT(*) FILTER (WHERE status IN ('sent', 'delivered', 'opened', 'clicked')),
    COUNT(*) FILTER (WHERE status IN ('delivered', 'opened', 'clicked')),
    COUNT(*) FILTER (WHERE status IN ('opened', 'clicked')),
    COUNT(*) FILTER (WHERE status = 'clicked'),
    COUNT(*) FILTER (WHERE status = 'bounced'),
    COUNT(*) FILTER (WHERE status = 'failed'),
    MIN(sent_at),
    MAX(sent_at)
  INTO v_sent, v_delivered, v_opened, v_clicked, v_bounced, v_failed, v_first_sent, v_last_sent
  FROM email_logs
  WHERE ab_test_id = p_ab_test_id
    AND ab_test_variant = p_variant;

  -- Upsert the results
  INSERT INTO email_ab_test_results (
    ab_test_id,
    variant,
    emails_sent,
    emails_delivered,
    emails_opened,
    emails_clicked,
    emails_bounced,
    emails_failed,
    delivery_rate,
    open_rate,
    click_rate,
    click_to_open_rate,
    first_email_sent_at,
    last_email_sent_at,
    last_updated_at
  )
  VALUES (
    p_ab_test_id,
    p_variant,
    COALESCE(v_sent, 0),
    COALESCE(v_delivered, 0),
    COALESCE(v_opened, 0),
    COALESCE(v_clicked, 0),
    COALESCE(v_bounced, 0),
    COALESCE(v_failed, 0),
    CASE WHEN COALESCE(v_sent, 0) > 0 THEN v_delivered::NUMERIC / v_sent ELSE 0 END,
    CASE WHEN COALESCE(v_delivered, 0) > 0 THEN v_opened::NUMERIC / v_delivered ELSE 0 END,
    CASE WHEN COALESCE(v_delivered, 0) > 0 THEN v_clicked::NUMERIC / v_delivered ELSE 0 END,
    CASE WHEN COALESCE(v_opened, 0) > 0 THEN v_clicked::NUMERIC / v_opened ELSE 0 END,
    v_first_sent,
    v_last_sent,
    NOW()
  )
  ON CONFLICT (ab_test_id, variant)
  DO UPDATE SET
    emails_sent = EXCLUDED.emails_sent,
    emails_delivered = EXCLUDED.emails_delivered,
    emails_opened = EXCLUDED.emails_opened,
    emails_clicked = EXCLUDED.emails_clicked,
    emails_bounced = EXCLUDED.emails_bounced,
    emails_failed = EXCLUDED.emails_failed,
    delivery_rate = EXCLUDED.delivery_rate,
    open_rate = EXCLUDED.open_rate,
    click_rate = EXCLUDED.click_rate,
    click_to_open_rate = EXCLUDED.click_to_open_rate,
    first_email_sent_at = EXCLUDED.first_email_sent_at,
    last_email_sent_at = EXCLUDED.last_email_sent_at,
    last_updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: AUTO-UPDATE RESULTS ON EMAIL STATUS CHANGE
-- ============================================

CREATE OR REPLACE FUNCTION trigger_update_ab_test_results()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if this email is part of an A/B test
  IF NEW.ab_test_id IS NOT NULL AND NEW.ab_test_variant IS NOT NULL THEN
    PERFORM update_ab_test_results(NEW.ab_test_id, NEW.ab_test_variant);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on email_logs for INSERT and UPDATE
CREATE TRIGGER trigger_email_logs_ab_test_results
  AFTER INSERT OR UPDATE OF status, opened_at, clicked_at ON email_logs
  FOR EACH ROW
  WHEN (NEW.ab_test_id IS NOT NULL)
  EXECUTE FUNCTION trigger_update_ab_test_results();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE email_ab_tests IS 'A/B test configurations for email campaigns';
COMMENT ON TABLE email_ab_test_results IS 'Aggregated performance metrics for each test variant';

COMMENT ON COLUMN email_ab_tests.test_type IS 'Type of A/B test: subject_line, preview_text, content, send_time';
COMMENT ON COLUMN email_ab_tests.winning_metric IS 'Metric to optimize: open_rate or click_rate';
COMMENT ON COLUMN email_ab_tests.variants IS 'JSON array of variant configs with id, name, isControl, and test-specific content';
COMMENT ON COLUMN email_ab_tests.traffic_split IS 'JSON object with variant percentages, must sum to 100';
COMMENT ON COLUMN email_ab_tests.auto_winner_enabled IS 'Automatically determine winner when conditions met';
COMMENT ON COLUMN email_ab_tests.min_sample_size IS 'Minimum total emails delivered before declaring winner';
COMMENT ON COLUMN email_ab_tests.test_duration_hours IS 'Minimum hours test must run before declaring winner';
COMMENT ON COLUMN email_ab_tests.confidence_level IS 'Statistical confidence level (0.80-0.99, typically 0.95)';

COMMENT ON COLUMN email_ab_test_results.is_statistically_significant IS 'Whether variant difference from control is statistically significant';
COMMENT ON COLUMN email_ab_test_results.p_value IS 'P-value from z-test for proportions vs control';
COMMENT ON COLUMN email_ab_test_results.z_score IS 'Z-score from statistical test';

COMMENT ON COLUMN email_logs.ab_test_id IS 'A/B test this email is part of (NULL if not in a test)';
COMMENT ON COLUMN email_logs.ab_test_variant IS 'Which variant was used for this email (A, B, C, or D)';

COMMENT ON FUNCTION assign_ab_test_variant IS 'Assigns variant to email using weighted random selection';
COMMENT ON FUNCTION update_ab_test_results IS 'Recalculates aggregated results for a variant from email_logs';
