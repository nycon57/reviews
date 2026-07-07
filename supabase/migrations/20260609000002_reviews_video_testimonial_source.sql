-- Unified review model (ADR 0002): video testimonials are reviews.
-- Allow 'video_testimonial' as a canonical reviews.source value so the AI
-- worker can create a reviews row when a rated video finishes processing.

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_source_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_source_check
  CHECK (source IN ('internal', 'google', 'zillow', 'facebook', 'yelp', 'other', 'video_testimonial'));

COMMENT ON COLUMN reviews.source IS
  'Where the review came from. video_testimonial rows are created by the AI worker; source_review_id points at video_testimonial_responses.id.';

-- Rollback (manual):
-- ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_source_check;
-- ALTER TABLE reviews ADD CONSTRAINT reviews_source_check
--   CHECK (source IN ('internal', 'google', 'zillow', 'facebook', 'yelp', 'other'));
