"use server";

import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import type {
  Question,
  SurveyBranding,
  ThankYouConfig,
} from "@/types/survey.types";
import { publishReviewIfClean } from "@/lib/reviews/publish";
import { analyzeNewReview } from "@/lib/ai/actions";
import type { PublicSurvey, ActionResult } from "./public-types";

/**
 * Build the Google "write a review" deep link for a place id. Mirrors the
 * validated pattern used by the video high-path share kit — only well-formed
 * place ids produce a link, everything else yields null (button hidden).
 */
function buildGoogleWriteReviewUrl(placeId: string | null | undefined): string | null {
  if (!placeId) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(placeId)) return null;
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}

// Get public survey by token (no auth required)
export async function getSurveyByToken(
  token: string
): Promise<ActionResult<PublicSurvey>> {
  try {
    if (!token) {
      return { success: false, error: "Survey token is required" };
    }

    const supabase = createAdminClient();

    // Fetch the survey with related data
    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .select(
        `
        id,
        token,
        customer_name,
        customer_email,
        status,
        expires_at,
        completed_at,
        opened_at,
        template_id,
        user_id,
        organization_id,
        users!user_id (
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
        ),
        survey_templates!inner (
          id,
          name,
          description,
          questions,
          branding,
          thank_you_config,
          is_active
        )
      `
      )
      .eq("token", token)
      .single();

    if (surveyError || !survey) {
      return { success: false, error: "Survey not found" };
    }

    // Check if survey is expired
    if (survey.expires_at && new Date(survey.expires_at) < new Date()) {
      return { success: false, error: "This survey has expired" };
    }

    // Check if already completed
    if (survey.completed_at || survey.status === "completed") {
      return { success: false, error: "This survey has already been completed" };
    }

    // Check if template is active
    const template = survey.survey_templates as unknown as {
      id: string;
      name: string;
      description: string | null;
      questions: Question[];
      branding: SurveyBranding | null;
      thank_you_config: ThankYouConfig | null;
      is_active: boolean;
    };

    if (!template.is_active) {
      return { success: false, error: "This survey is no longer available" };
    }

    // Update opened_at if not already set
    if (!survey.opened_at) {
      await supabase
        .from("surveys")
        .update({ opened_at: new Date().toISOString(), status: "opened" })
        .eq("id", survey.id);
    }

    const loanOfficer = survey.users as unknown as {
      id: string;
      full_name: string;
      photo_url: string | null;
      title: string | null;
    };

    const organization = survey.organizations as unknown as {
      id: string;
      name: string;
      logo_url: string | null;
      primary_color: string | null;
    };

    // Transform to PublicSurvey format
    const publicSurvey: PublicSurvey = {
      id: survey.id,
      token: survey.token,
      customerName: survey.customer_name,
      customerEmail: survey.customer_email,
      status: survey.status || "pending",
      expiresAt: survey.expires_at,
      completedAt: survey.completed_at,
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
      template: {
        id: template.id,
        name: template.name,
        description: template.description || undefined,
        questions: template.questions || [],
        branding: template.branding || undefined,
        thankYouConfig: template.thank_you_config || undefined,
        isActive: template.is_active,
        isDefault: false,
      },
    };

    return { success: true, data: publicSurvey };
  } catch (error) {
    console.error("Error fetching survey by token:", error);
    return { success: false, error: "Failed to load survey" };
  }
}

// Schema for survey response submission
const surveyAnswerSchema = z.object({
  questionId: z.string(),
  questionType: z.enum(["rating", "nps", "text", "multiple_choice"]),
  value: z.union([z.string(), z.number(), z.array(z.string())]),
});

const submitSurveyResponseSchema = z.object({
  token: z.string().min(1, "Survey token is required"),
  answers: z.array(surveyAnswerSchema).min(1, "At least one answer is required"),
});

export type SubmitSurveyResponseInput = z.infer<typeof submitSurveyResponseSchema>;

// Submit a survey response (no auth required)
export async function submitSurveyResponse(
  input: SubmitSurveyResponseInput
): Promise<
  ActionResult<{
    responseId: string;
    showReviewRedirect: boolean;
    googleReviewUrl: string | null;
  }>
