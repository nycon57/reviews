-- Email assets / media library for org-scoped image reuse across templates
create table email_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  filename text not null,
  url text not null,
  content_type text not null,
  size_bytes integer not null,
  width integer,
  height integer,
  tags text[] default '{}',
  created_at timestamptz default now()
);

create index idx_email_assets_org on email_assets(organization_id, created_at desc);
alter table email_assets enable row level security;

-- RLS: org members can read their org's assets
create policy "email_assets_select"
  on email_assets for select
  using (
    organization_id in (
      select organization_id from users where id = auth.uid()
    )
  );

-- RLS: org members can insert assets for their org
create policy "email_assets_insert"
  on email_assets for insert
  with check (
    organization_id in (
      select organization_id from users where id = auth.uid()
    )
  );

-- RLS: admins or the uploader can delete
create policy "email_assets_delete"
  on email_assets for delete
  using (
    uploaded_by = auth.uid()
    or exists (
      select 1 from users
      where id = auth.uid()
        and organization_id = email_assets.organization_id
        and role in ('admin', 'owner')
    )
  );
