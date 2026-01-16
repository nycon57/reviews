-- Stripe Billing & Subscription System
-- Adds tables for detailed subscription management, invoices, and payment methods

-- Subscriptions table for detailed Stripe subscription tracking
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused')),
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('free', 'starter', 'professional', 'enterprise')),
  billing_cycle TEXT CHECK (billing_cycle IN ('month', 'year')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  quantity INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Subscription items table for line items (seat-based pricing, add-ons)
CREATE TABLE IF NOT EXISTS subscription_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  stripe_item_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT NOT NULL,
  product_name TEXT,
  quantity INTEGER DEFAULT 1,
  unit_amount INTEGER,
  currency TEXT DEFAULT 'usd',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_items_sub ON subscription_items(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_items_stripe_id ON subscription_items(stripe_item_id);

-- Invoices table for billing history
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  number TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void')),
  amount_due INTEGER NOT NULL,
  amount_paid INTEGER DEFAULT 0,
  amount_remaining INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'usd',
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  pdf_url TEXT,
  hosted_invoice_url TEXT,
  billing_reason TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_id ON invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created ON invoices(created_at DESC);

-- Payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  billing_details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_org ON payment_methods(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(organization_id, is_default) WHERE is_default = TRUE;

-- Billing events table for audit trail
CREATE TABLE IF NOT EXISTS billing_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  stripe_object_id TEXT,
  stripe_object_type TEXT,
  data JSONB DEFAULT '{}',
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_events_org ON billing_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_stripe_event ON billing_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_type ON billing_events(event_type);
CREATE INDEX IF NOT EXISTS idx_billing_events_created ON billing_events(created_at DESC);

-- Usage records for metered billing (future use)
CREATE TABLE IF NOT EXISTS usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_item_id UUID REFERENCES subscription_items(id) ON DELETE SET NULL,
  metric_type TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stripe_usage_record_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_records_org ON usage_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_item ON usage_records(subscription_item_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_metric ON usage_records(metric_type);
CREATE INDEX IF NOT EXISTS idx_usage_records_timestamp ON usage_records(timestamp DESC);

-- Enable RLS on all tables
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

-- Subscriptions: Admins can view their org's subscriptions
CREATE POLICY "admins_view_subscriptions" ON subscriptions
  FOR SELECT USING (
    organization_id = get_user_organization_id() AND user_has_role(ARRAY['admin'])
  );

-- Subscription items: Admins can view their org's subscription items
CREATE POLICY "admins_view_subscription_items" ON subscription_items
  FOR SELECT USING (
    subscription_id IN (
      SELECT id FROM subscriptions WHERE organization_id = get_user_organization_id()
    ) AND user_has_role(ARRAY['admin'])
  );

-- Invoices: Admins can view their org's invoices
CREATE POLICY "admins_view_invoices" ON invoices
  FOR SELECT USING (
    organization_id = get_user_organization_id() AND user_has_role(ARRAY['admin'])
  );

-- Payment methods: Admins can view their org's payment methods
CREATE POLICY "admins_view_payment_methods" ON payment_methods
  FOR SELECT USING (
    organization_id = get_user_organization_id() AND user_has_role(ARRAY['admin'])
  );

-- Billing events: Admins can view their org's billing events
CREATE POLICY "admins_view_billing_events" ON billing_events
  FOR SELECT USING (
    organization_id = get_user_organization_id() AND user_has_role(ARRAY['admin'])
  );

-- Usage records: Admins can view their org's usage records
CREATE POLICY "admins_view_usage_records" ON usage_records
  FOR SELECT USING (
    organization_id = get_user_organization_id() AND user_has_role(ARRAY['admin'])
  );

-- Service role policies for webhook updates (bypass RLS)
-- These allow the webhook handler to insert/update records

-- Function to update organization subscription status from Stripe
CREATE OR REPLACE FUNCTION sync_organization_subscription_status()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the organization's subscription fields when subscription changes
  UPDATE organizations
  SET
    subscription_status = NEW.status,
    subscription_tier = NEW.plan_tier,
    subscription_started_at = NEW.current_period_start,
    subscription_ends_at = NEW.current_period_end,
    subscription_cancelled_at = NEW.canceled_at,
    trial_ends_at = NEW.trial_end,
    updated_at = NOW()
  WHERE id = NEW.organization_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync subscription status to organization
DROP TRIGGER IF EXISTS trigger_sync_subscription_status ON subscriptions;
CREATE TRIGGER trigger_sync_subscription_status
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_organization_subscription_status();

-- Function to get subscription details for an organization
CREATE OR REPLACE FUNCTION get_organization_subscription(p_organization_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  stripe_subscription_id TEXT,
  status TEXT,
  plan_tier TEXT,
  billing_cycle TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN,
  trial_end TIMESTAMPTZ,
  quantity INTEGER
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.stripe_subscription_id,
    s.status,
    s.plan_tier,
    s.billing_cycle,
    s.current_period_start,
    s.current_period_end,
    s.cancel_at_period_end,
    s.trial_end,
    s.quantity
  FROM subscriptions s
  WHERE s.organization_id = p_organization_id
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to check if organization has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(p_organization_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_status TEXT;
BEGIN
  SELECT status INTO sub_status
  FROM subscriptions
  WHERE organization_id = p_organization_id
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN sub_status IN ('active', 'trialing');
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE subscriptions IS 'Stripe subscription records for each organization';
COMMENT ON TABLE subscription_items IS 'Line items within a subscription (seats, add-ons)';
COMMENT ON TABLE invoices IS 'Stripe invoice records for billing history';
COMMENT ON TABLE payment_methods IS 'Stored payment methods for organizations';
COMMENT ON TABLE billing_events IS 'Audit log of all Stripe webhook events processed';
COMMENT ON TABLE usage_records IS 'Usage tracking for metered billing features';
