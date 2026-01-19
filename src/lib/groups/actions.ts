"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  createGroupSchema,
  updateGroupSchema,
  addMemberSchema,
  updateMemberRoleSchema,
  removeMemberSchema,
  rowToGroup,
  type Group,
  type GroupRow,
  type GroupWithMembers,
  type GroupMember,
  type ActionResult,
  type MemberRole,
} from "./types";

// Get user context
async function getUserContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: userData } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  return userData;
}

// Check if user has manager/admin role
async function requireManagerRole(): Promise<{
  userId: string;
  organizationId: string;
  role: string;
} | null> {
  const context = await getUserContext();

  if (!context) {
    return null;
  }

  if (!["admin", "manager"].includes(context.role)) {
    return null;
  }

  return {
    userId: context.id,
    organizationId: context.organization_id!,
    role: context.role,
  };
}

/**
 * Get all groups for the organization
 */
export async function getGroups(params?: {
  type?: string;
  isActive?: boolean;
}): Promise<ActionResult<Group[]>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createClient();

  let query = supabase
    .from("groups")
    .select("*")
    .eq("organization_id", context.organization_id!)
    .order("name");

  if (params?.type) {
    query = query.eq("type", params.type);
  }

  if (params?.isActive !== undefined) {
    query = query.eq("is_active", params.isActive);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: (data as GroupRow[]).map(rowToGroup),
  };
}

/**
 * Get a single group by ID
 */
export async function getGroup(id: string): Promise<ActionResult<Group>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", id)
    .eq("organization_id", context.organization_id!)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "Group not found" };
  }

  return { success: true, data: rowToGroup(data as GroupRow) };
}

/**
 * Get a group with its members
 */
export async function getGroupWithMembers(
  id: string
): Promise<ActionResult<GroupWithMembers>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createClient();

  // Get group
  const { data: groupData, error: groupError } = await supabase
    .from("groups")
    .select("*")
    .eq("id", id)
    .eq("organization_id", context.organization_id!)
    .single();

  if (groupError || !groupData) {
    return { success: false, error: groupError?.message || "Group not found" };
  }

  // Get members with user details
  const { data: membersData, error: membersError } = await supabase
    .from("user_groups")
    .select(
      `
      user_id,
      role,
      created_at,
      users!inner (
        id,
        full_name,
        email,
        avatar_url
      )
    `
    )
    .eq("group_id", id);

  if (membersError) {
    return { success: false, error: membersError.message };
  }

  const members: GroupMember[] = (membersData || []).map((m) => ({
    userId: m.user_id,
    fullName: (m.users as { full_name: string | null }).full_name || "",
    email: (m.users as { email: string }).email,
    avatarUrl: (m.users as { avatar_url: string | null }).avatar_url,
    role: m.role as MemberRole,
    joinedAt: m.created_at,
  }));

  const group = rowToGroup(groupData as GroupRow);

  return {
    success: true,
    data: {
      ...group,
      members,
      memberCount: members.length,
    },
  };
}

/**
 * Get groups that a user belongs to
 */
export async function getUserGroups(
  userId?: string
): Promise<ActionResult<Group[]>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Not authenticated" };
  }

  const targetUserId = userId || context.id;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_groups")
    .select(
      `
      group_id,
      role,
      groups!inner (*)
    `
    )
    .eq("user_id", targetUserId);

  if (error) {
    return { success: false, error: error.message };
  }

  const groups = (data || []).map((ug) => rowToGroup(ug.groups as GroupRow));

  return { success: true, data: groups };
}

/**
 * Create a new group
 */
export async function createGroup(
  input: unknown
): Promise<ActionResult<Group>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const parsed = createGroupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("groups")
    .insert({
      organization_id: context.organizationId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      type: parsed.data.type,
      is_active: parsed.data.isActive,
      metadata: parsed.data.metadata,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "A group with this name already exists",
      };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard/groups");

  return { success: true, data: rowToGroup(data as GroupRow) };
}

/**
 * Update a group
 */
export async function updateGroup(
  input: unknown
): Promise<ActionResult<Group>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const parsed = updateGroupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();

  // Build update object with only provided fields
  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined)
    updates.description = parsed.data.description;
  if (parsed.data.type !== undefined) updates.type = parsed.data.type;
  if (parsed.data.isActive !== undefined) updates.is_active = parsed.data.isActive;
  if (parsed.data.metadata !== undefined) updates.metadata = parsed.data.metadata;

  const { data, error } = await supabase
    .from("groups")
    .update(updates)
    .eq("id", parsed.data.id)
    .eq("organization_id", context.organizationId)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "A group with this name already exists",
      };
    }
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "Group not found" };
  }

  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard/groups");
  revalidatePath(`/dashboard/groups/${parsed.data.id}`);

  return { success: true, data: rowToGroup(data as GroupRow) };
}

