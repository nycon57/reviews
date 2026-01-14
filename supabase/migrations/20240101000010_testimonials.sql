-- Testimonial Generator Schema
-- This migration adds support for AI-generated marketing testimonials

-- Testimonial formats
CREATE TYPE testimonial_format AS ENUM (
  'short',      -- 1-2 sentence quote
  'medium',     -- Full paragraph testimonial
  'long',       -- Extended testimonial with context
  'social',     -- Social media optimized (Twitter/X length)
  'headline'    -- Single impactful headline
);

-- Testimonial status
CREATE TYPE testimonial_status AS ENUM (
  'draft',      -- AI-generated, not reviewed
  'approved',   -- Approved for use
  'rejected',   -- Rejected by reviewer
  'published'   -- Published/in-use
);

-- Testimonials table - stores generated testimonial snippets
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  loan_officer_id UUID REFERENCES loan_officers(id) ON DELETE SET NULL,

  -- Content
  format testimonial_format NOT NULL DEFAULT 'medium',
  content TEXT NOT NULL,
  original_quote TEXT, -- The exact quote extracted from the review
  key_highlights TEXT[], -- Key points highlighted in the testimonial

  -- AI metadata
  ai_generated BOOLEAN DEFAULT TRUE,
  generation_prompt TEXT, -- For debugging/improvement

  -- Status workflow
  status testimonial_status NOT NULL DEFAULT 'draft',
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason TEXT,

  -- Publishing
  published_at TIMESTAMPTZ,
  published_platforms TEXT[], -- Where it's been published (website, social, etc.)

  -- Export tracking
  last_exported_at TIMESTAMPTZ,
  export_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Testimonial graphics table - stores generated image assets
CREATE TABLE testimonial_graphics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimonial_id UUID NOT NULL REFERENCES testimonials(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Image data
  image_url TEXT, -- URL to stored image
  image_data TEXT, -- Base64 encoded image for preview

  -- Dimensions and format
  width INTEGER NOT NULL DEFAULT 1200,
  height INTEGER NOT NULL DEFAULT 675,
  format TEXT NOT NULL DEFAULT 'png', -- png, jpg, webp

  -- Styling
  template_name TEXT DEFAULT 'default',
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#1a1a1a',
  accent_color TEXT DEFAULT '#3b82f6',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Testimonial templates - reusable templates for generating testimonials
CREATE TABLE testimonial_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL for system templates

  -- Template info
  name TEXT NOT NULL,
  description TEXT,
  format testimonial_format NOT NULL,

  -- Template content
  prompt_template TEXT NOT NULL, -- AI prompt template with placeholders
  example_output TEXT, -- Example of expected output

  -- Settings
  is_system BOOLEAN DEFAULT FALSE, -- System templates can't be edited
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_testimonials_organization_id ON testimonials(organization_id);
CREATE INDEX idx_testimonials_review_id ON testimonials(review_id);
CREATE INDEX idx_testimonials_loan_officer_id ON testimonials(loan_officer_id);
CREATE INDEX idx_testimonials_status ON testimonials(status);
CREATE INDEX idx_testimonials_format ON testimonials(format);
CREATE INDEX idx_testimonials_created_at ON testimonials(created_at DESC);
CREATE INDEX idx_testimonial_graphics_testimonial_id ON testimonial_graphics(testimonial_id);
CREATE INDEX idx_testimonial_templates_organization_id ON testimonial_templates(organization_id);

-- RLS policies for testimonials
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonial_graphics ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonial_templates ENABLE ROW LEVEL SECURITY;

-- Testimonials policies
CREATE POLICY testimonials_org_isolation ON testimonials
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY testimonials_insert ON testimonials
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Testimonial graphics policies
CREATE POLICY testimonial_graphics_org_isolation ON testimonial_graphics
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY testimonial_graphics_insert ON testimonial_graphics
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Testimonial templates policies (read all system templates, CRUD own org templates)
CREATE POLICY testimonial_templates_read ON testimonial_templates
  FOR SELECT USING (
    is_system = TRUE
    OR organization_id IS NULL
    OR organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY testimonial_templates_write ON testimonial_templates
  FOR ALL USING (
    is_system = FALSE
    AND organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_testimonial_templates_updated_at
  BEFORE UPDATE ON testimonial_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default system templates
INSERT INTO testimonial_templates (name, description, format, prompt_template, example_output, is_system, is_active) VALUES
(
  'Social Media Quote',
  'Short, impactful quote optimized for Twitter/X and LinkedIn',
  'social',
  'Extract the most impactful 1-2 sentence quote from this review that would work well on social media. Focus on emotional impact and authenticity. Keep it under 280 characters.',
  '"Working with [Name] was the best decision we made during our home buying journey. Truly exceptional service!" - Happy Homeowner',
  TRUE,
  TRUE
),
(
  'Website Testimonial',
  'Full paragraph testimonial suitable for website display',
  'medium',
  'Create a polished, professional testimonial from this review. Maintain the customer''s authentic voice while making it suitable for a website. Include specific details they mentioned.',
  'Our experience with [Loan Officer] exceeded all expectations. From the initial consultation to closing day, every step of the process was handled with professionalism and care. The team kept us informed throughout, answered all our questions promptly, and made what could have been a stressful process feel seamless.',
  TRUE,
  TRUE
),
(
  'Headline Quote',
  'Single impactful headline for marketing materials',
  'headline',
  'Extract or create a single powerful headline (under 10 words) that captures the essence of this positive review. Make it memorable and quotable.',
  '"The best mortgage experience we''ve ever had!"',
  TRUE,
  TRUE
),
(
  'Extended Story',
  'Long-form testimonial with full customer journey',
  'long',
  'Transform this review into a compelling customer story. Include context about their situation, challenges they faced, how the loan officer helped, and the outcome. Maintain authenticity while creating a narrative arc.',
  'When [Customer] first started their home buying journey, they felt overwhelmed by the complexity of the mortgage process. Having been declined by two other lenders, they were losing hope. That''s when they met [Loan Officer]...',
  TRUE,
  TRUE
);
