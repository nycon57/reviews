-- Widget Database Schema (S132)
-- Tables: widget_configs, widget_events, social_proof_graphics
-- Includes JSONB config, indexes for analytics, and RLS for multi-tenant isolation.

------------------------------------------------------------------------
-- ENUMS
------------------------------------------------------------------------

CREATE TYPE widget_type AS ENUM (
  'lo_review',
  'branch_review',
  'company_review',
  'review_carousel',
  'star_rating_badge',
  'video_testimonial',
  'review_wall',
  'nps_score_badge',
  'social_proof_banner'
);

CREATE TYPE widget_entity_type AS ENUM ('user', 'branch', 'organization');

CREATE TYPE widget_status AS ENUM ('active', 'inactive', 'draft');

CREATE TYPE widget_event_type AS ENUM (
  'impression',
  'click_review',
  'click_cta',
  'click_write_review',
  'video_play',
  'scroll_depth',
  'banner_dismiss',
  'banner_click',
  'carousel_navigate',
  'filter_change'
);

CREATE TYPE render_status AS ENUM ('pending', 'rendering', 'complete', 'failed');

------------------------------------------------------------------------
-- 1. widget_configs
------------------------------------------------------------------------

CREATE TABLE widget_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  widget_id TEXT NOT NULL UNIQUE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  widget_type widget_type NOT NULL,
  entity_type widget_entity_type NOT NULL,
  entity_id UUID,
  config JSONB NOT NULL DEFAULT '{}',
  allowed_domains TEXT[] DEFAULT '{}',
  enable_structured_data BOOLEAN DEFAULT TRUE,
  structured_data_type TEXT DEFAULT 'LocalBusiness',
  status widget_status NOT NULL DEFAULT 'draft',
  name TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  parent_widget_id UUID REFERENCES widget_configs(id) ON DELETE SET NULL,
  ab_test_group TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE widget_configs IS 'Embeddable widget configurations per organization';
COMMENT ON COLUMN widget_configs.widget_id IS 'Human-readable slug used in embed scripts';
COMMENT ON COLUMN widget_configs.config IS 'JSONB widget appearance and behavior settings';
COMMENT ON COLUMN widget_configs.allowed_domains IS 'Domains permitted to embed this widget';
COMMENT ON COLUMN widget_configs.parent_widget_id IS 'Self-ref for widget versioning';

-- Indexes
CREATE INDEX idx_widget_configs_org_status ON widget_configs(organization_id, status);
CREATE INDEX idx_widget_configs_config_gin ON widget_configs USING gin (config);
CREATE INDEX idx_widget_configs_parent_widget_id ON widget_configs(parent_widget_id);

-- RLS
ALTER TABLE widget_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their widgets"
  ON widget_configs FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = get_current_user_id()
    )
  );

CREATE POLICY "Admins and managers can manage widgets"
  ON widget_configs FOR ALL TO authenticated
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

CREATE POLICY "Public can read active widgets"
  ON widget_configs FOR SELECT TO anon
  USING (status = 'active');

CREATE POLICY "Service role full access on widget_configs"
  ON widget_configs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- updated_at trigger
CREATE TRIGGER update_widget_configs_updated_at
  BEFORE UPDATE ON widget_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

------------------------------------------------------------------------
-- 2. widget_events
------------------------------------------------------------------------

CREATE TABLE widget_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  widget_id TEXT NOT NULL REFERENCES widget_configs(widget_id) ON DELETE CASCADE,
  event_type widget_event_type NOT NULL,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  metadata JSONB DEFAULT '{}',
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE widget_events IS 'Analytics events from embedded widgets (append-only)';

-- Indexes
CREATE INDEX idx_widget_events_widget_type_created
  ON widget_events(widget_id, event_type, created_at);
CREATE INDEX idx_widget_events_created_brin
  ON widget_events USING brin (created_at);

-- RLS
ALTER TABLE widget_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert widget events"
  ON widget_events FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Org members can read widget events"
  ON widget_events FOR SELECT TO authenticated
  USING (
    widget_id IN (
      SELECT wc.widget_id FROM widget_configs wc
      WHERE wc.organization_id IN (
        SELECT organization_id FROM users WHERE id = get_current_user_id()
      )
    )
  );

CREATE POLICY "Service role full access on widget_events"
  ON widget_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);

------------------------------------------------------------------------
-- 3. social_proof_graphics
------------------------------------------------------------------------

CREATE TABLE social_proof_graphics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  canvas_size JSONB NOT NULL,
  elements JSONB NOT NULL DEFAULT '[]',
  template_id TEXT,
  review_ids UUID[],
  render_url TEXT,
  render_status render_status NOT NULL DEFAULT 'pending',
  schedule_cron TEXT,
  last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE social_proof_graphics IS 'Social proof graphic designs and render state per organization';

-- Indexes
CREATE INDEX idx_social_proof_graphics_org ON social_proof_graphics(organization_id);

-- RLS
ALTER TABLE social_proof_graphics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their graphics"
  ON social_proof_graphics FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = get_current_user_id()
    )
  );

CREATE POLICY "Admins and managers can manage graphics"
  ON social_proof_graphics FOR ALL TO authenticated
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

CREATE POLICY "Service role full access on social_proof_graphics"
  ON social_proof_graphics FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- updated_at trigger
CREATE TRIGGER update_social_proof_graphics_updated_at
  BEFORE UPDATE ON social_proof_graphics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
