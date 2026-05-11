-- Video Testimonial System Migration
-- Creates schema for video testimonial requests, responses, and distribution queue
-- S057: Video Testimonial Database Schema & Storage

-- ===========================================
-- ENUMS
-- ===========================================

-- Video testimonial request status
CREATE TYPE video_testimonial_request_status AS ENUM (
  'pending',     -- Request created, not yet sent
  'sent',        -- Email sent to customer
  'opened',      -- Customer opened the link
  'recording',   -- Customer is actively recording
  'submitted',   -- Customer submitted a video
  'expired',     -- Request expired without submission
  'cancelled'    -- Request was cancelled
);

-- Video testimonial response approval status
CREATE TYPE video_testimonial_approval_status AS ENUM (
  'pending',     -- Awaiting review
  'approved',    -- Approved for use
  'rejected',    -- Rejected by reviewer
  'published'    -- Published/in use
);

-- ===========================================
-- VIDEO TESTIMONIAL REQUESTS TABLE
-- ===========================================

CREATE TABLE video_testimonial_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  loan_officer_id UUID NOT NULL REFERENCES loan_officers(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Secure token for public access
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),

  -- Customer information
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,

  -- Transaction context (optional)
  transaction_id TEXT,
  transaction_type TEXT DEFAULT 'mortgage',
  transaction_date DATE,

  -- Request configuration
  max_duration_seconds INTEGER DEFAULT 120,  -- 2 minutes default
  prompt_text TEXT,  -- Custom prompt for the customer

  -- Status tracking
  status video_testimonial_request_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Email tracking
  reminder_count INTEGER DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,

  -- Source tracking (manual, API, webhook, etc.)
  source TEXT DEFAULT 'manual',
  source_metadata JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for video_testimonial_requests
CREATE INDEX idx_video_testimonial_requests_organization ON video_testimonial_requests(organization_id);
CREATE INDEX idx_video_testimonial_requests_loan_officer ON video_testimonial_requests(loan_officer_id);
CREATE INDEX idx_video_testimonial_requests_token ON video_testimonial_requests(token);
CREATE INDEX idx_video_testimonial_requests_status ON video_testimonial_requests(status);
CREATE INDEX idx_video_testimonial_requests_customer_email ON video_testimonial_requests(customer_email);
CREATE INDEX idx_video_testimonial_requests_created_at ON video_testimonial_requests(created_at DESC);

-- ===========================================
-- VIDEO TESTIMONIAL RESPONSES TABLE
-- ===========================================

