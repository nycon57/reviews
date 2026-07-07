-- Prevent deletion of consent records (TCPA 5-year retention requirement)
-- Pattern from: 20260201000003_sms_enterprise_features.sql (sms_audit_log REVOKE)

-- Revoke DELETE from authenticated users (service role still bypasses RLS)
REVOKE DELETE ON sms_consent FROM authenticated;

-- Replace the broad FOR ALL policy with explicit INSERT and UPDATE (no DELETE)
DROP POLICY IF EXISTS "Admins and managers can manage consent" ON sms_consent;

CREATE POLICY "Admins and managers can insert consent"
  ON sms_consent FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = get_current_user_id() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can update consent"
  ON sms_consent FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = get_current_user_id() AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = get_current_user_id() AND role IN ('admin', 'manager')
    )
  );
