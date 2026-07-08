/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - recognition tables not in generated types yet
"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import {
  Recognition,
  RecognitionBadge,
  ManagerFeedback,
  RecognitionAnalytics,
  DEFAULT_BADGES,
  AnalyticsPeriod,
} from "@/types/recognition.types";

// Helper to get current user's organization
async function getUserOrganization() {
  const user = await unifiedGetUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const supabase = createAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role, department_id")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { error: "No organization found" };
  }

  return {
    userId: user.id,
    organizationId: userData.organization_id,
    role: userData.role,
    departmentId: userData.department_id,
  };
}

// Check manager/admin access
async function checkManagerAccess() {
  const result = await getUserOrganization();
  if ("error" in result) return result;

  if (result.role !== "admin" && result.role !== "manager") {
    return { error: "Unauthorized - requires manager or admin role" };
  }

  return result;
}

// ==================== BADGE ACTIONS ====================

export async function getRecognitionBadges(): Promise<{ success: boolean; data?: RecognitionBadge[]; error?: string }> {
  const result = await getUserOrganization();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("recognition_badges")
    .select("*")
    .eq("organization_id", result.organizationId)
    .eq("is_active", true)
    .order("name");

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data?.map((b) => ({
      id: b.id,
      organizationId: b.organization_id,
      name: b.name,
      description: b.description,
      icon: b.icon,
      category: b.category,
      points: b.points,
      color: b.color,
      isActive: b.is_active,
      isDefault: b.is_default,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    })),
  };
}

