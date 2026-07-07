-- S301: Word-level timestamp storage for video testimonial transcription

ALTER TABLE video_testimonial_responses
ADD COLUMN IF NOT EXISTS word_timestamps JSONB;

COMMENT ON COLUMN video_testimonial_responses.word_timestamps IS
  'Word-level transcript metadata: { full_text, segments[], words[], provider, model, created_at, flagged_word_count }';

CREATE INDEX IF NOT EXISTS idx_video_testimonial_responses_word_timestamps_present
  ON video_testimonial_responses (id)
  WHERE word_timestamps IS NOT NULL;

-- Rollback (manual):
-- DROP INDEX IF EXISTS idx_video_testimonial_responses_word_timestamps_present;
-- ALTER TABLE video_testimonial_responses DROP COLUMN IF EXISTS word_timestamps;
