-- Google reply processor: bounded auto-retry bookkeeping (Team A1 / H9)
ALTER TABLE google_review_replies
  ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz;

-- Acquisition funnel: record when a survey respondent clicks through to
-- the external Google review CTA (Team A1 / H4; feeds the funnel work)
ALTER TABLE survey_responses
  ADD COLUMN IF NOT EXISTS google_review_clicked_at timestamptz;