CREATE TABLE video_testimonial_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES video_testimonial_requests(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  loan_officer_id UUID NOT NULL REFERENCES loan_officers(id) ON DELETE CASCADE,

  -- Video storage
  video_url TEXT NOT NULL,           -- Supabase storage URL
  video_path TEXT NOT NULL,          -- Storage path for deletion
  thumbnail_url TEXT,                -- Generated thumbnail

  -- Video metadata
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,

  -- AI transcription (via Whisper)
  transcription TEXT,
  transcription_status TEXT DEFAULT 'pending' CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
  transcription_error TEXT,
  transcription_completed_at TIMESTAMPTZ,

  -- AI-generated text testimonial (via Gemini)
  ai_generated_text TEXT,
  ai_generation_status TEXT DEFAULT 'pending' CHECK (ai_generation_status IN ('pending', 'processing', 'completed', 'failed')),
  ai_generation_error TEXT,
  ai_generation_completed_at TIMESTAMPTZ,

  -- Key phrases and sentiment
  key_phrases TEXT[],
  sentiment_score DECIMAL(3,2),
  sentiment_label TEXT,

  -- Consent and legal
  consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  consent_timestamp TIMESTAMPTZ,
  consent_ip_address INET,
  marketing_consent BOOLEAN DEFAULT FALSE,

  -- Approval workflow
  approval_status video_testimonial_approval_status NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason TEXT,

  -- Publishing
  published_at TIMESTAMPTZ,
  published_platforms TEXT[],  -- website, social, email, etc.

  -- Submission metadata
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,  -- mobile, tablet, desktop
  browser TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for video_testimonial_responses
CREATE INDEX idx_video_testimonial_responses_request ON video_testimonial_responses(request_id);
CREATE INDEX idx_video_testimonial_responses_organization ON video_testimonial_responses(organization_id);
CREATE INDEX idx_video_testimonial_responses_loan_officer ON video_testimonial_responses(loan_officer_id);
CREATE INDEX idx_video_testimonial_responses_approval_status ON video_testimonial_responses(approval_status);
CREATE INDEX idx_video_testimonial_responses_transcription_status ON video_testimonial_responses(transcription_status);
CREATE INDEX idx_video_testimonial_responses_created_at ON video_testimonial_responses(created_at DESC);

-- ===========================================
-- VIDEO TESTIMONIAL QUEUE TABLE
-- ===========================================

CREATE TABLE video_testimonial_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES video_testimonial_requests(id) ON DELETE CASCADE,

  -- Queue item type
  type TEXT NOT NULL CHECK (type IN ('initial', 'reminder_3day', 'reminder_7day')),

  -- Scheduling
  scheduled_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ,

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 0,

  -- Retry logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint to prevent duplicate reminders per request/type
CREATE UNIQUE INDEX idx_video_testimonial_queue_request_type
  ON video_testimonial_queue(request_id, type);

-- Indexes for video_testimonial_queue
CREATE INDEX idx_video_testimonial_queue_organization ON video_testimonial_queue(organization_id);
CREATE INDEX idx_video_testimonial_queue_request ON video_testimonial_queue(request_id);
CREATE INDEX idx_video_testimonial_queue_status ON video_testimonial_queue(status);
CREATE INDEX idx_video_testimonial_queue_scheduled ON video_testimonial_queue(scheduled_at) WHERE status = 'pending';

-- ===========================================
-- STORAGE BUCKET
-- ===========================================

-- Create video-testimonials bucket with 100MB limit
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'video-testimonials',
  'video-testimonials',
  false,  -- Not public - access controlled via signed URLs
  104857600,  -- 100MB limit (100 * 1024 * 1024)
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime']::text[];

-- ===========================================
-- STORAGE POLICIES
-- ===========================================

-- Allow authenticated users to upload videos to their org folder
DROP POLICY IF EXISTS "Org members can upload video testimonials" ON storage.objects;
CREATE POLICY "Org members can upload video testimonials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'video-testimonials' AND
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.organization_id::text = (storage.foldername(name))[1]
  )
);

-- Allow authenticated users to read videos from their org
DROP POLICY IF EXISTS "Org members can read video testimonials" ON storage.objects;
CREATE POLICY "Org members can read video testimonials"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'video-testimonials' AND
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.organization_id::text = (storage.foldername(name))[1]
  )
);

-- Allow authenticated users to update videos in their org
DROP POLICY IF EXISTS "Org members can update video testimonials" ON storage.objects;
CREATE POLICY "Org members can update video testimonials"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'video-testimonials' AND
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.organization_id::text = (storage.foldername(name))[1]
  )
)
WITH CHECK (
  bucket_id = 'video-testimonials' AND
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.organization_id::text = (storage.foldername(name))[1]
  )
);

-- Allow authenticated users to delete videos from their org
DROP POLICY IF EXISTS "Org members can delete video testimonials" ON storage.objects;
CREATE POLICY "Org members can delete video testimonials"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'video-testimonials' AND
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.organization_id::text = (storage.foldername(name))[1]
  )
);

-- Allow public upload via token (for public submission form)
-- This is controlled via server-side validation of the token
DROP POLICY IF EXISTS "Public can upload video testimonials with valid token" ON storage.objects;
CREATE POLICY "Public can upload video testimonials with valid token"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'video-testimonials'
  AND array_length(storage.foldername(name), 1) >= 2
  AND EXISTS (
    SELECT 1
    FROM video_testimonial_requests r
    WHERE r.organization_id::text = (storage.foldername(name))[1]
      AND r.id::text = (storage.foldername(name))[2]
      AND r.status NOT IN ('expired', 'cancelled', 'submitted')
  )
);

-- ===========================================
-- RLS POLICIES
-- ===========================================

ALTER TABLE video_testimonial_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_testimonial_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_testimonial_queue ENABLE ROW LEVEL SECURITY;

-- =====================
-- VIDEO TESTIMONIAL REQUESTS POLICIES
-- =====================

-- Loan officers can view their own requests
CREATE POLICY "loan_officers_view_own_video_requests" ON video_testimonial_requests
  FOR SELECT USING (
    loan_officer_id IN (
      SELECT id FROM loan_officers WHERE user_id = auth.uid()
    )
  );

-- Managers and admins can view all requests in org
CREATE POLICY "managers_view_all_video_requests" ON video_testimonial_requests
  FOR SELECT USING (
    organization_id = get_user_organization_id() AND user_has_role(ARRAY['admin', 'manager'])
  );

