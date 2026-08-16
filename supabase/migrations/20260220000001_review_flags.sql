-- Review flags table for tracking reported reviews
CREATE TABLE IF NOT EXISTS review_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  reporter_name TEXT,
  reporter_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_review_flags_review_id ON review_flags(review_id);
CREATE INDEX IF NOT EXISTS idx_review_flags_org_status_created
  ON review_flags(organization_id, status, created_at DESC);

-- RLS
ALTER TABLE review_flags ENABLE ROW LEVEL SECURITY;

-- Org admins/managers can view and update flags for their org
CREATE POLICY "org_admins_select_flags" ON review_flags
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE users.id = (SELECT auth.uid())
        AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "org_admins_update_flags" ON review_flags
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE users.id = (SELECT auth.uid())
        AND users.role IN ('admin', 'manager')
    )
  );

-- Public insert via service_role (server actions use admin client)
-- No INSERT policy for authenticated — inserts go through server actions with admin client
