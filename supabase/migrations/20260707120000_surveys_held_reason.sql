-- Held Requests for unattributed acquisition surveys (ADR 0004; Grill #1
-- decision 10).
--
-- A CRM-triggered survey whose Opportunity owner could not be mapped to an org
-- professional must NOT be sent under a guessed name — "a wrong-name ask is
-- worse than a delayed ask" (CONTEXT.md § Acquisition, Held Request). The
-- attribution path assigns the held survey to a best-effort fallback owner (org
-- default assignee, else an org admin; surveys.user_id is nullable so it may
-- also be left unset), but `held_reason` is what actually holds it back.
--
-- We add a nullable text column rather than a new status value: surveys.status
-- is a CHECK-constrained enum, and a held survey is still logically 'pending' —
-- it simply must not enqueue/send while held_reason IS NOT NULL. The send/queue
-- paths gate on this column; releasing a Held Request clears it (future UI).
--
-- Additive-only.

ALTER TABLE surveys
  ADD COLUMN IF NOT EXISTS held_reason TEXT;

COMMENT ON COLUMN surveys.held_reason IS
  'Non-null means the survey is Held (never enqueued/sent) until released, e.g. salesforce_owner_unmatched. See ADR 0004 Held Request.';

-- The Held queue is "surveys for this org with held_reason set".
CREATE INDEX IF NOT EXISTS idx_surveys_held
  ON surveys (organization_id)
  WHERE held_reason IS NOT NULL;
