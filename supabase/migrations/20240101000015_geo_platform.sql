-- GEO (Generative Engine Optimization) Platform Tables
-- Stores AI visibility scores, FAQs, schema recommendations, and AI search mentions

-- AI Visibility Scores (persisted calculations)
CREATE TABLE IF NOT EXISTS geo_visibility_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('loan_officer', 'branch', 'organization')),
  entity_id UUID NOT NULL,

  -- Overall score
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  previous_score INTEGER,
  score_change INTEGER,

  -- Score breakdown
  content_completeness INTEGER NOT NULL DEFAULT 0,
  structured_data INTEGER NOT NULL DEFAULT 0,
  entity_clarity INTEGER NOT NULL DEFAULT 0,
  citation_potential INTEGER NOT NULL DEFAULT 0,
  topical_authority INTEGER NOT NULL DEFAULT 0,
  freshness INTEGER NOT NULL DEFAULT 0,

  -- Platform-specific scores (JSONB for flexibility)
  platform_scores JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- Timestamps
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_calculation_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_geo_visibility_org ON geo_visibility_scores(organization_id);
CREATE INDEX IF NOT EXISTS idx_geo_visibility_entity ON geo_visibility_scores(entity_type, entity_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_geo_visibility_unique ON geo_visibility_scores(entity_type, entity_id);

-- AI-Optimized FAQs
CREATE TABLE IF NOT EXISTS geo_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('loan_officer', 'branch', 'organization')),
  entity_id UUID NOT NULL,

  -- FAQ content
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',

  -- Optimization metadata
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  voice_search_optimized BOOLEAN DEFAULT TRUE,
  snippet_ready BOOLEAN DEFAULT TRUE,

  -- Performance tracking
  impressions INTEGER DEFAULT 0,
  citations INTEGER DEFAULT 0,
  last_cited_at TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geo_faqs_org ON geo_faqs(organization_id);
CREATE INDEX IF NOT EXISTS idx_geo_faqs_entity ON geo_faqs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_geo_faqs_active ON geo_faqs(is_active) WHERE is_active = TRUE;

-- Schema Markup Implementations (track what's been added)
CREATE TABLE IF NOT EXISTS geo_schema_implementations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('loan_officer', 'branch', 'organization')),
  entity_id UUID NOT NULL,

  -- Schema details
  schema_type TEXT NOT NULL,
  markup JSONB NOT NULL,

  -- Validation
  is_valid BOOLEAN DEFAULT TRUE,
  validation_errors TEXT[] DEFAULT ARRAY[]::TEXT[],
  validation_warnings TEXT[] DEFAULT ARRAY[]::TEXT[],
  last_validated_at TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geo_schema_org ON geo_schema_implementations(organization_id);
CREATE INDEX IF NOT EXISTS idx_geo_schema_entity ON geo_schema_implementations(entity_type, entity_id);

-- AI Search Mentions (tracking when entity is mentioned in AI responses)
CREATE TABLE IF NOT EXISTS geo_ai_mentions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('loan_officer', 'branch', 'organization')),
  entity_id UUID NOT NULL,

  -- Mention details
  platform TEXT NOT NULL CHECK (platform IN ('chatgpt', 'perplexity', 'google_ai_overview', 'bing_copilot', 'claude', 'gemini')),
  query TEXT NOT NULL,
  context TEXT,
  mention_type TEXT NOT NULL DEFAULT 'direct' CHECK (mention_type IN ('direct', 'indirect', 'comparison')),
  sentiment TEXT DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'neutral', 'negative')),

  -- Source information
  source_url TEXT,
  source_title TEXT,

  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,

  -- Timestamps
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geo_mentions_org ON geo_ai_mentions(organization_id);
CREATE INDEX IF NOT EXISTS idx_geo_mentions_entity ON geo_ai_mentions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_geo_mentions_platform ON geo_ai_mentions(platform);
CREATE INDEX IF NOT EXISTS idx_geo_mentions_detected ON geo_ai_mentions(detected_at DESC);

-- Competitor Tracking
CREATE TABLE IF NOT EXISTS geo_competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Competitor details
  name TEXT NOT NULL,
  domain TEXT,
  location TEXT,

  -- Tracking status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geo_competitors_org ON geo_competitors(organization_id);

-- Competitor Comparison Results
CREATE TABLE IF NOT EXISTS geo_competitor_comparisons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES geo_competitors(id) ON DELETE CASCADE,

  -- Scores
  our_score INTEGER NOT NULL,
  competitor_score INTEGER NOT NULL,
  score_difference INTEGER NOT NULL,

  -- Detailed breakdown (JSONB)
  breakdown_comparison JSONB NOT NULL DEFAULT '[]'::JSONB,

  -- Analysis
  gap_analysis TEXT[] DEFAULT ARRAY[]::TEXT[],
  opportunity_areas TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Timestamps
  compared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geo_comparisons_org ON geo_competitor_comparisons(organization_id);
CREATE INDEX IF NOT EXISTS idx_geo_comparisons_competitor ON geo_competitor_comparisons(competitor_id);

