# Database Schema Documentation

## Overview

RepWell uses Supabase (PostgreSQL) with Row Level Security (RLS) for multi-tenant data isolation. This document describes all database tables, relationships, and security policies.

## Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  organizations  │────<│      users      │────<│  loan_officers  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                                               │
         │                                               │
         ▼                                               │
┌─────────────────┐     ┌─────────────────┐             │
│ survey_templates│────<│    surveys      │             │
└─────────────────┘     └─────────────────┘             │
                               │                        │
                               ▼                        │
                        ┌─────────────────┐             │
                        │survey_responses │             │
                        └─────────────────┘             │
                               │                        │
                               ▼                        ▼
                        ┌─────────────────────────────────┐
                        │            reviews              │
                        └─────────────────────────────────┘
                                      │
                                      ▼
                        ┌─────────────────────────────────┐
                        │       review_responses          │
                        └─────────────────────────────────┘
```

## Tables

### organizations

Multi-tenant parent entity representing a company using the platform.

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Settings JSONB structure:
-- {
--   "email_from_name": "Company Reviews",
--   "email_from_address": "reviews@company.com",
--   "default_survey_template_id": "uuid",
--   "auto_approve_threshold": 5,
--   "google_connected": false,
--   "notification_preferences": {...}
-- }
```

### users

Platform users with authentication and role information.

```sql
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
```

### loan_officers

Loan Officer profiles - the primary entity being reviewed.

```sql
CREATE TABLE loan_officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Profile Information
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  title TEXT DEFAULT 'Loan Officer',
  nmls_id TEXT,
  bio TEXT,
  photo_url TEXT,

  -- Location
  branch TEXT,
  region TEXT,
  address JSONB,

  -- External Profiles
  google_business_id TEXT,
  google_place_id TEXT,
  zillow_profile_url TEXT,
  linkedin_url TEXT,

  -- Computed Metrics (cached)
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  nps_score INTEGER,
  reputation_score INTEGER DEFAULT 0,

  -- Settings
  is_active BOOLEAN DEFAULT TRUE,
  receive_notifications BOOLEAN DEFAULT TRUE,
  auto_request_reviews BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loan_officers_organization ON loan_officers(organization_id);
CREATE INDEX idx_loan_officers_user ON loan_officers(user_id);
CREATE INDEX idx_loan_officers_google_business ON loan_officers(google_business_id);
```

### survey_templates

Reusable survey template definitions.

```sql
CREATE TABLE survey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Template Configuration
  questions JSONB NOT NULL DEFAULT '[]',
  branding JSONB DEFAULT '{}',
  thank_you_config JSONB DEFAULT '{}',

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions JSONB structure:
-- [
--   {
--     "id": "q1",
--     "type": "rating", // rating, nps, text, multiple_choice
--     "text": "How would you rate your overall experience?",
--     "required": true,
--     "options": {...} // type-specific options
--   }
-- ]

-- Branding JSONB structure:
-- {
--   "logo_url": "...",
--   "primary_color": "#3B82F6",
--   "header_text": "We value your feedback!"
-- }

-- Thank You Config JSONB:
-- {
--   "message": "Thank you for your feedback!",
--   "show_google_prompt": true,
--   "google_review_url": "...",
--   "redirect_url": null
-- }

CREATE INDEX idx_survey_templates_organization ON survey_templates(organization_id);
```

### surveys

Individual survey instances sent to customers.

```sql
CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES survey_templates(id),
  loan_officer_id UUID NOT NULL REFERENCES loan_officers(id) ON DELETE CASCADE,

  -- Customer Information
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,

  -- Transaction Context
  transaction_id TEXT, -- External reference (loan ID, etc.)
  transaction_type TEXT DEFAULT 'mortgage',
  transaction_date DATE,

  -- Survey State
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'completed', 'expired')),

  -- Tracking
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,

  -- Source tracking
  source TEXT DEFAULT 'manual', -- manual, webhook, api, import
  source_metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_surveys_organization ON surveys(organization_id);
CREATE INDEX idx_surveys_loan_officer ON surveys(loan_officer_id);
CREATE INDEX idx_surveys_token ON surveys(token);
CREATE INDEX idx_surveys_status ON surveys(status);
CREATE INDEX idx_surveys_customer_email ON surveys(customer_email);
```

