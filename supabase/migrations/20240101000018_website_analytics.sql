-- Website Analytics & SEO Audit Tables
-- Stores visitor analytics, pageviews, sessions, and technical SEO audit data

-- Website Analytics Sessions (aggregated daily data)
CREATE TABLE IF NOT EXISTS website_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Date for aggregation
  date DATE NOT NULL,

  -- Page metrics
  page_path TEXT NOT NULL,
  page_title TEXT,

  -- Traffic metrics
  pageviews INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  sessions INTEGER NOT NULL DEFAULT 0,

  -- Engagement metrics
  avg_session_duration_seconds DECIMAL(10, 2) DEFAULT 0,
  bounce_rate DECIMAL(5, 2) DEFAULT 0,
  exit_rate DECIMAL(5, 2) DEFAULT 0,

  -- Traffic source breakdown (JSONB for flexibility)
  traffic_sources JSONB NOT NULL DEFAULT '{}'::JSONB,
  -- Example: {"organic": 40, "direct": 30, "referral": 20, "social": 10}

  -- Device breakdown
  device_breakdown JSONB NOT NULL DEFAULT '{}'::JSONB,
  -- Example: {"desktop": 60, "mobile": 35, "tablet": 5}

  -- Geographic data
  geographic_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  -- Example: {"US": 70, "CA": 10, "GB": 5, ...}

  -- Search query data (keywords that brought visitors)
  search_queries JSONB NOT NULL DEFAULT '[]'::JSONB,
  -- Example: [{"query": "best mortgage lender", "impressions": 100, "clicks": 15}, ...]

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for website analytics
CREATE INDEX IF NOT EXISTS idx_website_analytics_org ON website_analytics(organization_id);
CREATE INDEX IF NOT EXISTS idx_website_analytics_date ON website_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_website_analytics_path ON website_analytics(page_path);
CREATE UNIQUE INDEX IF NOT EXISTS idx_website_analytics_unique ON website_analytics(organization_id, date, page_path);

-- Website SEO Audits (periodic audit results)
CREATE TABLE IF NOT EXISTS website_seo_audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Page being audited
  page_url TEXT NOT NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,

  -- Overall SEO Score (0-100)
  seo_score INTEGER NOT NULL CHECK (seo_score >= 0 AND seo_score <= 100),
  previous_score INTEGER,
  score_change INTEGER,

  -- Score breakdown by category
  technical_score INTEGER NOT NULL DEFAULT 0,
  content_score INTEGER NOT NULL DEFAULT 0,
  performance_score INTEGER NOT NULL DEFAULT 0,
  mobile_score INTEGER NOT NULL DEFAULT 0,

  -- Technical SEO checks
  has_meta_title BOOLEAN DEFAULT FALSE,
  has_meta_description BOOLEAN DEFAULT FALSE,
  meta_title_length INTEGER,
  meta_description_length INTEGER,
  has_canonical_url BOOLEAN DEFAULT FALSE,
  has_robots_meta BOOLEAN DEFAULT FALSE,

  -- Headers analysis
  h1_count INTEGER DEFAULT 0,
  h2_count INTEGER DEFAULT 0,
  h3_count INTEGER DEFAULT 0,
  headers_hierarchy_valid BOOLEAN DEFAULT TRUE,

  -- Images analysis
  total_images INTEGER DEFAULT 0,
  images_with_alt INTEGER DEFAULT 0,
  images_without_alt INTEGER DEFAULT 0,

  -- Links analysis
  internal_links_count INTEGER DEFAULT 0,
  external_links_count INTEGER DEFAULT 0,
  broken_links_count INTEGER DEFAULT 0,

  -- Performance metrics
  page_load_time_ms INTEGER,
  first_contentful_paint_ms INTEGER,
  largest_contentful_paint_ms INTEGER,
  cumulative_layout_shift DECIMAL(5, 3),
  total_blocking_time_ms INTEGER,

  -- Mobile friendliness
  is_mobile_friendly BOOLEAN DEFAULT TRUE,
  viewport_configured BOOLEAN DEFAULT TRUE,
  font_size_readable BOOLEAN DEFAULT TRUE,
  tap_targets_sized BOOLEAN DEFAULT TRUE,

  -- Structured data
  has_structured_data BOOLEAN DEFAULT FALSE,
  structured_data_types TEXT[] DEFAULT ARRAY[]::TEXT[],
  structured_data_valid BOOLEAN DEFAULT TRUE,

  -- Content analysis
  word_count INTEGER DEFAULT 0,
  reading_time_minutes INTEGER DEFAULT 0,
  content_freshness_days INTEGER,

  -- Issues and recommendations (JSONB for flexibility)
  issues JSONB NOT NULL DEFAULT '[]'::JSONB,
  -- Example: [{"type": "error", "category": "meta", "title": "Missing meta description", "description": "...", "impact": "high"}]

  recommendations JSONB NOT NULL DEFAULT '[]'::JSONB,
  -- Example: [{"priority": "high", "title": "Add meta description", "description": "...", "estimated_impact": 5}]

  -- Audit metadata
  audit_type TEXT NOT NULL DEFAULT 'manual' CHECK (audit_type IN ('manual', 'scheduled', 'api')),
  audited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for SEO audits
