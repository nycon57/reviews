-- Social Media Auto-Publish Migration
-- Enables automatic publishing of approved reviews to Facebook, Twitter/X, LinkedIn

-- Social media platform enum
CREATE TYPE social_platform AS ENUM (
  'facebook',
  'twitter',
  'linkedin',
  'instagram'
);

-- Social post status enum
CREATE TYPE social_post_status AS ENUM (
  'draft',
  'scheduled',
  'publishing',
  'published',
  'failed'
);

-- Social Connections table (stores OAuth tokens for each platform)
CREATE TABLE social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform social_platform NOT NULL,

  -- Account info
  platform_user_id TEXT NOT NULL,
  platform_username TEXT,
  platform_display_name TEXT,
  platform_profile_url TEXT,
  platform_avatar_url TEXT,

  -- OAuth tokens
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  token_scope TEXT,

  -- Page/Profile selection (for Facebook/LinkedIn pages)
  page_id TEXT,
  page_name TEXT,
  page_access_token TEXT,

  -- Settings
  is_active BOOLEAN DEFAULT TRUE,
  auto_publish_enabled BOOLEAN DEFAULT FALSE,
  auto_publish_min_rating INTEGER DEFAULT 5, -- Only auto-publish 5-star reviews

  -- Status tracking
  last_post_at TIMESTAMPTZ,
  posts_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint per org per platform
  CONSTRAINT unique_platform_per_org UNIQUE (organization_id, platform)
);

CREATE INDEX idx_social_connections_organization ON social_connections(organization_id);
CREATE INDEX idx_social_connections_platform ON social_connections(platform);
CREATE INDEX idx_social_connections_active ON social_connections(is_active) WHERE is_active = TRUE;

-- Social Post Templates table
CREATE TABLE social_post_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL for system templates
  platform social_platform NOT NULL,

  -- Template info
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_system BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Template content with placeholders
  -- Placeholders: {{reviewer_name}}, {{rating}}, {{review_text}}, {{loan_officer_name}}, {{branch_name}}
  template_text TEXT NOT NULL,
  include_image BOOLEAN DEFAULT TRUE,
  include_link BOOLEAN DEFAULT TRUE,
  link_text TEXT DEFAULT 'Read more reviews',

  -- Character limits per platform
  max_length INTEGER, -- NULL means no limit

  -- Hashtags
  default_hashtags TEXT[],

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_social_post_templates_organization ON social_post_templates(organization_id);
CREATE INDEX idx_social_post_templates_platform ON social_post_templates(platform);
CREATE INDEX idx_social_post_templates_default ON social_post_templates(is_default) WHERE is_default = TRUE;

