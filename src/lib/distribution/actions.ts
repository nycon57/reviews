"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { z } from "zod";
import { randomBytes } from "crypto";
import {
  processQueueItem,
  scheduleReminders,
  checkRateLimit,
} from "./service";
import { sendSurveyInvitationEmail } from "@/lib/email";
import { emailConfig } from "@/lib/email/client";
import type { SurveyInvitationEmailData } from "@/lib/email/types";
import type { Json } from "@/types/database.types";

// Input validation schemas
const createSurveyInputSchema = z.object({
  loanOfficerId: z.string().uuid(),
  templateId: z.string().uuid(),
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().optional(),
  transactionId: z.string().optional(),
  transactionType: z.string().optional(),
  transactionDate: z.string().optional(),
  sendImmediately: z.boolean().default(false),
  scheduledAt: z.string().optional(),
});

export type CreateSurveyInput = z.infer<typeof createSurveyInputSchema>;

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SendSurveyResult {
  surveyId: string;
  status: "queued" | "sent" | "failed";
  queueItemId?: string;
  message?: string;
}

export interface DistributionQueueItem {
  id: string;
  surveyId: string;
  type: string;
  scheduledAt: string;
  processedAt: string | null;
  status: string;
  retryCount: number;
  errorMessage: string | null;
  customerName: string;
  customerEmail: string;
  loanOfficerName: string;
}

// Create a survey and add it to the distribution queue
export async function createSurveyAndQueue(
  input: CreateSurveyInput
): Promise<ActionResult<SendSurveyResult>> {
  try {
    const validated = createSurveyInputSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || "Validation failed",
      };
    }

    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = createAdminClient();

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    // Verify target user belongs to same organization
    const { data: targetUser, error: targetUserError } = await supabase
      .from("users")
      .select("id, organization_id")
      .eq("id", validated.data.loanOfficerId)
      .single();

    if (targetUserError || !targetUser) {
      return { success: false, error: "User not found" };
    }

    if (targetUser.organization_id !== userData.organization_id) {
      return { success: false, error: "User not in your organization" };
    }

    // Verify template belongs to same organization
    const { data: template, error: templateError } = await supabase
      .from("survey_templates")
      .select("id, organization_id, is_active")
      .eq("id", validated.data.templateId)
      .single();

    if (templateError || !template) {
      return { success: false, error: "Survey template not found" };
    }

    if (template.organization_id !== userData.organization_id) {
      return { success: false, error: "Template not in your organization" };
    }

    if (!template.is_active) {
      return { success: false, error: "Survey template is not active" };
    }

    // Check for existing survey
    const { data: existingSurvey } = await supabase
      .from("surveys")
      .select("id, status")
      .eq("organization_id", userData.organization_id)
      .eq("user_id", validated.data.loanOfficerId)
      .eq("customer_email", validated.data.customerEmail)
      .neq("status", "expired")
      .neq("status", "completed")
      .limit(1)
      .single();

    if (existingSurvey) {
      return {
        success: false,
        error: "A survey already exists for this customer",
      };
    }

    // Calculate scheduled time (use provided time if in future, otherwise now)
    const now = new Date();
    const requestedTime = validated.data.scheduledAt
      ? new Date(validated.data.scheduledAt)
      : now;
    const scheduledAt = requestedTime > now ? requestedTime : now;

    // Calculate expiration (14 days from scheduled send)
    const expiresAt = new Date(scheduledAt);
    expiresAt.setDate(expiresAt.getDate() + 14);

    // Create the survey
    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .insert({
        organization_id: userData.organization_id,
        template_id: validated.data.templateId,
        user_id: validated.data.loanOfficerId,
        customer_name: validated.data.customerName,
        customer_email: validated.data.customerEmail,
        customer_phone: validated.data.customerPhone,
        transaction_id: validated.data.transactionId,
        transaction_type: validated.data.transactionType,
        transaction_date: validated.data.transactionDate,
        status: "pending",
        expires_at: expiresAt.toISOString(),
        source: "manual",
        source_metadata: {
          created_by: user.id,
          send_immediately: validated.data.sendImmediately,
        },
      })
      .select("id, token")
      .single();

    if (surveyError || !survey) {
      return { success: false, error: "Failed to create survey" };
    }

    // Add to distribution queue
    const { data: queueItem, error: queueError } = await supabase
      .from("survey_distribution_queue")
      .insert({
        organization_id: userData.organization_id,
        survey_id: survey.id,
        type: "initial",
        scheduled_at: scheduledAt.toISOString(),
        priority: validated.data.sendImmediately ? 10 : 1,
      })
      .select("id")
      .single();

    if (queueError) {
      // Survey created but queue failed - still return success
      console.error("Failed to queue survey:", queueError);
    }

    revalidatePath("/dashboard/surveys");

    // If send immediately is requested, process now
    if (validated.data.sendImmediately && queueItem) {
      const processResult = await processQueueItem({
        id: queueItem.id,
        survey_id: survey.id,
        organization_id: userData.organization_id,
        type: "initial",
        scheduled_at: scheduledAt.toISOString(),
      });

      return {
        success: true,
        data: {
          surveyId: survey.id,
          status: processResult.success ? "sent" : "failed",
          queueItemId: queueItem.id,
          message: processResult.error || "Survey sent successfully",
        },
      };
    }

    return {
      success: true,
      data: {
        surveyId: survey.id,
        status: "queued",
        queueItemId: queueItem?.id,
        message: `Survey scheduled for ${scheduledAt.toISOString()}`,
      },
    };
  } catch (error) {
    console.error("Error creating survey:", error);
    return { success: false, error: "Failed to create survey" };
  }
}

