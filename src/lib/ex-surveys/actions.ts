/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - ex_surveys tables not in generated types yet
"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import {
  EXSurveyTemplate,
  EXSurvey,
  EXSurveyResponse,
  DEFAULT_EX_TEMPLATES,
  EXSurveyType,
} from "@/types/ex-survey.types";

// Helper to get current user's organization
async function getUserOrganization() {
  const user = await unifiedGetUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const supabase = createAdminClient();
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

// ==================== DEPARTMENT ACTIONS (DEPRECATED) ====================
// Department CRUD removed — use getEmployeeDepartments() from @/lib/employees/actions instead.
// Departments are now free-text fields on the employees table.

// ==================== TEMPLATE ACTIONS ====================

export async function getEXSurveyTemplate(id: string): Promise<{ success: boolean; data?: EXSurveyTemplate; error?: string }> {
  const result = await getUserOrganization();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ex_survey_templates")
    .select("*")
    .eq("id", id)
    .eq("organization_id", result.organizationId)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "Template not found" };
  }

  return {
    success: true,
    data: {
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      description: data.description,
      surveyType: data.survey_type,
      frequency: data.frequency,
      isAnonymous: data.is_anonymous,
      isDefault: data.is_default,
      isActive: data.is_active,
      questions: data.questions || [],
      branding: data.branding,
      thankYouConfig: data.thank_you_config,
      targetDepartments: data.target_departments,
      targetRoles: data.target_roles,
      notificationSettings: data.notification_settings,
      benchmarkCategory: data.benchmark_category,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      estimatedTimeMinutes: Math.ceil((data.questions?.length || 0) * 0.5 + 1),
    },
  };
}

