import { z } from "zod";

// Group type enum
export const groupTypes = ["team", "region", "segment", "custom"] as const;
export type GroupType = (typeof groupTypes)[number];

// Group member role enum
export const memberRoles = ["member", "lead"] as const;
export type MemberRole = (typeof memberRoles)[number];

// Group type display names
export const groupTypeLabels: Record<GroupType, string> = {
  team: "Team",
  region: "Region",
  segment: "Segment",
  custom: "Custom",
};

// Database row types
export interface GroupRow {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  type: string;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UserGroupRow {
  user_id: string;
  group_id: string;
  role: string;
  created_at: string;
}

// Application types
export interface Group {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  type: GroupType;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UserGroup {
  userId: string;
  groupId: string;
  role: MemberRole;
  createdAt: string;
}

export interface GroupMember {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: MemberRole;
  joinedAt: string;
}

export interface GroupWithMembers extends Group {
  members: GroupMember[];
  memberCount: number;
}

// Validation schemas
export const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
  description: z.string().max(500).optional(),
  type: z.enum(groupTypes).default("custom"),
  isActive: z.boolean().optional().default(true),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const updateGroupSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  type: z.enum(groupTypes).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const addMemberSchema = z.object({
  groupId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(memberRoles).default("member"),
});

export const updateMemberRoleSchema = z.object({
  groupId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(memberRoles),
});

export const removeMemberSchema = z.object({
  groupId: z.string().uuid(),
  userId: z.string().uuid(),
});

// Result types
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// Transform functions
export function rowToGroup(row: GroupRow): Group {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description,
    type: row.type as GroupType,
    isActive: row.is_active,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToUserGroup(row: UserGroupRow): UserGroup {
  return {
    userId: row.user_id,
    groupId: row.group_id,
    role: row.role as MemberRole,
    createdAt: row.created_at,
  };
}
