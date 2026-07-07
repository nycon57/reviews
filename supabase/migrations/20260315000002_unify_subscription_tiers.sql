-- Unify subscription tier naming: free/starter/professional → basic/pro/enterprise
-- This migration updates all existing rows to use the new tier names

-- Update organizations table
UPDATE organizations
SET subscription_tier = CASE subscription_tier
  WHEN 'free' THEN 'basic'
  WHEN 'starter' THEN 'basic'
  WHEN 'professional' THEN 'pro'
  ELSE subscription_tier
END
WHERE subscription_tier IN ('free', 'starter', 'professional');

-- Update selected_plan column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'selected_plan'
  ) THEN
    UPDATE organizations
    SET selected_plan = CASE selected_plan
      WHEN 'free' THEN 'basic'
      WHEN 'starter' THEN 'basic'
      WHEN 'professional' THEN 'pro'
      ELSE selected_plan
    END
    WHERE selected_plan IN ('free', 'starter', 'professional');
  END IF;
END $$;

-- Update subscriptions table if it has a plan_tier column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'plan_tier'
  ) THEN
    UPDATE subscriptions
    SET plan_tier = CASE plan_tier
      WHEN 'free' THEN 'basic'
      WHEN 'starter' THEN 'basic'
      WHEN 'professional' THEN 'pro'
      ELSE plan_tier
    END
    WHERE plan_tier IN ('free', 'starter', 'professional');
  END IF;
END $$;

-- Add a CHECK constraint on subscription_tier to enforce new values
-- First drop existing constraint if any
DO $$
BEGIN
  ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_subscription_tier_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE organizations ADD CONSTRAINT organizations_subscription_tier_check
  CHECK (subscription_tier IN ('basic', 'pro', 'enterprise'));
