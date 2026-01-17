"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import type { Json } from "@/types/database.types";

// ============================================================================
// Types
// ============================================================================

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PublicVideoTestimonialRequest {
  id: string;
  token: string;
  status: string;
  maxDurationSeconds: number;
  promptText: string | null;
  expiresAt: string | null;
  submittedAt: string | null;
  customerName: string;
  customerEmail: string;
  loanOfficer: {
    id: string;
    fullName: string;
    photoUrl: string | null;
    title: string | null;
  };
  organization: {
    id: string;
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
  };
}

export interface CustomerInfoInput {
  displayName: string;
  relationship: string;
}

export interface ConsentInput {
  videoRecordingConsent: boolean;
  usageRightsConsent: boolean;
  aiTextGenerationConsent: boolean;
  marketingConsent?: boolean;
}

// ============================================================================
// Validation Schemas
// ============================================================================

const customerInfoSchema = z.object({
  displayName: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  relationship: z
    .string()
    .min(1, "Relationship is required")
    .max(200, "Relationship must be less than 200 characters"),
});

const consentSchema = z.object({
  videoRecordingConsent: z.literal(true, {
    errorMap: () => ({ message: "Video recording consent is required" }),
  }),
  usageRightsConsent: z.literal(true, {
    errorMap: () => ({ message: "Usage rights consent is required" }),
  }),
  aiTextGenerationConsent: z.literal(true, {
    errorMap: () => ({ message: "AI text generation consent is required" }),
  }),
  marketingConsent: z.boolean().optional(),
});

const submitCustomerInfoSchema = z.object({
  token: z.string().min(1, "Token is required"),
  customerInfo: customerInfoSchema,
  consents: consentSchema,
});

export type SubmitCustomerInfoInput = z.infer<typeof submitCustomerInfoSchema>;

// ============================================================================
// Public Server Actions
// ============================================================================

/**
 * Get video testimonial request by token (no auth required)
 * Used for the public video testimonial capture page
 */
export async function getVideoTestimonialByToken(
  token: string
): Promise<ActionResult<PublicVideoTestimonialRequest>> {
  try {
    if (!token) {
      return { success: false, error: "Request token is required" };
    }

    const supabase = createAdminClient();

    // Fetch the video testimonial request with related data
    const { data: request, error: requestError } = await supabase
      .from("video_testimonial_requests")
      .select(
        `
        id,
        token,
        status,
        max_duration_seconds,
        prompt_text,
        expires_at,
        submitted_at,
        opened_at,
        customer_name,
        customer_email,
        loan_officer_id,
        organization_id,
        loan_officers!inner (
          id,
          full_name,
          photo_url,
          title
        ),
        organizations!inner (
          id,
          name,
          logo_url,
          primary_color
        )
      `
      )
      .eq("token", token)
      .single();

    if (requestError || !request) {
      return { success: false, error: "Video testimonial request not found" };
    }

    // Check if request has already been submitted
    if (request.submitted_at || request.status === "submitted") {
      return {
        success: false,
        error: "This video testimonial has already been submitted",
      };
    }

    // Check if request is cancelled
    if (request.status === "cancelled") {
      return { success: false, error: "This video testimonial request has been cancelled" };
    }

    // Check if request is expired
    if (request.expires_at && new Date(request.expires_at) < new Date()) {
      return { success: false, error: "This video testimonial request has expired" };
    }

    // Update opened_at if not already set
    if (!request.opened_at) {
      await supabase
        .from("video_testimonial_requests")
        .update({
          opened_at: new Date().toISOString(),
          status: "opened",
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.id);
    }

    const loanOfficer = request.loan_officers as unknown as {
      id: string;
      full_name: string;
      photo_url: string | null;
      title: string | null;
    };

    const organization = request.organizations as unknown as {
      id: string;
      name: string;
      logo_url: string | null;
      primary_color: string | null;
    };

    // Transform to PublicVideoTestimonialRequest format
    const publicRequest: PublicVideoTestimonialRequest = {
      id: request.id,
      token: request.token,
      status: request.status,
      maxDurationSeconds: request.max_duration_seconds || 120,
      promptText: request.prompt_text,
      expiresAt: request.expires_at,
      submittedAt: request.submitted_at,
      customerName: request.customer_name,
      customerEmail: request.customer_email,
      loanOfficer: {
        id: loanOfficer.id,
        fullName: loanOfficer.full_name,
        photoUrl: loanOfficer.photo_url,
        title: loanOfficer.title,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        logoUrl: organization.logo_url,
        primaryColor: organization.primary_color,
      },
    };

    return { success: true, data: publicRequest };
  } catch (error) {
    console.error("Error fetching video testimonial by token:", error);
    return { success: false, error: "Failed to load video testimonial request" };
  }
}

/**
 * Submit customer info and consent for video testimonial
 * Updates the request status to 'recording' to indicate ready for video capture
 */
export async function submitCustomerInfoAndConsent(
  input: SubmitCustomerInfoInput
): Promise<ActionResult<{ requestId: string }>> {
  try {
    // Validate input
    const validated = submitCustomerInfoSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || "Validation failed",
      };
    }

    const { token, customerInfo, consents } = validated.data;
    const supabase = createAdminClient();

    // Fetch the request to validate it exists and is in a valid state
    const { data: request, error: requestError } = await supabase
      .from("video_testimonial_requests")
      .select("id, status, expires_at, submitted_at")
      .eq("token", token)
      .single();

    if (requestError || !request) {
      return { success: false, error: "Video testimonial request not found" };
    }

    // Check if already submitted
    if (request.submitted_at || request.status === "submitted") {
      return {
        success: false,
        error: "This video testimonial has already been submitted",
      };
    }

    // Check if cancelled
    if (request.status === "cancelled") {
      return { success: false, error: "This request has been cancelled" };
    }

    // Check if expired
    if (request.expires_at && new Date(request.expires_at) < new Date()) {
      return { success: false, error: "This request has expired" };
    }

    // Update request with customer info and consent, and change status to recording
    const { error: updateError } = await supabase
      .from("video_testimonial_requests")
      .update({
        status: "recording",
        source_metadata: {
          customer_display_name: customerInfo.displayName,
          customer_relationship: customerInfo.relationship,
          consent_video_recording: consents.videoRecordingConsent,
          consent_usage_rights: consents.usageRightsConsent,
          consent_ai_text_generation: consents.aiTextGenerationConsent,
          consent_marketing: consents.marketingConsent || false,
          consent_timestamp: new Date().toISOString(),
        } as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", request.id);

    if (updateError) {
      console.error("Error updating video testimonial request:", updateError);
      return { success: false, error: "Failed to save your information" };
    }

    return {
      success: true,
      data: { requestId: request.id },
    };
  } catch (error) {
    console.error("Error submitting customer info and consent:", error);
    return { success: false, error: "Failed to submit your information" };
  }
}
