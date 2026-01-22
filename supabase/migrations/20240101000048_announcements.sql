-- Announcements System (S088)
-- Product updates, feature announcements, and maintenance notifications

-- Announcement types
CREATE TYPE announcement_type AS ENUM (
  'feature',        -- New feature launch
  'update',         -- Product update / changelog
  'maintenance',    -- Scheduled maintenance
  'security'        -- Security update
);

-- Announcement status
CREATE TYPE announcement_status AS ENUM (
  'draft',          -- Not yet published
  'scheduled',      -- Scheduled for future send
  'sending',        -- Currently being sent
  'sent',           -- Sent to all recipients
  'cancelled'       -- Cancelled before/during send
);

-- Target audience segments
CREATE TYPE announcement_audience AS ENUM (
  'all',                   -- All users
  'admins_only',           -- Admin users only
  'managers_only',         -- Manager users only
  'loan_officers_only',    -- Loan officer users only
  'free_tier',             -- Free plan users
  'starter_tier',          -- Starter plan users
  'professional_tier',     -- Professional plan users
  'enterprise_tier',       -- Enterprise plan users
  'trial_users',           -- Users on trial
  'custom'                 -- Custom filter criteria
);

-- Main announcements table
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content
  title TEXT NOT NULL,
  subtitle TEXT,
  content TEXT NOT NULL,              -- Rich text / HTML content
  content_plain TEXT,                 -- Plain text version for email

  -- Type and status
  type announcement_type NOT NULL DEFAULT 'update',
  status announcement_status NOT NULL DEFAULT 'draft',

  -- Media (for feature announcements)
  image_url TEXT,                     -- Screenshot or promotional image
  gif_url TEXT,                       -- Animated GIF for demos
  video_url TEXT,                     -- Video embed URL

  -- Targeting
  audience announcement_audience NOT NULL DEFAULT 'all',
  custom_filter JSONB,                -- Custom targeting criteria when audience='custom'
                                      -- e.g., { "feature_usage": ["video_testimonials"], "min_reviews": 10 }

  -- Scheduling
  scheduled_at TIMESTAMPTZ,           -- When to send (if scheduled)
  sent_at TIMESTAMPTZ,                -- When actually sent

  -- Maintenance-specific fields
  maintenance_start_at TIMESTAMPTZ,   -- Start of maintenance window
  maintenance_end_at TIMESTAMPTZ,     -- End of maintenance window
  affected_services TEXT[],           -- e.g., ['surveys', 'reviews', 'api']

  -- Call to action
  cta_text TEXT,                      -- e.g., "Learn More", "Try it Now"
  cta_url TEXT,                       -- Link for the CTA button

  -- Secondary CTA (optional)
  secondary_cta_text TEXT,
  secondary_cta_url TEXT,

  -- Metadata
  created_by UUID REFERENCES users(id),
  version INTEGER NOT NULL DEFAULT 1, -- For version history
  parent_id UUID REFERENCES announcements(id), -- Parent version for history

  -- Tracking
  total_recipients INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Announcement recipients tracking
-- Tracks who should receive / has received each announcement
CREATE TABLE announcement_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,

  -- Delivery status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'unsubscribed')
  ),

  -- Resend tracking
  resend_message_id TEXT,

  -- Engagement tracking
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  click_count INTEGER DEFAULT 0,
  clicked_urls JSONB,                 -- Array of clicked URLs with timestamps

  -- Error tracking
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(announcement_id, user_id)
);

-- User announcement preferences (extends general email preferences)
CREATE TABLE user_announcement_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  -- Category preferences (default all true)
  feature_announcements BOOLEAN DEFAULT true,
  product_updates BOOLEAN DEFAULT true,
  maintenance_notifications BOOLEAN DEFAULT true,
  security_updates BOOLEAN DEFAULT true,   -- Cannot be disabled for critical security

  -- Frequency preferences
  digest_only BOOLEAN DEFAULT false,        -- Only receive monthly digest

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Changelog entries (for product update digest)
CREATE TABLE changelog_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (
    category IN ('feature', 'improvement', 'bugfix', 'performance', 'security', 'other')
  ),

  -- Optional link to detailed docs
  docs_url TEXT,

  -- Optional image/screenshot
  image_url TEXT,

  -- Release info
  version TEXT,                       -- e.g., "2.5.0"
  release_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Whether to include in monthly digest
  include_in_digest BOOLEAN DEFAULT true,

  -- Has this been included in a sent digest?
  digest_sent_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Announcement email logs (links to main email_logs for detailed tracking)
