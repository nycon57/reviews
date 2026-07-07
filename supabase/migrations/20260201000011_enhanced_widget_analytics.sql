-- S154: Enhanced Widget Analytics
-- Add missing event types to widget_event_type enum for video and conversion tracking

ALTER TYPE widget_event_type ADD VALUE IF NOT EXISTS 'video_pause';
ALTER TYPE widget_event_type ADD VALUE IF NOT EXISTS 'video_complete';
ALTER TYPE widget_event_type ADD VALUE IF NOT EXISTS 'video_progress';
ALTER TYPE widget_event_type ADD VALUE IF NOT EXISTS 'conversion';

-- Index for efficient event-level analytics queries by session
CREATE INDEX IF NOT EXISTS idx_widget_events_session_id
  ON widget_events (session_id)
  WHERE session_id IS NOT NULL;

-- Index for conversion attribution queries
CREATE INDEX IF NOT EXISTS idx_widget_events_conversion
  ON widget_events (widget_id, event_type, created_at)
  WHERE event_type = 'conversion';
