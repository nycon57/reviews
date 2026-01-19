-- Create groups and user_groups tables for flexible team/segment organization
-- Supports teams, regions, segments, and custom groupings

CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'custom',  -- 'team', 'region', 'segment', 'custom'
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',  -- additional group-specific settings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, name)
);

-- User-group membership junction table
CREATE TABLE user_groups (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',  -- 'member', 'lead'
  created_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (user_id, group_id)
);

-- Indexes for groups
CREATE INDEX idx_groups_org ON groups(organization_id);
CREATE INDEX idx_groups_type ON groups(type);
CREATE INDEX idx_groups_is_active ON groups(is_active) WHERE is_active = TRUE;

-- Indexes for user_groups
CREATE INDEX idx_user_groups_group ON user_groups(group_id);
CREATE INDEX idx_user_groups_user ON user_groups(user_id);
CREATE INDEX idx_user_groups_role ON user_groups(role);

-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groups

-- Users can view groups in their organization
CREATE POLICY "org_users_view_groups" ON groups
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

-- Admins and managers can manage groups in their organization
CREATE POLICY "org_admins_manage_groups" ON groups
  FOR ALL USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

-- RLS Policies for user_groups

-- Users can view their own group memberships
CREATE POLICY "users_view_own_memberships" ON user_groups
  FOR SELECT USING (user_id = auth.uid());

-- Users can view memberships in groups they belong to
CREATE POLICY "users_view_group_memberships" ON user_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_groups ug
      WHERE ug.user_id = auth.uid()
      AND ug.group_id = user_groups.group_id
    )
  );

-- Admins and managers can view all memberships in their org
CREATE POLICY "org_admins_view_memberships" ON user_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = user_groups.group_id
      AND g.organization_id = get_user_organization_id()
    )
    AND user_has_role(ARRAY['admin', 'manager'])
  );

-- Admins can manage memberships in their organization
CREATE POLICY "org_admins_manage_memberships" ON user_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = user_groups.group_id
      AND g.organization_id = get_user_organization_id()
    )
    AND user_has_role(ARRAY['admin'])
  )
  WITH CHECK (
    -- Verify target user belongs to the same organization as the group
    EXISTS (
      SELECT 1 FROM groups g
      JOIN users u ON u.organization_id = g.organization_id
      WHERE g.id = user_groups.group_id
      AND u.id = user_groups.user_id
      AND g.organization_id = get_user_organization_id()
    )
    AND user_has_role(ARRAY['admin'])
  );

-- Group leads can manage memberships in their groups
CREATE POLICY "group_leads_manage_memberships" ON user_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_groups ug
      WHERE ug.user_id = auth.uid()
      AND ug.group_id = user_groups.group_id
      AND ug.role = 'lead'
    )
  )
  WITH CHECK (
    -- Verify target user belongs to the same organization as the group
    EXISTS (
      SELECT 1 FROM user_groups ug
      JOIN groups g ON g.id = ug.group_id
      JOIN users u ON u.organization_id = g.organization_id
      WHERE ug.user_id = auth.uid()
      AND ug.group_id = user_groups.group_id
      AND ug.role = 'lead'
      AND u.id = user_groups.user_id
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Comments
COMMENT ON TABLE groups IS 'Flexible groupings of users for teams, regions, segments, etc.';
COMMENT ON COLUMN groups.type IS 'Group type: team, region, segment, or custom';
COMMENT ON COLUMN groups.metadata IS 'Additional group settings and configuration';
COMMENT ON TABLE user_groups IS 'Junction table for user-group membership';
COMMENT ON COLUMN user_groups.role IS 'Member role within the group: member or lead';
