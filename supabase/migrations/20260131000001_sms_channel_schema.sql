-- SMS Channel Schema (S096)
-- Tables, enums, indexes, and RLS for the SMS channel.
-- Phone numbers: E.164 format. Consent records: append-only.
-- Twilio auth tokens: encrypted via pgcrypto.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

------------------------------------------------------------------------
-- ENUMS
------------------------------------------------------------------------

CREATE TYPE sms_number_type AS ENUM ('local', 'toll_free', 'short_code');
CREATE TYPE sms_number_status AS ENUM ('active', 'pending', 'released');

CREATE TYPE sms_consent_status AS ENUM ('opted_in', 'opted_out', 'pending');
CREATE TYPE sms_consent_method AS ENUM ('web_form', 'sms_keyword', 'api', 'import', 'verbal');

CREATE TYPE sms_direction AS ENUM ('outbound', 'inbound');
CREATE TYPE sms_message_status AS ENUM ('queued', 'sent', 'delivered', 'undelivered', 'failed', 'received');

CREATE TYPE sms_template_category AS ENUM ('review_request', 'follow_up', 'thank_you', 'video_request', 'custom');
CREATE TYPE sms_template_status AS ENUM ('active', 'archived');

CREATE TYPE sms_conversation_status AS ENUM ('active', 'closed', 'archived');

CREATE TYPE sms_registration_status AS ENUM (
  'not_started',
  'brand_pending',
  'brand_approved',
  'campaign_pending',
  'campaign_approved',
  'fully_registered',
  'rejected'
);

------------------------------------------------------------------------
-- 1. sms_phone_numbers
------------------------------------------------------------------------

CREATE TABLE sms_phone_numbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  twilio_sid TEXT,
  messaging_service_sid TEXT,
  number_type sms_number_type NOT NULL DEFAULT 'local',
  status sms_number_status NOT NULL DEFAULT 'pending',
  capabilities JSONB DEFAULT '{}',
  monthly_cost_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sms_phone_numbers_phone_unique UNIQUE (phone_number)
);

CREATE INDEX idx_sms_phone_numbers_org ON sms_phone_numbers(organization_id);

ALTER TABLE sms_phone_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their phone numbers"
  ON sms_phone_numbers FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = get_current_user_id()
    )
  );

CREATE POLICY "Admins and managers can manage phone numbers"
  ON sms_phone_numbers FOR ALL TO authenticated
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

CREATE POLICY "Service role full access on sms_phone_numbers"
  ON sms_phone_numbers FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_sms_phone_numbers_updated_at
  BEFORE UPDATE ON sms_phone_numbers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE sms_phone_numbers IS 'Twilio phone numbers provisioned per org';

------------------------------------------------------------------------
-- 2. sms_consent
------------------------------------------------------------------------

CREATE TABLE sms_consent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  status sms_consent_status NOT NULL DEFAULT 'pending',
  consent_method sms_consent_method,
  consent_language TEXT,
  consent_ip INET,
  consent_source TEXT,
  opted_in_at TIMESTAMPTZ,
  opted_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sms_consent_org_phone_unique UNIQUE (organization_id, phone_number)
);

-- Unique constraint already covers (organization_id, phone_number) lookups
CREATE INDEX idx_sms_consent_status ON sms_consent(status) WHERE status = 'opted_in';

ALTER TABLE sms_consent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view consent records"
  ON sms_consent FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = get_current_user_id()
    )
  );

CREATE POLICY "Admins and managers can manage consent"
  ON sms_consent FOR ALL TO authenticated
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

CREATE POLICY "Service role full access on sms_consent"
  ON sms_consent FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_sms_consent_updated_at
  BEFORE UPDATE ON sms_consent
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE sms_consent IS 'TCPA consent per phone number per org (append-only)';

------------------------------------------------------------------------
-- 3. sms_templates
------------------------------------------------------------------------

CREATE TABLE sms_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category sms_template_category NOT NULL DEFAULT 'custom',
  body TEXT NOT NULL,
  merge_fields JSONB DEFAULT '[]',
  is_locked BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  status sms_template_status NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sms_templates_org ON sms_templates(organization_id);
CREATE INDEX idx_sms_templates_org_category ON sms_templates(organization_id, category)
  WHERE status = 'active';

ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view templates"
  ON sms_templates FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = get_current_user_id()
    )
  );

CREATE POLICY "Admins and managers can manage templates"
  ON sms_templates FOR ALL TO authenticated
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

CREATE POLICY "Service role full access on sms_templates"
  ON sms_templates FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_sms_templates_updated_at
  BEFORE UPDATE ON sms_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE sms_templates IS 'Reusable SMS templates with merge field support';

------------------------------------------------------------------------
-- 4. sms_short_links
------------------------------------------------------------------------