-- Managers and admins can manage requests
CREATE POLICY "managers_manage_video_requests" ON video_testimonial_requests
  FOR ALL USING (
    organization_id = get_user_organization_id() AND user_has_role(ARRAY['admin', 'manager'])
  );

-- Loan officers can create requests for themselves
CREATE POLICY "loan_officers_create_video_requests" ON video_testimonial_requests
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id() AND
    loan_officer_id IN (
      SELECT id FROM loan_officers WHERE user_id = auth.uid()
    )
  );

-- NOTE: Public token lookup is handled via the lookup_video_testimonial_request()
-- SECURITY DEFINER function to prevent enumeration of all requests.
-- Direct public SELECT is NOT allowed on this table.

-- =====================
-- VIDEO TESTIMONIAL RESPONSES POLICIES
-- =====================

-- Loan officers can view responses for their requests
CREATE POLICY "loan_officers_view_own_video_responses" ON video_testimonial_responses
  FOR SELECT USING (
    loan_officer_id IN (
      SELECT id FROM loan_officers WHERE user_id = auth.uid()
    )
  );

-- Managers and admins can view all responses in org
CREATE POLICY "managers_view_all_video_responses" ON video_testimonial_responses
  FOR SELECT USING (
    organization_id = get_user_organization_id() AND user_has_role(ARRAY['admin', 'manager'])
  );

-- Managers and admins can manage responses (approve/reject)
CREATE POLICY "managers_manage_video_responses" ON video_testimonial_responses
  FOR ALL USING (
    organization_id = get_user_organization_id() AND user_has_role(ARRAY['admin', 'manager'])
  );

-- Allow public submission only for valid, non-expired requests
-- Additional validation (token matching) must be done server-side
CREATE POLICY "public_submit_video_responses" ON video_testimonial_responses
  FOR INSERT TO anon WITH CHECK (
    EXISTS (
      SELECT 1 FROM video_testimonial_requests r
      WHERE r.id = request_id
        AND r.organization_id = organization_id
        AND r.loan_officer_id = loan_officer_id
        AND r.status NOT IN ('expired', 'cancelled', 'submitted')
    )
  );

-- =====================
-- VIDEO TESTIMONIAL QUEUE POLICIES
-- =====================

-- Managers and admins can view queue
CREATE POLICY "managers_view_video_queue" ON video_testimonial_queue
  FOR SELECT USING (
    organization_id = get_user_organization_id() AND user_has_role(ARRAY['admin', 'manager'])
  );

-- Managers and admins can manage queue
CREATE POLICY "managers_manage_video_queue" ON video_testimonial_queue
  FOR ALL USING (
    organization_id = get_user_organization_id() AND user_has_role(ARRAY['admin', 'manager'])
  );

-- ===========================================
-- TRIGGERS
-- ===========================================

-- Update timestamps trigger for video_testimonial_requests
CREATE TRIGGER update_video_testimonial_requests_updated_at
  BEFORE UPDATE ON video_testimonial_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Update timestamps trigger for video_testimonial_responses
CREATE TRIGGER update_video_testimonial_responses_updated_at
  BEFORE UPDATE ON video_testimonial_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Secure function to lookup video testimonial request by token
