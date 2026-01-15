-- Salesforce CRM Integration Migration
-- Stores OAuth connections, sync logs, and field mappings for Salesforce integration

-- Salesforce Connections table (stores OAuth tokens and connection info)
CREATE TABLE salesforce_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  instance_url TEXT NOT NULL, -- e.g., https://yourcompany.salesforce.com
  salesforce_org_id TEXT NOT NULL,
  salesforce_user_id TEXT NOT NULL,
  salesforce_username TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  scopes TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed')),
  sync_error TEXT,
  -- Sync settings
  sync_contacts BOOLEAN DEFAULT TRUE,
  sync_accounts BOOLEAN DEFAULT TRUE,
  sync_opportunities BOOLEAN DEFAULT TRUE,
  auto_create_surveys BOOLEAN DEFAULT FALSE,
  opportunity_stage_trigger TEXT DEFAULT 'Closed Won', -- Stage that triggers survey
  -- Stats
  contacts_synced INTEGER DEFAULT 0,
  accounts_synced INTEGER DEFAULT 0,
  opportunities_synced INTEGER DEFAULT 0,
  -- Field mapping configuration
  field_mappings JSONB DEFAULT '{}',
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_salesforce_connections_organization ON salesforce_connections(organization_id);
CREATE INDEX idx_salesforce_connections_active ON salesforce_connections(is_active) WHERE is_active = TRUE;
CREATE UNIQUE INDEX idx_salesforce_connections_unique_org ON salesforce_connections(organization_id, salesforce_org_id) WHERE is_active = TRUE;

-- Salesforce Sync Logs table (tracks sync operations)
CREATE TABLE salesforce_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES salesforce_connections(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual', 'webhook')),
  sync_direction TEXT DEFAULT 'inbound' CHECK (sync_direction IN ('inbound', 'outbound', 'bidirectional')),
  object_type TEXT, -- Contact, Account, Opportunity
  status TEXT DEFAULT 'started' CHECK (status IN ('started', 'in_progress', 'completed', 'failed')),
  records_fetched INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  errors TEXT[],
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_salesforce_sync_logs_organization ON salesforce_sync_logs(organization_id);
CREATE INDEX idx_salesforce_sync_logs_connection ON salesforce_sync_logs(connection_id);
CREATE INDEX idx_salesforce_sync_logs_created ON salesforce_sync_logs(started_at DESC);

-- Salesforce Contact Mappings table (links Salesforce contacts to internal records)
CREATE TABLE salesforce_contact_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES salesforce_connections(id) ON DELETE CASCADE,
  salesforce_contact_id TEXT NOT NULL,
  salesforce_account_id TEXT,
  -- Internal mapping
  loan_officer_id UUID REFERENCES loan_officers(id) ON DELETE SET NULL,
  customer_email TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  -- Salesforce data snapshot
  salesforce_data JSONB DEFAULT '{}',
  -- Sync tracking
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_salesforce_contact_mappings_organization ON salesforce_contact_mappings(organization_id);
CREATE INDEX idx_salesforce_contact_mappings_connection ON salesforce_contact_mappings(connection_id);
CREATE INDEX idx_salesforce_contact_mappings_sf_contact ON salesforce_contact_mappings(salesforce_contact_id);
CREATE UNIQUE INDEX idx_salesforce_contact_mappings_unique ON salesforce_contact_mappings(connection_id, salesforce_contact_id);

-- Salesforce Opportunity Mappings table (tracks opportunities for survey triggers)
CREATE TABLE salesforce_opportunity_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES salesforce_connections(id) ON DELETE CASCADE,
  salesforce_opportunity_id TEXT NOT NULL,
  salesforce_account_id TEXT,
  salesforce_contact_id TEXT,
  -- Opportunity details
  opportunity_name TEXT,
  opportunity_stage TEXT,
  opportunity_amount DECIMAL(15,2),
  close_date DATE,
  -- Survey tracking
  survey_id UUID REFERENCES surveys(id) ON DELETE SET NULL,
  survey_triggered_at TIMESTAMPTZ,
  -- Salesforce data snapshot
  salesforce_data JSONB DEFAULT '{}',
  -- Sync tracking
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_salesforce_opportunity_mappings_organization ON salesforce_opportunity_mappings(organization_id);
CREATE INDEX idx_salesforce_opportunity_mappings_connection ON salesforce_opportunity_mappings(connection_id);
CREATE INDEX idx_salesforce_opportunity_mappings_sf_opp ON salesforce_opportunity_mappings(salesforce_opportunity_id);
CREATE INDEX idx_salesforce_opportunity_mappings_stage ON salesforce_opportunity_mappings(opportunity_stage);
CREATE UNIQUE INDEX idx_salesforce_opportunity_mappings_unique ON salesforce_opportunity_mappings(connection_id, salesforce_opportunity_id);

-- Salesforce Review Data table (stores review data synced to Salesforce)
CREATE TABLE salesforce_review_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES salesforce_connections(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  salesforce_contact_id TEXT,
  salesforce_account_id TEXT,
  -- Sync status
  synced_to_salesforce BOOLEAN DEFAULT FALSE,
  salesforce_record_id TEXT, -- Custom object or task ID in Salesforce
  synced_at TIMESTAMPTZ,
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_salesforce_review_data_organization ON salesforce_review_data(organization_id);
CREATE INDEX idx_salesforce_review_data_connection ON salesforce_review_data(connection_id);
CREATE INDEX idx_salesforce_review_data_review ON salesforce_review_data(review_id);
CREATE UNIQUE INDEX idx_salesforce_review_data_unique ON salesforce_review_data(connection_id, review_id);

-- Trigger to update timestamps
CREATE TRIGGER update_salesforce_connections_updated_at
  BEFORE UPDATE ON salesforce_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_salesforce_contact_mappings_updated_at
  BEFORE UPDATE ON salesforce_contact_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_salesforce_opportunity_mappings_updated_at
  BEFORE UPDATE ON salesforce_opportunity_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_salesforce_review_data_updated_at
  BEFORE UPDATE ON salesforce_review_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS Policies for salesforce_connections
ALTER TABLE salesforce_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's salesforce connections"
  ON salesforce_connections FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can insert salesforce connections"
  ON salesforce_connections FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin'])
  );

CREATE POLICY "Admins can update salesforce connections"
  ON salesforce_connections FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin'])
  );

CREATE POLICY "Admins can delete salesforce connections"
  ON salesforce_connections FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin'])
  );

-- RLS Policies for salesforce_sync_logs
ALTER TABLE salesforce_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's salesforce sync logs"
  ON salesforce_sync_logs FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "System can insert salesforce sync logs"
  ON salesforce_sync_logs FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

-- RLS Policies for salesforce_contact_mappings
ALTER TABLE salesforce_contact_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's salesforce contact mappings"
  ON salesforce_contact_mappings FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can manage salesforce contact mappings"
  ON salesforce_contact_mappings FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin'])
  );

-- RLS Policies for salesforce_opportunity_mappings
ALTER TABLE salesforce_opportunity_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's salesforce opportunity mappings"
  ON salesforce_opportunity_mappings FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can manage salesforce opportunity mappings"
  ON salesforce_opportunity_mappings FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin'])
  );

-- RLS Policies for salesforce_review_data
ALTER TABLE salesforce_review_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's salesforce review data"
  ON salesforce_review_data FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can manage salesforce review data"
  ON salesforce_review_data FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin'])
  );
