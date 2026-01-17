-- Video Testimonial Text Approval Schema
-- S065: Customer Text Approval Flow
-- Adds fields for customer text editing, approval, and Google review redirect

-- ===========================================
-- ALTER VIDEO_TESTIMONIAL_RESPONSES TABLE
-- ===========================================

-- Add customer approval fields to responses table
ALTER TABLE video_testimonial_responses
ADD COLUMN IF NOT EXISTS customer_approved_text TEXT,
ADD COLUMN IF NOT EXISTS customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
ADD COLUMN IF NOT EXISTS text_approval_status TEXT DEFAULT 'pending' CHECK (text_approval_status IN ('pending', 'approved', 'skipped')),
ADD COLUMN IF NOT EXISTS text_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS google_review_redirect_shown BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS google_review_redirect_clicked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS text_edit_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_consent_given BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS final_consent_timestamp TIMESTAMPTZ;

-- Index for text approval status filtering
CREATE INDEX IF NOT EXISTS idx_video_testimonial_responses_text_approval_status
ON video_testimonial_responses(text_approval_status);

-- Index for customer rating filtering
CREATE INDEX IF NOT EXISTS idx_video_testimonial_responses_customer_rating
ON video_testimonial_responses(customer_rating);

-- ===========================================
-- COMMENTS
-- ===========================================

COMMENT ON COLUMN video_testimonial_responses.customer_approved_text IS 'Customer-edited and approved version of the AI-generated review text';
COMMENT ON COLUMN video_testimonial_responses.customer_rating IS 'Star rating (1-5) given by the customer for their experience';
COMMENT ON COLUMN video_testimonial_responses.text_approval_status IS 'Status of customer text approval: pending, approved, or skipped';
COMMENT ON COLUMN video_testimonial_responses.text_approved_at IS 'Timestamp when customer approved the text';
COMMENT ON COLUMN video_testimonial_responses.google_review_redirect_shown IS 'Whether the Google review redirect option was shown to customer';
COMMENT ON COLUMN video_testimonial_responses.google_review_redirect_clicked IS 'Whether customer clicked to leave a Google review';
COMMENT ON COLUMN video_testimonial_responses.text_edit_count IS 'Number of times customer edited the AI-generated text';
COMMENT ON COLUMN video_testimonial_responses.final_consent_given IS 'Whether customer gave final consent to submit the review';
COMMENT ON COLUMN video_testimonial_responses.final_consent_timestamp IS 'Timestamp of final consent';
