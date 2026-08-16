-- A/B winner-apply: persist the winning variant so future sends actually use it.
--
-- Background: email A/B tests (20240101000051_email_ab_testing.sql) collect
-- stats and let an admin "declare" a winner, but nothing ever *applied* the
-- winner — declaring only stamped winner_* columns and the send path never
-- consulted the test. This migration adds the store the send path reads and the
-- audit columns the apply step stamps.
--
-- Two additive changes:
--   1. email_type_overrides — the effective (subject_line, preview_text) an org
--      wants used for a given email_type going forward. One row per
--      (organization_id, email_type); written by applyWinnerToFuture, read at
--      send time by resolveEmailTypeOverride. Decoupled from email_ab_tests so
--      the override outlives the test (tests can be archived) and could later be
--      set by hand, not only by an A/B winner.
--   2. email_ab_tests.winner_applied_at / winner_applied_by — audit stamp so the
--      admin UI can show an "Applied" state distinct from merely "declared".
--
-- Additive-only. Code reads these defensively (missing table/column degrades to
-- "no override") so it is safe to deploy before this migration runs.

-- ============================================
-- EFFECTIVE PER-ORG SUBJECT/PREVIEW OVERRIDES
-- ============================================

CREATE TABLE IF NOT EXISTS email_type_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Matches email_ab_tests.email_type / email_logs.template_name, e.g.
  -- 'survey_invitation', 'welcome_1_access'.
  email_type TEXT NOT NULL,
  -- The winning variant's copy. Either may be null (a subject-line test leaves
  -- preview_text null); a null column means "don't override that field".
  subject_line TEXT,
  preview_text TEXT,
  -- Provenance: which A/B test produced this override (null if set another way).
  -- ON DELETE SET NULL so deleting the test keeps the applied override intact.
  source_ab_test_id UUID REFERENCES email_ab_tests(id) ON DELETE SET NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- One effective override per email type per org; re-applying upserts.
  UNIQUE (organization_id, email_type)
);

CREATE INDEX IF NOT EXISTS idx_email_type_overrides_lookup
  ON email_type_overrides (organization_id, email_type);

-- Reads at send time come from the service-role admin client (RLS bypassed).
-- This policy backstops authenticated admin reads/manage of their own org.
ALTER TABLE email_type_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_type_overrides_admin_all" ON email_type_overrides
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE users.id = (SELECT auth.uid()) AND users.role = 'admin'
    )
  );

CREATE POLICY "email_type_overrides_service_role" ON email_type_overrides
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_email_type_overrides_updated_at
  BEFORE UPDATE ON email_type_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- APPLIED-STATE AUDIT COLUMNS ON email_ab_tests
-- ============================================

ALTER TABLE email_ab_tests
  ADD COLUMN IF NOT EXISTS winner_applied_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS winner_applied_by UUID REFERENCES users(id) ON DELETE SET NULL;

COMMENT ON TABLE email_type_overrides IS 'Effective per-org subject/preview overrides consulted at send time; populated by applying an A/B test winner.';
COMMENT ON COLUMN email_type_overrides.email_type IS 'Template identifier, matches email_ab_tests.email_type and email_logs.template_name.';
COMMENT ON COLUMN email_type_overrides.source_ab_test_id IS 'A/B test whose winner produced this override (NULL if set another way).';
COMMENT ON COLUMN email_ab_tests.winner_applied_at IS 'When the declared winner was applied to email_type_overrides (NULL if declared but not applied).';
COMMENT ON COLUMN email_ab_tests.winner_applied_by IS 'User who applied the winner to future sends.';
