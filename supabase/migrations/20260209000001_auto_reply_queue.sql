-- Auto-Reply Queue Schema
-- Enables automatic AI response generation for reviews (Pro/Enterprise only)

-- Auto-reply queue table
CREATE TABLE auto_reply_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Processing state
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'cancelled'
  )),
  tone TEXT NOT NULL DEFAULT 'professional' CHECK (tone IN (
    'professional', 'friendly', 'empathetic'
  )),

  -- Scheduling
  eligible_at TIMESTAMPTZ NOT NULL,
  attempted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Error handling
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One queue entry per review
  CONSTRAINT uq_auto_reply_review UNIQUE (review_id)
);

-- Index for batch processing: find pending items ready for processing
CREATE INDEX idx_auto_reply_queue_pending
  ON auto_reply_queue (status, eligible_at)
  WHERE status = 'pending';

CREATE INDEX idx_auto_reply_queue_org ON auto_reply_queue(organization_id);
CREATE INDEX idx_auto_reply_queue_user ON auto_reply_queue(user_id);

-- Add auto_reply_opt_out to notification_preferences
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS auto_reply_opt_out BOOLEAN DEFAULT FALSE;

-- Add was_auto_reply to response_analytics
ALTER TABLE response_analytics
  ADD COLUMN IF NOT EXISTS was_auto_reply BOOLEAN DEFAULT FALSE;

-- Trigger function: enqueue auto-reply when a review is approved
CREATE OR REPLACE FUNCTION fn_enqueue_auto_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org RECORD;
  v_tone TEXT;
  v_min_rating INT;
  v_user_opt_out BOOLEAN := FALSE;
BEGIN
  -- Only act for approved reviews
  IF NEW.status <> 'approved' THEN
    RETURN NEW;
  END IF;

  -- Must have an assigned user and no posted response yet
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.response_text IS NOT NULL OR NEW.response_status = 'posted' THEN
    RETURN NEW;
  END IF;

  -- Check org has auto_reply_enabled and is pro/enterprise tier
  SELECT
    subscription_tier,
    COALESCE((settings->>'auto_reply_enabled')::boolean, false) AS auto_reply_enabled,
    COALESCE((settings->>'auto_reply_tone'), 'professional') AS auto_reply_tone,
    COALESCE((settings->>'auto_reply_min_rating')::int, 1) AS auto_reply_min_rating
  INTO v_org
  FROM organizations
  WHERE id = NEW.organization_id;

  IF v_org IS NULL THEN
    RETURN NEW;
  END IF;

  -- Must be pro/enterprise tier
  IF v_org.subscription_tier NOT IN ('professional', 'enterprise') THEN
    RETURN NEW;
  END IF;

  -- Must have auto_reply_enabled
  IF NOT v_org.auto_reply_enabled THEN
    RETURN NEW;
  END IF;

  v_tone := v_org.auto_reply_tone;
  v_min_rating := v_org.auto_reply_min_rating;

  -- Check min rating filter
  IF NEW.rating < v_min_rating THEN
    RETURN NEW;
  END IF;

  -- Respect per-user opt-out
  SELECT COALESCE(auto_reply_opt_out, false)
  INTO v_user_opt_out
  FROM notification_preferences
  WHERE user_id = NEW.user_id
  LIMIT 1;

  IF v_user_opt_out THEN
    RETURN NEW;
  END IF;

  -- Enqueue (skip if already exists)
  INSERT INTO auto_reply_queue (
    organization_id,
    review_id,
    user_id,
    tone,
    eligible_at
  ) VALUES (
    NEW.organization_id,
    NEW.id,
    NEW.user_id,
    v_tone,
    COALESCE(NEW.approved_at, NEW.created_at, NEW.review_date, NOW()) + INTERVAL '24 hours'
  )
  ON CONFLICT (review_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create trigger on reviews table
DROP TRIGGER IF EXISTS trg_enqueue_auto_reply ON reviews;
CREATE TRIGGER trg_enqueue_auto_reply
  AFTER INSERT OR UPDATE OF status ON reviews
  FOR EACH ROW
  WHEN (NEW.status = 'approved')
  EXECUTE FUNCTION fn_enqueue_auto_reply();
