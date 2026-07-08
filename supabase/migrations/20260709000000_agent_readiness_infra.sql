-- Agent-readiness infrastructure (PRD US-009/US-010):
-- per-request v2 API usage logs, agent traffic logs, and a minute-window
-- rate limiter covering both the open (per-IP) and keyed (per-key) tiers.

create table public.api_usage_logs (
  id uuid primary key default gen_random_uuid(),
  api_key_id uuid references public.api_keys(id) on delete set null,
  endpoint text not null,
  method text not null,
  query_params jsonb,
  user_agent text,
  ip_address inet,
  response_status integer,
  response_time_ms integer,
  tier text not null check (tier in ('open', 'keyed')),
  created_at timestamptz not null default now()
);

create index api_usage_logs_created_idx on public.api_usage_logs (created_at desc);
create index api_usage_logs_endpoint_idx on public.api_usage_logs (endpoint, created_at desc);
create index api_usage_logs_key_idx on public.api_usage_logs (api_key_id, created_at desc)
  where api_key_id is not null;

create table public.agent_traffic_logs (
  id uuid primary key default gen_random_uuid(),
  page_path text not null,
  user_agent text,
  bot_name text not null,
  bot_category text not null check (bot_category in ('search', 'llm', 'agent', 'unknown')),
  referrer text,
  created_at timestamptz not null default now()
);

create index agent_traffic_logs_created_idx on public.agent_traffic_logs (created_at desc);
create index agent_traffic_logs_category_idx on public.agent_traffic_logs (bot_category, created_at desc);

-- Minute-window fixed counters for v2 rate limiting. bucket distinguishes
-- tiers ('v2-open' keyed by ip hash, 'v2-keyed' keyed by api key id).
create table public.rate_limit_minute_windows (
  bucket text not null,
  window_key text not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  primary key (bucket, window_key, window_start)
);

create or replace function public.check_minute_rate_limit(
  p_bucket text,
  p_window_key text,
  p_limit integer
)
returns table(is_allowed boolean, current_count integer, retry_after_seconds integer)
language plpgsql
as $$
declare
  v_window_start timestamptz := date_trunc('minute', now());
  v_count integer;
begin
  insert into public.rate_limit_minute_windows as w (bucket, window_key, window_start, request_count)
  values (p_bucket, p_window_key, v_window_start, 1)
  on conflict (bucket, window_key, window_start)
  do update set request_count = w.request_count + 1
  returning w.request_count into v_count;

  return query select
    v_count <= p_limit,
    v_count,
    greatest(0, extract(epoch from (v_window_start + interval '1 minute') - now()))::integer;
end;
$$;

-- Opportunistic cleanup helper for the cron that prunes old windows/logs.
create or replace function public.prune_rate_limit_windows()
returns void
language sql
as $$
  delete from public.rate_limit_minute_windows
  where window_start < now() - interval '10 minutes';
$$;

-- Service-role only (admin client); no anon/authenticated access.
alter table public.api_usage_logs enable row level security;
alter table public.agent_traffic_logs enable row level security;
alter table public.rate_limit_minute_windows enable row level security;

notify pgrst, 'reload schema';
