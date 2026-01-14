/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - ex_surveys tables not in generated types yet
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  EXSurveyTemplate,
  EXSurvey,
  EXSurveyResponse,
  EXActionPlan,
  Department,
  DEFAULT_EX_TEMPLATES,
  EXSurveyType,
} from "@/types/ex-survey.types";

// Helper to get current user's organization
async function getUserOrganization() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { error: "No organization found" };
  }

  return { userId: user.id, organizationId: userData.organization_id, role: userData.role };
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

// ==================== DEPARTMENT ACTIONS ====================

export async function getDepartments(): Promise<{ success: boolean; data?: Department[]; error?: string }> {
  const result = await getUserOrganization();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("organization_id", result.organizationId)
    .order("name");

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data?.map((d) => ({
      id: d.id,
      organizationId: d.organization_id,
      name: d.name,
      slug: d.slug,
      description: d.description,
      parentId: d.parent_id,
      managerUserId: d.manager_user_id,
      settings: d.settings,
      isActive: d.is_active,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    })),
  };
}

export async function createDepartment(input: {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  managerUserId?: string;
}): Promise<{ success: boolean; data?: Department; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("departments")
    .insert({
      organization_id: result.organizationId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      parent_id: input.parentId,
      manager_user_id: input.managerUserId,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/ex-surveys");
  return {
    success: true,
    data: {
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      parentId: data.parent_id,
      managerUserId: data.manager_user_id,
      settings: data.settings,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  };
}

// ==================== TEMPLATE ACTIONS ====================

export async function getEXSurveyTemplates(): Promise<{ success: boolean; data?: EXSurveyTemplate[]; error?: string }> {
  const result = await getUserOrganization();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ex_survey_templates")
    .select("*")
    .eq("organization_id", result.organizationId)
    .eq("is_active", true)
    .order("name");

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data?.map((t) => ({
      id: t.id,
      organizationId: t.organization_id,
      name: t.name,
      description: t.description,
      surveyType: t.survey_type,
      frequency: t.frequency,
      isAnonymous: t.is_anonymous,
      isDefault: t.is_default,
      isActive: t.is_active,
      questions: t.questions || [],
      branding: t.branding,
      thankYouConfig: t.thank_you_config,
      targetDepartments: t.target_departments,
      targetRoles: t.target_roles,
      notificationSettings: t.notification_settings,
      benchmarkCategory: t.benchmark_category,
      createdBy: t.created_by,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      estimatedTimeMinutes: Math.ceil((t.questions?.length || 0) * 0.5 + 1),
    })),
  };
}

export async function initializeDefaultEXTemplates(): Promise<{ success: boolean; error?: string }> {
  const result = await getUserOrganization();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = await createClient();

  // Check if templates already exist
  const { count } = await supabase
    .from("ex_survey_templates")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", result.organizationId);

  if (count && count > 0) {
    return { success: true };
  }

  // Create default templates
  const templates = Object.values(DEFAULT_EX_TEMPLATES).map((t) => ({
    organization_id: result.organizationId,
    name: t.name,
    description: t.description,
    survey_type: t.surveyType,
    frequency: t.frequency,
    is_anonymous: true,
    is_default: true,
    is_active: true,
    questions: t.questions,
    branding: {},
    thank_you_config: {
      title: "Thank You!",
      message: "Your feedback has been submitted successfully.",
    },
  }));

  const { error } = await supabase.from("ex_survey_templates").insert(templates);

  if (error) {
    console.error("Failed to initialize EX templates:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/ex-surveys");
  return { success: true };
}

// ==================== SURVEY CAMPAIGN ACTIONS ====================

export async function getEXSurveys(): Promise<{ success: boolean; data?: (EXSurvey & { template?: { name: string } })[]; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ex_surveys")
    .select(`
      *,
      ex_survey_templates (name)
    `)
    .eq("organization_id", result.organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data?.map((s) => ({
      id: s.id,
      organizationId: s.organization_id,
      templateId: s.template_id,
      name: s.name,
      description: s.description,
      surveyType: s.survey_type,
      isAnonymous: s.is_anonymous,
      status: s.status,
      targetDepartments: s.target_departments,
      targetRoles: s.target_roles,
      startDate: s.start_date,
      endDate: s.end_date,
      reminderSchedule: s.reminder_schedule,
      totalInvites: s.total_invites || 0,
      totalResponses: s.total_responses || 0,
      responseRate: s.response_rate || 0,
      enpsScore: s.enps_score,
      averageRating: s.average_rating,
      createdBy: s.created_by,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
      template: s.ex_survey_templates,
    })),
  };
}

export async function createEXSurvey(input: {
  templateId: string;
  name: string;
  description?: string;
  surveyType: EXSurveyType;
  isAnonymous?: boolean;
  targetDepartmentId?: string;
  endDate?: string;
}): Promise<{ success: boolean; data?: EXSurvey; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ex_surveys")
    .insert({
      organization_id: result.organizationId,
      template_id: input.templateId,
      name: input.name,
      description: input.description,
      survey_type: input.surveyType,
      is_anonymous: input.isAnonymous ?? true,
      status: "draft",
      target_departments: input.targetDepartmentId ? [input.targetDepartmentId] : [],
      end_date: input.endDate,
      created_by: result.userId,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/ex-surveys");
  return {
    success: true,
    data: {
      id: data.id,
      organizationId: data.organization_id,
      templateId: data.template_id,
      name: data.name,
      description: data.description,
      surveyType: data.survey_type,
      isAnonymous: data.is_anonymous,
      status: data.status,
      targetDepartments: data.target_departments,
      targetRoles: data.target_roles,
      startDate: data.start_date,
      endDate: data.end_date,
      totalInvites: 0,
      totalResponses: 0,
      responseRate: 0,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  };
}

export async function launchEXSurvey(surveyId: string): Promise<{ success: boolean; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = await createClient();

  // Get survey details
  const { data: survey, error: surveyError } = await supabase
    .from("ex_surveys")
    .select("*")
    .eq("id", surveyId)
    .eq("organization_id", result.organizationId)
    .single();

  if (surveyError || !survey) {
    return { success: false, error: "Survey not found" };
  }

  if (survey.status !== "draft") {
    return { success: false, error: "Survey must be in draft status to launch" };
  }

  // Get users to invite
  let query = supabase
    .from("users")
    .select("id, department_id")
    .eq("organization_id", result.organizationId)
    .eq("is_active", true);

  if (survey.target_departments && survey.target_departments.length > 0) {
    query = query.in("department_id", survey.target_departments);
  }

  const { data: users, error: usersError } = await query;

  if (usersError) {
    return { success: false, error: "Failed to get users" };
  }

  if (!users || users.length === 0) {
    return { success: false, error: "No users to invite" };
  }

  // Create invitations
  const invitations = users.map((u) => ({
    survey_id: surveyId,
    user_id: u.id,
    department_id: u.department_id,
  }));

  const { error: inviteError } = await supabase.from("ex_survey_invitations").insert(invitations);

  if (inviteError) {
    console.error("Failed to create invitations:", inviteError);
    return { success: false, error: "Failed to create invitations" };
  }

  // Update survey status
  const { error: updateError } = await supabase
    .from("ex_surveys")
    .update({
      status: "active",
      start_date: new Date().toISOString(),
      total_invites: users.length,
    })
    .eq("id", surveyId);

  if (updateError) {
    return { success: false, error: "Failed to update survey status" };
  }

  revalidatePath("/dashboard/ex-surveys");
  return { success: true };
}

export async function closeEXSurvey(surveyId: string): Promise<{ success: boolean; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("ex_surveys")
    .update({ status: "closed" })
    .eq("id", surveyId)
    .eq("organization_id", result.organizationId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/ex-surveys");
  return { success: true };
}

// ==================== RESPONSE ACTIONS ====================

export async function getEXSurveyResponses(surveyId: string): Promise<{ success: boolean; data?: EXSurveyResponse[]; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = await createClient();

  // Verify survey belongs to organization
  const { data: survey } = await supabase
    .from("ex_surveys")
    .select("organization_id")
    .eq("id", surveyId)
    .single();

  if (!survey || survey.organization_id !== result.organizationId) {
    return { success: false, error: "Survey not found" };
  }

  const { data, error } = await supabase
    .from("ex_survey_responses")
    .select("*")
    .eq("survey_id", surveyId)
    .order("submitted_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data?.map((r) => ({
      id: r.id,
      surveyId: r.survey_id,
      invitationId: r.invitation_id,
      departmentId: r.department_id,
      tenureRange: r.tenure_range,
      roleCategory: r.role_category,
      isAnonymous: r.is_anonymous,
      answers: r.answers,
      enpsScore: r.enps_score,
      overallRating: r.overall_rating,
      sentimentScore: r.sentiment_score,
      sentimentLabel: r.sentiment_label,
      themes: r.themes,
      keyPhrases: r.key_phrases,
      aiSummary: r.ai_summary,
      submittedAt: r.submitted_at,
      createdAt: r.created_at,
    })),
  };
}

// ==================== METRICS ACTIONS ====================

// Trend data point for charts
export interface TrendDataPoint {
  date: string;
  enpsScore?: number;
  engagementScore?: number;
  responseRate?: number;
  totalResponses: number;
  surveyName?: string;
  surveyType?: string;
}

export async function getEXTrends(limit: number = 12): Promise<{ success: boolean; data?: TrendDataPoint[]; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = await createClient();

  // Get completed surveys ordered by close/start date
  const { data: surveys, error } = await supabase
    .from("ex_surveys")
    .select("id, name, survey_type, status, start_date, end_date, enps_score, average_rating, response_rate, total_responses, created_at")
    .eq("organization_id", result.organizationId)
    .in("status", ["active", "closed"])
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    return { success: false, error: error.message };
  }

  const trendData: TrendDataPoint[] = (surveys || []).map((s) => ({
    date: s.end_date || s.start_date || s.created_at,
    enpsScore: s.enps_score,
    engagementScore: s.average_rating ? Math.round(s.average_rating * 20) : undefined,
    responseRate: s.response_rate,
    totalResponses: s.total_responses || 0,
    surveyName: s.name,
    surveyType: s.survey_type,
  }));

  return { success: true, data: trendData };
}

export async function getEXMetrics(): Promise<{ success: boolean; data?: { enpsScore?: number; engagementScore?: number; responseRate?: number; totalResponses: number }; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = await createClient();

  // Get recent survey data
  const { data: surveys } = await supabase
    .from("ex_surveys")
    .select("enps_score, average_rating, response_rate, total_responses")
    .eq("organization_id", result.organizationId)
    .in("status", ["active", "closed"])
    .order("created_at", { ascending: false })
    .limit(10);

  if (!surveys || surveys.length === 0) {
    return { success: true, data: { totalResponses: 0 } };
  }

  const enpsScores = surveys.filter((s) => s.enps_score != null).map((s) => s.enps_score);
  const avgEnps = enpsScores.length > 0 ? Math.round(enpsScores.reduce((a, b) => a + b, 0) / enpsScores.length) : undefined;

  const ratings = surveys.filter((s) => s.average_rating != null).map((s) => s.average_rating);
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : undefined;

  const responseRates = surveys.filter((s) => s.response_rate != null).map((s) => s.response_rate);
  const avgResponseRate = responseRates.length > 0 ? responseRates.reduce((a, b) => a + b, 0) / responseRates.length : undefined;

  const totalResponses = surveys.reduce((sum, s) => sum + (s.total_responses || 0), 0);

  return {
    success: true,
    data: {
      enpsScore: avgEnps,
      engagementScore: avgRating ? avgRating * 20 : undefined, // Convert 5-point scale to 100
      responseRate: avgResponseRate,
      totalResponses,
    },
  };
}

// ==================== ACTION PLAN ACTIONS ====================

export async function getActionPlans(): Promise<{ success: boolean; data?: EXActionPlan[]; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ex_action_plans")
    .select("*")
    .eq("organization_id", result.organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data?.map((p) => ({
      id: p.id,
      organizationId: p.organization_id,
      surveyId: p.survey_id,
      departmentId: p.department_id,
      title: p.title,
      description: p.description,
      theme: p.theme,
      priority: p.priority,
      status: p.status,
      ownerUserId: p.owner_user_id,
      targetDate: p.target_date,
      completedDate: p.completed_date,
      successMetrics: p.success_metrics,
      notes: p.notes,
      createdBy: p.created_by,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    })),
  };
}

export async function createActionPlan(input: {
  surveyId?: string;
  departmentId?: string;
  title: string;
  description?: string;
  theme: string;
  priority?: "low" | "medium" | "high" | "critical";
  ownerUserId?: string;
  targetDate?: string;
  notes?: string;
}): Promise<{ success: boolean; data?: EXActionPlan; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ex_action_plans")
    .insert({
      organization_id: result.organizationId,
      survey_id: input.surveyId,
      department_id: input.departmentId,
      title: input.title,
      description: input.description,
      theme: input.theme,
      priority: input.priority || "medium",
      owner_user_id: input.ownerUserId,
      target_date: input.targetDate,
      notes: input.notes,
      created_by: result.userId,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/ex-surveys");
  return {
    success: true,
    data: {
      id: data.id,
      organizationId: data.organization_id,
      surveyId: data.survey_id,
      departmentId: data.department_id,
      title: data.title,
      description: data.description,
      theme: data.theme,
      priority: data.priority,
      status: data.status,
      ownerUserId: data.owner_user_id,
      targetDate: data.target_date,
      completedDate: data.completed_date,
      successMetrics: data.success_metrics,
      notes: data.notes,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  };
}

export async function updateActionPlan(input: {
  id: string;
  title?: string;
  description?: string;
  theme?: string;
  priority?: "low" | "medium" | "high" | "critical";
  status?: "planned" | "in_progress" | "completed" | "cancelled";
  ownerUserId?: string | null;
  targetDate?: string | null;
  notes?: string;
}): Promise<{ success: boolean; data?: EXActionPlan; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = await createClient();

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.theme !== undefined) updateData.theme = input.theme;
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.status !== undefined) {
    updateData.status = input.status;
    if (input.status === "completed") {
      updateData.completed_date = new Date().toISOString().split("T")[0];
    }
  }
  if (input.ownerUserId !== undefined) updateData.owner_user_id = input.ownerUserId;
  if (input.targetDate !== undefined) updateData.target_date = input.targetDate;
  if (input.notes !== undefined) updateData.notes = input.notes;

  const { data, error } = await supabase
    .from("ex_action_plans")
    .update(updateData)
    .eq("id", input.id)
    .eq("organization_id", result.organizationId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/ex-surveys");
  revalidatePath("/dashboard/ex-surveys/action-plans");
  return {
    success: true,
    data: {
      id: data.id,
      organizationId: data.organization_id,
      surveyId: data.survey_id,
      departmentId: data.department_id,
      title: data.title,
      description: data.description,
      theme: data.theme,
      priority: data.priority,
      status: data.status,
      ownerUserId: data.owner_user_id,
      targetDate: data.target_date,
      completedDate: data.completed_date,
      successMetrics: data.success_metrics,
      notes: data.notes,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  };
}

export async function deleteActionPlan(id: string): Promise<{ success: boolean; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("ex_action_plans")
    .delete()
    .eq("id", id)
    .eq("organization_id", result.organizationId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/ex-surveys");
  revalidatePath("/dashboard/ex-surveys/action-plans");
  return { success: true };
}
