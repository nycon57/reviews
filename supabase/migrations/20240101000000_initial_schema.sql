-- ReviewHub Initial Database Schema
-- This migration creates all core tables for the platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  settings JSONB DEFAULT '{}',
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (linked to Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'loan_officer')),
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  notification_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);

-- Loan Officers table
CREATE TABLE loan_officers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  title TEXT DEFAULT 'Loan Officer',
  nmls_id TEXT,
  bio TEXT,
  photo_url TEXT,
  branch TEXT,
  region TEXT,
  address JSONB,
  google_business_id TEXT,
  google_place_id TEXT,
  zillow_profile_url TEXT,
  linkedin_url TEXT,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  nps_score INTEGER,
  reputation_score INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  receive_notifications BOOLEAN DEFAULT TRUE,
  auto_request_reviews BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loan_officers_organization ON loan_officers(organization_id);
CREATE INDEX idx_loan_officers_user ON loan_officers(user_id);
CREATE INDEX idx_loan_officers_email ON loan_officers(email);

-- Survey Templates table
CREATE TABLE survey_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  questions JSONB NOT NULL DEFAULT '[]',
  branding JSONB DEFAULT '{}',
  thank_you_config JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_survey_templates_organization ON survey_templates(organization_id);

-- Surveys table
CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES survey_templates(id),
  loan_officer_id UUID NOT NULL REFERENCES loan_officers(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  transaction_id TEXT,
  transaction_type TEXT DEFAULT 'mortgage',
  transaction_date DATE,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'completed', 'expired')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,
  source TEXT DEFAULT 'manual',
  source_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_surveys_organization ON surveys(organization_id);
CREATE INDEX idx_surveys_loan_officer ON surveys(loan_officer_id);
CREATE INDEX idx_surveys_token ON surveys(token);
CREATE INDEX idx_surveys_status ON surveys(status);
CREATE INDEX idx_surveys_customer_email ON surveys(customer_email);

-- Survey Responses table
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  overall_rating INTEGER,
  nps_score INTEGER,
  testimonial_text TEXT,
  sentiment_score DECIMAL(3,2),
  sentiment_label TEXT,
  themes TEXT[],
  key_phrases TEXT[],
  ai_summary TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX idx_survey_responses_rating ON survey_responses(overall_rating);

-- Reviews table (unified from all sources)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  loan_officer_id UUID NOT NULL REFERENCES loan_officers(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('internal', 'google', 'zillow', 'facebook', 'yelp', 'other')),
  source_review_id TEXT,
  source_url TEXT,
  survey_response_id UUID REFERENCES survey_responses(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  text TEXT,
  customer_name TEXT,
  customer_location TEXT,
  sentiment_score DECIMAL(3,2),
  sentiment_label TEXT,
  themes TEXT[],
  key_phrases TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  response_text TEXT,
  response_at TIMESTAMPTZ,
  response_by UUID REFERENCES users(id),
  response_synced_at TIMESTAMPTZ,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  featured BOOLEAN DEFAULT FALSE,
  review_date TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_organization ON reviews(organization_id);
CREATE INDEX idx_reviews_loan_officer ON reviews(loan_officer_id);
CREATE INDEX idx_reviews_source ON reviews(source);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_date ON reviews(review_date);
CREATE INDEX idx_reviews_published ON reviews(is_published) WHERE is_published = TRUE;

-- Email Logs table
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  to_name TEXT,
  from_email TEXT NOT NULL,
  from_name TEXT,
  subject TEXT NOT NULL,
  template_name TEXT,
  survey_id UUID REFERENCES surveys(id) ON DELETE SET NULL,
  loan_officer_id UUID REFERENCES loan_officers(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  resend_message_id TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_logs_organization ON email_logs(organization_id);
CREATE INDEX idx_email_logs_survey ON email_logs(survey_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);

-- Metrics Snapshots table (for caching analytics)
CREATE TABLE metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  loan_officer_id UUID REFERENCES loan_officers(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'all_time')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_metrics_snapshots_unique
  ON metrics_snapshots(organization_id, COALESCE(loan_officer_id, '00000000-0000-0000-0000-000000000000'::uuid), period_type, period_start);
CREATE INDEX idx_metrics_snapshots_loan_officer ON metrics_snapshots(loan_officer_id);

-- API Keys table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  permissions TEXT[] DEFAULT ARRAY['read'],
  rate_limit INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_organization ON api_keys(organization_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);

-- Trigger function to update loan officer metrics
CREATE OR REPLACE FUNCTION update_loan_officer_metrics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE loan_officers
  SET
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE loan_officer_id = COALESCE(NEW.loan_officer_id, OLD.loan_officer_id)
      AND status = 'approved'
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE loan_officer_id = COALESCE(NEW.loan_officer_id, OLD.loan_officer_id)
      AND status = 'approved'
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.loan_officer_id, OLD.loan_officer_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating metrics
CREATE TRIGGER trigger_update_lo_metrics
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_loan_officer_metrics();

-- Trigger function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_loan_officers_updated_at BEFORE UPDATE ON loan_officers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_survey_templates_updated_at BEFORE UPDATE ON survey_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON surveys FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();
