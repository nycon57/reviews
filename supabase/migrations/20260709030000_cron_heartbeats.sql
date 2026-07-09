-- Dead-man's-switch for the cron fleet (Grill #11.3, layer 2). Every cron
-- reports on completion; a monitor alerts when a scheduled cron goes quiet
-- (the reports cron failed silently for weeks before anyone noticed).

create table public.cron_heartbeats (
  cron_name text primary key,
  last_run_at timestamptz,
  last_success_at timestamptz,
  last_status text check (last_status in ('success', 'failure')),
  last_duration_ms integer,
  last_summary jsonb,
  consecutive_failures integer not null default 0,
  updated_at timestamptz not null default now()
);

comment on table public.cron_heartbeats is
  'One row per cron route; written by withCronHeartbeat on every run, read by the monitor-crons dead-man''s switch.';

-- Service-role only.
alter table public.cron_heartbeats enable row level security;

notify pgrst, 'reload schema';
