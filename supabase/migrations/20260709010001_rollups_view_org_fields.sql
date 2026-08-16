-- The company-rollups endpoint returns logo_url/website_url; carry them on
-- the view so the v2 mapping doesn't regress them to null.

drop view if exists public.organization_review_rollups;

create view public.organization_review_rollups as
select
  o.id as organization_id,
  o.name,
  o.slug,
  o.industry,
  o.logo_url,
  o.website_url,
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

notify pgrst, 'reload schema';
