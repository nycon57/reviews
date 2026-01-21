-- Migration: generated_videos
-- Creates table for tracking Remotion-generated videos
-- Adds columns to video_testimonial_responses for generated video URLs

-- Create generated_videos table
CREATE TABLE IF NOT EXISTS generated_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_type text NOT NULL,
  -- 'video-testimonial', 'text-testimonial', 'leaderboard-celebration', 'report-summary', 'social-clip', 'video-thumbnail'
  source_id uuid NOT NULL,
  template text NOT NULL DEFAULT 'modern',
  -- 'modern', 'minimal', 'bold'
  format text NOT NULL DEFAULT '16:9',
  -- '16:9', '1:1', '9:16'
  storage_path text NOT NULL,
  duration_seconds numeric,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT valid_source_type CHECK (
    source_type IN (
      'video-testimonial',
      'text-testimonial',
      'leaderboard-celebration',
      'report-summary',
      'social-clip',
      'video-thumbnail'
    )
  ),
  CONSTRAINT valid_template CHECK (
    template IN ('modern', 'minimal', 'bold')
  ),
  CONSTRAINT valid_format CHECK (
    format IN ('16:9', '1:1', '9:16')
  )
);

-- Create index for fast lookups by organization
CREATE INDEX IF NOT EXISTS idx_generated_videos_organization_id
  ON generated_videos(organization_id);

-- Create index for lookups by source
CREATE INDEX IF NOT EXISTS idx_generated_videos_source
  ON generated_videos(source_type, source_id);

-- Create index for created_at for quota checking
CREATE INDEX IF NOT EXISTS idx_generated_videos_created_at
  ON generated_videos(organization_id, created_at);

-- Add columns to video_testimonial_responses for generated video URLs
ALTER TABLE video_testimonial_responses
ADD COLUMN IF NOT EXISTS generated_video_urls jsonb DEFAULT '{}';
-- JSON structure: { "16:9": "url", "1:1": "url", "9:16": "url" }

ALTER TABLE video_testimonial_responses
ADD COLUMN IF NOT EXISTS video_generation_status text DEFAULT 'pending';

ALTER TABLE video_testimonial_responses
ADD COLUMN IF NOT EXISTS video_generated_at timestamptz;

-- Create index for finding responses needing video generation
CREATE INDEX IF NOT EXISTS idx_video_testimonial_responses_generation_status
  ON video_testimonial_responses(video_generation_status)
  WHERE video_generation_status = 'pending';

-- Enable RLS on generated_videos
ALTER TABLE generated_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for generated_videos

-- Users can view generated videos for their organization
CREATE POLICY "Users can view organization videos"
  ON generated_videos
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Only admins and managers can create videos
CREATE POLICY "Admins and managers can create videos"
  ON generated_videos
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'manager')
    )
  );

-- Only admins can delete videos
CREATE POLICY "Admins can delete videos"
  ON generated_videos
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Service role bypass for API
CREATE POLICY "Service role full access"
  ON generated_videos
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE generated_videos IS 'Stores metadata for Remotion-generated videos';
COMMENT ON COLUMN generated_videos.source_type IS 'Type of composition that generated this video';
COMMENT ON COLUMN generated_videos.source_id IS 'ID of the source record (testimonial, video response, report, etc.)';
COMMENT ON COLUMN generated_videos.template IS 'Visual template used: modern, minimal, or bold';
COMMENT ON COLUMN generated_videos.format IS 'Aspect ratio: 16:9 (landscape), 1:1 (square), or 9:16 (vertical)';
COMMENT ON COLUMN generated_videos.storage_path IS 'Path in Supabase Storage videos bucket';
COMMENT ON COLUMN generated_videos.duration_seconds IS 'Video duration in seconds';
