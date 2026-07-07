-- Review publish inversion: reviews auto-publish after machine screening;
-- human attention becomes the exception (quarantine release + disputes).
-- See decisions in tasks/todo.md "Review System Inversion".

-- Allow pro-page walk-up submissions as a first-class source.
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_source_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_source_check
  CHECK (source IN ('internal','google','zillow','facebook','yelp','other','video_testimonial','direct'));

-- Machine-screening verdict (write-side gate replacing human approval).
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS moderation_verdict TEXT CHECK (moderation_verdict IN ('pass','quarantine')),
  ADD COLUMN IF NOT EXISTS moderation_reasons TEXT[],
  ADD COLUMN IF NOT EXISTS moderation_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderation_provider TEXT,
  -- Email verification for anonymous direct submissions.
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_token_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_reviews_verification_token
  ON reviews(verification_token_hash)
  WHERE verification_token_hash IS NOT NULL;

-- Dispute adjudication metadata.
ALTER TABLE review_flags
  ADD COLUMN IF NOT EXISTS flagged_by_user_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS resolution_note TEXT,
  ADD COLUMN IF NOT EXISTS escalated_to_platform_at TIMESTAMPTZ;
