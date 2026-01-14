"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import {
  processQueueItem,
  scheduleReminders,
  checkRateLimit,
} from "./service";
import { sendSurveyInvitationEmail } from "@/lib/email";
import { emailConfig } from "@/lib/email/client";
import type { SurveyInvitationEmailData } from "@/lib/email/types";

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

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    // Verify loan officer belongs to same organization
    const { data: loanOfficer, error: loError } = await supabase
      .from("loan_officers")
      .select("id, organization_id")
      .eq("id", validated.data.loanOfficerId)
      .single();

    if (loError || !loanOfficer) {
      return { success: false, error: "Loan officer not found" };
    }

    if (loanOfficer.organization_id !== userData.organization_id) {
      return { success: false, error: "Loan officer not in your organization" };
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
      .eq("loan_officer_id", validated.data.loanOfficerId)
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

    // Calculate scheduled time
    let scheduledAt = new Date();
    if (validated.data.scheduledAt) {
      scheduledAt = new Date(validated.data.scheduledAt);
      if (scheduledAt < new Date()) {
        scheduledAt = new Date();
      }
    }

    // Calculate expiration (14 days from scheduled send)
    const expiresAt = new Date(scheduledAt);
    expiresAt.setDate(expiresAt.getDate() + 14);

    // Create the survey
    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .insert({
        organization_id: userData.organization_id,
        template_id: validated.data.templateId,
        loan_officer_id: validated.data.loanOfficerId,
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
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

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
        loan_officers!inner (
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

    const loanOfficer = survey.loan_officers as unknown as {
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
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

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
        loan_officers!inner (
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
      query = query.eq("loan_officer_id", params.loanOfficerId);
    }

    const { data, count, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const surveys = (data || []).map((survey) => {
      const lo = survey.loan_officers as unknown as { full_name: string };
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
        loanOfficerName: lo.full_name,
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

// Get distribution queue items
export async function getDistributionQueue(params?: {
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<ActionResult<{ items: DistributionQueueItem[]; total: number }>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

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
          loan_officers!inner (
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
        loan_officers: { full_name: string };
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
        loanOfficerName: survey.loan_officers.full_name,
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
