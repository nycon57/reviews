-- Video Testimonial Phase 2: customer rating, quarantine, passthrough tracking
-- See docs/adr/0001-customer-rating-gates-video-publishing.md

ALTER TABLE video_testimonial_responses
ADD COLUMN IF NOT EXISTS customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
ADD COLUMN IF NOT EXISTS quarantined BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS private_feedback TEXT,
ADD COLUMN IF NOT EXISTS platform_passthrough_clicked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS recapture_email_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN video_testimonial_responses.customer_rating IS
  'Required 1-5 star rating collected on the About-you step before recording. Null only for legacy rows.';
COMMENT ON COLUMN video_testimonial_responses.quarantined IS
  'Low path: below the org celebration threshold. Excluded from smart links, widgets, and social publishing until explicitly approved (ADR 0001).';
COMMENT ON COLUMN video_testimonial_responses.private_feedback IS
  'Optional low-path free text from the customer. Professional-only; never published.';
COMMENT ON COLUMN video_testimonial_responses.platform_passthrough_clicked_at IS
  'When the customer used a GMB/Zillow passthrough button on the thank-you screen.';
COMMENT ON COLUMN video_testimonial_responses.recapture_email_sent_at IS
  'When the Review Kit recapture email was sent (high path, no passthrough click).';

-- Recapture cron sweeps: high-path responses with no click and no kit sent
CREATE INDEX IF NOT EXISTS idx_vtr_recapture_pending
  ON video_testimonial_responses (created_at)
  WHERE customer_rating >= 4
    AND platform_passthrough_clicked_at IS NULL
    AND recapture_email_sent_at IS NULL;

-- Quarantine filtering on public surfaces
CREATE INDEX IF NOT EXISTS idx_vtr_quarantined
  ON video_testimonial_responses (quarantined)
  WHERE quarantined = true;

-- Rollback (manual):
-- DROP INDEX IF EXISTS idx_vtr_recapture_pending;
-- DROP INDEX IF EXISTS idx_vtr_quarantined;
-- ALTER TABLE video_testimonial_responses
--   DROP COLUMN IF EXISTS customer_rating,
--   DROP COLUMN IF EXISTS quarantined,
--   DROP COLUMN IF EXISTS private_feedback,
--   DROP COLUMN IF EXISTS platform_passthrough_clicked_at,
--   DROP COLUMN IF EXISTS recapture_email_sent_at;

-- Unified review model (decision: video testimonials are reviews)
ALTER TABLE video_testimonial_responses
ADD COLUMN IF NOT EXISTS review_id UUID REFERENCES reviews(id) ON DELETE SET NULL;

COMMENT ON COLUMN video_testimonial_responses.review_id IS
  'Canonical reviews row for this video testimonial (source=video_testimonial). Created when AI processing completes; rating/status/text sync to it.';

CREATE INDEX IF NOT EXISTS idx_vtr_review_id
  ON video_testimonial_responses (review_id)
  WHERE review_id IS NOT NULL;
