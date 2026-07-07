-- Suppressed-send audit trail (ADR 0004).
--
-- Every acquisition send path passes the single send-time suppression check
-- (isSuppressed). When that check blocks a send, the send must not vanish
-- silently — a suppressed send is a compliance-relevant event and needs a
-- durable, queryable trace. Rather than overload each channel's heterogeneous
-- status/error columns (and to avoid changing existing status enums), we record
-- one row here per skipped send, uniform across surveys, video requests, and the
-- review→video upsell. The originating queue item / request is also moved to a
-- terminal state by the send path so it is not retried; this table is the
-- audit-of-record for *why*.
--
-- Additive-only.

CREATE TABLE IF NOT EXISTS acquisition_send_skips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- The Contact whose suppression blocked the send, when known. Nullable +
  -- ON DELETE SET NULL so an erased/deleted Contact does not erase the audit fact.
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  -- Denormalized identity hash of the skipped recipient (matches the suppression
  -- key), so the trace survives Contact erasure and is joinable to suppressions.
  email_sha256 TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  -- Which send path was skipped, e.g. 'survey_invitation', 'survey_reminder',
  -- 'video_invitation', 'video_reminder', 'review_video_upsell'.
  send_kind TEXT NOT NULL,
  -- The originating row: table name + id, kept loose (no FK) because it spans
  -- several source tables and must outlive their rows.
  source_table TEXT,
  source_id UUID,
  -- Why the send was skipped. Today always a suppression; kept as text for
  -- forward compatibility.
  reason TEXT NOT NULL DEFAULT 'suppressed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_acquisition_send_skips_org_created
  ON acquisition_send_skips (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_acquisition_send_skips_contact
  ON acquisition_send_skips (contact_id)
  WHERE contact_id IS NOT NULL;

-- Writes come only from the service-role admin client on send paths (RLS
-- bypassed). This policy is the backstop for authenticated reads: admins and
-- managers may audit their own org's skipped sends. Modeled on contacts RLS.
ALTER TABLE acquisition_send_skips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acquisition_send_skips_select" ON acquisition_send_skips
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE users.id = (SELECT auth.uid())
        AND users.role IN ('admin', 'manager')
    )
  );