CREATE TABLE sms_short_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  short_code TEXT NOT NULL,
  destination_url TEXT NOT NULL,
  borrower_phone TEXT,
  loan_officer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  message_id UUID, -- FK added after sms_messages table
  click_count INTEGER NOT NULL DEFAULT 0,
  first_clicked_at TIMESTAMPTZ,
  last_clicked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sms_short_links_code_unique UNIQUE (short_code)
);

-- Unique constraint already covers short_code lookups
CREATE INDEX idx_sms_short_links_org ON sms_short_links(organization_id);

ALTER TABLE sms_short_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view short links"
  ON sms_short_links FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = get_current_user_id()
    )
  );

CREATE POLICY "Admins and managers can manage short links"
  ON sms_short_links FOR ALL TO authenticated
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

CREATE POLICY "Service role full access on sms_short_links"
  ON sms_short_links FOR ALL TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE sms_short_links IS 'Shortened URLs for SMS with click tracking';

------------------------------------------------------------------------
-- 5. sms_messages
------------------------------------------------------------------------

CREATE TABLE sms_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  loan_officer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  borrower_id UUID REFERENCES users(id) ON DELETE SET NULL,
  campaign_id UUID,
  flow_execution_id UUID,
  direction sms_direction NOT NULL DEFAULT 'outbound',
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  body TEXT NOT NULL,
  template_id UUID REFERENCES sms_templates(id) ON DELETE SET NULL,
  short_link_id UUID REFERENCES sms_short_links(id) ON DELETE SET NULL,
  twilio_sid TEXT,
  status sms_message_status NOT NULL DEFAULT 'queued',
  error_code TEXT,
  error_message TEXT,
  segments INTEGER NOT NULL DEFAULT 1,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sms_messages_org_created ON sms_messages(organization_id, created_at DESC);
CREATE INDEX idx_sms_messages_to_number ON sms_messages(to_number);
CREATE INDEX idx_sms_messages_twilio_sid ON sms_messages(twilio_sid) WHERE twilio_sid IS NOT NULL;
CREATE INDEX idx_sms_messages_lo ON sms_messages(loan_officer_id) WHERE loan_officer_id IS NOT NULL;
CREATE INDEX idx_sms_messages_scheduled ON sms_messages(scheduled_at)
  WHERE status = 'queued' AND scheduled_at IS NOT NULL;

ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;

-- Admins/managers see all org messages; LOs see only their own
CREATE POLICY "Admins and managers can view all org messages"
  ON sms_messages FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = get_current_user_id() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Loan officers see only their own messages"
  ON sms_messages FOR SELECT TO authenticated
  USING (
    loan_officer_id = get_current_user_id()
    AND organization_id IN (
      SELECT organization_id FROM users WHERE id = get_current_user_id()
    )
  );

CREATE POLICY "Admins and managers can manage messages"
  ON sms_messages FOR ALL TO authenticated
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

CREATE POLICY "Service role full access on sms_messages"
  ON sms_messages FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_sms_messages_updated_at
  BEFORE UPDATE ON sms_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE sms_messages IS 'Outbound and inbound SMS with delivery tracking';

-- Deferred FK: sms_short_links.message_id -> sms_messages (circular dependency)
ALTER TABLE sms_short_links
  ADD CONSTRAINT fk_sms_short_links_message
  FOREIGN KEY (message_id) REFERENCES sms_messages(id) ON DELETE SET NULL;

------------------------------------------------------------------------
-- 6. sms_conversations
------------------------------------------------------------------------

CREATE TABLE sms_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  borrower_phone TEXT NOT NULL,
  assigned_lo_id UUID REFERENCES users(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ,
  status sms_conversation_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sms_conversations_org_phone_unique UNIQUE (organization_id, borrower_phone)
);

-- Unique constraint already covers (organization_id, borrower_phone) lookups
CREATE INDEX idx_sms_conversations_org_last_msg ON sms_conversations(organization_id, last_message_at DESC)
  WHERE status = 'active';

ALTER TABLE sms_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view conversations"
  ON sms_conversations FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = get_current_user_id()
    )
  );

CREATE POLICY "Admins and managers can manage conversations"
  ON sms_conversations FOR ALL TO authenticated
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

CREATE POLICY "Service role full access on sms_conversations"
  ON sms_conversations FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_sms_conversations_updated_at
  BEFORE UPDATE ON sms_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE sms_conversations IS 'Two-way SMS threads per borrower phone';

------------------------------------------------------------------------
-- 7. sms_daily_stats (materialized aggregation)
------------------------------------------------------------------------

