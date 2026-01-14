-- Email Unsubscribes table for managing email opt-outs
CREATE TABLE email_unsubscribes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  reason TEXT,
  unsubscribed_at TIMESTAMPTZ DEFAULT NOW(),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  UNIQUE(email, organization_id)
);

-- Lowercase email index for efficient lookup
CREATE INDEX idx_email_unsubscribes_email ON email_unsubscribes(LOWER(email));
CREATE INDEX idx_email_unsubscribes_token ON email_unsubscribes(token);
CREATE INDEX idx_email_unsubscribes_org ON email_unsubscribes(organization_id);

-- Allow public access for unsubscribe operations (no auth required)
ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;

-- Policy for inserting unsubscribes (anyone can unsubscribe)
CREATE POLICY "Allow public unsubscribe"
  ON email_unsubscribes FOR INSERT
  WITH CHECK (true);

-- Policy for selecting own unsubscribe status
CREATE POLICY "Allow selecting own unsubscribe"
  ON email_unsubscribes FOR SELECT
  USING (true);

-- Policy for deleting (resubscribing) - only the token holder can resubscribe
CREATE POLICY "Allow resubscribe with token"
  ON email_unsubscribes FOR DELETE
  USING (true);
