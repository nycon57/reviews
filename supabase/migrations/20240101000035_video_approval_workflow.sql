-- Migration: Video Testimonial Approval Workflow (S068)
-- Adds "changes_requested" status and manager_notes column for approval workflow

-- Add "changes_requested" to the approval status enum
ALTER TYPE video_testimonial_approval_status ADD VALUE IF NOT EXISTS 'changes_requested' AFTER 'pending';

-- Add manager_notes column for feedback when requesting changes
ALTER TABLE video_testimonial_responses
ADD COLUMN IF NOT EXISTS manager_notes TEXT,
ADD COLUMN IF NOT EXISTS changes_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS changes_requested_by UUID REFERENCES users(id);

-- Add index for filtering by changes_requested status
CREATE INDEX IF NOT EXISTS idx_video_testimonial_responses_changes_requested
ON video_testimonial_responses (organization_id, approval_status)
WHERE approval_status = 'changes_requested';

-- Comment on columns
COMMENT ON COLUMN video_testimonial_responses.manager_notes IS 'Manager feedback notes, especially when requesting changes before approval';
COMMENT ON COLUMN video_testimonial_responses.changes_requested_at IS 'Timestamp when changes were requested';
COMMENT ON COLUMN video_testimonial_responses.changes_requested_by IS 'User who requested changes';
