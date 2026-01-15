-- Apple Business Connect Integration Migration
-- Stores OAuth connections, sync logs, and review replies for Apple Maps integration

-- Apple Connections table (stores OAuth tokens and connection info)
CREATE TABLE apple_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  loan_officer_id UUID REFERENCES loan_officers(id) ON DELETE CASCADE,
  apple_team_id TEXT NOT NULL,
  apple_business_id TEXT NOT NULL,
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

  -- Apple-specific metadata
  place_action_links JSONB DEFAULT '[]',
  showcases JSONB DEFAULT '[]',
  photos JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_apple_connections_organization ON apple_connections(organization_id);
CREATE INDEX idx_apple_connections_loan_officer ON apple_connections(loan_officer_id);
CREATE INDEX idx_apple_connections_location ON apple_connections(location_id);
CREATE UNIQUE INDEX idx_apple_connections_unique_location ON apple_connections(organization_id, location_id) WHERE is_active = TRUE;

-- Apple Sync Logs table (tracks sync operations)
CREATE TABLE apple_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES apple_connections(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual', 'business_info', 'photos', 'reviews')),
  status TEXT DEFAULT 'started' CHECK (status IN ('started', 'in_progress', 'completed', 'failed')),
  reviews_fetched INTEGER DEFAULT 0,
  reviews_created INTEGER DEFAULT 0,
  reviews_updated INTEGER DEFAULT 0,
  photos_synced INTEGER DEFAULT 0,
  business_info_updated BOOLEAN DEFAULT FALSE,
  errors TEXT[],
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_apple_sync_logs_organization ON apple_sync_logs(organization_id);
CREATE INDEX idx_apple_sync_logs_connection ON apple_sync_logs(connection_id);
CREATE INDEX idx_apple_sync_logs_created ON apple_sync_logs(started_at DESC);

-- Apple Review Replies table (tracks replies sent to Apple)
CREATE TABLE apple_review_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES apple_connections(id) ON DELETE CASCADE,
  reply_text TEXT NOT NULL,
  apple_reply_time TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  sent_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_apple_review_replies_organization ON apple_review_replies(organization_id);
CREATE INDEX idx_apple_review_replies_review ON apple_review_replies(review_id);

-- Apple Business Analytics table (stores Apple-specific metrics)
CREATE TABLE apple_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES apple_connections(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Visibility metrics
  impressions INTEGER DEFAULT 0,
  actions INTEGER DEFAULT 0,
  direction_requests INTEGER DEFAULT 0,
  website_clicks INTEGER DEFAULT 0,
  phone_calls INTEGER DEFAULT 0,

  -- Review metrics
  new_reviews INTEGER DEFAULT 0,
  review_responses INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),

  -- Photo metrics
  photo_views INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(connection_id, date)
);

CREATE INDEX idx_apple_analytics_organization ON apple_analytics(organization_id);
CREATE INDEX idx_apple_analytics_connection ON apple_analytics(connection_id);
CREATE INDEX idx_apple_analytics_date ON apple_analytics(date DESC);

-- Trigger to update timestamps
CREATE TRIGGER update_apple_connections_updated_at
  BEFORE UPDATE ON apple_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_apple_analytics_updated_at
  BEFORE UPDATE ON apple_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS Policies for apple_connections
ALTER TABLE apple_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's apple connections"
  ON apple_connections FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins and managers can insert apple connections"
  ON apple_connections FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

CREATE POLICY "Admins and managers can update apple connections"
  ON apple_connections FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

CREATE POLICY "Admins and managers can delete apple connections"
  ON apple_connections FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

-- RLS Policies for apple_sync_logs
ALTER TABLE apple_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's apple sync logs"
  ON apple_sync_logs FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "System can insert apple sync logs"
  ON apple_sync_logs FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "System can update apple sync logs"
  ON apple_sync_logs FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- RLS Policies for apple_review_replies
ALTER TABLE apple_review_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's apple review replies"
  ON apple_review_replies FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins and managers can insert apple review replies"
  ON apple_review_replies FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

CREATE POLICY "Admins and managers can update apple review replies"
  ON apple_review_replies FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

-- RLS Policies for apple_analytics
ALTER TABLE apple_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's apple analytics"
  ON apple_analytics FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "System can insert apple analytics"
  ON apple_analytics FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "System can update apple analytics"
  ON apple_analytics FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- Add apple_maps as a source type to reviews table if not already supported
DO $$
BEGIN
  -- Check if the constraint exists and update it if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'reviews_source_check'
  ) THEN
    ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_source_check;
  END IF;

  -- Re-add with apple_maps included
  ALTER TABLE reviews ADD CONSTRAINT reviews_source_check
    CHECK (source IN ('internal', 'google', 'yelp', 'facebook', 'zillow', 'apple_maps', 'manual', 'other'));
EXCEPTION
  WHEN OTHERS THEN
    -- Constraint may not exist or already includes apple_maps
    NULL;
END $$;