CREATE INDEX IF NOT EXISTS idx_seo_audits_org ON website_seo_audits(organization_id);
CREATE INDEX IF NOT EXISTS idx_seo_audits_url ON website_seo_audits(page_url);
CREATE INDEX IF NOT EXISTS idx_seo_audits_score ON website_seo_audits(seo_score DESC);
CREATE INDEX IF NOT EXISTS idx_seo_audits_audited ON website_seo_audits(audited_at DESC);

-- Website Analytics Summary (daily/weekly/monthly aggregates for org)
CREATE TABLE IF NOT EXISTS website_analytics_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Period
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Aggregate metrics
  total_pageviews INTEGER NOT NULL DEFAULT 0,
  total_unique_visitors INTEGER NOT NULL DEFAULT 0,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  avg_session_duration_seconds DECIMAL(10, 2) DEFAULT 0,
  avg_bounce_rate DECIMAL(5, 2) DEFAULT 0,

  -- Top pages
  top_pages JSONB NOT NULL DEFAULT '[]'::JSONB,
  -- Example: [{"path": "/lo/john-doe", "pageviews": 500, "unique_visitors": 300}, ...]

  -- Traffic sources aggregate
  traffic_sources_total JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- Device breakdown aggregate
  device_breakdown_total JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- Geographic aggregate
  geographic_total JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- Top search queries
  top_search_queries JSONB NOT NULL DEFAULT '[]'::JSONB,

  -- Period comparison
  previous_period_pageviews INTEGER,
  pageviews_change_percent DECIMAL(5, 2),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for analytics summary
CREATE INDEX IF NOT EXISTS idx_analytics_summary_org ON website_analytics_summary(organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_summary_period ON website_analytics_summary(period, period_start DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_summary_unique ON website_analytics_summary(organization_id, period, period_start);

-- Enable RLS on all tables
ALTER TABLE website_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_seo_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_analytics_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies for website_analytics
CREATE POLICY "Users can view own org analytics" ON website_analytics
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own org analytics" ON website_analytics
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own org analytics" ON website_analytics
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policies for website_seo_audits
CREATE POLICY "Users can view own org SEO audits" ON website_seo_audits
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own org SEO audits" ON website_seo_audits
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policies for website_analytics_summary
CREATE POLICY "Users can view own org analytics summary" ON website_analytics_summary
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own org analytics summary" ON website_analytics_summary
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Apply updated_at triggers
CREATE TRIGGER update_website_analytics_updated_at BEFORE UPDATE ON website_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_website_seo_audits_updated_at BEFORE UPDATE ON website_seo_audits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_website_analytics_summary_updated_at BEFORE UPDATE ON website_analytics_summary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
