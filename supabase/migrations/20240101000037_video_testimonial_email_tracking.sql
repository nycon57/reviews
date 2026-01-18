-- Video Testimonial Email Tracking Enhancement
-- S070: Adds columns to track email delivery status from Resend webhooks

-- ===========================================
-- ADD "failed" STATUS TO ENUM
-- ===========================================

-- Add 'failed' status to the video_testimonial_request_status enum
ALTER TYPE video_testimonial_request_status ADD VALUE IF NOT EXISTS 'failed';

-- ===========================================
-- ADD EMAIL TRACKING COLUMNS
-- ===========================================

-- Add email tracking columns to video_testimonial_requests
ALTER TABLE video_testimonial_requests
  ADD COLUMN IF NOT EXISTS email_delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- ===========================================
-- COMMENTS
-- ===========================================

COMMENT ON COLUMN video_testimonial_requests.email_delivered_at IS 'Timestamp when the email was delivered (from Resend webhook)';
COMMENT ON COLUMN video_testimonial_requests.clicked_at IS 'Timestamp when the customer clicked the email link (from Resend webhook)';
COMMENT ON COLUMN video_testimonial_requests.failure_reason IS 'Reason for failure if status is failed (e.g., email bounced)';

-- ===========================================
-- INDEX FOR EMAIL DELIVERY TRACKING
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_video_testimonial_requests_email_delivered
  ON video_testimonial_requests(email_delivered_at)
  WHERE email_delivered_at IS NOT NULL;
