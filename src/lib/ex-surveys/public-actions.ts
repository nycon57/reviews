/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - ex_surveys tables not in generated types yet
"use server";

import { createClient } from "@/lib/supabase/server";
import { EXSurveyAnswer, TenureRange } from "@/types/ex-survey.types";
import { Question } from "@/types/survey.types";

// Public EX Survey type for the form
export interface PublicEXSurvey {
  id: string;
  name: string;
  description?: string;
  surveyType: string;
  isAnonymous: boolean;
  status: string;
  endDate?: string;
  template: {
    questions: Question[];
    branding?: {
      logo?: string;
      primaryColor?: string;
      backgroundColor?: string;
      showProgressBar?: boolean;
      showQuestionNumbers?: boolean;
    };
    thankYouConfig?: {
      title: string;
      message: string;
    };
  };
  organization: {
    id: string;
    name: string;
    logoUrl?: string;
    primaryColor?: string;
  };
}

// Get EX survey by invitation token
export async function getEXSurveyByToken(
  token: string
): Promise<{ success: boolean; data?: PublicEXSurvey; error?: string }> {
  const supabase = await createClient();

  // Get the invitation with survey and template
  const { data: invitation, error } = await supabase
    .from("ex_survey_invitations")
    .select(`
      *,
      ex_surveys!inner (
        id,
        name,
        description,
        survey_type,
        is_anonymous,
        status,
        end_date,
        organization_id,
        ex_survey_templates (
          questions,
          branding,
          thank_you_config
        )
      )
    `)
    .eq("token", token)
    .single();

  if (error || !invitation) {
    return { success: false, error: "Survey not found or invalid token" };
  }

  const survey = invitation.ex_surveys;

  // Check survey status
  if (survey.status !== "active") {
    if (survey.status === "closed" || survey.status === "archived") {
      return { success: false, error: "This survey has ended" };
    }
    if (survey.status === "draft" || survey.status === "scheduled") {
      return { success: false, error: "This survey is not yet available" };
    }
  }

  // Check if already completed
  if (invitation.status === "completed") {
    return { success: false, error: "You have already completed this survey" };
  }

  // Check expiration
  if (survey.end_date && new Date(survey.end_date) < new Date()) {
    return { success: false, error: "This survey has expired" };
  }

  // Get organization info
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, logo_url, primary_color")
    .eq("id", survey.organization_id)
    .single();

  // Mark as opened if not already
  if (invitation.status === "pending" || invitation.status === "sent") {
    await supabase
      .from("ex_survey_invitations")
      .update({
        status: "opened",
        opened_at: new Date().toISOString(),
      })
      .eq("id", invitation.id);
  }

  return {
    success: true,
    data: {
      id: survey.id,
      name: survey.name,
      description: survey.description,
      surveyType: survey.survey_type,
      isAnonymous: survey.is_anonymous,
      status: survey.status,
      endDate: survey.end_date,
      template: {
        questions: survey.ex_survey_templates?.questions || [],
        branding: survey.ex_survey_templates?.branding,
        thankYouConfig: survey.ex_survey_templates?.thank_you_config,
      },
      organization: {
        id: org?.id || "",
        name: org?.name || "",
        logoUrl: org?.logo_url,
        primaryColor: org?.primary_color,
      },
    },
  };
}

// Submit EX survey response
export async function submitEXSurveyResponse(
  token: string,
  answers: EXSurveyAnswer[],
  metadata?: {
    tenureRange?: TenureRange;
    roleCategory?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get the invitation
  const { data: invitation, error: inviteError } = await supabase
    .from("ex_survey_invitations")
    .select(`
      *,
      ex_surveys!inner (
        id,
        is_anonymous,
        status,
        end_date,
        organization_id
      ),
      users!inner (
        department_id
      )
    `)
    .eq("token", token)
    .single();

  if (inviteError || !invitation) {
    return { success: false, error: "Invalid survey token" };
  }

  const survey = invitation.ex_surveys;

  // Validate survey is still active
  if (survey.status !== "active") {
    return { success: false, error: "This survey is no longer accepting responses" };
  }

  // Check if already completed
  if (invitation.status === "completed") {
    return { success: false, error: "You have already submitted a response" };
  }

  // Check expiration
  if (survey.end_date && new Date(survey.end_date) < new Date()) {
    return { success: false, error: "This survey has expired" };
  }

  // Extract eNPS score (first NPS question)
  let enpsScore: number | undefined;
  let overallRating: number | undefined;

  for (const answer of answers) {
    if (answer.questionType === "nps" && enpsScore === undefined) {
      enpsScore = typeof answer.value === "number" ? answer.value : parseInt(answer.value as string, 10);
    }
    if (answer.questionType === "rating" && overallRating === undefined) {
      overallRating = typeof answer.value === "number" ? answer.value : parseInt(answer.value as string, 10);
    }
  }

  // For anonymous surveys, we don't link to the invitation after submission
  const responseData: Record<string, unknown> = {
    survey_id: survey.id,
    invitation_id: survey.is_anonymous ? null : invitation.id,
    department_id: invitation.users?.department_id,
    tenure_range: metadata?.tenureRange,
    role_category: metadata?.roleCategory,
    is_anonymous: survey.is_anonymous,
    answers: answers,
    enps_score: enpsScore,
    overall_rating: overallRating,
    submitted_at: new Date().toISOString(),
  };

  const { error: insertError } = await supabase.from("ex_survey_responses").insert(responseData);

  if (insertError) {
    console.error("Failed to insert EX survey response:", insertError);
    return { success: false, error: "Failed to submit response. Please try again." };
  }

  // Update invitation status
  await supabase
    .from("ex_survey_invitations")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", invitation.id);

  return { success: true };
}

// Get survey completion status by token
export async function getEXSurveyStatus(
  token: string
): Promise<{
  success: boolean;
  data?: { status: string; completedAt?: string };
  error?: string;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ex_survey_invitations")
    .select("status, completed_at")
    .eq("token", token)
    .single();

  if (error || !data) {
    return { success: false, error: "Survey invitation not found" };
  }

  return {
    success: true,
    data: {
      status: data.status,
      completedAt: data.completed_at,
    },
  };
}
