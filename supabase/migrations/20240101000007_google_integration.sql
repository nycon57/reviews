-- Google Business Profile Integration Migration
-- Stores OAuth connections and sync logs for Google review integration

-- Google Connections table (stores OAuth tokens and connection info)
CREATE TABLE google_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  loan_officer_id UUID REFERENCES loan_officers(id) ON DELETE CASCADE,
  google_account_id TEXT NOT NULL,
  google_account_email TEXT,
  google_account_name TEXT,
  location_id TEXT NOT NULL,
  location_name TEXT,
  location_address TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  scopes TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed')),
  sync_error TEXT,
  reviews_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_google_connections_organization ON google_connections(organization_id);
CREATE INDEX idx_google_connections_loan_officer ON google_connections(loan_officer_id);
CREATE INDEX idx_google_connections_location ON google_connections(location_id);
CREATE UNIQUE INDEX idx_google_connections_unique_location ON google_connections(organization_id, location_id) WHERE is_active = TRUE;

-- Google Sync Logs table (tracks sync operations)
CREATE TABLE google_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES google_connections(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual')),
  status TEXT DEFAULT 'started' CHECK (status IN ('started', 'in_progress', 'completed', 'failed')),
  reviews_fetched INTEGER DEFAULT 0,
  reviews_created INTEGER DEFAULT 0,
  reviews_updated INTEGER DEFAULT 0,
  errors TEXT[],
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_google_sync_logs_organization ON google_sync_logs(organization_id);
CREATE INDEX idx_google_sync_logs_connection ON google_sync_logs(connection_id);
CREATE INDEX idx_google_sync_logs_created ON google_sync_logs(started_at DESC);

-- Google Review Replies table (tracks replies sent to Google)
CREATE TABLE google_review_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES google_connections(id) ON DELETE CASCADE,
  reply_text TEXT NOT NULL,
  google_reply_time TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  sent_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_google_review_replies_organization ON google_review_replies(organization_id);
CREATE INDEX idx_google_review_replies_review ON google_review_replies(review_id);

-- Trigger to update timestamps
CREATE TRIGGER update_google_connections_updated_at
  BEFORE UPDATE ON google_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS Policies for google_connections
ALTER TABLE google_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's google connections"
  ON google_connections FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins and managers can insert google connections"
  ON google_connections FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

CREATE POLICY "Admins and managers can update google connections"
  ON google_connections FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

CREATE POLICY "Admins and managers can delete google connections"
  ON google_connections FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

-- RLS Policies for google_sync_logs
ALTER TABLE google_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's sync logs"
  ON google_sync_logs FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "System can insert sync logs"
  ON google_sync_logs FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

-- RLS Policies for google_review_replies
ALTER TABLE google_review_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's review replies"
  ON google_review_replies FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins and managers can insert review replies"
  ON google_review_replies FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

CREATE POLICY "Admins and managers can update review replies"
  ON google_review_replies FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );
