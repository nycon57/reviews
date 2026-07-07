-- Allow all authenticated users in an organization to VIEW billing info
-- This enables the user billing settings page to display subscription status
-- Write operations remain admin-only

-- Subscriptions: All org members can view subscription status
CREATE POLICY "users_view_subscriptions" ON subscriptions
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

-- Invoices: All org members can view invoice history
CREATE POLICY "users_view_invoices" ON invoices
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

-- Subscription items: All org members can view subscription items
CREATE POLICY "users_view_subscription_items" ON subscription_items
  FOR SELECT USING (
    subscription_id IN (
      SELECT id FROM subscriptions WHERE organization_id = get_user_organization_id()
    )
  );

-- Usage records: All org members can view usage
CREATE POLICY "users_view_usage_records" ON usage_records
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

-- Note: payment_methods and billing_events remain admin-only for security
-- These contain sensitive payment details that shouldn't be broadly visible

-- Comments
COMMENT ON POLICY "users_view_subscriptions" ON subscriptions IS 'Allows all org members to view subscription status for billing settings page';
COMMENT ON POLICY "users_view_invoices" ON invoices IS 'Allows all org members to view invoice history';
COMMENT ON POLICY "users_view_subscription_items" ON subscription_items IS 'Allows all org members to view subscription line items';
COMMENT ON POLICY "users_view_usage_records" ON usage_records IS 'Allows all org members to view usage metrics';
