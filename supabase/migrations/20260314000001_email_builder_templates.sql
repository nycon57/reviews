-- Email Builder: custom email templates with drag-and-drop document model
create table if not exists email_templates_custom (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  name text not null,
  description text,
  category text not null default 'custom',
  document jsonb not null,
  subject text not null,
  preview_text text,
  html_cache text,
  thumbnail_url text,
  is_starter boolean default false,
  is_default boolean default false,
  version integer default 1,
  merge_fields text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint unique_org_template_name unique (organization_id, name)
);

-- Indexes
create index if not exists idx_ect_org on email_templates_custom(organization_id);
create index if not exists idx_ect_category on email_templates_custom(organization_id, category);

-- RLS
alter table email_templates_custom enable row level security;

-- Org members can read templates in their org
create policy "org_members_read_templates" on email_templates_custom
  for select
  using (
    organization_id in (
      select organization_id from users where id = auth.uid()
    )
  );

-- Org admins can insert/update/delete templates
create policy "org_admins_manage_templates" on email_templates_custom
  for all
  using (
    organization_id in (
      select organization_id from users where id = auth.uid() and role in ('admin', 'manager')
    )
  )
  with check (
    organization_id in (
      select organization_id from users where id = auth.uid() and role in ('admin', 'manager')
    )
  );

-- Individual users can manage their own templates
create policy "individual_own_templates" on email_templates_custom
  for all
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- Updated_at trigger
create or replace function update_email_template_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger email_template_updated
  before update on email_templates_custom
  for each row
  execute function update_email_template_timestamp();
