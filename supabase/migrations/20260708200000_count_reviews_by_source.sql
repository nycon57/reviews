-- Grouped count for the reviews-by-source analytics chart.
-- Replaces a full row scan (select source ... then tally in JS) with a
-- database-side GROUP BY. Filters on is_published — the canonical
-- live-review signal after the publish inversion.

create or replace function public.count_reviews_by_source(
  org_id uuid,
  start_date timestamptz default null,
  end_date timestamptz default null
)
returns table(source text, review_count bigint)
language sql
stable
as $$
  select coalesce(nullif(trim(r.source), ''), 'unknown') as source,
         count(*) as review_count
  from public.reviews r
  where r.organization_id = org_id
    and r.is_published = true
    and (start_date is null or r.review_date >= start_date)
    and (end_date is null or r.review_date <= end_date)
  group by 1
  order by review_count desc;
$$;

comment on function public.count_reviews_by_source(uuid, timestamptz, timestamptz) is
  'Live (is_published) review counts grouped by source for one organization, optional review_date window.';

notify pgrst, 'reload schema';
