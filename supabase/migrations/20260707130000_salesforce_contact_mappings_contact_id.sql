-- Observability back-link from Salesforce contact mappings to Contacts (ADR 0004).
--
-- B1's contacts migration (20260707100000) documents this column: it is a
-- nullable, purely OBSERVABILITY back-link, stamped when a CRM person becomes a
-- real acquisition Contact (i.e. when a Salesforce-triggered survey resolves the
-- Contact). Owner attribution and dedup still key off the Contact itself, never
-- this mapping row — the back-link only lets ops see which CRM record a Contact
-- came from. Mappings for CRM contacts never asked for feedback stay unlinked.
--
-- Additive-only. Nullable so historical mappings that predate a resolution stay
-- valid until a later trigger stamps them.

ALTER TABLE salesforce_contact_mappings
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_salesforce_contact_mappings_contact_id
  ON salesforce_contact_mappings (contact_id)
  WHERE contact_id IS NOT NULL;
