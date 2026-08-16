import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { z } from "zod";
import {
  sendSurveyInvitationEmail,
  sendSurveyReminderEmail,
  sendNewReviewNotificationEmail,
} from "@/lib/email";
import { emailConfig } from "@/lib/email/client";
import { verifyNotBot } from "@/lib/botid";

// Schema for survey invitation request
const surveyInvitationSchema = z.object({
  type: z.literal("survey_invitation"),
  surveyId: z.string().uuid(),
});

// Schema for survey reminder request
const surveyReminderSchema = z.object({
  type: z.literal("survey_reminder"),
  surveyId: z.string().uuid(),
  reminderNumber: z.union([z.literal(1), z.literal(2)]),
});

// Schema for new review notification request
const reviewNotificationSchema = z.object({
  type: z.literal("new_review_notification"),
  reviewId: z.string().uuid(),
});

const sendEmailSchema = z.discriminatedUnion("type", [
  surveyInvitationSchema,
  surveyReminderSchema,
  reviewNotificationSchema,
]);

export async function POST(request: NextRequest) {
  try {
    // Verify request is not from a bot
    const botResponse = await verifyNotBot();
    if (botResponse) return botResponse;

    // Verify user is authenticated
    const user = await unifiedGetUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = sendEmailSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    if (validated.data.type === "survey_invitation") {
      const { surveyId } = validated.data;

      // Fetch survey with related data
      const { data: survey, error: surveyError } = await adminSupabase
        .from("surveys")
        .select(
          `
          id,
          token,
          customer_name,
          customer_email,
          transaction_type,
          organization_id,
          user_id,
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
        return NextResponse.json(
          { error: "Survey not found" },
          { status: 404 }
        );
      }

      const loanOfficer = survey.users;
      const organization = survey.organizations;

      if (!loanOfficer) {
        return NextResponse.json({ error: "Survey owner not found" }, { status: 404 });
      }

      const result = await sendSurveyInvitationEmail({
        toEmail: survey.customer_email,
        toName: survey.customer_name,
        customerName: survey.customer_name,
        loanOfficerName: loanOfficer.full_name ?? "",
        loanOfficerPhotoUrl: loanOfficer.photo_url ?? undefined,
        organizationName: organization.name,
        organizationLogoUrl: organization.logo_url ?? undefined,
        surveyUrl: `${emailConfig.baseUrl}/survey/${survey.token}`,
        transactionType: survey.transaction_type ?? undefined,
        organizationId: survey.organization_id,
        loanOfficerId: survey.user_id ?? undefined,
        surveyId: survey.id,
      });

      if (result.success) {
        // Update survey status to sent
        await adminSupabase
          .from("surveys")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", surveyId);
      }

      return NextResponse.json(result);
    }

    if (validated.data.type === "survey_reminder") {
      const { surveyId, reminderNumber } = validated.data;

      // Fetch survey with related data
      const { data: survey, error: surveyError } = await adminSupabase
        .from("surveys")
        .select(
          `
          id,
          token,
          customer_name,
          customer_email,
          organization_id,
          user_id,
          reminder_count,
          users!user_id (
            full_name
          ),
          organizations!inner (
            name
          )
        `
        )
        .eq("id", surveyId)
        .single();

      if (surveyError || !survey) {
        return NextResponse.json(
          { error: "Survey not found" },
          { status: 404 }
        );
      }

      const loanOfficer = survey.users;
      const organization = survey.organizations;

      if (!loanOfficer) {
        return NextResponse.json({ error: "Survey owner not found" }, { status: 404 });
      }

      const result = await sendSurveyReminderEmail({
        toEmail: survey.customer_email,
        toName: survey.customer_name,
        customerName: survey.customer_name,
        loanOfficerName: loanOfficer.full_name ?? "",
        organizationName: organization.name,
        surveyUrl: `${emailConfig.baseUrl}/survey/${survey.token}`,
        reminderNumber,
        organizationId: survey.organization_id,
        loanOfficerId: survey.user_id ?? undefined,
        surveyId: survey.id,
      });

      if (result.success) {
        // Update survey reminder count
        await adminSupabase
          .from("surveys")
          .update({
            reminder_count: (survey.reminder_count || 0) + 1,
            last_reminder_at: new Date().toISOString(),
          })
          .eq("id", surveyId);
      }

      return NextResponse.json(result);
    }

    if (validated.data.type === "new_review_notification") {
      const { reviewId } = validated.data;

      // Fetch review with related data
      const { data: review, error: reviewError } = await adminSupabase
        .from("reviews")
        .select(
          `
          id,
          rating,
          text,
          customer_name,
          review_date,
          organization_id,
          user_id,
          users!user_id (
            id,
            full_name,
            email,
            receive_notifications
          )
        `
        )
        .eq("id", reviewId)
        .single();

      if (reviewError || !review) {
        return NextResponse.json(
          { error: "Review not found" },
          { status: 404 }
        );
      }

      const loanOfficer = review.users;

      if (!loanOfficer) {
        return NextResponse.json({ error: "Review owner not found" }, { status: 404 });
      }

      // Check if loan officer wants notifications
      if (!loanOfficer.receive_notifications) {
        return NextResponse.json({
          success: false,
          error: "Loan officer has disabled notifications",
        });
      }

      const result = await sendNewReviewNotificationEmail({
        toEmail: loanOfficer.email,
        toName: loanOfficer.full_name ?? "",
        loanOfficerName: loanOfficer.full_name ?? "",
        customerName: review.customer_name || "A customer",
        rating: review.rating,
        reviewText: review.text ?? undefined,
        reviewDate: new Date(review.review_date).toLocaleDateString(),
        dashboardUrl: `${emailConfig.baseUrl}/dashboard/reviews`,
        organizationId: review.organization_id,
        loanOfficerId: review.user_id ?? undefined,
      });

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