export async function getEXSurveyTemplates(): Promise<{ success: boolean; data?: EXSurveyTemplate[]; error?: string }> {
  const result = await getUserOrganization();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = createAdminClient();
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

export async function initializeDefaultEXTemplates(options?: {
  skipExistingCheck?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const result = await getUserOrganization();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = createAdminClient();

  if (!options?.skipExistingCheck) {
    const { count } = await supabase
      .from("ex_survey_templates")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", result.organizationId);

    if (count && count > 0) {
      return { success: true };
    }
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

  const { data, error } = await supabase
    .from("ex_survey_templates")
    .insert(templates)
    .select();

  if (error || !data) {
    console.error("Failed to initialize EX templates:", {
      error: error ? JSON.stringify(error, null, 2) : "no error object",
      hasData: !!data,
      templateCount: templates.length,
    });
    return { success: false, error: error?.message || "Insert failed - no data returned" };
  }

  revalidatePath("/dashboard/ex-surveys");
  return { success: true };
}

export async function createEXSurveyTemplate(input: {
  name: string;
  description?: string;
  surveyType: EXSurveyType;
  frequency?: "once" | "weekly" | "monthly" | "quarterly" | "annual";
  isAnonymous?: boolean;
  questions: EXSurveyTemplate["questions"];
  branding?: EXSurveyTemplate["branding"];
  thankYouConfig?: EXSurveyTemplate["thankYouConfig"];
  targetDepartments?: string[];
  targetRoles?: string[];
  notificationSettings?: EXSurveyTemplate["notificationSettings"];
  benchmarkCategory?: string;
}): Promise<{ success: boolean; data?: EXSurveyTemplate; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ex_survey_templates")
    .insert({
      organization_id: result.organizationId,
      name: input.name,
      description: input.description,
      survey_type: input.surveyType,
      frequency: input.frequency || "once",
      is_anonymous: input.isAnonymous ?? true,
      is_default: false,
      is_active: true,
      questions: input.questions,
      branding: input.branding || {},
      thank_you_config: input.thankYouConfig || {
        title: "Thank You!",
        message: "Your feedback has been submitted successfully.",
      },
      target_departments: input.targetDepartments,
      target_roles: input.targetRoles,
      notification_settings: input.notificationSettings,
      benchmark_category: input.benchmarkCategory,
      created_by: result.userId,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/ex-surveys/templates");
  return {
    success: true,
    data: {
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      description: data.description,
      surveyType: data.survey_type,
      frequency: data.frequency,
      isAnonymous: data.is_anonymous,
      isDefault: data.is_default,
      isActive: data.is_active,
      questions: data.questions || [],
      branding: data.branding,
      thankYouConfig: data.thank_you_config,
      targetDepartments: data.target_departments,
      targetRoles: data.target_roles,
      notificationSettings: data.notification_settings,
      benchmarkCategory: data.benchmark_category,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      estimatedTimeMinutes: Math.ceil((data.questions?.length || 0) * 0.5 + 1),
    },
  };
}

export async function updateEXSurveyTemplate(input: {
  id: string;
  name?: string;
  description?: string;
  surveyType?: EXSurveyType;
  frequency?: "once" | "weekly" | "monthly" | "quarterly" | "annual";
  isAnonymous?: boolean;
  questions?: EXSurveyTemplate["questions"];
  branding?: EXSurveyTemplate["branding"];
  thankYouConfig?: EXSurveyTemplate["thankYouConfig"];
  targetDepartments?: string[];
  targetRoles?: string[];
  notificationSettings?: EXSurveyTemplate["notificationSettings"];
  benchmarkCategory?: string;
}): Promise<{ success: boolean; data?: EXSurveyTemplate; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = createAdminClient();

  // First check if template exists and is not a default template
  const { data: existing } = await supabase
    .from("ex_survey_templates")
    .select("is_default")
    .eq("id", input.id)
    .eq("organization_id", result.organizationId)
    .single();

  if (!existing) {
    return { success: false, error: "Template not found" };
  }

  if (existing.is_default) {
    return { success: false, error: "Cannot edit default templates. Duplicate it first to customize." };
  }

  // Build update object
  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.surveyType !== undefined) updateData.survey_type = input.surveyType;
  if (input.frequency !== undefined) updateData.frequency = input.frequency;
  if (input.isAnonymous !== undefined) updateData.is_anonymous = input.isAnonymous;
  if (input.questions !== undefined) updateData.questions = input.questions;
  if (input.branding !== undefined) updateData.branding = input.branding;
  if (input.thankYouConfig !== undefined) updateData.thank_you_config = input.thankYouConfig;
  if (input.targetDepartments !== undefined) updateData.target_departments = input.targetDepartments;
  if (input.targetRoles !== undefined) updateData.target_roles = input.targetRoles;
  if (input.notificationSettings !== undefined) updateData.notification_settings = input.notificationSettings;
  if (input.benchmarkCategory !== undefined) updateData.benchmark_category = input.benchmarkCategory;

  const { data, error } = await supabase
    .from("ex_survey_templates")
    .update(updateData)
    .eq("id", input.id)
    .eq("organization_id", result.organizationId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/ex-surveys/templates");
  revalidatePath(`/dashboard/ex-surveys/templates/${input.id}`);
  return {
    success: true,
    data: {
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      description: data.description,
      surveyType: data.survey_type,
      frequency: data.frequency,
      isAnonymous: data.is_anonymous,
      isDefault: data.is_default,
      isActive: data.is_active,
      questions: data.questions || [],
      branding: data.branding,
      thankYouConfig: data.thank_you_config,
      targetDepartments: data.target_departments,
      targetRoles: data.target_roles,
      notificationSettings: data.notification_settings,
      benchmarkCategory: data.benchmark_category,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      estimatedTimeMinutes: Math.ceil((data.questions?.length || 0) * 0.5 + 1),
    },
  };
}

export async function deleteEXSurveyTemplate(id: string): Promise<{ success: boolean; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = createAdminClient();

  // Check if template exists and is not a default
  const { data: existing } = await supabase
    .from("ex_survey_templates")
    .select("is_default")
    .eq("id", id)
    .eq("organization_id", result.organizationId)
    .single();

  if (!existing) {
    return { success: false, error: "Template not found" };
  }

  if (existing.is_default) {
    return { success: false, error: "Cannot delete default templates" };
  }

  // Soft delete by setting is_active to false
  const { error } = await supabase
    .from("ex_survey_templates")
    .update({ is_active: false })
    .eq("id", id)
    .eq("organization_id", result.organizationId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/ex-surveys/templates");
  return { success: true };
}

export async function duplicateEXSurveyTemplate(id: string): Promise<{ success: boolean; data?: EXSurveyTemplate; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = createAdminClient();

  // Get the original template
  const { data: original, error: fetchError } = await supabase
    .from("ex_survey_templates")
    .select("*")
    .eq("id", id)
    .eq("organization_id", result.organizationId)
    .single();

  if (fetchError || !original) {
    return { success: false, error: "Template not found" };
  }

  // Create a copy with modified name
  const { data, error } = await supabase
    .from("ex_survey_templates")
    .insert({
      organization_id: result.organizationId,
      name: `${original.name} (Copy)`,
      description: original.description,
      survey_type: original.survey_type,
      frequency: original.frequency,
      is_anonymous: original.is_anonymous,
      is_default: false, // Duplicates are never defaults
      is_active: true,
      questions: original.questions,
      branding: original.branding,
      thank_you_config: original.thank_you_config,
      target_departments: original.target_departments,
      target_roles: original.target_roles,
      notification_settings: original.notification_settings,
      benchmark_category: original.benchmark_category,
      created_by: result.userId,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/ex-surveys/templates");
  return {
    success: true,
    data: {
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      description: data.description,
      surveyType: data.survey_type,
      frequency: data.frequency,
      isAnonymous: data.is_anonymous,
      isDefault: data.is_default,
      isActive: data.is_active,
      questions: data.questions || [],
      branding: data.branding,
      thankYouConfig: data.thank_you_config,
      targetDepartments: data.target_departments,
      targetRoles: data.target_roles,
      notificationSettings: data.notification_settings,
      benchmarkCategory: data.benchmark_category,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      estimatedTimeMinutes: Math.ceil((data.questions?.length || 0) * 0.5 + 1),
    },
  };
}

// ==================== SURVEY CAMPAIGN ACTIONS ====================

export async function getEXSurveys(): Promise<{ success: boolean; data?: (EXSurvey & { template?: { name: string } })[]; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = createAdminClient();
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
  targetDepartment?: string;
  endDate?: string;
}): Promise<{ success: boolean; data?: EXSurvey; error?: string }> {
  const result = await checkManagerAccess();
  if ("error" in result) return { success: false, error: result.error };

  const supabase = createAdminClient();
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
      target_departments: input.targetDepartment ? [input.targetDepartment] : [],
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

  const supabase = createAdminClient();

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

  // Get employees to invite (includes both linked users and non-user employees)
  let employeeQuery = supabase
    .from("employees")
    .select("id, email, user_id, department")
    .eq("organization_id", result.organizationId)
    .eq("is_active", true);

  if (survey.target_departments && survey.target_departments.length > 0) {
    employeeQuery = employeeQuery.in("department", survey.target_departments);
  }

  const { data: employees, error: employeesError } = await employeeQuery;

  // Also get users who may not be in employees table yet
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, email")
    .eq("organization_id", result.organizationId)
    .eq("is_active", true);

  if (employeesError || usersError) {
    return { success: false, error: "Failed to get recipients" };
  }

  // Build deduplicated invitation list
  const invitations: { survey_id: string; user_id?: string; employee_id?: string; employee_email?: string }[] = [];
  const seenUserIds = new Set<string>();
  const seenEmails = new Set<string>();

  // Process employees first
  for (const employee of employees ?? []) {
    const email = employee.email ? String(employee.email).toLowerCase() : null;
    if (employee.user_id) {
      if (!seenUserIds.has(employee.user_id)) {
        invitations.push({ survey_id: surveyId, user_id: employee.user_id, employee_id: employee.id });
        seenUserIds.add(employee.user_id);
        if (email) seenEmails.add(email);
      }
    } else if (email) {
      if (!seenEmails.has(email)) {
        invitations.push({ survey_id: surveyId, employee_id: employee.id, employee_email: email });
        seenEmails.add(email);
      }
    }
  }

  // Add users not already covered by employees (only when no department filter)
  if (!survey.target_departments || survey.target_departments.length === 0) {
    for (const user of users ?? []) {
      if (!seenUserIds.has(user.id)) {
        invitations.push({ survey_id: surveyId, user_id: user.id });
        seenUserIds.add(user.id);
      }
    }
  }

  if (invitations.length === 0) {
    return { success: false, error: "No recipients to invite" };
  }

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
      total_invites: invitations.length,
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

  const supabase = createAdminClient();
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

  const supabase = createAdminClient();

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

  const supabase = createAdminClient();

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

  const supabase = createAdminClient();

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
