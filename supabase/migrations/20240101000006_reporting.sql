-- S014: Reporting & Export
-- Creates tables for report templates, scheduled reports, sharing, and export history

-- Report templates table (Monthly Performance, Team Summary, etc.)
CREATE TABLE report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL CHECK (template_type IN ('monthly_performance', 'team_summary', 'custom')),
  config JSONB DEFAULT '{}'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled reports table
CREATE TABLE scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  recipients TEXT[] NOT NULL DEFAULT '{}',
  schedule TEXT NOT NULL CHECK (schedule IN ('daily', 'weekly', 'monthly')),
  schedule_day_of_week INT CHECK (schedule_day_of_week >= 0 AND schedule_day_of_week <= 6),
  schedule_day_of_month INT CHECK (schedule_day_of_month >= 1 AND schedule_day_of_month <= 28),
  schedule_time TIME DEFAULT '09:00:00',
  filters JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report shares table (shareable links)
CREATE TABLE report_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  filters JSONB DEFAULT '{}'::jsonb,
  shared_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  access_count INT DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report exports history table
CREATE TABLE report_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  export_format TEXT NOT NULL CHECK (export_format IN ('pdf', 'csv', 'json')),
  file_name TEXT NOT NULL,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  filters JSONB DEFAULT '{}'::jsonb,
  row_count INT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_report_templates_org ON report_templates(organization_id);
CREATE INDEX idx_report_templates_type ON report_templates(template_type);
CREATE INDEX idx_scheduled_reports_org ON scheduled_reports(organization_id);
CREATE INDEX idx_scheduled_reports_next_run ON scheduled_reports(next_run_at) WHERE is_active = true;
CREATE INDEX idx_report_shares_token ON report_shares(share_token);
CREATE INDEX idx_report_shares_org ON report_shares(organization_id);
CREATE INDEX idx_report_exports_org ON report_exports(organization_id);

-- Enable RLS
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_exports ENABLE ROW LEVEL SECURITY;

-- RLS policies for report_templates
CREATE POLICY "Users can view templates in their org"
  ON report_templates FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Managers can create templates"
  ON report_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('manager', 'admin')
    )
  );

CREATE POLICY "Managers can update templates"
  ON report_templates FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('manager', 'admin')
    )
  );

CREATE POLICY "Managers can delete templates"
  ON report_templates FOR DELETE
  TO authenticated
  USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('manager', 'admin')
    )
  );

-- RLS policies for scheduled_reports
CREATE POLICY "Users can view scheduled reports in their org"
  ON scheduled_reports FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Managers can manage scheduled reports"
  ON scheduled_reports FOR ALL
  TO authenticated
  USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('manager', 'admin')
    )
  );

-- RLS policies for report_shares
CREATE POLICY "Users can view shares in their org"
  ON report_shares FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Managers can manage shares"
  ON report_shares FOR ALL
  TO authenticated
  USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('manager', 'admin')
    )
  );

-- RLS policies for report_exports
CREATE POLICY "Users can view exports in their org"
  ON report_exports FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create exports"
  ON report_exports FOR INSERT
  TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_report_template_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER report_templates_updated_at
  BEFORE UPDATE ON report_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_report_template_timestamp();

CREATE TRIGGER scheduled_reports_updated_at
  BEFORE UPDATE ON scheduled_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_report_template_timestamp();

-- Insert default report templates (will be created per org when needed)
-- These will serve as seed data for new organizations

COMMENT ON TABLE report_templates IS 'Stores report template definitions for generating reports';
COMMENT ON TABLE scheduled_reports IS 'Stores scheduled report jobs for automated delivery';
COMMENT ON TABLE report_shares IS 'Stores shareable report links with expiration';
COMMENT ON TABLE report_exports IS 'Tracks report export history for auditing';