### survey_responses

Submitted survey responses.

```sql
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,

  -- Response Data
  answers JSONB NOT NULL DEFAULT '{}',

  -- Extracted/Computed Values
  overall_rating INTEGER, -- 1-5 stars
  nps_score INTEGER, -- 0-10
  testimonial_text TEXT,

  -- AI Analysis (populated async)
  sentiment_score DECIMAL(3,2), -- -1.0 to 1.0
  sentiment_label TEXT, -- positive, neutral, negative
  themes TEXT[], -- ['communication', 'process', 'service']
  key_phrases TEXT[],
  ai_summary TEXT,

  -- Submission metadata
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Answers JSONB structure:
-- {
--   "q1": 5,
--   "q2": 9,
--   "q3": "Great experience working with John!",
--   "q4": ["responsive", "knowledgeable"]
-- }

CREATE INDEX idx_survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX idx_survey_responses_rating ON survey_responses(overall_rating);
CREATE INDEX idx_survey_responses_sentiment ON survey_responses(sentiment_label);
```

### reviews

Unified reviews from all sources (internal surveys + external platforms).

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  loan_officer_id UUID NOT NULL REFERENCES loan_officers(id) ON DELETE CASCADE,

  -- Source Information
  source TEXT NOT NULL CHECK (source IN ('internal', 'google', 'zillow', 'facebook', 'yelp', 'other')),
  source_review_id TEXT, -- External platform's review ID
  source_url TEXT,
  survey_response_id UUID REFERENCES survey_responses(id), -- If from internal survey

  -- Review Content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  text TEXT,
  customer_name TEXT,
  customer_location TEXT,

  -- AI Analysis
  sentiment_score DECIMAL(3,2),
  sentiment_label TEXT,
  themes TEXT[],
  key_phrases TEXT[],

  -- Workflow Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,

  -- Response
  response_text TEXT,
  response_at TIMESTAMPTZ,
  response_by UUID REFERENCES users(id),
  response_synced_at TIMESTAMPTZ, -- When pushed to external platform

  -- Publishing
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  featured BOOLEAN DEFAULT FALSE,

  -- Timestamps
  review_date TIMESTAMPTZ NOT NULL, -- Original review date
  synced_at TIMESTAMPTZ, -- Last sync from external source
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
```

### email_logs

Track all sent emails for debugging and analytics.

```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- Email Details
  to_email TEXT NOT NULL,
  to_name TEXT,
  from_email TEXT NOT NULL,
  from_name TEXT,
  subject TEXT NOT NULL,
  template_name TEXT,

  -- Related Entities
  survey_id UUID REFERENCES surveys(id) ON DELETE SET NULL,
  loan_officer_id UUID REFERENCES loan_officers(id) ON DELETE SET NULL,

  -- Delivery Status
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  resend_message_id TEXT,

  -- Tracking
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
CREATE INDEX idx_email_logs_to_email ON email_logs(to_email);
```

### metrics_snapshots

Cached analytics snapshots for performance.

```sql
CREATE TABLE metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  loan_officer_id UUID REFERENCES loan_officers(id) ON DELETE CASCADE, -- NULL for org-level

  -- Time Period
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'all_time')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Metrics
  metrics JSONB NOT NULL DEFAULT '{}',

  computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metrics JSONB structure:
-- {
--   "total_reviews": 150,
--   "average_rating": 4.8,
--   "nps_score": 72,
--   "response_rate": 0.65,
--   "review_velocity": 12.5,
--   "sentiment_breakdown": {"positive": 85, "neutral": 10, "negative": 5},
--   "rating_distribution": {"5": 100, "4": 35, "3": 10, "2": 3, "1": 2},
--   "top_themes": ["communication", "responsive", "helpful"]
-- }

CREATE UNIQUE INDEX idx_metrics_snapshots_unique
  ON metrics_snapshots(organization_id, COALESCE(loan_officer_id, '00000000-0000-0000-0000-000000000000'), period_type, period_start);
