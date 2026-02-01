-- S112: Two-Way SMS Conversation UI
-- Adds unread_count to sms_conversations for tracking unread inbound messages

ALTER TABLE sms_conversations
  ADD COLUMN IF NOT EXISTS unread_count integer NOT NULL DEFAULT 0;

-- Index for efficient unread badge queries
CREATE INDEX IF NOT EXISTS idx_sms_conversations_unread
  ON sms_conversations (organization_id, unread_count)
  WHERE unread_count > 0;

-- Index for searching conversations by borrower_phone (partial match)
CREATE INDEX IF NOT EXISTS idx_sms_conversations_borrower_phone
  ON sms_conversations (organization_id, borrower_phone);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_sms_conversations_status
  ON sms_conversations (organization_id, status);

-- Index for messages by phone pair (conversation lookup)
CREATE INDEX IF NOT EXISTS idx_sms_messages_conversation_lookup
  ON sms_messages (organization_id, created_at DESC)
  WHERE direction IN ('outbound', 'inbound');

-- RPC to atomically increment unread_count on a conversation
CREATE OR REPLACE FUNCTION increment_conversation_unread(
  p_conversation_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE sms_conversations
  SET unread_count = unread_count + 1
  WHERE id = p_conversation_id;
END;
$$;