-- Prevents enumeration of all requests by requiring exact token match
CREATE OR REPLACE FUNCTION lookup_video_testimonial_request(
  p_token TEXT
)
RETURNS TABLE (
  id UUID,
  organization_id UUID,
  loan_officer_id UUID,
  customer_name TEXT,
  max_duration_seconds INTEGER,
  prompt_text TEXT,
  status video_testimonial_request_status
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.organization_id,
    r.loan_officer_id,
    r.customer_name,
    r.max_duration_seconds,
    r.prompt_text,
    r.status
  FROM video_testimonial_requests r
  WHERE r.token = p_token
    AND r.status NOT IN ('expired', 'cancelled', 'submitted')
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function to mark a video testimonial request as opened (for tracking)
CREATE OR REPLACE FUNCTION mark_video_testimonial_opened(
  p_token TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  UPDATE video_testimonial_requests
  SET
    status = CASE WHEN status = 'sent' THEN 'opened' ELSE status END,
    opened_at = COALESCE(opened_at, NOW()),
    updated_at = NOW()
  WHERE token = p_token
    AND status NOT IN ('expired', 'cancelled', 'submitted');

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function to schedule video testimonial reminders
CREATE OR REPLACE FUNCTION schedule_video_testimonial_reminders(
  p_request_id UUID,
  p_organization_id UUID,
  p_send_3day BOOLEAN DEFAULT TRUE,
  p_send_7day BOOLEAN DEFAULT TRUE
)
RETURNS VOID AS $$
DECLARE
  v_sent_at TIMESTAMPTZ;
BEGIN
  -- Get the sent_at time for the request
  SELECT sent_at INTO v_sent_at
  FROM video_testimonial_requests
  WHERE id = p_request_id;

  IF v_sent_at IS NULL THEN
    v_sent_at := NOW();
  END IF;

  -- Schedule 3-day reminder
  IF p_send_3day THEN
    INSERT INTO video_testimonial_queue (
      organization_id,
      request_id,
      type,
      scheduled_at,
      priority
    ) VALUES (
      p_organization_id,
      p_request_id,
      'reminder_3day',
      v_sent_at + INTERVAL '3 days',
      -1  -- Lower priority than initial sends
    )
    ON CONFLICT (request_id, type) DO NOTHING;
  END IF;

  -- Schedule 7-day reminder
  IF p_send_7day THEN
    INSERT INTO video_testimonial_queue (
      organization_id,
      request_id,
      type,
      scheduled_at,
      priority
    ) VALUES (
      p_organization_id,
      p_request_id,
      'reminder_7day',
      v_sent_at + INTERVAL '7 days',
      -2  -- Even lower priority
    )
    ON CONFLICT (request_id, type) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function to get pending video testimonial queue items
CREATE OR REPLACE FUNCTION get_pending_video_testimonial_items(
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  request_id UUID,
  organization_id UUID,
  type TEXT,
  scheduled_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.request_id,
    q.organization_id,
    q.type,
    q.scheduled_at
  FROM video_testimonial_queue q
  WHERE q.status = 'pending'
    AND q.scheduled_at <= NOW()
    AND q.retry_count < q.max_retries
  ORDER BY q.priority DESC, q.scheduled_at ASC
  LIMIT p_limit
  FOR UPDATE SKIP LOCKED;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function to mark a video testimonial request as submitted
CREATE OR REPLACE FUNCTION mark_video_testimonial_submitted(
  p_request_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Update request status
  UPDATE video_testimonial_requests
  SET
    status = 'submitted',
    submitted_at = NOW(),
    updated_at = NOW()
  WHERE id = p_request_id;

  -- Cancel any pending reminders
  UPDATE video_testimonial_queue
  SET
    status = 'cancelled'
  WHERE request_id = p_request_id
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ===========================================
-- COMMENTS
-- ===========================================

COMMENT ON TABLE video_testimonial_requests IS 'Stores video testimonial requests sent to customers';
COMMENT ON TABLE video_testimonial_responses IS 'Stores submitted video testimonials with transcription and AI-generated text';
COMMENT ON TABLE video_testimonial_queue IS 'Queue for scheduled video testimonial reminders';

COMMENT ON COLUMN video_testimonial_requests.token IS 'Secure token for public access to submission form';
COMMENT ON COLUMN video_testimonial_requests.max_duration_seconds IS 'Maximum allowed video duration in seconds';
COMMENT ON COLUMN video_testimonial_responses.video_url IS 'Signed URL to video file in Supabase storage';
COMMENT ON COLUMN video_testimonial_responses.video_path IS 'Storage path for video file deletion';
COMMENT ON COLUMN video_testimonial_responses.transcription IS 'AI-generated transcription via Whisper';
COMMENT ON COLUMN video_testimonial_responses.ai_generated_text IS 'AI-generated text testimonial via Gemini';

COMMENT ON FUNCTION lookup_video_testimonial_request(TEXT) IS 'Secure public lookup of video testimonial request by token - prevents enumeration';
COMMENT ON FUNCTION mark_video_testimonial_opened(TEXT) IS 'Mark a video testimonial request as opened when customer views the form';
COMMENT ON FUNCTION schedule_video_testimonial_reminders(UUID, UUID, BOOLEAN, BOOLEAN) IS 'Schedule 3-day and 7-day reminders for video testimonial request';
COMMENT ON FUNCTION get_pending_video_testimonial_items(INTEGER) IS 'Get pending video testimonial queue items ready for processing';
COMMENT ON FUNCTION mark_video_testimonial_submitted(UUID) IS 'Mark video testimonial request as submitted and cancel pending reminders';
