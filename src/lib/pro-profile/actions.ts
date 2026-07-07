"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import {
  sendProfileReferralIntroductionEmail,
  sendReviewVerificationEmail,
} from "@/lib/email/send";
import { emailConfig } from "@/lib/email/client";
import type {
  ProfileReferralIntroductionEmailData,
  ReviewVerificationEmailData,
} from "@/lib/email/types";
import { screenReviewText } from "@/lib/reviews/moderation";
import { generateVerificationToken } from "@/lib/reviews/verification";
import { routeNewFlag } from "@/lib/reviews/flag-actions";

// Schema definitions
const submitPublicReviewSchema = z.object({
  loanOfficerId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(10).max(2000),
  title: z.string().max(200).optional(),
  customerName: z.string().max(100).optional(),
  customerEmail: z.string().email("Please enter a valid email"),
  customerLocation: z.string().max(100).optional(),
  consentGiven: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms to submit a review",
  }),
});

const submitReferralSchema = z.object({
  loanOfficerId: z.string().uuid(),
  referrerName: z.string().max(100).optional(),
  referrerEmail: z.string().email().optional().or(z.literal("")),
  referrerPhone: z.string().max(20).optional(),
  referredName: z.string().min(1).max(100),
  referredEmail: z.string().email("Please enter a valid email"),
  referredPhone: z.string().max(20).optional(),
  subject: z.string().min(1, "Subject is required").max(200),
  message: z.string().min(1, "Message is required").max(2000),
});

const flagReviewSchema = z.object({
  reviewId: z.string().uuid(),
  reason: z.enum([
    "inaccurate_information",
    "impersonation",
    "inappropriate_content",
    "spam_fake_review",
    "other",
  ]),
  details: z.string().max(1000).optional(),
  reporterName: z.string().max(100).optional(),
  reporterEmail: z.string().email().optional().or(z.literal("")),
});