export async function initializeDefaultBadges(options?: {
  skipExistingCheck?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const result = await getUserOrganization();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = createAdminClient();

  if (!options?.skipExistingCheck) {
    const { count } = await supabase
      .from("recognition_badges")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", result.organizationId);

    if (count && count > 0) {
      return { success: true };
    }
  }

  // Create default badges
  const badges = DEFAULT_BADGES.map((b) => ({
    organization_id: result.organizationId,
    name: b.name,
    description: b.description,
    icon: b.icon,
    category: b.category,
    points: b.points,
    color: b.color,
    is_active: b.isActive,
    is_default: b.isDefault,
  }));

  const { error } = await supabase.from("recognition_badges").upsert(badges, {
    onConflict: "organization_id,name",
    ignoreDuplicates: true,
  });

  if (error) {
    console.error("Failed to initialize badges:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/recognition");
  return { success: true };
}

// ==================== RECOGNITION ACTIONS ====================

export async function getRecognitions(options?: {
  limit?: number;
  offset?: number;
  page?: number;
  userId?: string;
}): Promise<{ success: boolean; data?: Recognition[]; error?: string }> {
  const result = await getUserOrganization();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = createAdminClient();
  let query = supabase
    .from("recognitions")
    .select(`
      *,
      from_user:users!recognitions_from_user_id_fkey (id, full_name, avatar_url, role),
      to_user:users!recognitions_to_user_id_fkey (id, full_name, avatar_url, role, department_id),
      badge:recognition_badges (*)
    `)
    .eq("organization_id", result.organizationId)
    .order("created_at", { ascending: false });

  // Filter by specific user if provided
  if (options?.userId) {
    query = query.or(`from_user_id.eq.${options.userId},to_user_id.eq.${options.userId}`);
  }

  // Handle pagination - support both page and offset
  const limit = options?.limit || 20;
  if (options?.page) {
    const offset = (options.page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
  } else if (options?.offset !== undefined) {
    query = query.range(options.offset, options.offset + limit - 1);
  } else if (options?.limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  // Get reactions for each recognition
  const recognitionIds = data?.map((r) => r.id) || [];
  const { data: reactions } = await supabase
    .from("recognition_reactions")
    .select("*")
    .in("recognition_id", recognitionIds);

  const reactionsByRecognition = (reactions || []).reduce(
    (acc, r) => {
      if (!acc[r.recognition_id]) acc[r.recognition_id] = [];
      acc[r.recognition_id].push({
        id: r.id,
        recognitionId: r.recognition_id,
        userId: r.user_id,
        emoji: r.emoji,
        createdAt: r.created_at,
      });
      return acc;
    },
    {} as Record<string, Recognition["reactions"]>
  );

  const currentUserId = result.userId;

  return {
    success: true,
    data: data?.map((r) => {
      const recReactions = reactionsByRecognition[r.id] || [];
      const userReaction = recReactions.find((rx) => rx.userId === currentUserId)?.emoji;

      return {
        id: r.id,
        organizationId: r.organization_id,
        fromUserId: r.from_user_id,
        toUserId: r.to_user_id,
        badgeId: r.badge_id,
        message: r.message,
        visibility: r.visibility,
        isAnonymous: r.is_anonymous,
        pointsAwarded: r.points_awarded || 0,
        reactions: recReactions,
        reactionCount: recReactions.length,
        userReaction,
        createdAt: r.created_at,
        fromUser: r.is_anonymous
          ? undefined
          : r.from_user
            ? {
                id: r.from_user.id,
                name: r.from_user.full_name || "Unknown",
                avatarUrl: r.from_user.avatar_url,
                role: r.from_user.role,
              }
            : undefined,
        toUser: r.to_user
          ? {
              id: r.to_user.id,
              name: r.to_user.full_name || "Unknown",
              avatarUrl: r.to_user.avatar_url,
              role: r.to_user.role,
            }
          : undefined,
        badge: r.badge
          ? {
              id: r.badge.id,
              organizationId: r.badge.organization_id,
              name: r.badge.name,
              description: r.badge.description,
              icon: r.badge.icon,
              category: r.badge.category,
              points: r.badge.points,
              color: r.badge.color,
              isActive: r.badge.is_active,
              isDefault: r.badge.is_default,
              createdAt: r.badge.created_at,
              updatedAt: r.badge.updated_at,
            }
          : undefined,
      };
    }),
  };
}

export async function createRecognition(input: {
  toUserId: string;
  badgeId?: string;
  message: string;
  visibility?: "public" | "team" | "private";
  isAnonymous?: boolean;
}): Promise<{ success: boolean; data?: Recognition; error?: string }> {
  const result = await getUserOrganization();
  if ("error" in result) return { success: false, error: result.error };

  // Prevent self-recognition
  if (input.toUserId === result.userId) {
    return { success: false, error: "Cannot recognize yourself" };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("recognitions")
    .insert({
      organization_id: result.organizationId,
      from_user_id: result.userId,
      to_user_id: input.toUserId,
      badge_id: input.badgeId,
      message: input.message,
      visibility: input.visibility || "public",
      is_anonymous: input.isAnonymous || false,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/recognition");
  return {
    success: true,
    data: {
      id: data.id,
      organizationId: data.organization_id,
      fromUserId: data.from_user_id,
      toUserId: data.to_user_id,
      badgeId: data.badge_id,
      message: data.message,
      visibility: data.visibility,
      isAnonymous: data.is_anonymous,
      pointsAwarded: data.points_awarded || 0,
      reactions: [],
      reactionCount: 0,
      createdAt: data.created_at,
    },
  };
}

export async function deleteRecognition(id: string): Promise<{ success: boolean; error?: string }> {
  const result = await getUserOrganization();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("recognitions")
    .delete()
    .eq("id", id)
    .eq("organization_id", result.organizationId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/recognition");
  return { success: true };
}

export async function toggleReaction(
  recognitionId: string,
  emoji: string = "thumbsup"
): Promise<{ success: boolean; error?: string }> {
  const result = await getUserOrganization();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = createAdminClient();

  // Check if reaction exists
  const { data: existing } = await supabase
    .from("recognition_reactions")
    .select("id")
    .eq("recognition_id", recognitionId)
    .eq("user_id", result.userId)
    .single();

  if (existing) {
    // Remove reaction
    const { error } = await supabase
      .from("recognition_reactions")
      .delete()
      .eq("id", existing.id);

    if (error) {
      return { success: false, error: error.message };
    }
  } else {
    // Add reaction
    const { error } = await supabase.from("recognition_reactions").insert({
      recognition_id: recognitionId,
      user_id: result.userId,
      emoji,
    });

    if (error) {
      return { success: false, error: error.message };
    }
  }

  revalidatePath("/dashboard/recognition");
  return { success: true };
}

// ==================== MANAGER FEEDBACK ACTIONS ====================

export async function getManagerFeedback(options?: {
  toUserId?: string;
  userId?: string;
  limit?: number;
  page?: number;
  type?: string;
}): Promise<{ success: boolean; data?: ManagerFeedback[]; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = createAdminClient();
  let query = supabase
    .from("manager_feedback")
    .select(`
      *,
      from_user:users!manager_feedback_from_user_id_fkey (id, full_name, avatar_url)
    `)
    .eq("organization_id", result.organizationId)
    .order("created_at", { ascending: false });

  // Support both toUserId and userId parameter names
  const targetUserId = options?.toUserId || options?.userId;
  if (targetUserId) {
    query = query.eq("to_user_id", targetUserId);
  }

  // Filter by feedback type
  if (options?.type) {
    query = query.eq("type", options.type);
  }

  // Handle pagination
  const limit = options?.limit || 20;
  const page = options?.page || 1;
  const offset = (page - 1) * limit;

  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data?.map((f) => ({
      id: f.id,
      organizationId: f.organization_id,
      fromUserId: f.from_user_id,
      toUserId: f.to_user_id,
      type: f.type,
      subject: f.subject,
      content: f.content,
      isPrivate: f.is_private,
      linkedGoalId: f.linked_goal_id,
      createdAt: f.created_at,
      updatedAt: f.updated_at,
      fromUser: f.from_user
        ? {
            id: f.from_user.id,
            name: f.from_user.full_name || "Unknown",
            avatarUrl: f.from_user.avatar_url,
          }
        : undefined,
    })),
  };
}

export async function createManagerFeedback(input: {
  toUserId: string;
  type: "praise" | "constructive" | "goal_progress" | "check_in" | "performance";
  subject: string;
  content: string;
  isPrivate?: boolean;
  linkedGoalId?: string;
}): Promise<{ success: boolean; data?: ManagerFeedback; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("manager_feedback")
    .insert({
      organization_id: result.organizationId,
      from_user_id: result.userId,
      to_user_id: input.toUserId,
      type: input.type,
      subject: input.subject,
      content: input.content,
      is_private: input.isPrivate ?? true,
      linked_goal_id: input.linkedGoalId,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/recognition");
  return {
    success: true,
    data: {
      id: data.id,
      organizationId: data.organization_id,
      fromUserId: data.from_user_id,
      toUserId: data.to_user_id,
      type: data.type,
      subject: data.subject,
      content: data.content,
      isPrivate: data.is_private,
      linkedGoalId: data.linked_goal_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  };
}

export async function updateManagerFeedback(input: {
  id: string;
  subject?: string;
  content?: string;
  isPrivate?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = createAdminClient();

  const updateData: Record<string, unknown> = {};
  if (input.subject !== undefined) updateData.subject = input.subject;
  if (input.content !== undefined) updateData.content = input.content;
  if (input.isPrivate !== undefined) updateData.is_private = input.isPrivate;

  const { error } = await supabase
    .from("manager_feedback")
    .update(updateData)
    .eq("id", input.id)
    .eq("organization_id", result.organizationId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/recognition");
  return { success: true };
}

export async function deleteManagerFeedback(id: string): Promise<{ success: boolean; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("manager_feedback")
    .delete()
    .eq("id", id)
    .eq("organization_id", result.organizationId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/recognition");
  return { success: true };
}

// ==================== ANALYTICS ACTIONS ====================

function getPeriodDates(period: AnalyticsPeriod): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);

  switch (period) {
    case "week": {
      const dayOfWeek = now.getDay();
      const start = new Date(now);
      start.setDate(now.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case "month":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end,
      };
    case "quarter": {
      const quarter = Math.floor(now.getMonth() / 3);
      return {
        start: new Date(now.getFullYear(), quarter * 3, 1),
        end,
      };
    }
    case "year":
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end,
      };
    case "all":
    default:
      return {
        start: new Date(2000, 0, 1),
        end,
      };
  }
}

export async function getRecognitionAnalytics(
  period: AnalyticsPeriod = "month"
): Promise<{ success: boolean; data?: RecognitionAnalytics; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = createAdminClient();
  const { start, end } = getPeriodDates(period);

  // Get recognitions for the period
  const { data: recognitions, error } = await supabase
    .from("recognitions")
    .select(`
      *,
      from_user:users!recognitions_from_user_id_fkey (id, full_name),
      to_user:users!recognitions_to_user_id_fkey (id, full_name),
      badge:recognition_badges (id, name)
    `)
    .eq("organization_id", result.organizationId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  if (error) {
    return { success: false, error: error.message };
  }

  const recs = recognitions || [];

  // Calculate analytics
  const totalRecognitions = recs.length;
  const totalPoints = recs.reduce((sum, r) => sum + (r.points_awarded || 0), 0);

  // Unique givers and recipients
  const uniqueGiverIds = new Set(recs.map((r) => r.from_user_id));
  const uniqueRecipientIds = new Set(recs.map((r) => r.to_user_id));

  // Get total employee count for participation rate
  const { count: totalEmployees } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", result.organizationId)
    .eq("is_active", true);

  const allParticipants = new Set([...uniqueGiverIds, ...uniqueRecipientIds]);
  const participationRate = totalEmployees
    ? Math.round((allParticipants.size / totalEmployees) * 100)
    : 0;

  // Top givers
  const giverCounts: Record<string, { userId: string; name: string; avatarUrl?: string; count: number }> = {};
  recs.forEach((r) => {
    if (r.from_user) {
      if (!giverCounts[r.from_user_id]) {
        giverCounts[r.from_user_id] = {
          userId: r.from_user_id,
          name: r.from_user.full_name || "Unknown",
          count: 0,
        };
      }
      giverCounts[r.from_user_id].count++;
    }
  });
  const topGivers = Object.values(giverCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top recipients
  const recipientCounts: Record<string, { userId: string; name: string; avatarUrl?: string; count: number; points: number }> = {};
  recs.forEach((r) => {
    if (r.to_user) {
      if (!recipientCounts[r.to_user_id]) {
        recipientCounts[r.to_user_id] = {
          userId: r.to_user_id,
          name: r.to_user.full_name || "Unknown",
          count: 0,
          points: 0,
        };
      }
      recipientCounts[r.to_user_id].count++;
      recipientCounts[r.to_user_id].points += r.points_awarded || 0;
    }
  });
  const topRecipients = Object.values(recipientCounts)
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  // Top badges
  const badgeCounts: Record<string, { badgeId: string; name: string; icon: string; color?: string; count: number }> = {};
  recs.forEach((r) => {
    if (r.badge) {
      if (!badgeCounts[r.badge_id]) {
        badgeCounts[r.badge_id] = {
          badgeId: r.badge_id,
          name: r.badge.name || "Unknown",
          icon: r.badge.icon || "Award",
          color: r.badge.color,
          count: 0,
        };
      }
      badgeCounts[r.badge_id].count++;
    }
  });
  const topBadges = Object.values(badgeCounts).sort((a, b) => b.count - a.count);

  return {
    success: true,
    data: {
      totalRecognitions,
      totalPoints,
      uniqueGivers: uniqueGiverIds.size,
      uniqueRecipients: uniqueRecipientIds.size,
      participationRate,
      topGivers,
      topRecipients,
      topBadges,
    },
  };
}

// ==================== USER SEARCH ====================

export async function searchUsers(query: string): Promise<{
  success: boolean;
  data?: { id: string; name: string; email: string; avatarUrl?: string; role?: string }[];
  error?: string;
}> {
  const result = await getUserOrganization();
  if ("error" in result) return { success: false, error: result.error };

  if (query.length < 2) {
    return { success: true, data: [] };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, avatar_url, role")
    .eq("organization_id", result.organizationId)
    .eq("is_active", true)
    .neq("id", result.userId) // Exclude current user
    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(10);

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data?.map((u) => ({
      id: u.id,
      name: u.full_name || u.email,
      email: u.email,
      avatarUrl: u.avatar_url,
      role: u.role,
    })),
  };
}
