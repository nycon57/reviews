"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { cache } from "react";
import type { Json } from "@/types/database.types";
import {
  VALID_RELATIONSHIPS,
  type ActionResult,
  type PublicVideoTestimonialRequest,
  type SubmitCustomerInfoInput,
} from "./types";

// ============================================================================
// Security Validation Helpers
// ============================================================================

/**
 * Validate URL is safe for rendering (only http/https protocols)
 * Prevents javascript: and data: URL injection
 */
function validateSafeUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    }
    return null; // Invalid protocol
  } catch {
    return null; // Malformed URL
  }
}

/**
 * Validate hex color format to prevent CSS injection
 * Only accepts formats: #RGB, #RRGGBB, #RRGGBBAA
 */
function validateHexColor(color: string | null): string | null {
  if (!color) return null;
  const hexPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
  return hexPattern.test(color) ? color : null;
}

// ============================================================================
// Validation Schemas
// ============================================================================

const customerInfoSchema = z.object({
  displayName: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  relationship: z.enum(VALID_RELATIONSHIPS, {
    errorMap: () => ({ message: "Please select a valid relationship type" }),
  }),
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

// ============================================================================
// Public Server Actions
// ============================================================================

/**
 * Get video testimonial request by token (no auth required)
 * Used for the public video testimonial capture page
 * Cached with React cache() to deduplicate requests within a single render pass
 */
export const getVideoTestimonialByToken = cache(async function getVideoTestimonialByTokenImpl(
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
      const { error: openedError } = await supabase
        .from("video_testimonial_requests")
        .update({
          opened_at: new Date().toISOString(),
          status: "opened",
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (openedError) {
        console.error("Error updating opened_at timestamp:", openedError);
        // Non-blocking error - continue serving the request
      }
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
    // Apply security validation to URLs and colors to prevent XSS/CSS injection
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
        photoUrl: validateSafeUrl(loanOfficer.photo_url),
        title: loanOfficer.title,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        logoUrl: validateSafeUrl(organization.logo_url),
        primaryColor: validateHexColor(organization.primary_color),
      },
    };

    return { success: true, data: publicRequest };
  } catch (error) {
    console.error("Error fetching video testimonial by token:", error);
    return { success: false, error: "Failed to load video testimonial request" };
  }
});

/**
 * Submit customer info and consent for video testimonial
 * Updates the request status to 'recording' to indicate ready for video capture
 * Uses optimistic locking to prevent race conditions
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
    // Use optimistic locking: only update if status hasn't changed to submitted/cancelled
    const { data: updatedData, error: updateError } = await supabase
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
      .eq("id", request.id)
      .not("status", "in", '("submitted","cancelled")') // Optimistic lock
      .select("id")
      .single();

    if (updateError || !updatedData) {
      // Race condition detected - status was changed by another request
      console.error("Error updating video testimonial request:", updateError);
      return {
        success: false,
        error: "Unable to save your information. The request may have been updated.",
      };
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
