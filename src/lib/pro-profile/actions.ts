"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";

// Schema definitions
const submitPublicReviewSchema = z.object({
  loanOfficerId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(10).max(2000).optional(),
  title: z.string().max(200).optional(),
  customerName: z.string().max(100).optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerLocation: z.string().max(100).optional(),
  consentGiven: z.boolean().default(false),
});

const submitReferralSchema = z.object({
  loanOfficerId: z.string().uuid(),
  referrerName: z.string().max(100).optional(),
  referrerEmail: z.string().email().optional().or(z.literal("")),
  referrerPhone: z.string().max(20).optional(),
  referredName: z.string().min(1).max(100),
  referredEmail: z.string().email().optional().or(z.literal("")),
  referredPhone: z.string().max(20).optional(),
  message: z.string().max(1000).optional(),
});

const flagReviewSchema = z.object({
  reviewId: z.string().uuid(),
  reason: z.enum(["inappropriate", "spam", "fake", "other"]),
  details: z.string().max(500).optional(),
});

export type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Submit a public review from the profile page
 */
export async function submitPublicReview(
  input: z.infer<typeof submitPublicReviewSchema>
): Promise<ActionResult<{ id: string; status: string }>> {
  try {
    const validated = submitPublicReviewSchema.parse(input);
    const supabase = createAdminClient();

    // Get request metadata
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || undefined;
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || undefined;

    // Verify user exists and accepts public reviews
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, organization_id, accepts_public_reviews")
      .eq("id", validated.loanOfficerId)
      .eq("is_active", true)
      .single();

    if (userError || !user) {
      return { success: false, error: "Professional not found" };
    }

    if (!user.organization_id) {
      return { success: false, error: "Professional not associated with an organization" };
    }

    if (!user.accepts_public_reviews) {
      return { success: false, error: "This professional is not accepting public reviews" };
    }

    // Determine initial status: auto-approve 4-5 star reviews, pending for 1-3
    const status = validated.rating >= 4 ? "approved" : "pending";

    // Insert the review submission
    const { data: submission, error: insertError } = await supabase
      .from("public_review_submissions")
      .insert({
        user_id: validated.loanOfficerId,
        organization_id: user.organization_id,
        rating: validated.rating,
        text: validated.text || null,
        title: validated.title || null,
        customer_name: validated.customerName || null,
        customer_email: validated.customerEmail || null,
        customer_location: validated.customerLocation || null,
        consent_given: validated.consentGiven,
        status,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select("id, status")
      .single();

    if (insertError || !submission) {
      console.error("Error submitting review:", insertError);
      return { success: false, error: "Failed to submit review" };
    }

    return {
      success: true,
      data: { id: submission.id, status: submission.status || "pending" },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Invalid input" };
    }
    console.error("Error in submitPublicReview:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Submit a referral from the profile page
 */
export async function submitReferral(
  input: z.infer<typeof submitReferralSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const validated = submitReferralSchema.parse(input);
    const supabase = createAdminClient();

    // Get request metadata
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || undefined;
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || undefined;

    // Verify user exists and has referrals enabled
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, organization_id, referral_enabled")
      .eq("id", validated.loanOfficerId)
      .eq("is_active", true)
      .single();

    if (userError || !user) {
      return { success: false, error: "Professional not found" };
    }

    if (!user.organization_id) {
      return { success: false, error: "Professional not associated with an organization" };
    }

    if (!user.referral_enabled) {
      return { success: false, error: "Referrals are not enabled for this professional" };
    }

    // Insert the referral
    const { data: referral, error: insertError } = await supabase
      .from("profile_referrals")
      .insert({
        user_id: validated.loanOfficerId,
        organization_id: user.organization_id,
        referrer_name: validated.referrerName || null,
        referrer_email: validated.referrerEmail || null,
        referrer_phone: validated.referrerPhone || null,
        referred_name: validated.referredName,
        referred_email: validated.referredEmail || null,
        referred_phone: validated.referredPhone || null,
        message: validated.message || null,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select("id")
      .single();

    if (insertError || !referral) {
      console.error("Error submitting referral:", insertError);
      return { success: false, error: "Failed to submit referral" };
    }

    return { success: true, data: { id: referral.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Invalid input" };
    }
    console.error("Error in submitReferral:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Flag a review for moderation
 * TODO: Implement review_flags table for proper flag storage
 */
export async function flagReview(
  input: z.infer<typeof flagReviewSchema>
): Promise<ActionResult> {
  try {
    const validated = flagReviewSchema.parse(input);
    const supabase = createAdminClient();

    // Verify review exists
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("id, organization_id")
      .eq("id", validated.reviewId)
      .single();

    if (reviewError || !review) {
      return { success: false, error: "Review not found" };
    }

    // TODO: Create review_flags table and store flag data there
    // For now, just log the flag attempt
    console.log("Review flag attempt:", {
      reviewId: validated.reviewId,
      reason: validated.reason,
      details: validated.details,
    });

    // Return success to acknowledge the flag was received
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Invalid input" };
    }
    console.error("Error in flagReview:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