-- AI Search Performance History (daily/weekly/monthly snapshots)
CREATE TABLE IF NOT EXISTS geo_performance_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('loan_officer', 'branch', 'organization')),
  entity_id UUID NOT NULL,

  -- Period
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Metrics
  visibility_score INTEGER NOT NULL,
  total_mentions INTEGER DEFAULT 0,
  total_citations INTEGER DEFAULT 0,
  platform_breakdown JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- Trends
  score_change INTEGER DEFAULT 0,
  mentions_change INTEGER DEFAULT 0,
  citations_change INTEGER DEFAULT 0,

  -- Top queries
  top_queries JSONB DEFAULT '[]'::JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geo_performance_org ON geo_performance_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_geo_performance_entity ON geo_performance_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_geo_performance_period ON geo_performance_history(period, period_start DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_geo_performance_unique ON geo_performance_history(entity_type, entity_id, period, period_start);

-- Optimization Suggestions (tracked)
CREATE TABLE IF NOT EXISTS geo_optimization_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('loan_officer', 'branch', 'organization')),
  entity_id UUID NOT NULL,

  -- Suggestion details
  category TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  current_value TEXT,
  suggested_value TEXT,

  -- Impact estimation
  estimated_impact INTEGER DEFAULT 0,
  estimated_effort TEXT DEFAULT 'moderate' CHECK (estimated_effort IN ('minimal', 'moderate', 'significant')),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'implemented', 'dismissed')),
  implemented_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geo_suggestions_org ON geo_optimization_suggestions(organization_id);
CREATE INDEX IF NOT EXISTS idx_geo_suggestions_entity ON geo_optimization_suggestions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_geo_suggestions_status ON geo_optimization_suggestions(status);

-- Content Templates
CREATE TABLE IF NOT EXISTS geo_content_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL for system templates

  -- Template details
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  template TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::JSONB,

  -- Optimization metadata
  target_platforms TEXT[] DEFAULT ARRAY[]::TEXT[],
  optimization_tips TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Usage tracking
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_system BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geo_templates_org ON geo_content_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_geo_templates_category ON geo_content_templates(category);

-- Enable RLS on all GEO tables
ALTER TABLE geo_visibility_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_schema_implementations ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_ai_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_competitor_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_performance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_optimization_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_content_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for GEO tables (organization-based access)

-- Visibility Scores
CREATE POLICY "Users can view own org visibility scores" ON geo_visibility_scores
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own org visibility scores" ON geo_visibility_scores
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own org visibility scores" ON geo_visibility_scores
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- FAQs
CREATE POLICY "Users can view own org FAQs" ON geo_faqs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own org FAQs" ON geo_faqs
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Schema Implementations
CREATE POLICY "Users can view own org schema" ON geo_schema_implementations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own org schema" ON geo_schema_implementations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- AI Mentions
CREATE POLICY "Users can view own org mentions" ON geo_ai_mentions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own org mentions" ON geo_ai_mentions
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Competitors
CREATE POLICY "Users can view own org competitors" ON geo_competitors
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own org competitors" ON geo_competitors
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Competitor Comparisons
CREATE POLICY "Users can view own org comparisons" ON geo_competitor_comparisons
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own org comparisons" ON geo_competitor_comparisons
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Performance History
CREATE POLICY "Users can view own org performance" ON geo_performance_history
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own org performance" ON geo_performance_history
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Optimization Suggestions
CREATE POLICY "Users can view own org suggestions" ON geo_optimization_suggestions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own org suggestions" ON geo_optimization_suggestions
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Content Templates (allow viewing system templates + own org)
CREATE POLICY "Users can view templates" ON geo_content_templates
  FOR SELECT USING (
    is_system = TRUE OR
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own org templates" ON geo_content_templates
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Updated at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_geo_visibility_scores_updated_at BEFORE UPDATE ON geo_visibility_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_geo_faqs_updated_at BEFORE UPDATE ON geo_faqs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_geo_schema_updated_at BEFORE UPDATE ON geo_schema_implementations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_geo_competitors_updated_at BEFORE UPDATE ON geo_competitors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_geo_suggestions_updated_at BEFORE UPDATE ON geo_optimization_suggestions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_geo_templates_updated_at BEFORE UPDATE ON geo_content_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system templates
INSERT INTO geo_content_templates (name, category, description, template, is_system, is_active)
VALUES
  ('AI-Optimized Bio', 'profile', 'Professional bio template structured for AI search visibility',
   '[Full Name] is a [Title] with [X years] of experience helping clients in [Location Area] achieve their homeownership goals. Specializing in [Specialties], [First Name] has helped [Number]+ families navigate the mortgage process with a focus on [Key Value Proposition].

With expertise in [Loan Types], [First Name] provides personalized guidance for [Target Clients]. [His/Her] approach combines [Key Differentiator] with deep knowledge of [Market/Industry].

[First Name] is licensed through NMLS ID #[NMLS Number] and is committed to [Mission Statement].',
   TRUE, TRUE),

  ('Service Description', 'services', 'Clear service description optimized for AI comprehension',
   '## [Service Name]

[One-sentence clear definition of the service]

### Who This Is For
[Description of ideal client for this service]

### How It Works
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Key Benefits
- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

### Get Started
[Clear call to action with contact information]',
   TRUE, TRUE),

  ('FAQ Answer Format', 'faq', 'Structured FAQ answer template for AI snippet inclusion',
   '[Direct answer to the question in the first sentence]. [Supporting context or explanation]. [Specific details, numbers, or requirements if applicable]. For [specific situation], [relevant exception or additional guidance]. Contact [Name/Organization] to [clear next step].',
   TRUE, TRUE),

  ('Location Description', 'location', 'Location content optimized for local AI search',
   '[Organization/Branch Name] serves clients throughout [Primary Service Area], including [City 1], [City 2], and [City 3]. Our [Location Type] at [Full Address] offers [Available Services].

### Areas We Serve
- [County/Region 1]
- [County/Region 2]
- [County/Region 3]

### Hours of Operation
[Day-time availability]

### Contact
Phone: [Phone Number]
Email: [Email Address]',
   TRUE, TRUE)
ON CONFLICT DO NOTHING;
