-- Share Studio hub panel findings: referrers aggregate in SQL, and the new
-- org-wide assets access pattern gets a covering index.

create or replace function public.proof_link_referrer_summary(
  p_link_id uuid,
  p_days integer default 30,
  p_limit integer default 10
)
returns table(referrer text, event_count bigint)
language sql
stable
as $$
  select coalesce(nullif(trim(e.referrer), ''), 'Direct') as referrer,
         count(*) as event_count
  from public.proof_link_events e
  where e.proof_link_id = p_link_id
    and e.created_at >= now() - make_interval(days => p_days)
  group by 1
  order by event_count desc
  limit p_limit;
$$;

create index if not exists idx_proof_assets_org_type_created
  on public.proof_assets (organization_id, asset_type, created_at desc)
  where asset_url is not null;

notify pgrst, 'reload schema';