-- Social Posts table (scheduled and published posts)
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES social_connections(id) ON DELETE CASCADE,
  review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
  testimonial_id UUID REFERENCES testimonials(id) ON DELETE SET NULL,
  template_id UUID REFERENCES social_post_templates(id) ON DELETE SET NULL,

  -- Post content
  platform social_platform NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT, -- Generated testimonial image
  link_url TEXT, -- Link to review or profile

  -- Scheduling
  status social_post_status NOT NULL DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,

  -- Platform response
  platform_post_id TEXT, -- ID of the post on the platform
  platform_post_url TEXT, -- URL to the post

  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,

  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_auto_generated BOOLEAN DEFAULT FALSE, -- Was this auto-generated on review approval?

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_social_posts_organization ON social_posts(organization_id);
CREATE INDEX idx_social_posts_connection ON social_posts(connection_id);
CREATE INDEX idx_social_posts_review ON social_posts(review_id);
CREATE INDEX idx_social_posts_status ON social_posts(status);
CREATE INDEX idx_social_posts_scheduled ON social_posts(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_social_posts_platform ON social_posts(platform);

-- Social Post Analytics table
CREATE TABLE social_post_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Metrics from platform
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,

  -- Calculated metrics
  engagement_rate DECIMAL(5,2) DEFAULT 0, -- (engagements / impressions) * 100

  -- Tracking
  last_fetched_at TIMESTAMPTZ DEFAULT NOW(),
  fetch_count INTEGER DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_social_post_analytics_post ON social_post_analytics(post_id);
CREATE INDEX idx_social_post_analytics_organization ON social_post_analytics(organization_id);

-- Social Publish Queue table (for bulk publishing)
CREATE TABLE social_publish_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES social_connections(id) ON DELETE CASCADE,

  -- Queue status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 0, -- Higher priority processed first

  -- Scheduling
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,

  -- Result
  post_id UUID REFERENCES social_posts(id) ON DELETE SET NULL,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_social_publish_queue_organization ON social_publish_queue(organization_id);
CREATE INDEX idx_social_publish_queue_status ON social_publish_queue(status) WHERE status = 'pending';
CREATE INDEX idx_social_publish_queue_scheduled ON social_publish_queue(scheduled_for);

-- Trigger to update timestamps
CREATE TRIGGER update_social_connections_updated_at
  BEFORE UPDATE ON social_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_post_templates_updated_at
  BEFORE UPDATE ON social_post_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_posts_updated_at
  BEFORE UPDATE ON social_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_post_analytics_updated_at
  BEFORE UPDATE ON social_post_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for social_connections
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's social connections"
  ON social_connections FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins and managers can insert social connections"
  ON social_connections FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

CREATE POLICY "Admins and managers can update social connections"
  ON social_connections FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

CREATE POLICY "Admins and managers can delete social connections"
  ON social_connections FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

-- RLS Policies for social_post_templates
ALTER TABLE social_post_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view system and org templates"
  ON social_post_templates FOR SELECT
  USING (
    is_system = TRUE
    OR organization_id IS NULL
    OR organization_id = get_user_organization_id()
  );

CREATE POLICY "Admins and managers can manage org templates"
  ON social_post_templates FOR ALL
  USING (
    is_system = FALSE
    AND organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

-- RLS Policies for social_posts
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's social posts"
  ON social_posts FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins and managers can insert social posts"
  ON social_posts FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

CREATE POLICY "Admins and managers can update social posts"
  ON social_posts FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

CREATE POLICY "Admins and managers can delete social posts"
  ON social_posts FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

-- RLS Policies for social_post_analytics
ALTER TABLE social_post_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's post analytics"
  ON social_post_analytics FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "System can insert post analytics"
  ON social_post_analytics FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "System can update post analytics"
  ON social_post_analytics FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- RLS Policies for social_publish_queue
ALTER TABLE social_publish_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's publish queue"
  ON social_publish_queue FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins and managers can manage publish queue"
  ON social_publish_queue FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

-- Insert default system templates for each platform
INSERT INTO social_post_templates (platform, name, description, is_default, is_system, template_text, max_length, default_hashtags) VALUES
-- Twitter/X templates
('twitter', 'Standard Review', 'Default Twitter post format', TRUE, TRUE,
  E'{{rating_stars}} "{{review_excerpt}}" - {{reviewer_name}}\n\n{{hashtags}}\n\n{{link}}',
  280, ARRAY['#CustomerReview', '#5Stars', '#Mortgage']),
('twitter', 'Thank You', 'Appreciation-focused post', FALSE, TRUE,
  E'Thank you {{reviewer_name}} for the amazing {{rating}}-star review! {{emoji}}\n\n"{{review_excerpt}}"\n\n{{hashtags}}',
  280, ARRAY['#ThankYou', '#CustomerAppreciation']),

-- Facebook templates
('facebook', 'Standard Review', 'Default Facebook post format', TRUE, TRUE,
  E'We''re thrilled to share this {{rating}}-star review from {{reviewer_name}}! {{emoji}}\n\n"{{review_text}}"\n\nThank you for trusting us with your mortgage needs! {{hashtags}}\n\n{{link}}',
  NULL, ARRAY['#CustomerReview', '#MortgageSuccess', '#HappyCustomer']),
('facebook', 'Featured Testimonial', 'Highlighted testimonial post', FALSE, TRUE,
  E'{{emoji}} FEATURED TESTIMONIAL {{emoji}}\n\n{{review_text}}\n\n- {{reviewer_name}}\n\nReady to start your journey? Contact us today!\n\n{{link}}',
  NULL, ARRAY['#Testimonial', '#CustomerStory']),

-- LinkedIn templates
('linkedin', 'Professional Review', 'Default LinkedIn post format', TRUE, TRUE,
  E'We''re honored to receive this {{rating}}-star review from {{reviewer_name}}.\n\n"{{review_text}}"\n\nAt {{organization_name}}, we''re committed to providing exceptional service to every client. This feedback motivates us to continue delivering excellence.\n\n{{hashtags}}\n\n{{link}}',
  3000, ARRAY['#CustomerSuccess', '#MortgageIndustry', '#ClientTestimonial']),
('linkedin', 'Team Recognition', 'Highlight team member', FALSE, TRUE,
  E'Congratulations to {{loan_officer_name}} for this outstanding {{rating}}-star review!\n\n"{{review_text}}"\n\n- {{reviewer_name}}\n\nOur team''s dedication to client success continues to drive amazing results. {{hashtags}}',
  3000, ARRAY['#TeamSuccess', '#EmployeeRecognition']),

-- Instagram templates (caption only, image handled separately)
('instagram', 'Visual Testimonial', 'Default Instagram caption', TRUE, TRUE,
  E'{{emoji}} {{rating}}-STAR REVIEW {{emoji}}\n\n"{{review_excerpt}}"\n\n- {{reviewer_name}}\n\n.\n.\n.\n{{hashtags}}',
  2200, ARRAY['#CustomerReview', '#5StarReview', '#MortgageBroker', '#HomeLoans', '#HappyCustomer', '#TestimonialTuesday', '#ClientLove', '#RealEstate', '#HomeOwnership', '#MortgageExpert']);

-- Add auto_publish_to_social column to reviews table if not exists
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS auto_publish_to_social BOOLEAN DEFAULT FALSE;

-- Function to check if review should be auto-published
CREATE OR REPLACE FUNCTION should_auto_publish_review(review_row reviews)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only auto-publish approved reviews with high ratings
  RETURN review_row.status = 'approved'
    AND review_row.rating >= 4
    AND review_row.auto_publish_to_social = TRUE;
END;
$$;

-- Function to queue review for social publishing
CREATE OR REPLACE FUNCTION queue_review_for_social_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conn RECORD;
BEGIN
  -- Only trigger on approval
  IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.auto_publish_to_social = TRUE THEN
    -- Queue for each active social connection with auto-publish enabled
    FOR conn IN
      SELECT id, platform
      FROM social_connections
      WHERE organization_id = NEW.organization_id
        AND is_active = TRUE
        AND auto_publish_enabled = TRUE
        AND auto_publish_min_rating <= NEW.rating
    LOOP
      INSERT INTO social_publish_queue (organization_id, review_id, connection_id, scheduled_for)
      VALUES (NEW.organization_id, NEW.id, conn.id, NOW() + INTERVAL '5 minutes');
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to auto-queue reviews for social publishing
CREATE TRIGGER auto_queue_social_publish
  AFTER UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION queue_review_for_social_publish();
