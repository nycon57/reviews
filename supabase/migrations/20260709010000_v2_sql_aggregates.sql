-- Push the v2 API's fetch-then-reduce-in-JS work into Postgres (panel
-- findings: silent truncation past PostgREST row caps at scale).

-- Computed column: professional has at least one live review — joins into
-- the same filter stack as is_public_professional (same pattern).
create or replace function public.has_published_review(u public.users)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.reviews r
    where r.user_id = u.id
      and r.is_published = true
      and r.status = 'approved'
  );
$$;

-- Org rollups aggregated in SQL (PostgREST can order/range/count a view).
create or replace view public.organization_review_rollups as
select
  o.id as organization_id,
  o.name,
  o.slug,
  o.industry,
  coalesce(pu.professional_count, 0) as professional_count,
  coalesce(rv.published_reviews, 0) as published_reviews,
  rv.average_rating
from public.organizations o
left join (
  select organization_id, count(*) as professional_count
  from public.users
  where is_active
  group by 1
) pu on pu.organization_id = o.id
left join (
  select organization_id,
         count(*) as published_reviews,
         round(avg(rating)::numeric, 2) as average_rating
  from public.reviews
  where is_published = true and status = 'approved'
  group by 1
) rv on rv.organization_id = o.id;

-- Dashboard aggregates in one round trip each.
create or replace function public.agent_traffic_summary(p_days integer default 30)
returns jsonb
language sql
stable
as $$
  with base as (
    select bot_category, bot_name, page_path, created_at
    from public.agent_traffic_logs
    where created_at >= now() - make_interval(days => p_days)
  )
  select jsonb_build_object(
    'daily', (select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
        select date_trunc('day', created_at)::date as day, bot_category, count(*)::int as visits
        from base group by 1, 2 order by 1) t),
    'top_bots', (select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
        select bot_name, count(*)::int as visits from base group by 1 order by 2 desc limit 10) t),
    'top_pages', (select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
        select page_path, count(*)::int as visits from base group by 1 order by 2 desc limit 10) t),
    'category_totals', (select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
        select bot_category, count(*)::int as visits from base group by 1 order by 2 desc) t),
    'total_visits', (select count(*)::int from base)
  );
$$;

create or replace function public.api_usage_summary(p_days integer default 30)
returns jsonb
language sql
stable
as $$
  with base as (
    select endpoint, tier, api_key_id, response_status, response_time_ms, created_at
    from public.api_usage_logs
    where created_at >= now() - make_interval(days => p_days)
  )
  select jsonb_build_object(
    'daily', (select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
        select date_trunc('day', created_at)::date as day, tier, count(*)::int as requests
        from base group by 1, 2 order by 1) t),
    'top_endpoints', (select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
        select endpoint, count(*)::int as requests,
               round(avg(response_time_ms))::int as avg_response_ms
        from base group by 1 order by 2 desc limit 10) t),
    'by_key', (select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
        select api_key_id, count(*)::int as requests
        from base where api_key_id is not null group by 1 order by 2 desc limit 10) t),
    'totals', (select row_to_json(t)::jsonb from (
        select count(*)::int as total_requests,
               (count(*) filter (where response_status >= 400))::int as error_count,
               round(avg(response_time_ms))::int as avg_response_ms,
               (count(distinct api_key_id) filter (where api_key_id is not null))::int as distinct_keys
        from base) t)
  );
$$;

notify pgrst, 'reload schema';