CREATE TABLE announcement_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  email_log_id UUID REFERENCES email_logs(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES announcement_recipients(id) ON DELETE SET NULL,

  -- Copy of key fields for quick access
  user_id UUID REFERENCES users(id),
  email TEXT NOT NULL,
  template_name TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Announcements indexes
CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_announcements_type ON announcements(type);
CREATE INDEX idx_announcements_scheduled_at ON announcements(scheduled_at)
  WHERE status = 'scheduled';
CREATE INDEX idx_announcements_sent_at ON announcements(sent_at DESC)
  WHERE status = 'sent';
CREATE INDEX idx_announcements_parent_id ON announcements(parent_id);

-- Recipients indexes
CREATE INDEX idx_announcement_recipients_announcement ON announcement_recipients(announcement_id);
CREATE INDEX idx_announcement_recipients_user ON announcement_recipients(user_id);
CREATE INDEX idx_announcement_recipients_status ON announcement_recipients(status);
CREATE INDEX idx_announcement_recipients_pending ON announcement_recipients(announcement_id)
  WHERE status = 'pending';

-- Preferences indexes
CREATE INDEX idx_user_announcement_prefs_user ON user_announcement_preferences(user_id);

-- Changelog indexes
CREATE INDEX idx_changelog_release_date ON changelog_entries(release_date DESC);
CREATE INDEX idx_changelog_digest_pending ON changelog_entries(release_date DESC)
  WHERE include_in_digest = true AND digest_sent_at IS NULL;

-- Email logs indexes
CREATE INDEX idx_announcement_email_logs_announcement ON announcement_email_logs(announcement_id);
CREATE INDEX idx_announcement_email_logs_user ON announcement_email_logs(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_announcement_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE changelog_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_email_logs ENABLE ROW LEVEL SECURITY;

-- Announcements: Only admins can manage, all authenticated can view sent
CREATE POLICY "Admins can manage announcements"
  ON announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "All authenticated can view sent announcements"
  ON announcements FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND status = 'sent'
  );

-- Recipients: Users can view their own, admins can manage all
CREATE POLICY "Users can view own recipient records"
  ON announcement_recipients FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage recipients"
  ON announcement_recipients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Preferences: Users can manage their own
CREATE POLICY "Users can manage own preferences"
  ON user_announcement_preferences FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all preferences"
  ON user_announcement_preferences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Changelog: Public read, admin write
CREATE POLICY "Anyone can view changelog"
  ON changelog_entries FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage changelog"
  ON changelog_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Email logs: Admins only
CREATE POLICY "Admins can manage announcement email logs"
  ON announcement_email_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update announcement stats after recipient status changes
CREATE OR REPLACE FUNCTION update_announcement_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE announcements
  SET
    total_sent = (
      SELECT COUNT(*) FROM announcement_recipients
      WHERE announcement_id = NEW.announcement_id
      AND status IN ('sent', 'delivered', 'opened', 'clicked')
    ),
    total_delivered = (
      SELECT COUNT(*) FROM announcement_recipients
      WHERE announcement_id = NEW.announcement_id
      AND status IN ('delivered', 'opened', 'clicked')
    ),
    total_opened = (
      SELECT COUNT(*) FROM announcement_recipients
      WHERE announcement_id = NEW.announcement_id
      AND status IN ('opened', 'clicked')
    ),
    total_clicked = (
      SELECT COUNT(*) FROM announcement_recipients
      WHERE announcement_id = NEW.announcement_id
      AND status = 'clicked'
    ),
    updated_at = now()
  WHERE id = NEW.announcement_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_announcement_stats
  AFTER UPDATE ON announcement_recipients
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_announcement_stats();

-- Auto-update updated_at timestamps
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcement_recipients_updated_at
  BEFORE UPDATE ON announcement_recipients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_announcement_preferences_updated_at
  BEFORE UPDATE ON user_announcement_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_changelog_entries_updated_at
  BEFORE UPDATE ON changelog_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE announcements IS 'Product announcements, updates, and notifications';
COMMENT ON TABLE announcement_recipients IS 'Tracks announcement delivery to individual users';
COMMENT ON TABLE user_announcement_preferences IS 'User preferences for announcement emails';
COMMENT ON TABLE changelog_entries IS 'Product changelog for monthly digest emails';
COMMENT ON TABLE announcement_email_logs IS 'Links announcements to email delivery logs';
