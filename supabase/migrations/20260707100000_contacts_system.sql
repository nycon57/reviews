-- Contacts system: first-class acquisition identity (ADR 0004).
--
-- A Contact is the canonical record of an EXTERNAL person a professional asks
-- for feedback (text review or video testimonial). Every acquisition request
-- references a Contact; deduplication, suppression, and funnel identity hang
-- off it. Strictly separate from `employees` (EX-survey roster) — different
-- consent, anonymity, and suppression semantics (ADR 0004).
--
-- Scope: org-scoped on organizations.id. Per ADR 0006 every account (individual
-- and enterprise) has exactly one organizations row, so a single organization_id
-- FK covers both account types with no polymorphism.
--
-- Additive-only. No existing objects are dropped.

-- ---------------------------------------------------------------------------
-- contacts
-- ---------------------------------------------------------------------------
-- Identity is normalized email per org (required by the app for now, but the
-- column is nullable-capable so phone-only Contacts become non-breaking when
-- SMS returns — ADR 0005). Phone stored E.164 with per-org uniqueness.
--
-- Erasure tombstone semantics (right-to-erasure, Grill #11 item 7): an erased
-- Contact KEEPS its row. PII (name/email/phone) is nulled, but `email_sha256`
-- and `erased_at` are retained. This lets suppressions survive erasure (they
-- still reference a live row) and lets a later re-import of the same email be
-- detected via the hash without ever un-erasing the PII.
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Single reassignable Owner. NULL == unassigned (e.g. a Held Request that was
  -- never attributed, or a departed professional). ON DELETE SET NULL keeps the
  -- Contact when its owning user is removed rather than cascade-deleting it.
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT,
  -- Normalized (lowercased/trimmed) email. App writes the normalized value; the
  -- unique index on lower(email) is a DB-level backstop. Nullable so erasure can
  -- null it and so phone-only Contacts are schema-legal later.
  email TEXT,
  -- E.164, e.g. +14155550123.
  phone TEXT,
  -- First-seen origin of this Contact.
  source TEXT CHECK (
    source IN (
      'survey',
      'video_testimonial',
      'salesforce',
      'referral',
      'direct_review',
      'import',
      'manual'
    )
  ),
  -- SHA-256 of the normalized email. Tombstone/dedup key: retained even after
  -- erasure nulls `email`, so re-imports and surviving suppressions can be
  -- matched by hash. Denormalized onto contact_suppressions for the send-time
  -- check (see below).
  email_sha256 TEXT,
  -- Set when the Contact is erased. PII columns are nulled at the same time.
  erased_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Identity uniqueness: one live Contact per org per normalized email. Erased
-- rows (email nulled) fall out of the index automatically, so a re-import can
-- create a fresh Contact for the same email.
CREATE UNIQUE INDEX contacts_org_email_unique
  ON contacts (organization_id, lower(email))
  WHERE email IS NOT NULL AND erased_at IS NULL;

-- Phone-readiness: one live Contact per org per phone (ADR 0005).
CREATE UNIQUE INDEX contacts_org_phone_unique
  ON contacts (organization_id, phone)
  WHERE phone IS NOT NULL AND erased_at IS NULL;

-- Tombstone / re-import lookup by hash (survives erasure).
CREATE INDEX contacts_org_email_sha256
  ON contacts (organization_id, email_sha256)
  WHERE email_sha256 IS NOT NULL;

-- Owner-scoped list reads (professionals see their own).
CREATE INDEX contacts_owner_user_id ON contacts (owner_user_id)
  WHERE owner_user_id IS NOT NULL;

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- contact_suppressions
-- ---------------------------------------------------------------------------
-- Per-channel "do not contact" state, honored org-wide by a single send-time
-- check (ADR 0004). A suppression can exist in two shapes:
--
--   1. Contact-linked (contact_id NOT NULL) — the normal case.
--   2. Tombstone (contact_id NULL) — an unsubscribe for an email we have no
--      Contact for (e.g. legacy email_unsubscribes with no matching request).
--      We deliberately do NOT fabricate a Contact for these; we record the
--      suppression keyed on (organization_id, email_sha256, channel) so that if
--      that email is ever imported as a Contact, the send-time check already
--      blocks it.
--
-- `email_sha256` is populated on BOTH shapes for email-channel rows, so the
-- send-time check is a single index lookup on (organization_id, email_sha256,
-- channel) with no join to contacts — and it covers live Contacts, erased
-- Contacts (row retained), and never-a-Contact tombstones uniformly.
CREATE TABLE contact_suppressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- NULL for tombstone suppressions. ON DELETE SET NULL so a suppression
  -- survives as a tombstone if its Contact row is ever hard-deleted (the
  -- erasure path never hard-deletes; org deletion cascades everything away).
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  -- SHA-256 of the normalized email. Required for tombstones; denormalized onto
  -- contact-linked rows so the send-time check never has to join contacts.
  email_sha256 TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  reason TEXT NOT NULL CHECK (
    reason IN ('unsubscribed', 'do_not_contact', 'bounced', 'complained')
  ),
  -- Free-text provenance note (e.g. 'legacy_email_unsubscribes', 'self_serve').
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One suppression per channel per Contact.
CREATE UNIQUE INDEX contact_suppressions_contact_channel
  ON contact_suppressions (contact_id, channel)
  WHERE contact_id IS NOT NULL;

-- One tombstone per org per email per channel.
CREATE UNIQUE INDEX contact_suppressions_tombstone
  ON contact_suppressions (organization_id, email_sha256, channel)
  WHERE contact_id IS NULL AND email_sha256 IS NOT NULL;

-- The send-time check: WHERE organization_id = ? AND email_sha256 = ? AND
-- channel = ?. Covers both suppression shapes.
CREATE INDEX contact_suppressions_org_hash_channel
  ON contact_suppressions (organization_id, email_sha256, channel)
  WHERE email_sha256 IS NOT NULL;

CREATE TRIGGER update_contact_suppressions_updated_at
  BEFORE UPDATE ON contact_suppressions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- contact_id links on the request/review sources
-- ---------------------------------------------------------------------------
-- Request rows keep their inline name/email/phone as the immutable Send-Time
-- Snapshot (ADR 0004); the new contact_id points at the living Contact. Erasure
-- nulls both sides (see the erasure path in src/lib/contacts/actions.ts).
--
-- salesforce_contact_mappings and email_unsubscribes deliberately get NO
-- contact_id column: the former is deduped into Contacts by upsert (owner
-- attribution keys off the Contact, not the mapping row), the latter folds into
-- contact_suppressions. See the backfill for how each source is walked.
ALTER TABLE surveys
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;
ALTER TABLE video_testimonial_requests
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;
ALTER TABLE profile_referrals
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_surveys_contact_id
  ON surveys (contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_video_testimonial_requests_contact_id
  ON video_testimonial_requests (contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profile_referrals_contact_id
  ON profile_referrals (contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_contact_id
  ON reviews (contact_id) WHERE contact_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- Server actions and the backfill use the service-role admin client, which
-- bypasses RLS. These policies are the backstop for any direct authenticated
-- (anon-key) access, e.g. a client-side read in the Contacts UI. Visibility per
-- ADR 0004: admins/managers see all of their org's Contacts; professionals see
-- the Contacts they own. Writes are limited to owner + admin/manager. Modeled
-- on the review_flags / clip_music RLS in the 2026 migrations.
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_suppressions ENABLE ROW LEVEL SECURITY;

-- Admins/managers of the org, OR the owning professional.
CREATE POLICY "contacts_select" ON contacts
  FOR SELECT TO authenticated
  USING (
    owner_user_id = (SELECT auth.uid())
    OR organization_id IN (
      SELECT organization_id FROM users
      WHERE users.id = (SELECT auth.uid())
        AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "contacts_insert" ON contacts
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_user_id = (SELECT auth.uid())
    OR organization_id IN (
      SELECT organization_id FROM users
      WHERE users.id = (SELECT auth.uid())
        AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "contacts_update" ON contacts
  FOR UPDATE TO authenticated
  USING (
    owner_user_id = (SELECT auth.uid())
    OR organization_id IN (
      SELECT organization_id FROM users
      WHERE users.id = (SELECT auth.uid())
        AND users.role IN ('admin', 'manager')
    )
  );

-- Suppressions are readable/writable by admins/managers of the org, or by the
-- professional who owns the linked Contact. Tombstones (contact_id NULL) are
-- org-scoped and therefore admin/manager-only for direct access.
CREATE POLICY "contact_suppressions_select" ON contact_suppressions
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE users.id = (SELECT auth.uid())
        AND users.role IN ('admin', 'manager')
    )
    OR contact_id IN (
      SELECT id FROM contacts WHERE contacts.owner_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "contact_suppressions_insert" ON contact_suppressions
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE users.id = (SELECT auth.uid())
        AND users.role IN ('admin', 'manager')
    )
    OR contact_id IN (
      SELECT id FROM contacts WHERE contacts.owner_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "contact_suppressions_update" ON contact_suppressions
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE users.id = (SELECT auth.uid())
        AND users.role IN ('admin', 'manager')
    )
    OR contact_id IN (
      SELECT id FROM contacts WHERE contacts.owner_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "contact_suppressions_delete" ON contact_suppressions
  FOR DELETE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE users.id = (SELECT auth.uid())
        AND users.role IN ('admin', 'manager')
    )
    OR contact_id IN (
      SELECT id FROM contacts WHERE contacts.owner_user_id = (SELECT auth.uid())
    )
  );
