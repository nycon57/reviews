-- Business Listings Management Migration
-- Enables managing and syncing business information across online directories

-- Directory platform enum
CREATE TYPE directory_platform AS ENUM (
  'google',
  'yelp',
  'facebook',
  'zillow',
  'bing',
  'yahoo',
  'apple_maps',
  'bbb',
  'yellowpages',
  'foursquare',
  'tripadvisor',
  'angi',
  'homeadvisor',
  'realtor',
  'trulia',
  'lendingtree'
);

-- Sync status enum
CREATE TYPE listing_sync_status AS ENUM (
  'pending',
  'syncing',
  'synced',
  'error',
  'not_connected'
);

-- Business Listings table (core NAP data)
CREATE TABLE business_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,

  -- NAP (Name, Address, Phone) data
  business_name TEXT NOT NULL,
  business_phone TEXT,
  business_email TEXT,
  business_website TEXT,

  -- Address components
  street_address TEXT,
  street_address_2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',

  -- Business details
  business_description TEXT,
  business_categories TEXT[] DEFAULT '{}',
  business_keywords TEXT[] DEFAULT '{}',
  hours_of_operation JSONB DEFAULT '{}',

  -- Photos
  logo_url TEXT,
  cover_photo_url TEXT,
  photos TEXT[] DEFAULT '{}',

  -- Social links
  social_links JSONB DEFAULT '{}',

  -- Accuracy tracking
  accuracy_score INTEGER DEFAULT 0 CHECK (accuracy_score >= 0 AND accuracy_score <= 100),
  last_accuracy_check TIMESTAMPTZ,
  nap_consistency_status TEXT DEFAULT 'unchecked' CHECK (nap_consistency_status IN ('consistent', 'inconsistent', 'unchecked')),

  -- Duplicate tracking
  potential_duplicates UUID[] DEFAULT '{}',
  is_primary BOOLEAN DEFAULT TRUE,
  merged_from UUID REFERENCES business_listings(id) ON DELETE SET NULL,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_business_listings_organization ON business_listings(organization_id);
CREATE INDEX idx_business_listings_branch ON business_listings(branch_id);
CREATE INDEX idx_business_listings_active ON business_listings(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_business_listings_accuracy ON business_listings(accuracy_score);

-- Directory Connections table (connection to each directory)
CREATE TABLE directory_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES business_listings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform directory_platform NOT NULL,

  -- Directory identifiers
  directory_listing_id TEXT,
  directory_url TEXT,
  directory_username TEXT,

  -- Connection credentials (if API access available)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Sync metadata
  is_connected BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  sync_status listing_sync_status DEFAULT 'not_connected',
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,

  -- Remote NAP data (for comparison)
  remote_nap_data JSONB DEFAULT '{}',
  nap_match_score INTEGER DEFAULT 0 CHECK (nap_match_score >= 0 AND nap_match_score <= 100),
  has_conflicts BOOLEAN DEFAULT FALSE,
  conflicts JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint per listing per platform
  CONSTRAINT unique_listing_platform UNIQUE (listing_id, platform)
);

CREATE INDEX idx_directory_connections_listing ON directory_connections(listing_id);
CREATE INDEX idx_directory_connections_organization ON directory_connections(organization_id);
CREATE INDEX idx_directory_connections_platform ON directory_connections(platform);
CREATE INDEX idx_directory_connections_sync_status ON directory_connections(sync_status);
CREATE INDEX idx_directory_connections_connected ON directory_connections(is_connected) WHERE is_connected = TRUE;

