-- Add campaign_workflow_id to email_sequences to link runtime execution back to campaigns
ALTER TABLE email_sequences
ADD COLUMN IF NOT EXISTS campaign_workflow_id uuid REFERENCES campaign_workflows(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_email_sequences_campaign
ON email_sequences(campaign_workflow_id)
WHERE campaign_workflow_id IS NOT NULL;

COMMENT ON COLUMN email_sequences.campaign_workflow_id IS
  'Links this sequence instance to the campaign workflow that created it. NULL for non-campaign sequences.';