> {
  try {
    const validated = submitSurveyResponseSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || "Validation failed",
      };
    }

    const { token, answers } = validated.data;
    const supabase = createAdminClient();

    // Fetch the survey to validate and get template info
    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .select(
        `
        id,
        status,
        expires_at,
        completed_at,
        organization_id,
        user_id,
        template_id,
        users!user_id (
          google_place_id
        ),
        survey_templates!inner (
          thank_you_config
        )
      `
      )
      .eq("token", token)
      .single();

    if (surveyError || !survey) {
      return { success: false, error: "Survey not found" };
    }

    // Check if survey can be submitted
    if (survey.expires_at && new Date(survey.expires_at) < new Date()) {
      return { success: false, error: "This survey has expired" };
    }

    if (survey.completed_at || survey.status === "completed") {
      return { success: false, error: "This survey has already been completed" };
    }

    // Calculate overall rating and NPS score from answers
    let overallRating: number | null = null;
    let npsScore: number | null = null;
    let testimonialText: string | null = null;

    for (const answer of answers) {
      if (answer.questionType === "rating" && typeof answer.value === "number") {
        overallRating = answer.value;
      }
      if (answer.questionType === "nps" && typeof answer.value === "number") {
        npsScore = answer.value;
      }
      if (answer.questionType === "text" && typeof answer.value === "string" && answer.value.length > 50) {
        // Use longest text response as potential testimonial
        if (!testimonialText || answer.value.length > testimonialText.length) {
          testimonialText = answer.value;
        }
      }
    }

    // Insert survey response
    const { data: response, error: responseError } = await supabase
      .from("survey_responses")
      .insert({
        survey_id: survey.id,
        answers: JSON.parse(JSON.stringify(answers)),
        overall_rating: overallRating,
        nps_score: npsScore,
        testimonial_text: testimonialText,
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (responseError) {
      console.error("Error inserting survey response:", responseError);
      return { success: false, error: "Failed to save your response" };
    }

    // Update survey status to completed
    await supabase
      .from("surveys")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", survey.id);

    // Get customer name from survey for review creation
    const { data: surveyDetails } = await supabase
      .from("surveys")
      .select("customer_name")
      .eq("id", survey.id)
      .single();

    // Create a review record from the survey response. Publish inversion:
    // machine screening is the only gate — a pass verdict publishes
    // immediately at any rating; quarantine awaits human release.
    if (overallRating) {
      const reviewText = testimonialText || null;
      const customerName = surveyDetails?.customer_name || null;
      const now = new Date().toISOString();

      const untypedAdmin = createUntypedAdminClient();
      const { data: newReview, error: reviewError } = await untypedAdmin
        .from("reviews")
        .insert({
          organization_id: survey.organization_id,
          user_id: survey.user_id,
          source: "internal",
          survey_response_id: response.id,
          rating: overallRating,
          text: reviewText,
          customer_name: customerName,
          status: "pending",
          is_published: false,
          review_date: now,
        })
        .select("id")
        .single();

      if (!reviewError && newReview) {
        const reviewId = String((newReview as { id: string }).id);

        if (survey.user_id) {
          await publishReviewIfClean({
            reviewId,
            organizationId: survey.organization_id,
            ownerUserId: survey.user_id,
            customerName,
            rating: overallRating,
            reviewText,
            screening: {
              mode: "compute",
              text: reviewText ?? "",
              customerName,
            },
          });
        }

        // Trigger AI sentiment analysis (runs async, doesn't block response)
        analyzeNewReview(reviewId, reviewText, overallRating).catch((err) =>
          console.error("Sentiment analysis failed:", err)
        );
      }
    }

    // Determine if we should show review redirect
    const thankYouConfig = (survey.survey_templates as unknown as {
      thank_you_config: ThankYouConfig | null;
    }).thank_you_config;

    let showReviewRedirect = false;
    if (thankYouConfig?.showReviewRedirect && thankYouConfig.reviewRedirectRating) {
      // Check if rating meets threshold
      const ratingThreshold = thankYouConfig.reviewRedirectRating;
      if (overallRating && overallRating >= ratingThreshold) {
        showReviewRedirect = true;
      }
      // Also check NPS (9-10 = promoters)
      if (npsScore && npsScore >= 9 && ratingThreshold <= 4) {
        showReviewRedirect = true;
      }
    }

    // Deep link the promoter to Google's write-a-review flow for this
    // professional. Only surfaced when we are already showing the redirect
    // and the professional has a Google place id on file.
    const professional = survey.users as unknown as {
      google_place_id: string | null;
    } | null;
    const googleReviewUrl = showReviewRedirect
      ? buildGoogleWriteReviewUrl(professional?.google_place_id)
      : null;

    return {
      success: true,
      data: {
        responseId: response.id,
        showReviewRedirect,
        googleReviewUrl,
      },
    };
  } catch (error) {
    console.error("Error submitting survey response:", error);
    return { success: false, error: "Failed to submit your response" };
  }
}

// Record a survey respondent clicking through to the external Google review
// CTA (no auth — the respondent is anonymous). Fire-and-forget from the client;
// stamps the first click only. Uses the untyped client because
// google_review_clicked_at lands with migration 20260707000001 and is not in
// the generated types yet; a missing column just no-ops gracefully.
export async function recordSurveyGoogleReviewClick(
  responseId: string
): Promise<{ success: boolean }> {
  if (!responseId) {
    return { success: false };
  }

  try {
    const supabase = createUntypedAdminClient();
    const { error } = await supabase
      .from("survey_responses")
      .update({ google_review_clicked_at: new Date().toISOString() })
      .eq("id", responseId)
      .is("google_review_clicked_at", null);

    if (error) {
      console.error("Error recording survey Google review click:", error);
      return { success: false };
    }
    return { success: true };
  } catch (error) {
    console.error("Error recording survey Google review click:", error);
    return { success: false };
  }
}
