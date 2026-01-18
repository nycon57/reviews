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

-- ===========================================
-- DATA INTEGRITY CONSTRAINTS
-- ===========================================

-- Ensure approved status has a timestamp
ALTER TABLE video_testimonial_responses
ADD CONSTRAINT IF NOT EXISTS check_text_approved_at_when_approved
CHECK (text_approval_status != 'approved' OR text_approved_at IS NOT NULL);

-- Ensure consent given has a timestamp
ALTER TABLE video_testimonial_responses
ADD CONSTRAINT IF NOT EXISTS check_final_consent_timestamp
CHECK (final_consent_given = FALSE OR final_consent_timestamp IS NOT NULL);

-- Ensure redirect clicked implies redirect was shown
ALTER TABLE video_testimonial_responses
ADD CONSTRAINT IF NOT EXISTS check_redirect_shown_before_clicked
CHECK (google_review_redirect_clicked = FALSE OR google_review_redirect_shown = TRUE);

-- ===========================================
-- INDEXES (Single-column for general filtering)
-- ===========================================

-- Index for text approval status filtering
CREATE INDEX IF NOT EXISTS idx_video_testimonial_responses_text_approval_status
ON video_testimonial_responses(text_approval_status);

-- Index for customer rating filtering
CREATE INDEX IF NOT EXISTS idx_video_testimonial_responses_customer_rating
ON video_testimonial_responses(customer_rating);

-- Index for text approval timestamp (for date range queries and sorting)
CREATE INDEX IF NOT EXISTS idx_video_testimonial_responses_text_approved_at
ON video_testimonial_responses(text_approved_at DESC);

-- Index for final consent timestamp (for compliance and audit queries)
CREATE INDEX IF NOT EXISTS idx_video_testimonial_responses_final_consent_timestamp
ON video_testimonial_responses(final_consent_timestamp DESC);

-- ===========================================
-- COMPOSITE INDEXES (Multi-tenant queries)
-- ===========================================

-- Composite index for organization filtering + approval status (common dashboard query)
CREATE INDEX IF NOT EXISTS idx_video_testimonial_responses_org_approval_status
ON video_testimonial_responses(organization_id, text_approval_status);

-- Composite index for organization filtering + customer rating (common analytics query)
CREATE INDEX IF NOT EXISTS idx_video_testimonial_responses_org_customer_rating
ON video_testimonial_responses(organization_id, customer_rating);

-- Composite index for organization + approval timestamp (sorted lists)
CREATE INDEX IF NOT EXISTS idx_video_testimonial_responses_org_approved_at
ON video_testimonial_responses(organization_id, text_approved_at DESC);

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

-- ===========================================
-- ROLLBACK (if needed)
-- ===========================================
-- To reverse this migration, run:
--
-- ALTER TABLE video_testimonial_responses
--   DROP CONSTRAINT IF EXISTS check_redirect_shown_before_clicked,
--   DROP CONSTRAINT IF EXISTS check_final_consent_timestamp,
--   DROP CONSTRAINT IF EXISTS check_text_approved_at_when_approved;
--
-- DROP INDEX IF EXISTS idx_video_testimonial_responses_org_approved_at;
-- DROP INDEX IF EXISTS idx_video_testimonial_responses_org_customer_rating;
-- DROP INDEX IF EXISTS idx_video_testimonial_responses_org_approval_status;
-- DROP INDEX IF EXISTS idx_video_testimonial_responses_final_consent_timestamp;
-- DROP INDEX IF EXISTS idx_video_testimonial_responses_text_approved_at;
-- DROP INDEX IF EXISTS idx_video_testimonial_responses_customer_rating;
-- DROP INDEX IF EXISTS idx_video_testimonial_responses_text_approval_status;
--
-- ALTER TABLE video_testimonial_responses
--   DROP COLUMN IF EXISTS final_consent_timestamp,
--   DROP COLUMN IF EXISTS final_consent_given,
--   DROP COLUMN IF EXISTS text_edit_count,
--   DROP COLUMN IF EXISTS google_review_redirect_clicked,
--   DROP COLUMN IF EXISTS google_review_redirect_shown,
--   DROP COLUMN IF EXISTS text_approved_at,
--   DROP COLUMN IF EXISTS text_approval_status,
--   DROP COLUMN IF EXISTS customer_rating,
--   DROP COLUMN IF EXISTS customer_approved_text;
