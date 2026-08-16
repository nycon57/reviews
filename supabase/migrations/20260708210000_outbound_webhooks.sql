-- Outbound webhook delivery system (Zapier build, Grill #7).
-- The existing webhook_configs/webhook_logs tables are the INBOUND receiver
-- (external systems trigger surveys); these two tables model the opposite
-- direction: org-registered endpoints we deliver events TO, plus the
-- delivery-attempt queue processed by the process-webhook-deliveries cron.

create table public.webhook_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  target_url text not null,
  secret text not null,
  events text[] not null default '{}',
  description text,
  source text not null default 'dashboard' check (source in ('dashboard', 'api', 'zapier')),
  api_key_id uuid references public.api_keys(id) on delete set null,
  is_active boolean not null default true,
  last_delivery_at timestamptz,
  failure_count integer not null default 0,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index webhook_subscriptions_org_active_idx
  on public.webhook_subscriptions (organization_id)
  where is_active;

comment on table public.webhook_subscriptions is
  'Org-registered outbound webhook endpoints (dashboard, API, or Zapier REST hooks). secret signs payloads via X-RepWell-Signature.';

create table public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  subscription_id uuid not null references public.webhook_subscriptions(id) on delete cascade,
  event_type text not null,
  event_id uuid not null default gen_random_uuid(),
  payload jsonb not null,
  status text not null default 'pending'
    check (status in ('pending', 'delivering', 'delivered', 'failed', 'dead')),
  attempt_count integer not null default 0,
  max_attempts integer not null default 5,
  scheduled_at timestamptz not null default now(),
  last_attempt_at timestamptz,
  delivered_at timestamptz,
  response_status integer,
  error_message text,
  created_at timestamptz not null default now()
);

create index webhook_deliveries_pending_idx
  on public.webhook_deliveries (scheduled_at)
  where status = 'pending';

create index webhook_deliveries_subscription_idx
  on public.webhook_deliveries (subscription_id, created_at desc);

comment on table public.webhook_deliveries is
  'Outbound delivery attempts; event_id is the idempotency key delivered in the payload envelope.';

-- Fail-closed: RLS enabled with no policies — only the service-role admin
-- client (used by all server actions and the cron) can touch these tables.
alter table public.webhook_subscriptions enable row level security;
alter table public.webhook_deliveries enable row level security;

notify pgrst, 'reload schema';