// Send a survey immediately (bypassing queue)
export async function sendSurveyManually(
  surveyId: string
): Promise<ActionResult<{ sent: boolean; messageId?: string }>> {
  try {
    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = createAdminClient();

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    // Only admins and managers can send manually
    if (!["admin", "manager"].includes(userData.role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Get survey details
    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .select(
        `
        id,
        token,
        customer_name,
        customer_email,
        status,
        completed_at,
        expires_at,
        transaction_type,
        organization_id,
        users!user_id (
          id,
          full_name,
          photo_url
        ),
        organizations!inner (
          id,
          name,
          logo_url
        )
      `
      )
      .eq("id", surveyId)
      .single();

    if (surveyError || !survey) {
      return { success: false, error: "Survey not found" };
    }

    if (survey.organization_id !== userData.organization_id) {
      return { success: false, error: "Survey not in your organization" };
    }

    if (survey.completed_at || survey.status === "completed") {
      return { success: false, error: "Survey is already completed" };
    }

    if (survey.expires_at && new Date(survey.expires_at) < new Date()) {
      return { success: false, error: "Survey has expired" };
    }

    // Check rate limits
    const rateCheck = await checkRateLimit(userData.organization_id);
    if (!rateCheck.allowed) {
      return { success: false, error: rateCheck.reason || "Rate limit exceeded" };
    }

    const loanOfficer = survey.users as unknown as {
      id: string;
      full_name: string;
      photo_url: string | null;
    };

    const organization = survey.organizations as unknown as {
      id: string;
      name: string;
      logo_url: string | null;
    };

    const surveyUrl = `${emailConfig.baseUrl}/survey/${survey.token}`;

    // Send email
    const emailData: SurveyInvitationEmailData = {
      toEmail: survey.customer_email,
      customerName: survey.customer_name,
      loanOfficerName: loanOfficer.full_name,
      loanOfficerPhotoUrl: loanOfficer.photo_url || undefined,
      organizationName: organization.name,
      organizationLogoUrl: organization.logo_url || undefined,
      surveyUrl,
      transactionType: survey.transaction_type || undefined,
      organizationId: organization.id,
      loanOfficerId: loanOfficer.id,
      surveyId: survey.id,
    };

    const result = await sendSurveyInvitationEmail(emailData);

    if (result.success) {
      // Update survey status
      const adminSupabase = createAdminClient();

      await adminSupabase
        .from("surveys")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", survey.id);

      // Schedule reminders
      await scheduleReminders(survey.id, userData.organization_id);

      revalidatePath("/dashboard/surveys");

      return {
        success: true,
        data: { sent: true, messageId: result.messageId },
      };
    }

    return { success: false, error: result.error || "Failed to send email" };
  } catch (error) {
    console.error("Error sending survey manually:", error);
    return { success: false, error: "Failed to send survey" };
  }
}

// Resend a survey (creates new invitation email)
export async function resendSurvey(
  surveyId: string
): Promise<ActionResult<{ sent: boolean }>> {
  try {
    const result = await sendSurveyManually(surveyId);

    if (result.success) {
      // Increment reminder count and update last reminder time
      const adminSupabase = createAdminClient();
      const { data: survey } = await adminSupabase
        .from("surveys")
        .select("reminder_count")
        .eq("id", surveyId)
        .single();

      await adminSupabase
        .from("surveys")
        .update({
          reminder_count: (survey?.reminder_count || 0) + 1,
          last_reminder_at: new Date().toISOString(),
        })
        .eq("id", surveyId);
    }

    return result;
  } catch (error) {
    console.error("Error resending survey:", error);
    return { success: false, error: "Failed to resend survey" };
  }
}

// Get surveys for distribution management
export async function getSurveysForDistribution(params?: {
  status?: string;
  loanOfficerId?: string;
  page?: number;
  pageSize?: number;
}): Promise<
  ActionResult<{
    surveys: Array<{
      id: string;
      token: string;
      customerName: string;
      customerEmail: string;
      status: string;
      sentAt: string | null;
      completedAt: string | null;
      expiresAt: string | null;
      reminderCount: number;
      loanOfficerName: string;
      source: string;
      createdAt: string;
    }>;
    total: number;
  }>
> {
  try {
    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = createAdminClient();

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 25;
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from("surveys")
      .select(
        `
        id,
        token,
        customer_name,
        customer_email,
        status,
        sent_at,
        completed_at,
        expires_at,
        reminder_count,
        source,
        created_at,
        users!user_id (
          full_name
        )
      `,
        { count: "exact" }
      )
      .eq("organization_id", userData.organization_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (params?.status) {
      query = query.eq("status", params.status);
    }

    if (params?.loanOfficerId) {
      query = query.eq("user_id", params.loanOfficerId);
    }

    const { data, count, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const surveys = (data || []).map((survey) => {
      const user = survey.users as unknown as { full_name: string };
      return {
        id: survey.id,
        token: survey.token,
        customerName: survey.customer_name,
        customerEmail: survey.customer_email,
        status: survey.status || "pending",
        sentAt: survey.sent_at,
        completedAt: survey.completed_at,
        expiresAt: survey.expires_at,
        reminderCount: survey.reminder_count || 0,
        loanOfficerName: user.full_name,
        source: survey.source || "manual",
        createdAt: survey.created_at || "",
      };
    });

    return {
      success: true,
      data: {
        surveys,
        total: count ?? 0,
      },
    };
  } catch (error) {
    console.error("Error fetching surveys:", error);
    return { success: false, error: "Failed to fetch surveys" };
  }
}

// Get loan officers for the current organization
export async function getLoanOfficersForSend(): Promise<
  ActionResult<Array<{ id: string; fullName: string; email: string }>>
> {
  try {
    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = createAdminClient();

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email")
      .eq("organization_id", userData.organization_id)
      .eq("is_active", true)
      .order("full_name", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    const users = (data || []).map((user) => ({
      id: user.id,
      fullName: user.full_name || 'Unknown',
      email: user.email,
    }));

    return { success: true, data: users };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, error: "Failed to fetch users" };
  }
}

// Get active survey templates for the current organization
export async function getActiveTemplatesForSend(): Promise<
  ActionResult<Array<{ id: string; name: string; description: string | null }>>
> {
  try {
    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = createAdminClient();

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    const { data, error } = await supabase
      .from("survey_templates")
      .select("id, name, description")
      .eq("organization_id", userData.organization_id)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    const templates = (data || []).map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
    }));

    return { success: true, data: templates };
  } catch (error) {
    console.error("Error fetching templates:", error);
    return { success: false, error: "Failed to fetch templates" };
  }
}

// Get distribution queue items
export async function getDistributionQueue(params?: {
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<ActionResult<{ items: DistributionQueueItem[]; total: number }>> {
  try {
    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = createAdminClient();

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 25;
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from("survey_distribution_queue")
      .select(
        `
        id,
        survey_id,
        type,
        scheduled_at,
        processed_at,
        status,
        retry_count,
        error_message,
        surveys!inner (
          customer_name,
          customer_email,
          users!user_id (
            full_name
          )
        )
      `,
        { count: "exact" }
      )
      .eq("organization_id", userData.organization_id)
      .order("scheduled_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (params?.status) {
      query = query.eq("status", params.status);
    }

    const { data, count, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const items: DistributionQueueItem[] = (data || []).map((item) => {
      const survey = item.surveys as unknown as {
        customer_name: string;
        customer_email: string;
        users: { full_name: string };
      };

      return {
        id: item.id,
        surveyId: item.survey_id,
        type: item.type,
        scheduledAt: item.scheduled_at,
        processedAt: item.processed_at,
        status: item.status || "pending",
        retryCount: item.retry_count || 0,
        errorMessage: item.error_message,
        customerName: survey.customer_name,
        customerEmail: survey.customer_email,
        loanOfficerName: survey.users.full_name,
      };
    });

    return {
      success: true,
      data: {
        items,
        total: count ?? 0,
      },
    };
  } catch (error) {
    console.error("Error fetching distribution queue:", error);
    return { success: false, error: "Failed to fetch distribution queue" };
  }
}

// Webhook configuration types
export interface WebhookConfig {
  id: string;
  name: string;
  secretKey: string;
  isActive: boolean;
  allowedIps: string[] | null;
  defaultTemplateId: string | null;
  settings: Record<string, unknown> | null;
  lastTriggeredAt: string | null;
  triggerCount: number;
  createdAt: string;
}

const createWebhookConfigSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  allowedIps: z.array(z.string()).optional(),
  defaultTemplateId: z.string().uuid().optional(),
  settings: z.record(z.unknown()).optional(),
});

// Get webhook configurations for the current organization
export async function getWebhookConfigs(): Promise<ActionResult<WebhookConfig[]>> {
  try {
    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = createAdminClient();
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    // Only admins can view webhook configs
    if (userData.role !== "admin") {
      return { success: false, error: "Admin access required" };
    }

    const { data, error } = await supabase
      .from("webhook_configs")
      .select("*")
      .eq("organization_id", userData.organization_id)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    const configs: WebhookConfig[] = (data || []).map((config) => ({
      id: config.id,
      name: config.name,
      secretKey: config.secret_key,
      isActive: config.is_active ?? true,
      allowedIps: config.allowed_ips as string[] | null,
      defaultTemplateId: config.default_template_id,
      settings: config.settings as Record<string, unknown> | null,
      lastTriggeredAt: config.last_triggered_at,
      triggerCount: config.trigger_count || 0,
      createdAt: config.created_at || "",
    }));

    return { success: true, data: configs };
  } catch (error) {
    console.error("Error fetching webhook configs:", error);
    return { success: false, error: "Failed to fetch webhook configurations" };
  }
}

// Create a new webhook configuration
export async function createWebhookConfig(
  input: z.infer<typeof createWebhookConfigSchema>
): Promise<ActionResult<WebhookConfig>> {
  try {
    const validated = createWebhookConfigSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || "Validation failed",
      };
    }

    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = createAdminClient();
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    // Only admins can create webhook configs
    if (userData.role !== "admin") {
      return { success: false, error: "Admin access required" };
    }

    // Generate a secure secret key
    const secretKey = `whk_${randomBytes(32).toString("hex")}`;

    const { data, error } = await supabase
      .from("webhook_configs")
      .insert({
        organization_id: userData.organization_id,
        name: validated.data.name,
        secret_key: secretKey,
        is_active: true,
        allowed_ips: validated.data.allowedIps || null,
        default_template_id: validated.data.defaultTemplateId || null,
        settings: validated.data.settings
          ? (JSON.parse(JSON.stringify(validated.data.settings)) as Json)
          : null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/distribution");

    const config: WebhookConfig = {
      id: data.id,
      name: data.name,
      secretKey: data.secret_key,
      isActive: data.is_active ?? true,
      allowedIps: data.allowed_ips as string[] | null,
      defaultTemplateId: data.default_template_id,
      settings: data.settings as Record<string, unknown> | null,
      lastTriggeredAt: data.last_triggered_at,
      triggerCount: data.trigger_count || 0,
      createdAt: data.created_at || "",
    };

    return { success: true, data: config };
  } catch (error) {
    console.error("Error creating webhook config:", error);
    return { success: false, error: "Failed to create webhook configuration" };
  }
}

// Toggle webhook configuration active status
export async function toggleWebhookConfig(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = createAdminClient();
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    if (userData.role !== "admin") {
      return { success: false, error: "Admin access required" };
    }

    const { error } = await supabase
      .from("webhook_configs")
      .update({ is_active: isActive })
      .eq("id", id)
      .eq("organization_id", userData.organization_id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/distribution");
    return { success: true };
  } catch (error) {
    console.error("Error toggling webhook config:", error);
    return { success: false, error: "Failed to update webhook configuration" };
  }
}

// Delete a webhook configuration
export async function deleteWebhookConfig(id: string): Promise<ActionResult> {
  try {
    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = createAdminClient();
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    if (userData.role !== "admin") {
      return { success: false, error: "Admin access required" };
    }

    const { error } = await supabase
      .from("webhook_configs")
      .delete()
      .eq("id", id)
      .eq("organization_id", userData.organization_id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/distribution");
    return { success: true };
  } catch (error) {
    console.error("Error deleting webhook config:", error);
    return { success: false, error: "Failed to delete webhook configuration" };
  }
}

// Regenerate webhook secret key
export async function regenerateWebhookSecret(
  id: string
): Promise<ActionResult<{ secretKey: string }>> {
  try {
    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = createAdminClient();
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    if (userData.role !== "admin") {
      return { success: false, error: "Admin access required" };
    }

    const newSecretKey = `whk_${randomBytes(32).toString("hex")}`;

    const { error } = await supabase
      .from("webhook_configs")
      .update({ secret_key: newSecretKey })
      .eq("id", id)
      .eq("organization_id", userData.organization_id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/distribution");
    return { success: true, data: { secretKey: newSecretKey } };
  } catch (error) {
    console.error("Error regenerating webhook secret:", error);
    return { success: false, error: "Failed to regenerate webhook secret" };
  }
}
