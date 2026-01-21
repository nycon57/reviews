-- Team Member Invite Tracking
-- Adds columns to organization_invitations table for tracking invite email sequence

-- Add tracking columns for the invite email sequence
ALTER TABLE organization_invitations
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expiration_sent BOOLEAN DEFAULT FALSE;

-- Add index for querying pending invitations that need reminders
CREATE INDEX IF NOT EXISTS idx_org_invitations_pending_reminders
ON organization_invitations (created_at, reminder_count)
WHERE accepted_at IS NULL AND expiration_sent = FALSE;

-- Add index for querying expired invitations
CREATE INDEX IF NOT EXISTS idx_org_invitations_expired
ON organization_invitations (expires_at)
WHERE accepted_at IS NULL AND expiration_sent = FALSE;

-- Update expires_at default to 14 days (was 7 days)
ALTER TABLE organization_invitations
ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '14 days');

-- Add comment for documentation
COMMENT ON COLUMN organization_invitations.reminder_count IS 'Number of reminder emails sent (1=initial, 2=day2 reminder, 3=day5 reminder)';
COMMENT ON COLUMN organization_invitations.last_reminder_at IS 'Timestamp of the last reminder email sent';
COMMENT ON COLUMN organization_invitations.expiration_sent IS 'Whether the expiration notice email has been sent';
