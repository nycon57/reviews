-- Migration: Add customer_email to reviews table for response notifications
-- This enables emailing reviewers when a response is posted

-- Add customer_email column to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- Backfill customer_email from surveys (via survey_responses)
-- Reviews link to survey_responses, which link to surveys where customer_email lives
UPDATE reviews r
SET customer_email = s.customer_email
FROM survey_responses sr
INNER JOIN surveys s ON sr.survey_id = s.id
WHERE r.survey_response_id = sr.id
  AND r.customer_email IS NULL
  AND s.customer_email IS NOT NULL;

-- Create index for efficient email lookups
CREATE INDEX IF NOT EXISTS idx_reviews_customer_email ON reviews(customer_email)
WHERE customer_email IS NOT NULL;

-- Add comment explaining the column purpose
COMMENT ON COLUMN reviews.customer_email IS 'Customer email address for sending response notifications. Populated from surveys for internal reviews.';
