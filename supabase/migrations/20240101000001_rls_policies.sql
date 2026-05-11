-- Row Level Security Policies for RepWell
-- This migration sets up RLS policies for multi-tenant data isolation

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's organization
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to check if current user has role
CREATE OR REPLACE FUNCTION user_has_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = ANY(required_roles)
    AND is_active = TRUE
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to get current user's active status
CREATE OR REPLACE FUNCTION get_user_is_active()
RETURNS BOOLEAN AS $$
  SELECT is_active FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- ORGANIZATIONS POLICIES
-- ============================================

-- Users can view their own organization
CREATE POLICY "users_view_own_organization" ON organizations
  FOR SELECT USING (
    id = get_user_organization_id()
  );

-- Only admins can update organization settings
CREATE POLICY "admins_update_organization" ON organizations
  FOR UPDATE USING (
    id = get_user_organization_id() AND user_has_role(ARRAY['admin'])
  );

-- ============================================
-- USERS POLICIES
-- ============================================

-- Users can view other users in their organization
CREATE POLICY "users_view_same_org" ON users
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

-- Users can update their own profile
CREATE POLICY "users_update_own_profile" ON users
  FOR UPDATE USING (
    id = auth.uid()
  )
  WITH CHECK (
    id = auth.uid()
    AND organization_id = get_user_organization_id()
    AND role = get_user_role()
    AND is_active = get_user_is_active()
  );

-- Admins can insert new users in their org
CREATE POLICY "admins_insert_users" ON users
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id() AND user_has_role(ARRAY['admin'])
  );

-- Admins can update any user in their org
CREATE POLICY "admins_update_users" ON users
  FOR UPDATE USING (
    organization_id = get_user_organization_id() AND user_has_role(ARRAY['admin'])
  );

-- ============================================
-- LOAN OFFICERS POLICIES
-- ============================================

-- All org members can view loan officers
CREATE POLICY "org_members_view_loan_officers" ON loan_officers
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

-- Loan officers can update their own profile
CREATE POLICY "loan_officers_update_own" ON loan_officers
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- Managers and admins can manage all LOs
CREATE POLICY "managers_manage_loan_officers" ON loan_officers
  FOR ALL USING (
    organization_id = get_user_organization_id() AND user_has_role(ARRAY['admin', 'manager'])
  );

-- ============================================
-- SURVEY TEMPLATES POLICIES
-- ============================================

-- All org members can view templates
CREATE POLICY "org_members_view_templates" ON survey_templates
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

-- Managers and admins can manage templates
CREATE POLICY "managers_manage_templates" ON survey_templates
  FOR ALL USING (
    organization_id = get_user_organization_id() AND user_has_role(ARRAY['admin', 'manager'])
  );

-- ============================================
-- SURVEYS POLICIES
-- ============================================

-- Loan officers see their own surveys
CREATE POLICY "loan_officers_view_own_surveys" ON surveys
  FOR SELECT USING (
    loan_officer_id IN (
      SELECT id FROM loan_officers WHERE user_id = auth.uid()
    )
  );

-- Managers and admins see all surveys in org
CREATE POLICY "managers_view_all_surveys" ON surveys
  FOR SELECT USING (
    organization_id = get_user_organization_id() AND user_has_role(ARRAY['admin', 'manager'])
  );

-- Managers and admins can manage surveys
CREATE POLICY "managers_manage_surveys" ON surveys
  FOR ALL USING (
    organization_id = get_user_organization_id() AND user_has_role(ARRAY['admin', 'manager'])
  );

-- ============================================
-- SURVEY RESPONSES POLICIES
-- ============================================

-- Users can view responses for surveys they can see
CREATE POLICY "users_view_survey_responses" ON survey_responses
  FOR SELECT USING (
    survey_id IN (
      SELECT id FROM surveys
      WHERE organization_id = get_user_organization_id()
    )
  );

-- Allow anonymous submission (for public survey forms)
CREATE POLICY "public_submit_responses" ON survey_responses
  FOR INSERT WITH CHECK (true);

-- ============================================
-- REVIEWS POLICIES
-- ============================================

-- Loan officers see their own reviews
CREATE POLICY "loan_officers_view_own_reviews" ON reviews
  FOR SELECT USING (
    loan_officer_id IN (
      SELECT id FROM loan_officers WHERE user_id = auth.uid()
    )
  );

-- Managers and admins see all reviews in org
CREATE POLICY "managers_view_all_reviews" ON reviews
  FOR SELECT USING (
    organization_id = get_user_organization_id() AND user_has_role(ARRAY['admin', 'manager'])
  );

-- Managers and admins can manage reviews
CREATE POLICY "managers_manage_reviews" ON reviews
  FOR ALL USING (
    organization_id = get_user_organization_id() AND user_has_role(ARRAY['admin', 'manager'])
  );

-- Public can view published reviews (for widgets)
CREATE POLICY "public_view_published_reviews" ON reviews
  FOR SELECT USING (
    is_published = TRUE AND status = 'approved'
  );

-- ============================================
-- EMAIL LOGS POLICIES
-- ============================================

-- Managers and admins can view email logs
CREATE POLICY "managers_view_email_logs" ON email_logs
  FOR SELECT USING (
    organization_id = get_user_organization_id() AND user_has_role(ARRAY['admin', 'manager'])
  );

-- System can insert email logs (via service role)
CREATE POLICY "system_insert_email_logs" ON email_logs
  FOR INSERT WITH CHECK (true);

-- ============================================
-- METRICS SNAPSHOTS POLICIES
-- ============================================

-- All org members can view org-level metrics
CREATE POLICY "org_members_view_metrics" ON metrics_snapshots
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

-- Loan officers can only view their own metrics
CREATE POLICY "loan_officers_view_own_metrics" ON metrics_snapshots
  FOR SELECT USING (
    loan_officer_id IN (
      SELECT id FROM loan_officers WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- API KEYS POLICIES
-- ============================================

-- Only admins can manage API keys
CREATE POLICY "admins_manage_api_keys" ON api_keys
  FOR ALL USING (
    organization_id = get_user_organization_id() AND user_has_role(ARRAY['admin'])
  );
