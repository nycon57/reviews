-- Response Management Migration
-- Adds response templates and approval workflow for S017: Review Response Management

-- Response Templates table (reusable templates for common response scenarios)
CREATE TABLE response_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('thank_you', 'apologetic', 'follow_up', 'promotional', 'custom')),
  tone TEXT DEFAULT 'professional' CHECK (tone IN ('professional', 'friendly', 'empathetic', 'formal')),
  content TEXT NOT NULL,
  variables TEXT[] DEFAULT ARRAY[]::TEXT[], -- e.g., ['{{customer_name}}', '{{loan_officer_name}}']
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_response_templates_organization ON response_templates(organization_id);
CREATE INDEX idx_response_templates_category ON response_templates(category);
CREATE INDEX idx_response_templates_active ON response_templates(is_active) WHERE is_active = TRUE;

-- Add response approval workflow fields to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS response_status TEXT DEFAULT NULL
  CHECK (response_status IS NULL OR response_status IN ('draft', 'pending_approval', 'approved', 'rejected', 'posted'));
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS response_approved_at TIMESTAMPTZ;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS response_approved_by UUID REFERENCES users(id);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS response_rejected_at TIMESTAMPTZ;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS response_rejected_by UUID REFERENCES users(id);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS response_rejection_reason TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS response_template_id UUID REFERENCES response_templates(id);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS ai_suggested_response TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS response_posted_at TIMESTAMPTZ;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS response_post_error TEXT;

-- Response analytics tracking table (for detailed response metrics)
CREATE TABLE response_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  loan_officer_id UUID NOT NULL REFERENCES loan_officers(id) ON DELETE CASCADE,
  response_time_hours DECIMAL(10,2), -- Time from review to response in hours
  template_used UUID REFERENCES response_templates(id),
  was_ai_suggested BOOLEAN DEFAULT FALSE,
  was_edited_from_template BOOLEAN DEFAULT FALSE,
  word_count INTEGER,
  sentiment_before DECIMAL(3,2), -- Review sentiment
  platform TEXT NOT NULL, -- google, internal, etc.
  posted_successfully BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_response_analytics_organization ON response_analytics(organization_id);
CREATE INDEX idx_response_analytics_loan_officer ON response_analytics(loan_officer_id);
CREATE INDEX idx_response_analytics_review ON response_analytics(review_id);
CREATE INDEX idx_response_analytics_created ON response_analytics(created_at DESC);

-- Trigger to update response_templates usage count
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.response_template_id IS NOT NULL AND
     (OLD.response_template_id IS NULL OR OLD.response_template_id != NEW.response_template_id) THEN
    UPDATE response_templates
    SET usage_count = usage_count + 1, updated_at = NOW()
    WHERE id = NEW.response_template_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_increment_template_usage
  AFTER UPDATE ON reviews
  FOR EACH ROW
  WHEN (NEW.response_template_id IS DISTINCT FROM OLD.response_template_id)
  EXECUTE FUNCTION increment_template_usage();

-- Trigger to update timestamps on response_templates
CREATE TRIGGER update_response_templates_updated_at
  BEFORE UPDATE ON response_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS Policies for response_templates
ALTER TABLE response_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's response templates"
  ON response_templates FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins and managers can create response templates"
  ON response_templates FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

CREATE POLICY "Admins and managers can update response templates"
  ON response_templates FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

CREATE POLICY "Admins can delete response templates"
  ON response_templates FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin'])
  );

-- RLS Policies for response_analytics
ALTER TABLE response_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's response analytics"
  ON response_analytics FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "System can insert response analytics"
  ON response_analytics FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

-- Insert default response templates
INSERT INTO response_templates (id, organization_id, name, description, category, tone, content, variables, is_default, is_active)
SELECT
  uuid_generate_v4(),
  o.id,
  'Thank You - Positive Review',
  'Standard thank you response for positive reviews (4-5 stars)',
  'thank_you',
  'friendly',
  'Hi {{customer_name}},

Thank you so much for taking the time to share your experience! It was truly a pleasure working with you, and I''m thrilled to hear that you had a positive experience.

Your kind words mean a lot to me and my team. If you ever need assistance in the future or know someone who could benefit from our services, please don''t hesitate to reach out.

Best regards,
{{loan_officer_name}}',
  ARRAY['{{customer_name}}', '{{loan_officer_name}}'],
  TRUE,
  TRUE
FROM organizations o
ON CONFLICT DO NOTHING;

INSERT INTO response_templates (id, organization_id, name, description, category, tone, content, variables, is_default, is_active)
SELECT
  uuid_generate_v4(),
  o.id,
  'Apologetic - Negative Review',
  'Empathetic response for negative reviews addressing concerns',
  'apologetic',
  'empathetic',
  'Dear {{customer_name}},

Thank you for sharing your feedback. I sincerely apologize that your experience didn''t meet the high standards we strive to provide.

Your satisfaction is extremely important to me, and I would welcome the opportunity to discuss your concerns and make things right. Please feel free to contact me directly at your convenience.

Sincerely,
{{loan_officer_name}}',
  ARRAY['{{customer_name}}', '{{loan_officer_name}}'],
  TRUE,
  TRUE
FROM organizations o
ON CONFLICT DO NOTHING;

INSERT INTO response_templates (id, organization_id, name, description, category, tone, content, variables, is_default, is_active)
SELECT
  uuid_generate_v4(),
  o.id,
  'Follow Up - Request More Info',
  'Follow up response requesting more details about the experience',
  'follow_up',
  'professional',
  'Hello {{customer_name}},

Thank you for your feedback. I appreciate you taking the time to share your thoughts.

I''d love to learn more about your experience so I can continue to improve my service. If you have a moment, I''d be grateful if you could share any additional details.

Thank you again for your business.

Best,
{{loan_officer_name}}',
  ARRAY['{{customer_name}}', '{{loan_officer_name}}'],
  TRUE,
  TRUE
FROM organizations o
ON CONFLICT DO NOTHING;

INSERT INTO response_templates (id, organization_id, name, description, category, tone, content, variables, is_default, is_active)
SELECT
  uuid_generate_v4(),
  o.id,
  'Promotional - Referral Request',
  'Thank you with a soft referral request for satisfied customers',
  'promotional',
  'friendly',
  'Hi {{customer_name}},

Thank you so much for the wonderful review! It was an absolute pleasure helping you through your mortgage journey.

If you know anyone who''s looking to buy a home or refinance, I''d be honored if you kept me in mind. Word-of-mouth referrals from clients like you are the greatest compliment I can receive.

Wishing you all the best in your new home!

Warmly,
{{loan_officer_name}}',
  ARRAY['{{customer_name}}', '{{loan_officer_name}}'],
  TRUE,
  TRUE
FROM organizations o
ON CONFLICT DO NOTHING;
