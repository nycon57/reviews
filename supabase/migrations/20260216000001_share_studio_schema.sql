-- Share Studio Consolidation Schema
-- Unified model for Smart Links, Images, and Videos.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- --------------------------------------------------------------------------
-- Enums
-- --------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'proof_source_type') THEN
    CREATE TYPE proof_source_type AS ENUM (
      'review',
      'video_testimonial',
      'manual_json'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'proof_status') THEN
    CREATE TYPE proof_status AS ENUM (
      'draft',
      'ready',
      'pending_approval',
      'approved',
      'rejected',
      'archived'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'proof_edit_classification') THEN
    CREATE TYPE proof_edit_classification AS ENUM (
      'minor',
      'material',
      'blocked'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'proof_asset_type') THEN
    CREATE TYPE proof_asset_type AS ENUM (
      'smart_link_og',
      'image',
      'video'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'proof_job_status') THEN
    CREATE TYPE proof_job_status AS ENUM (
      'queued',
      'processing',
      'completed',
      'failed',
      'canceled'
    );
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- Core tables
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS proof_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  source_type proof_source_type NOT NULL,
  source_id UUID,
  source_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  title TEXT,
  summary TEXT,
  quote TEXT,
  customer_name TEXT,
  rating INTEGER,
  source_platform TEXT,
  source_review_date TIMESTAMPTZ,
  custom_payload JSONB,
  status proof_status NOT NULL DEFAULT 'draft',
  approval_required BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proof_item_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proof_item_id UUID NOT NULL REFERENCES proof_items(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  edited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  original_content JSONB NOT NULL,
  edited_content JSONB NOT NULL,
  diff_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  lexical_delta_percent NUMERIC(5,2),
  classification proof_edit_classification NOT NULL,
  classification_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proof_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  dsl JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proof_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES proof_templates(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  dsl JSONB NOT NULL,
  change_note TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (template_id, version)
);

CREATE TABLE IF NOT EXISTS proof_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proof_item_id UUID NOT NULL REFERENCES proof_items(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_type proof_asset_type NOT NULL,
  template_id UUID REFERENCES proof_templates(id) ON DELETE SET NULL,
  template_version_id UUID REFERENCES proof_template_versions(id) ON DELETE SET NULL,
  storage_path TEXT,
  asset_url TEXT,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  duration_seconds NUMERIC,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proof_render_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  proof_item_id UUID NOT NULL REFERENCES proof_items(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  asset_type proof_asset_type NOT NULL,
  template_id UUID REFERENCES proof_templates(id) ON DELETE SET NULL,
  template_version_id UUID REFERENCES proof_template_versions(id) ON DELETE SET NULL,
  status proof_job_status NOT NULL DEFAULT 'queued',
  priority INTEGER NOT NULL DEFAULT 0,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_asset_id UUID REFERENCES proof_assets(id) ON DELETE SET NULL,
  error_message TEXT,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proof_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  proof_item_id UUID NOT NULL REFERENCES proof_items(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  destination_url TEXT,
  og_asset_id UUID REFERENCES proof_assets(id) ON DELETE SET NULL,
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proof_link_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proof_link_id UUID NOT NULL REFERENCES proof_links(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click')),
  request_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- Indexes
-- --------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_proof_items_org_status ON proof_items(organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proof_items_source ON proof_items(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_proof_item_edits_item_created ON proof_item_edits(proof_item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proof_templates_org_active ON proof_templates(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_proof_assets_item_type ON proof_assets(proof_item_id, asset_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proof_render_jobs_status_priority ON proof_render_jobs(status, priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_proof_render_jobs_item ON proof_render_jobs(proof_item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proof_links_org_published ON proof_links(organization_id, published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proof_link_events_link_created ON proof_link_events(proof_link_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proof_link_events_org_created ON proof_link_events(organization_id, created_at DESC);

-- --------------------------------------------------------------------------
-- Updated_at triggers
-- --------------------------------------------------------------------------

DROP TRIGGER IF EXISTS update_proof_items_updated_at ON proof_items;
CREATE TRIGGER update_proof_items_updated_at
  BEFORE UPDATE ON proof_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_proof_templates_updated_at ON proof_templates;
CREATE TRIGGER update_proof_templates_updated_at
  BEFORE UPDATE ON proof_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_proof_assets_updated_at ON proof_assets;
CREATE TRIGGER update_proof_assets_updated_at
  BEFORE UPDATE ON proof_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_proof_render_jobs_updated_at ON proof_render_jobs;
CREATE TRIGGER update_proof_render_jobs_updated_at
  BEFORE UPDATE ON proof_render_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_proof_links_updated_at ON proof_links;
CREATE TRIGGER update_proof_links_updated_at
  BEFORE UPDATE ON proof_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- --------------------------------------------------------------------------
-- RLS
-- --------------------------------------------------------------------------

ALTER TABLE proof_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE proof_item_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE proof_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE proof_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE proof_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE proof_render_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE proof_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE proof_link_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view proof_items"
  ON proof_items FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins and managers can manage proof_items"
  ON proof_items FOR ALL TO authenticated
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  )
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

CREATE POLICY "Org members can view proof_item_edits"
  ON proof_item_edits FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins and managers can manage proof_item_edits"
  ON proof_item_edits FOR ALL TO authenticated
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  )
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

CREATE POLICY "Org members can view proof_templates"
  ON proof_templates FOR SELECT TO authenticated
  USING (
    is_system = true
    OR organization_id IS NULL
    OR organization_id = get_user_organization_id()
  );

CREATE POLICY "Admins and managers can manage proof_templates"
  ON proof_templates FOR ALL TO authenticated
  USING (
    (organization_id = get_user_organization_id() OR organization_id IS NULL)
    AND user_has_role(ARRAY['admin', 'manager'])
  )
  WITH CHECK (
    (organization_id = get_user_organization_id() OR organization_id IS NULL)
    AND user_has_role(ARRAY['admin', 'manager'])
  );

CREATE POLICY "Org members can view proof_template_versions"
  ON proof_template_versions FOR SELECT TO authenticated
  USING (
    organization_id IS NULL OR organization_id = get_user_organization_id()
  );

CREATE POLICY "Admins and managers can manage proof_template_versions"
  ON proof_template_versions FOR ALL TO authenticated
  USING (
    (organization_id IS NULL OR organization_id = get_user_organization_id())
    AND user_has_role(ARRAY['admin', 'manager'])
  )
  WITH CHECK (
    (organization_id IS NULL OR organization_id = get_user_organization_id())
    AND user_has_role(ARRAY['admin', 'manager'])
  );

CREATE POLICY "Org members can view proof_assets"
  ON proof_assets FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins and managers can manage proof_assets"
  ON proof_assets FOR ALL TO authenticated
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  )
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

CREATE POLICY "Org members can view proof_render_jobs"
  ON proof_render_jobs FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins and managers can manage proof_render_jobs"
  ON proof_render_jobs FOR ALL TO authenticated
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  )
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

CREATE POLICY "Org members can view proof_links"
  ON proof_links FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins and managers can manage proof_links"
  ON proof_links FOR ALL TO authenticated
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  )
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

CREATE POLICY "Org members can view proof_link_events"
  ON proof_link_events FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Service role can manage proof_link_events"
  ON proof_link_events FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can insert view/click proof_link_events"
  ON proof_link_events FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- --------------------------------------------------------------------------
-- Storage bucket + policies
-- --------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'share-studio',
  'share-studio',
  true,
  209715200,
  ARRAY['image/png', 'image/webp', 'image/jpeg', 'video/mp4', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 209715200,
  allowed_mime_types = ARRAY['image/png', 'image/webp', 'image/jpeg', 'video/mp4', 'image/svg+xml']::text[];

DROP POLICY IF EXISTS "Org members can upload share studio assets" ON storage.objects;
CREATE POLICY "Org members can upload share studio assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'share-studio'
  AND EXISTS (
    SELECT 1
    FROM users u
    WHERE u.id = get_current_user_id()
      AND u.organization_id::text = (storage.foldername(name))[2]
      AND u.role IN ('admin', 'manager')
  )
);

DROP POLICY IF EXISTS "Org members can update share studio assets" ON storage.objects;
CREATE POLICY "Org members can update share studio assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'share-studio'
  AND EXISTS (
    SELECT 1
    FROM users u
    WHERE u.id = get_current_user_id()
      AND u.organization_id::text = (storage.foldername(name))[2]
      AND u.role IN ('admin', 'manager')
  )
)
WITH CHECK (
  bucket_id = 'share-studio'
  AND EXISTS (
    SELECT 1
    FROM users u
    WHERE u.id = get_current_user_id()
      AND u.organization_id::text = (storage.foldername(name))[2]
      AND u.role IN ('admin', 'manager')
  )
);

DROP POLICY IF EXISTS "Org members can delete share studio assets" ON storage.objects;
CREATE POLICY "Org members can delete share studio assets"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'share-studio'
  AND EXISTS (
    SELECT 1
    FROM users u
    WHERE u.id = get_current_user_id()
      AND u.organization_id::text = (storage.foldername(name))[2]
      AND u.role IN ('admin', 'manager')
  )
);

DROP POLICY IF EXISTS "Share studio assets are publicly readable" ON storage.objects;
CREATE POLICY "Share studio assets are publicly readable"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'share-studio');

-- --------------------------------------------------------------------------
-- Seed default system template
-- --------------------------------------------------------------------------

INSERT INTO proof_templates (
  organization_id,
  name,
  description,
  category,
  dsl,
  is_system,
  is_active
)
SELECT
  NULL,
  'Share Studio Classic',
  'Default system template for Smart Links, images, and videos',
  'general',
  jsonb_build_object(
    'version', 1,
    'canvas', jsonb_build_object('width', 1200, 'height', 630),
    'layers', jsonb_build_array(
      jsonb_build_object(
        'id', 'bg',
        'type', 'shape',
        'x', 0,
        'y', 0,
        'width', 1,
        'height', 1,
        'fill', jsonb_build_object('token', 'primaryColor')
      ),
      jsonb_build_object(
        'id', 'quote',
        'type', 'text',
        'x', 0.1,
        'y', 0.25,
        'width', 0.8,
        'height', 0.4,
        'binding', 'quote',
        'fontFamilyToken', 'fontFamily',
        'colorToken', 'textColor',
        'motion', jsonb_build_object('preset', 'fade-up', 'durationMs', 450)
      )
    )
  ),
  true,
  true
WHERE NOT EXISTS (
  SELECT 1
  FROM proof_templates
  WHERE is_system = true
    AND name = 'Share Studio Classic'
);

COMMENT ON TABLE proof_items IS 'Unified shareable proof items for Smart Links, images, and videos';
COMMENT ON TABLE proof_links IS 'Public Smart Links bound to proof items';
COMMENT ON TABLE proof_render_jobs IS 'Asynchronous render jobs for image/video/OG assets';
