-- Seed-table integrity: the default-seeding fast path no longer runs an
-- existence check before insert, so concurrent first visits to a fresh org
-- could double-insert the default sets. Enforce uniqueness at the database
-- and let seeding upsert-ignore instead.

-- Existing duplicates in ex_survey_templates: repoint any referencing
-- surveys to the oldest row per (organization_id, name), then delete the
-- younger duplicates.
with keepers as (
  select distinct on (organization_id, name) id, organization_id, name
  from public.ex_survey_templates
  order by organization_id, name, created_at asc
),
dupes as (
  select t.id as dupe_id, k.id as keeper_id
  from public.ex_survey_templates t
  join keepers k
    on k.organization_id = t.organization_id
   and k.name = t.name
   and k.id <> t.id
)
update public.ex_surveys s
set template_id = d.keeper_id
from dupes d
where s.template_id = d.dupe_id;

delete from public.ex_survey_templates t
using public.ex_survey_templates keep
where t.organization_id = keep.organization_id
  and t.name = keep.name
  and t.created_at > keep.created_at;

create unique index if not exists recognition_badges_org_name_key
  on public.recognition_badges (organization_id, name);

create unique index if not exists ex_survey_templates_org_name_key
  on public.ex_survey_templates (organization_id, name);

create unique index if not exists report_templates_org_name_key
  on public.report_templates (organization_id, name);

notify pgrst, 'reload schema';