/**
 * Delete a group
 */
export async function deleteGroup(id: string): Promise<ActionResult> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("groups")
    .delete()
    .eq("id", id)
    .eq("organization_id", context.organizationId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard/groups");

  return { success: true };
}

/**
 * Add a member to a group
 */
export async function addMember(input: unknown): Promise<ActionResult> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const parsed = addMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();

  // Verify group belongs to organization
  const { data: group } = await supabase
    .from("groups")
    .select("id")
    .eq("id", parsed.data.groupId)
    .eq("organization_id", context.organizationId)
    .single();

  if (!group) {
    return { success: false, error: "Group not found" };
  }

  // Verify user belongs to organization
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("id", parsed.data.userId)
    .eq("organization_id", context.organizationId)
    .single();

  if (!user) {
    return { success: false, error: "User not found in your organization" };
  }

  const { error } = await supabase.from("user_groups").insert({
    user_id: parsed.data.userId,
    group_id: parsed.data.groupId,
    role: parsed.data.role,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "User is already a member of this group" };
    }
    return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/groups/${parsed.data.groupId}`);
  revalidatePath("/dashboard/team");

  return { success: true };
}

/**
 * Update a member's role in a group
 */
export async function updateMemberRole(input: unknown): Promise<ActionResult> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const parsed = updateMemberRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();

  // Verify group belongs to organization
  const { data: group } = await supabase
    .from("groups")
    .select("id")
    .eq("id", parsed.data.groupId)
    .eq("organization_id", context.organizationId)
    .single();

  if (!group) {
    return { success: false, error: "Group not found" };
  }

  const { error } = await supabase
    .from("user_groups")
    .update({ role: parsed.data.role })
    .eq("user_id", parsed.data.userId)
    .eq("group_id", parsed.data.groupId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/groups/${parsed.data.groupId}`);

  return { success: true };
}

/**
 * Remove a member from a group
 */
export async function removeMember(input: unknown): Promise<ActionResult> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const parsed = removeMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();

  // Verify group belongs to organization
  const { data: group } = await supabase
    .from("groups")
    .select("id")
    .eq("id", parsed.data.groupId)
    .eq("organization_id", context.organizationId)
    .single();

  if (!group) {
    return { success: false, error: "Group not found" };
  }

  const { error } = await supabase
    .from("user_groups")
    .delete()
    .eq("user_id", parsed.data.userId)
    .eq("group_id", parsed.data.groupId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/groups/${parsed.data.groupId}`);
  revalidatePath("/dashboard/team");

  return { success: true };
}

/**
 * Bulk add members to a group
 */
export async function addMembers(
  groupId: string,
  userIds: string[],
  role: MemberRole = "member"
): Promise<ActionResult<{ added: number; failed: number; invalidUsers: string[] }>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  if (!userIds.length) {
    return { success: false, error: "No users provided" };
  }

  const supabase = await createClient();

  // Verify group belongs to organization
  const { data: group } = await supabase
    .from("groups")
    .select("id")
    .eq("id", groupId)
    .eq("organization_id", context.organizationId)
    .single();

  if (!group) {
    return { success: false, error: "Group not found" };
  }

  // Verify all users belong to the organization
  const { data: validUsers } = await supabase
    .from("users")
    .select("id")
    .in("id", userIds)
    .eq("organization_id", context.organizationId);

  const validUserIds = new Set((validUsers || []).map((u) => u.id));
  const invalidUserIds = userIds.filter((id) => !validUserIds.has(id));

  if (validUserIds.size === 0) {
    return { success: false, error: "No valid users found in your organization" };
  }

  // Only create memberships for valid users
  const memberships = Array.from(validUserIds).map((userId) => ({
    user_id: userId,
    group_id: groupId,
    role,
  }));

  const { data, error } = await supabase
    .from("user_groups")
    .upsert(memberships, { onConflict: "user_id,group_id" })
    .select();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/groups/${groupId}`);
  revalidatePath("/dashboard/team");

  return {
    success: true,
    data: {
      added: data?.length || 0,
      failed: invalidUserIds.length,
      invalidUsers: invalidUserIds,
    },
  };
}
