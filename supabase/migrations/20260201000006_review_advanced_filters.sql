-- S152: Advanced Filtering — add metadata JSONB, text search, and loan type columns to reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_reviews_metadata ON reviews USING GIN (metadata);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS text_search tsvector
  GENERATED ALWAYS AS (to_tsvector('english', COALESCE(text, '') || ' ' || COALESCE(title, ''))) STORED;
CREATE INDEX IF NOT EXISTS idx_reviews_text_search ON reviews USING GIN (text_search);