export type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Submit a public review from the profile page.
 *
 * Writes directly to `reviews` with source 'direct'. The review stays
 * unpublished until the reviewer confirms their email; publication then
 * depends on the machine-screening verdict recorded here.
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
      .select("id, organization_id, accepts_public_reviews, full_name")
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

    // Rate limit: max 3 direct submissions per hour per IP per professional
    if (ipAddress) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      // TODO: Remove type assertion after running db:push && db:types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count, error: countError } = await (supabase as any)
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("source", "direct")
        .eq("user_id", validated.loanOfficerId)
        .gte("created_at", oneHourAgo)
        .eq("metadata->>ip_address", ipAddress);

      if (countError) {
        console.error("Error checking review rate limit:", countError);
      } else if ((count ?? 0) >= 3) {
        return {
          success: false,
          error: "Too many submissions from this network. Please try again later.",
        };
      }
    }

    // Machine screening (fail-closed: errors quarantine)
    const screenInput = validated.title
      ? `${validated.text}\n${validated.title}`
      : validated.text;
    const screen = await screenReviewText(screenInput, validated.customerName);

    // Email verification token: store only the sha256 hash
    const { rawToken, tokenHash } = generateVerificationToken();

    // Insert the review (unpublished until email verification)
    // TODO: Remove type assertion after running db:push && db:types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: review, error: insertError } = await (supabase as any)
      .from("reviews")
      .insert({
        source: "direct",
        organization_id: user.organization_id,
        user_id: validated.loanOfficerId,
        rating: validated.rating,
        text: validated.text,
        title: validated.title || null,
        customer_name: validated.customerName || null,
        customer_email: validated.customerEmail,
        customer_location: validated.customerLocation || null,
        review_date: new Date().toISOString(),
        status: "pending",
        is_published: false,
        metadata: {
          consent_given: validated.consentGiven,
          ip_address: ipAddress,
          user_agent: userAgent,
        },
        moderation_verdict: screen.verdict,
        moderation_reasons: screen.reasons,
        moderation_checked_at: new Date().toISOString(),
        moderation_provider: screen.provider,
        verification_token_hash: tokenHash,
      })
      .select("id")
      .single();

    if (insertError || !review) {
      console.error("Error submitting review:", insertError);
      return { success: false, error: "Failed to submit review" };
    }

    // Send verification email (fire-and-forget — don't block the response)
    const emailData: ReviewVerificationEmailData = {
      toEmail: validated.customerEmail,
      toName: validated.customerName,
      organizationId: user.organization_id,
      loanOfficerId: validated.loanOfficerId,
      reviewId: review.id,
      customerName: validated.customerName,
      professionalName: user.full_name ?? "this professional",
      rating: validated.rating,
      reviewText: validated.text,
      verifyUrl: `${emailConfig.baseUrl}/review/verify/${rawToken}`,
    };

    sendReviewVerificationEmail(emailData).catch((err) => {
      console.error("Failed to send review verification email:", err);
    });

    return {
      success: true,
      data: { id: review.id, status: "awaiting_verification" },
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
 * Submit a referral from the profile page and send an introduction email
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

    // Fetch professional with expanded fields for email template
    const { data: user, error: userError } = await supabase
      .from("users")
      .select(
        "id, organization_id, full_name, title, photo_url, email, phone, slug"
      )
      .eq("id", validated.loanOfficerId)
      .eq("is_active", true)
      .single();

    if (userError || !user) {
      return { success: false, error: "Professional not found" };
    }

    if (!user.organization_id) {
      return { success: false, error: "Professional not associated with an organization" };
    }


    // Fetch organization name
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", user.organization_id)
      .single();

    // Fetch 2 recent approved reviews with text for the email snippet
    const { data: recentReviews } = await supabase
      .from("reviews")
      .select("customer_name, rating, text")
      .eq("user_id", validated.loanOfficerId)
      .eq("status", "approved")
      .not("text", "is", null)
      .order("review_date", { ascending: false })
      .limit(2);

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
        referred_email: validated.referredEmail,
        referred_phone: validated.referredPhone || null,
        message: validated.message,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select("id")
      .single();

    if (insertError || !referral) {
      console.error("Error submitting referral:", insertError);
      return { success: false, error: "Failed to submit referral" };
    }

    // Send introduction email (fire-and-forget — don't block the response)
    const profileUrl = `${emailConfig.baseUrl}/pro/${user.slug}`;

    const emailData: ProfileReferralIntroductionEmailData = {
      toEmail: validated.referredEmail,
      toName: validated.referredName,
      organizationId: user.organization_id,
      loanOfficerId: validated.loanOfficerId,
      referredName: validated.referredName,
      referrerName: validated.referrerName,
      subject: validated.subject,
      message: validated.message,
      professionalName: user.full_name ?? "Professional",
      professionalTitle: user.title ?? undefined,
      professionalPhotoUrl: user.photo_url ?? undefined,
      organizationName: org?.name ?? undefined,
      phone: user.phone ?? undefined,
      profileUrl,
      recentReviews: recentReviews
        ?.filter(
          (r): r is typeof r & { text: string; customer_name: string } =>
            !!r.text && !!r.customer_name
        )
        .map((r) => ({
          customerName: r.customer_name,
          rating: r.rating,
          text: r.text,
        })),
    };

    // Send email — don't fail the referral if email fails
    sendProfileReferralIntroductionEmail(emailData, referral.id).catch(
      (err) => {
        console.error("Failed to send referral introduction email:", err);
      }
    );

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
 */
export async function flagReview(
  input: z.infer<typeof flagReviewSchema>
): Promise<ActionResult> {
  try {
    const validated = flagReviewSchema.parse(input);
    const supabase = createAdminClient();

    // Get request metadata
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || undefined;
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || undefined;

    // Verify review exists and get org
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("id, organization_id")
      .eq("id", validated.reviewId)
      .single();

    if (reviewError || !review) {
      return { success: false, error: "Review not found" };
    }

    // Insert flag into review_flags table
    // TODO: Remove type assertion after running db:push && db:types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: flag, error: insertError } = await (supabase as any)
      .from("review_flags")
      .insert({
        review_id: validated.reviewId,
        organization_id: review.organization_id,
        reason: validated.reason,
        details: validated.details || null,
        reporter_name: validated.reporterName || null,
        reporter_email: validated.reporterEmail || null,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select("id")
      .single();

    if (insertError || !flag) {
      console.error("Error inserting review flag:", insertError);
      return { success: false, error: "Failed to submit report" };
    }

    // Route the dispute: notify enterprise managers or escalate to RepWell
    await routeNewFlag({ id: flag.id as string }, review.organization_id);

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Invalid input" };
    }
    console.error("Error in flagReview:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