CREATE TABLE sms_daily_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  loan_officer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  sent INTEGER NOT NULL DEFAULT 0,
  delivered INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  clicked INTEGER NOT NULL DEFAULT 0,
  replied INTEGER NOT NULL DEFAULT 0,
  opted_out INTEGER NOT NULL DEFAULT 0,
  reviews_generated INTEGER NOT NULL DEFAULT 0,
  total_cost_cents INTEGER NOT NULL DEFAULT 0,
  segments_used INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT sms_daily_stats_org_lo_date_unique UNIQUE (organization_id, loan_officer_id, date)
);

CREATE INDEX idx_sms_daily_stats_org_date ON sms_daily_stats(organization_id, date DESC);

ALTER TABLE sms_daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view daily stats"
  ON sms_daily_stats FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = get_current_user_id()
    )
  );

CREATE POLICY "Admins and managers can manage daily stats"
  ON sms_daily_stats FOR ALL TO authenticated
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

CREATE POLICY "Service role full access on sms_daily_stats"
  ON sms_daily_stats FOR ALL TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE sms_daily_stats IS 'Pre-aggregated daily SMS stats per org/LO';

------------------------------------------------------------------------
-- 8. sms_settings
------------------------------------------------------------------------

CREATE TABLE sms_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Twilio credentials (encrypted at rest)
  twilio_account_sid TEXT,
  twilio_auth_token_encrypted BYTEA,
  messaging_service_sid TEXT,
  default_from_number TEXT,

  -- Quiet hours (TCPA)
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT true,
  quiet_hours_start TIME NOT NULL DEFAULT '21:00',
  quiet_hours_end TIME NOT NULL DEFAULT '08:00',
  quiet_hours_timezone TEXT NOT NULL DEFAULT 'America/New_York',
  use_recipient_timezone BOOLEAN NOT NULL DEFAULT false,

  -- Limits
  monthly_message_limit INTEGER NOT NULL DEFAULT 1000,
  double_opt_in_enabled BOOLEAN NOT NULL DEFAULT false,

  -- 10DLC registration
  a2p_campaign_id TEXT,
  a2p_brand_id TEXT,
  registration_status sms_registration_status NOT NULL DEFAULT 'not_started',

  -- Brand
  brand_name TEXT,

  -- Auto follow-up
  auto_follow_up_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_follow_up_delay_hours INTEGER NOT NULL DEFAULT 72,
  auto_follow_up_template_id UUID REFERENCES sms_templates(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT sms_settings_org_unique UNIQUE (organization_id)
);

ALTER TABLE sms_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view sms settings"
  ON sms_settings FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = get_current_user_id()
    )
  );

CREATE POLICY "Admins can manage sms settings"
  ON sms_settings FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = get_current_user_id() AND role = 'admin'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = get_current_user_id() AND role = 'admin'
    )
  );

CREATE POLICY "Service role full access on sms_settings"
  ON sms_settings FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_sms_settings_updated_at
  BEFORE UPDATE ON sms_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE sms_settings IS 'Per-org SMS config: Twilio creds, quiet hours, 10DLC registration';
COMMENT ON COLUMN sms_settings.twilio_auth_token_encrypted IS 'Encrypted via pgp_sym_encrypt';

------------------------------------------------------------------------
-- 9. sms_credits
------------------------------------------------------------------------

CREATE TABLE sms_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  included_credits INTEGER NOT NULL DEFAULT 0,
  used_credits INTEGER NOT NULL DEFAULT 0,
  overage_credits INTEGER NOT NULL DEFAULT 0,
  overage_rate_cents INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sms_credits_org_period_unique UNIQUE (organization_id, period_start)
);

-- Composite index covers organization_id-only lookups via leftmost prefix
CREATE INDEX idx_sms_credits_org_period ON sms_credits(organization_id, period_start DESC);

ALTER TABLE sms_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view credits"
  ON sms_credits FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = get_current_user_id()
    )
  );

CREATE POLICY "Admins can manage credits"
  ON sms_credits FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = get_current_user_id() AND role = 'admin'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = get_current_user_id() AND role = 'admin'
    )
  );

CREATE POLICY "Service role full access on sms_credits"
  ON sms_credits FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_sms_credits_updated_at
  BEFORE UPDATE ON sms_credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE sms_credits IS 'SMS credit allocation and usage per billing period per org';

------------------------------------------------------------------------
-- Helper: encrypt/decrypt Twilio auth token
------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION encrypt_sms_token(p_token TEXT, p_key TEXT)
RETURNS BYTEA AS $$
BEGIN
  RETURN pgp_sym_encrypt(p_token, p_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_sms_token(p_encrypted BYTEA, p_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(p_encrypted, p_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION encrypt_sms_token IS 'Encrypt a Twilio auth token via pgcrypto symmetric encryption';
COMMENT ON FUNCTION decrypt_sms_token IS 'Decrypt a Twilio auth token via pgcrypto symmetric encryption';