-- Listing Sync Logs table (audit trail)
CREATE TABLE listing_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES business_listings(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES directory_connections(id) ON DELETE SET NULL,

  -- Sync details
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual', 'conflict_resolution', 'photo_sync')),
  status TEXT NOT NULL CHECK (status IN ('started', 'in_progress', 'completed', 'failed')),

  -- Results
  directories_synced INTEGER DEFAULT 0,
  conflicts_detected INTEGER DEFAULT 0,
  conflicts_resolved INTEGER DEFAULT 0,
  photos_synced INTEGER DEFAULT 0,

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Errors
  errors TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_listing_sync_logs_organization ON listing_sync_logs(organization_id);
CREATE INDEX idx_listing_sync_logs_listing ON listing_sync_logs(listing_id);
CREATE INDEX idx_listing_sync_logs_status ON listing_sync_logs(status);
CREATE INDEX idx_listing_sync_logs_started ON listing_sync_logs(started_at DESC);

-- Listing Accuracy History table (track score changes)
CREATE TABLE listing_accuracy_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES business_listings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Score data
  previous_score INTEGER,
  new_score INTEGER NOT NULL,
  change_amount INTEGER,

  -- Breakdown
  score_breakdown JSONB NOT NULL DEFAULT '{}',
  -- Breakdown structure: {
  --   nap_completeness: 0-100,
  --   directory_coverage: 0-100,
  --   nap_consistency: 0-100,
  --   update_freshness: 0-100,
  --   photo_quality: 0-100
  -- }

  -- Tracking
  calculation_reason TEXT DEFAULT 'scheduled',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listing_accuracy_history_listing ON listing_accuracy_history(listing_id);
CREATE INDEX idx_listing_accuracy_history_recorded ON listing_accuracy_history(recorded_at DESC);

-- Listing Change Audit table (track all changes)
CREATE TABLE listing_changes_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES business_listings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Change details
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,

  -- Source
  source TEXT NOT NULL CHECK (source IN ('user', 'directory_sync', 'duplicate_merge', 'api', 'system')),
  source_platform directory_platform,

  -- Who
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- When
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listing_changes_audit_listing ON listing_changes_audit(listing_id);
CREATE INDEX idx_listing_changes_audit_detected ON listing_changes_audit(detected_at DESC);
CREATE INDEX idx_listing_changes_audit_field ON listing_changes_audit(field_changed);

-- Listing Alerts table (for monitoring)
CREATE TABLE listing_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES business_listings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Alert info
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'nap_mismatch',
    'listing_removed',
    'duplicate_found',
    'accuracy_drop',
    'sync_failed',
    'verification_needed',
    'photo_rejected',
    'hours_mismatch'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,

  -- Related data
  platform directory_platform,
  connection_id UUID REFERENCES directory_connections(id) ON DELETE SET NULL,

  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listing_alerts_listing ON listing_alerts(listing_id);
CREATE INDEX idx_listing_alerts_organization ON listing_alerts(organization_id);
CREATE INDEX idx_listing_alerts_unresolved ON listing_alerts(is_resolved) WHERE is_resolved = FALSE;
CREATE INDEX idx_listing_alerts_severity ON listing_alerts(severity);

-- Trigger to update timestamps
CREATE TRIGGER update_business_listings_updated_at
  BEFORE UPDATE ON business_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_directory_connections_updated_at
  BEFORE UPDATE ON directory_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate listing accuracy score
CREATE OR REPLACE FUNCTION calculate_listing_accuracy(listing_row business_listings)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nap_completeness INTEGER;
  directory_coverage INTEGER;
  nap_consistency INTEGER;
  update_freshness INTEGER;
  photo_quality INTEGER;
  connected_count INTEGER;
  consistent_count INTEGER;
  total_score INTEGER;
BEGIN
  -- NAP Completeness (20% weight)
  -- Check if essential fields are filled
  nap_completeness := 0;
  IF listing_row.business_name IS NOT NULL AND listing_row.business_name != '' THEN
    nap_completeness := nap_completeness + 20;
  END IF;
  IF listing_row.business_phone IS NOT NULL AND listing_row.business_phone != '' THEN
    nap_completeness := nap_completeness + 20;
  END IF;
  IF listing_row.street_address IS NOT NULL AND listing_row.street_address != '' THEN
    nap_completeness := nap_completeness + 20;
  END IF;
  IF listing_row.city IS NOT NULL AND listing_row.state IS NOT NULL THEN
    nap_completeness := nap_completeness + 20;
  END IF;
  IF listing_row.business_website IS NOT NULL AND listing_row.business_website != '' THEN
    nap_completeness := nap_completeness + 20;
  END IF;

  -- Directory Coverage (25% weight)
  -- Based on number of connected directories (max 10 for 100%)
  SELECT COUNT(*) INTO connected_count
  FROM directory_connections
  WHERE listing_id = listing_row.id AND is_connected = TRUE;
  directory_coverage := LEAST(connected_count * 10, 100);

  -- NAP Consistency (30% weight)
  -- Based on how many connected directories have matching NAP
  SELECT COUNT(*) INTO consistent_count
  FROM directory_connections
  WHERE listing_id = listing_row.id
    AND is_connected = TRUE
    AND nap_match_score >= 80;
  IF connected_count > 0 THEN
    nap_consistency := (consistent_count * 100) / connected_count;
  ELSE
    nap_consistency := 0;
  END IF;

  -- Update Freshness (15% weight)
  -- Based on last update time (100% if updated within 30 days)
  IF listing_row.updated_at > NOW() - INTERVAL '30 days' THEN
    update_freshness := 100;
  ELSIF listing_row.updated_at > NOW() - INTERVAL '90 days' THEN
    update_freshness := 70;
  ELSIF listing_row.updated_at > NOW() - INTERVAL '180 days' THEN
    update_freshness := 40;
  ELSE
    update_freshness := 10;
  END IF;

  -- Photo Quality (10% weight)
  -- Based on presence of logo and photos
  photo_quality := 0;
  IF listing_row.logo_url IS NOT NULL AND listing_row.logo_url != '' THEN
    photo_quality := photo_quality + 40;
  END IF;
  IF listing_row.cover_photo_url IS NOT NULL AND listing_row.cover_photo_url != '' THEN
    photo_quality := photo_quality + 30;
  END IF;
  IF array_length(listing_row.photos, 1) > 0 THEN
    photo_quality := photo_quality + LEAST(array_length(listing_row.photos, 1) * 10, 30);
  END IF;

  -- Calculate total weighted score
  total_score := (
    (nap_completeness * 20 / 100) +
    (directory_coverage * 25 / 100) +
    (nap_consistency * 30 / 100) +
    (update_freshness * 15 / 100) +
    (photo_quality * 10 / 100)
  );

  RETURN total_score;
END;
$$;

-- Function to update listing accuracy score
CREATE OR REPLACE FUNCTION update_listing_accuracy()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_score INTEGER;
  old_score INTEGER;
BEGIN
  -- Calculate new score
  new_score := calculate_listing_accuracy(NEW);
  old_score := COALESCE(OLD.accuracy_score, 0);

  -- Update the listing with new score
  NEW.accuracy_score := new_score;
  NEW.last_accuracy_check := NOW();

  -- Log the change if significant
  IF ABS(new_score - old_score) >= 5 THEN
    INSERT INTO listing_accuracy_history (
      listing_id,
      organization_id,
      previous_score,
      new_score,
      change_amount,
      score_breakdown,
      calculation_reason
    ) VALUES (
      NEW.id,
      NEW.organization_id,
      old_score,
      new_score,
      new_score - old_score,
      jsonb_build_object(
        'nap_completeness', CASE
          WHEN NEW.business_name IS NOT NULL THEN 20 ELSE 0 END +
          CASE WHEN NEW.business_phone IS NOT NULL THEN 20 ELSE 0 END +
          CASE WHEN NEW.street_address IS NOT NULL THEN 20 ELSE 0 END +
          CASE WHEN NEW.city IS NOT NULL AND NEW.state IS NOT NULL THEN 20 ELSE 0 END +
          CASE WHEN NEW.business_website IS NOT NULL THEN 20 ELSE 0 END
      ),
      TG_OP
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to auto-update accuracy score
CREATE TRIGGER auto_update_listing_accuracy
  BEFORE INSERT OR UPDATE ON business_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_accuracy();

-- Function to detect duplicate listings
CREATE OR REPLACE FUNCTION detect_listing_duplicates(p_listing_id UUID)
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  listing_rec business_listings%ROWTYPE;
  duplicates UUID[];
  potential_dup UUID;
BEGIN
  -- Get the listing
  SELECT * INTO listing_rec FROM business_listings WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RETURN '{}';
  END IF;

  duplicates := '{}';

  -- Find potential duplicates based on:
  -- 1. Same phone number
  -- 2. Same address
  -- 3. Similar business name
  FOR potential_dup IN
    SELECT id FROM business_listings
    WHERE id != p_listing_id
      AND organization_id = listing_rec.organization_id
      AND is_active = TRUE
      AND (
        -- Same phone
        (business_phone IS NOT NULL AND business_phone = listing_rec.business_phone)
        -- Same address
        OR (
          street_address IS NOT NULL
          AND street_address = listing_rec.street_address
          AND city = listing_rec.city
          AND state = listing_rec.state
        )
        -- Similar name (simple check - can be enhanced)
        OR (
          business_name IS NOT NULL
          AND LOWER(business_name) = LOWER(listing_rec.business_name)
        )
      )
  LOOP
    duplicates := array_append(duplicates, potential_dup);
  END LOOP;

  -- Update the listing with potential duplicates
  UPDATE business_listings
  SET potential_duplicates = duplicates
  WHERE id = p_listing_id;

  RETURN duplicates;
END;
$$;

-- Function to create alert for NAP mismatch
CREATE OR REPLACE FUNCTION create_nap_mismatch_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If NAP match score drops below threshold, create alert
  IF NEW.nap_match_score < 70 AND OLD.nap_match_score >= 70 AND NEW.is_connected = TRUE THEN
    INSERT INTO listing_alerts (
      listing_id,
      organization_id,
      alert_type,
      severity,
      title,
      description,
      platform,
      connection_id
    ) VALUES (
      NEW.listing_id,
      NEW.organization_id,
      'nap_mismatch',
      'high',
      'NAP Information Mismatch Detected',
      'The business information on ' || NEW.platform || ' does not match your listing data. Review and update to maintain accuracy.',
      NEW.platform,
      NEW.id
    );
  END IF;

  -- If sync fails, create alert
  IF NEW.sync_status = 'error' AND OLD.sync_status != 'error' THEN
    INSERT INTO listing_alerts (
      listing_id,
      organization_id,
      alert_type,
      severity,
      title,
      description,
      platform,
      connection_id
    ) VALUES (
      NEW.listing_id,
      NEW.organization_id,
      'sync_failed',
      'medium',
      'Directory Sync Failed',
      'Failed to sync with ' || NEW.platform || ': ' || COALESCE(NEW.sync_error, 'Unknown error'),
      NEW.platform,
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_create_listing_alerts
  AFTER UPDATE ON directory_connections
  FOR EACH ROW
  EXECUTE FUNCTION create_nap_mismatch_alert();

-- RLS Policies for business_listings
ALTER TABLE business_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's listings"
  ON business_listings FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins and managers can insert listings"
  ON business_listings FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

CREATE POLICY "Admins and managers can update listings"
  ON business_listings FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

CREATE POLICY "Admins and managers can delete listings"
  ON business_listings FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

-- RLS Policies for directory_connections
ALTER TABLE directory_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's directory connections"
  ON directory_connections FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins and managers can manage directory connections"
  ON directory_connections FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

-- RLS Policies for listing_sync_logs
ALTER TABLE listing_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's sync logs"
  ON listing_sync_logs FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "System can manage sync logs"
  ON listing_sync_logs FOR ALL
  USING (organization_id = get_user_organization_id());

-- RLS Policies for listing_accuracy_history
ALTER TABLE listing_accuracy_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's accuracy history"
  ON listing_accuracy_history FOR SELECT
  USING (organization_id = get_user_organization_id());

-- RLS Policies for listing_changes_audit
ALTER TABLE listing_changes_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's change audit"
  ON listing_changes_audit FOR SELECT
  USING (organization_id = get_user_organization_id());

-- RLS Policies for listing_alerts
ALTER TABLE listing_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's alerts"
  ON listing_alerts FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can update their organization's alerts"
  ON listing_alerts FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- Insert default directory platforms for a listing
CREATE OR REPLACE FUNCTION initialize_listing_directories(p_listing_id UUID, p_organization_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create entries for all platforms
  INSERT INTO directory_connections (listing_id, organization_id, platform)
  SELECT p_listing_id, p_organization_id, unnest(enum_range(NULL::directory_platform))
  ON CONFLICT (listing_id, platform) DO NOTHING;
END;
$$;

-- Trigger to initialize directories for new listings
CREATE OR REPLACE FUNCTION auto_initialize_directories()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM initialize_listing_directories(NEW.id, NEW.organization_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_init_listing_directories
  AFTER INSERT ON business_listings
  FOR EACH ROW
  EXECUTE FUNCTION auto_initialize_directories();