CREATE INDEX idx_metrics_snapshots_loan_officer ON metrics_snapshots(loan_officer_id);
```

### api_keys

API keys for programmatic access.

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  key_hash TEXT NOT NULL, -- Hashed API key (only prefix stored for display)
  key_prefix TEXT NOT NULL, -- First 8 chars for identification

  permissions TEXT[] DEFAULT ARRAY['read'],
  rate_limit INTEGER DEFAULT 1000, -- Requests per hour

  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_organization ON api_keys(organization_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
```

### webhooks

Outbound webhook configurations.

```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL, -- For HMAC signature

  events TEXT[] NOT NULL, -- ['review.created', 'survey.completed', etc.]
  is_active BOOLEAN DEFAULT TRUE,

  -- Stats
  total_sent INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  last_error TEXT,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhooks_organization ON webhooks(organization_id);
```

### google_connections

OAuth connections for Google Business Profile.

```sql
CREATE TABLE google_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  loan_officer_id UUID REFERENCES loan_officers(id) ON DELETE CASCADE,

  -- OAuth Tokens
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,

  -- Google Account Info
  google_account_id TEXT NOT NULL,
  google_email TEXT,
  account_name TEXT,

  -- Connected Locations
  locations JSONB DEFAULT '[]',

  -- Sync Status
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending',
  sync_error TEXT,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_google_connections_organization ON google_connections(organization_id);
CREATE INDEX idx_google_connections_loan_officer ON google_connections(loan_officer_id);
```

## Row Level Security Policies

### Organizations

```sql
-- Users can only see their own organization
CREATE POLICY "users_own_organization" ON organizations
  FOR SELECT USING (
    id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Only admins can update organization
CREATE POLICY "admins_update_organization" ON organizations
  FOR UPDATE USING (
    id = (SELECT organization_id FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

### Users

```sql
-- Users can see other users in their organization
CREATE POLICY "users_same_org" ON users
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (id = auth.uid());

-- Admins can manage all users in their org
CREATE POLICY "admins_manage_users" ON users
  FOR ALL USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

### Loan Officers

```sql
-- All org members can view loan officers
CREATE POLICY "org_members_view_los" ON loan_officers
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Loan officers can update their own profile
CREATE POLICY "lo_update_own" ON loan_officers
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- Managers/admins can manage all LOs
CREATE POLICY "managers_manage_los" ON loan_officers
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );
```

### Reviews

```sql
-- Loan officers see their own reviews
CREATE POLICY "lo_own_reviews" ON reviews
  FOR SELECT USING (
    loan_officer_id IN (
      SELECT id FROM loan_officers WHERE user_id = auth.uid()
    )
  );

-- Managers/admins see all org reviews
CREATE POLICY "managers_all_reviews" ON reviews
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Public access for published reviews (for widgets)
CREATE POLICY "public_published_reviews" ON reviews
  FOR SELECT USING (
    is_published = TRUE AND status = 'approved'
  );
```

## Functions & Triggers

### Update Loan Officer Metrics

```sql
CREATE OR REPLACE FUNCTION update_loan_officer_metrics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE loan_officers
  SET
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE loan_officer_id = NEW.loan_officer_id
      AND status = 'approved'
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE loan_officer_id = NEW.loan_officer_id
      AND status = 'approved'
    ),
    updated_at = NOW()
  WHERE id = NEW.loan_officer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_lo_metrics
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_loan_officer_metrics();
```

### Auto-expire Surveys

```sql
CREATE OR REPLACE FUNCTION expire_old_surveys()
RETURNS void AS $$
BEGIN
  UPDATE surveys
  SET status = 'expired', updated_at = NOW()
  WHERE status IN ('pending', 'sent', 'opened')
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule this as a cron job in Supabase
```

## Migrations

All migrations are stored in `supabase/migrations/` and applied in order.

```
supabase/migrations/
├── 20240101000000_create_organizations.sql
├── 20240101000001_create_users.sql
├── 20240101000002_create_loan_officers.sql
├── 20240101000003_create_surveys.sql
├── 20240101000004_create_reviews.sql
├── 20240101000005_create_email_logs.sql
├── 20240101000006_create_metrics.sql
├── 20240101000007_create_integrations.sql
├── 20240101000008_setup_rls_policies.sql
└── 20240101000009_create_functions.sql
```
