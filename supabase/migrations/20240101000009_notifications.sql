-- Notifications & Alert System Schema
-- Implements in-app notifications, email preferences, digest options, and Slack integration

-- Notifications table for in-app notification center
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Notification content
  type TEXT NOT NULL CHECK (type IN (
    'new_review',
    'negative_review',
    'review_approved',
    'review_rejected',
    'response_posted',
    'badge_earned',
    'milestone_reached',
    'mention',
    'report_ready',
    'digest',
    'system'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Associated entities (optional)
  review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
  loan_officer_id UUID REFERENCES loan_officers(id) ON DELETE SET NULL,

  -- Metadata for additional context
  metadata JSONB DEFAULT '{}',

  -- Status tracking
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMPTZ,

  -- Action URL for click-through
  action_url TEXT,

  -- Priority for sorting (higher = more important)
  priority INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_org ON notifications(organization_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- User notification preferences (extends existing notification_preferences in users table)
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  -- In-app notification preferences
  in_app_enabled BOOLEAN DEFAULT TRUE,
  in_app_new_review BOOLEAN DEFAULT TRUE,
  in_app_negative_review BOOLEAN DEFAULT TRUE,
  in_app_review_approved BOOLEAN DEFAULT TRUE,
  in_app_response_posted BOOLEAN DEFAULT TRUE,
  in_app_badge_earned BOOLEAN DEFAULT TRUE,
  in_app_mention BOOLEAN DEFAULT TRUE,

  -- Email notification preferences
  email_enabled BOOLEAN DEFAULT TRUE,
  email_new_review BOOLEAN DEFAULT TRUE,
  email_negative_review BOOLEAN DEFAULT TRUE,
  email_review_approved BOOLEAN DEFAULT TRUE,
  email_response_posted BOOLEAN DEFAULT TRUE,
  email_badge_earned BOOLEAN DEFAULT FALSE,
  email_mention BOOLEAN DEFAULT TRUE,

  -- Digest preferences
  digest_enabled BOOLEAN DEFAULT FALSE,
  digest_frequency TEXT DEFAULT 'daily' CHECK (digest_frequency IN ('daily', 'weekly', 'monthly')),
  digest_day_of_week INTEGER CHECK (digest_day_of_week >= 0 AND digest_day_of_week <= 6), -- 0=Sunday
  digest_hour INTEGER DEFAULT 9 CHECK (digest_hour >= 0 AND digest_hour <= 23),
  digest_timezone TEXT DEFAULT 'America/New_York',
  last_digest_sent_at TIMESTAMPTZ,

  -- Instant alert preferences
  instant_alert_threshold INTEGER DEFAULT 3, -- Rating below which to send instant alert
  instant_alert_enabled BOOLEAN DEFAULT TRUE,

  -- Slack integration
  slack_enabled BOOLEAN DEFAULT FALSE,
  slack_webhook_url TEXT,
  slack_channel TEXT,
  slack_new_review BOOLEAN DEFAULT TRUE,
  slack_negative_review BOOLEAN DEFAULT TRUE,
  slack_digest BOOLEAN DEFAULT FALSE,

  -- Quiet hours (no notifications during these times)
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_digest ON notification_preferences(digest_enabled, digest_frequency)
  WHERE digest_enabled = TRUE;

-- Digest queue for batching notifications
CREATE TABLE notification_digest_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  digest_type TEXT NOT NULL CHECK (digest_type IN ('daily', 'weekly', 'monthly')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(notification_id)
);

CREATE INDEX idx_digest_queue_pending ON notification_digest_queue(scheduled_for, processed_at)
  WHERE processed_at IS NULL;
CREATE INDEX idx_digest_queue_user ON notification_digest_queue(user_id);

-- Slack webhook logs for debugging
CREATE TABLE slack_webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
  webhook_url TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  success BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_slack_webhook_logs_user ON slack_webhook_logs(user_id);
CREATE INDEX idx_slack_webhook_logs_created ON slack_webhook_logs(created_at DESC);

-- RLS Policies

-- Notifications: users can only see their own notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND organization_id = notifications.organization_id
    )
  );

-- Notification preferences: users can manage their own
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_preferences_select_own" ON notification_preferences
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notification_preferences_insert_own" ON notification_preferences
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notification_preferences_update_own" ON notification_preferences
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notification_preferences_delete_own" ON notification_preferences
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Digest queue: users can see their own
ALTER TABLE notification_digest_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "digest_queue_select_own" ON notification_digest_queue
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Slack webhook logs: users can see their own
ALTER TABLE slack_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "slack_webhook_logs_select_own" ON slack_webhook_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_organization_id UUID DEFAULT NULL,
  p_review_id UUID DEFAULT NULL,
  p_loan_officer_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_action_url TEXT DEFAULT NULL,
  p_priority INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_prefs RECORD;
  v_in_app_enabled BOOLEAN;
BEGIN
  -- Get user preferences
  SELECT * INTO v_prefs
  FROM notification_preferences
  WHERE user_id = p_user_id;

  -- Check if in-app notifications are enabled for this type
  IF v_prefs IS NOT NULL THEN
    v_in_app_enabled := v_prefs.in_app_enabled AND (
      CASE p_type
        WHEN 'new_review' THEN v_prefs.in_app_new_review
        WHEN 'negative_review' THEN v_prefs.in_app_negative_review
        WHEN 'review_approved' THEN v_prefs.in_app_review_approved
        WHEN 'response_posted' THEN v_prefs.in_app_response_posted
        WHEN 'badge_earned' THEN v_prefs.in_app_badge_earned
        WHEN 'mention' THEN v_prefs.in_app_mention
        ELSE TRUE
      END
    );
  ELSE
    v_in_app_enabled := TRUE;
  END IF;

  -- Only create notification if enabled
  IF v_in_app_enabled THEN
    INSERT INTO notifications (
      user_id,
      organization_id,
      type,
      title,
      message,
      review_id,
      loan_officer_id,
      metadata,
      action_url,
      priority
    ) VALUES (
      p_user_id,
      p_organization_id,
      p_type,
      p_title,
      p_message,
      p_review_id,
      p_loan_officer_id,
      p_metadata,
      p_action_url,
      p_priority
    )
    RETURNING id INTO v_notification_id;

    -- Add to digest queue if digest is enabled
    IF v_prefs IS NOT NULL AND v_prefs.digest_enabled THEN
      INSERT INTO notification_digest_queue (
        user_id,
        notification_id,
        digest_type,
        scheduled_for
      ) VALUES (
        p_user_id,
        v_notification_id,
        v_prefs.digest_frequency,
        calculate_next_digest_time(
          v_prefs.digest_frequency,
          v_prefs.digest_day_of_week,
          v_prefs.digest_hour,
          v_prefs.digest_timezone
        )
      );
    END IF;
  END IF;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate next digest time
CREATE OR REPLACE FUNCTION calculate_next_digest_time(
  p_frequency TEXT,
  p_day_of_week INTEGER,
  p_hour INTEGER,
  p_timezone TEXT
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_now TIMESTAMPTZ;
  v_target TIMESTAMPTZ;
BEGIN
  v_now := NOW() AT TIME ZONE COALESCE(p_timezone, 'America/New_York');

  CASE p_frequency
    WHEN 'daily' THEN
      v_target := DATE_TRUNC('day', v_now) + INTERVAL '1 day' + (p_hour || ' hours')::INTERVAL;

    WHEN 'weekly' THEN
      -- Calculate next occurrence of the specified day
      v_target := DATE_TRUNC('week', v_now) +
        ((COALESCE(p_day_of_week, 1) + 7 - EXTRACT(DOW FROM v_now)::INTEGER) % 7 || ' days')::INTERVAL +
        (p_hour || ' hours')::INTERVAL;
      IF v_target <= v_now THEN
        v_target := v_target + INTERVAL '7 days';
      END IF;

    WHEN 'monthly' THEN
      v_target := DATE_TRUNC('month', v_now) + INTERVAL '1 month' + (p_hour || ' hours')::INTERVAL;

    ELSE
      v_target := v_now + INTERVAL '1 day';
  END CASE;

  RETURN v_target AT TIME ZONE COALESCE(p_timezone, 'America/New_York');
END;
$$ LANGUAGE plpgsql;

-- Function to get unread notification count for a user
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = p_user_id
      AND is_read = FALSE
      AND is_archived = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(
  p_user_id UUID,
  p_notification_ids UUID[] DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF p_notification_ids IS NULL THEN
    -- Mark all unread as read
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE user_id = p_user_id AND is_read = FALSE;
  ELSE
    -- Mark specific notifications as read
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE user_id = p_user_id
      AND id = ANY(p_notification_ids)
      AND is_read = FALSE;
  END IF;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending digest notifications for a user
CREATE OR REPLACE FUNCTION get_pending_digest_notifications(
  p_user_id UUID,
  p_before TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  notification_id UUID,
  type TEXT,
  title TEXT,
  message TEXT,
  action_url TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id as notification_id,
    n.type,
    n.title,
    n.message,
    n.action_url,
    n.created_at
  FROM notification_digest_queue dq
  JOIN notifications n ON n.id = dq.notification_id
  WHERE dq.user_id = p_user_id
    AND dq.scheduled_for <= p_before
    AND dq.processed_at IS NULL
  ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark digest as sent
CREATE OR REPLACE FUNCTION mark_digest_sent(
  p_user_id UUID,
  p_notification_ids UUID[]
)
RETURNS VOID AS $$
BEGIN
  -- Mark digest queue items as processed
  UPDATE notification_digest_queue
  SET processed_at = NOW()
  WHERE user_id = p_user_id
    AND notification_id = ANY(p_notification_ids);

  -- Update user preferences with last digest sent time
  UPDATE notification_preferences
  SET last_digest_sent_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create notification for new reviews
CREATE OR REPLACE FUNCTION notify_on_review_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_lo RECORD;
  v_user_id UUID;
  v_prefs RECORD;
  v_notification_type TEXT;
  v_title TEXT;
  v_message TEXT;
BEGIN
  -- Get loan officer details
  SELECT * INTO v_lo
  FROM loan_officers
  WHERE id = NEW.loan_officer_id;

  IF v_lo IS NULL OR v_lo.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_user_id := v_lo.user_id;

  -- Get user preferences
  SELECT * INTO v_prefs
  FROM notification_preferences
  WHERE user_id = v_user_id;

  -- Determine notification type based on rating
  IF NEW.rating < COALESCE(v_prefs.instant_alert_threshold, 3) THEN
    v_notification_type := 'negative_review';
    v_title := 'Low Rating Alert';
    v_message := format('You received a %s-star review from %s', NEW.rating, COALESCE(NEW.customer_name, 'a customer'));
  ELSE
    v_notification_type := 'new_review';
    v_title := 'New Review';
    v_message := format('You received a %s-star review from %s', NEW.rating, COALESCE(NEW.customer_name, 'a customer'));
  END IF;

  -- Create notification
  PERFORM create_notification(
    p_user_id := v_user_id,
    p_type := v_notification_type,
    p_title := v_title,
    p_message := v_message,
    p_organization_id := NEW.organization_id,
    p_review_id := NEW.id,
    p_loan_officer_id := NEW.loan_officer_id,
    p_metadata := jsonb_build_object(
      'rating', NEW.rating,
      'customer_name', NEW.customer_name,
      'source', NEW.source
    ),
    p_action_url := '/dashboard/reviews/' || NEW.id,
    p_priority := CASE WHEN NEW.rating < 3 THEN 10 ELSE 0 END
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new reviews
CREATE TRIGGER trigger_notify_on_review_insert
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_review_insert();

-- Trigger to notify when review is approved
CREATE OR REPLACE FUNCTION notify_on_review_approved()
RETURNS TRIGGER AS $$
DECLARE
  v_lo RECORD;
  v_user_id UUID;
BEGIN
  -- Only trigger when status changes to approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Get loan officer details
    SELECT * INTO v_lo
    FROM loan_officers
    WHERE id = NEW.loan_officer_id;

    IF v_lo IS NOT NULL AND v_lo.user_id IS NOT NULL THEN
      v_user_id := v_lo.user_id;

      PERFORM create_notification(
        p_user_id := v_user_id,
        p_type := 'review_approved',
        p_title := 'Review Approved',
        p_message := format('Your %s-star review from %s has been approved',
          NEW.rating, COALESCE(NEW.customer_name, 'a customer')),
        p_organization_id := NEW.organization_id,
        p_review_id := NEW.id,
        p_loan_officer_id := NEW.loan_officer_id,
        p_action_url := '/dashboard/reviews/' || NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_on_review_approved
  AFTER UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_review_approved();

-- Trigger to notify when response is posted
CREATE OR REPLACE FUNCTION notify_on_response_posted()
RETURNS TRIGGER AS $$
DECLARE
  v_lo RECORD;
  v_user_id UUID;
BEGIN
  -- Only trigger when response_text is added
  IF NEW.response_text IS NOT NULL AND (OLD.response_text IS NULL OR OLD.response_text = '') THEN
    -- Get loan officer details
    SELECT * INTO v_lo
    FROM loan_officers
    WHERE id = NEW.loan_officer_id;

    IF v_lo IS NOT NULL AND v_lo.user_id IS NOT NULL THEN
      v_user_id := v_lo.user_id;

      PERFORM create_notification(
        p_user_id := v_user_id,
        p_type := 'response_posted',
        p_title := 'Response Posted',
        p_message := format('Your response to %s''s review has been posted',
          COALESCE(NEW.customer_name, 'a customer')),
        p_organization_id := NEW.organization_id,
        p_review_id := NEW.id,
        p_loan_officer_id := NEW.loan_officer_id,
        p_action_url := '/dashboard/reviews/' || NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_on_response_posted
  AFTER UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_response_posted();

-- Apply updated_at trigger to notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
