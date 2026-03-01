import "server-only";

import type { EmailContext } from "@/lib/email/orchestration/types";

/**
 * Generic email sender for campaign sequences.
 * Resolves template from step config and generates email content.
 *
 * Register via: registerEmailSender("custom", campaignEmailSender)
 */
export async function campaignEmailSender(
  ctx: EmailContext
): Promise<{ subject: string; html: string }> {
  const templateName = ctx.step.template?.name ?? "campaign_generic";
  const subjectOverride = ctx.step.template?.subjectOverride;
  const userName = ctx.user.full_name || "there";
  const variant = ctx.variant;

  // Build subject
  const subject =
    subjectOverride ||
    buildSubjectFromTemplate(templateName, userName, variant);

  // Build HTML body
  const html = buildHtmlFromTemplate(templateName, {
    userName,
    userEmail: ctx.user.email,
    variant,
    stepNumber: ctx.step.step,
    metadata: ctx.metadata,
  });

  return { subject, html };
}

function buildSubjectFromTemplate(
  templateName: string,
  userName: string,
  variant?: string
): string {
  // Map known template patterns to subjects
  const templateSubjects: Record<string, string> = {
    survey_invitation: `${userName}, we'd love your feedback`,
    review_request: `${userName}, how was your experience?`,
    follow_up_reminder: `Just checking in, ${userName}`,
    thank_you: `Thank you for your feedback, ${userName}`,
    welcome: `Welcome aboard, ${userName}!`,
    onboarding: `Getting started with your account`,
  };

  // Check for exact match or partial match
  for (const [key, subject] of Object.entries(templateSubjects)) {
    if (templateName.includes(key)) {
      return variant ? `${subject} (${variant})` : subject;
    }
  }

  // Fallback: humanize the template name
  const humanized = templateName
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return variant ? `${humanized} (${variant})` : humanized;
}

function buildHtmlFromTemplate(
  templateName: string,
  context: {
    userName: string;
    userEmail: string;
    variant?: string;
    stepNumber: number;
    metadata: Record<string, unknown>;
  }
): string {
  // Minimal HTML email template — in production, this would resolve
  // from a template library (react-email, stored templates, etc.)
  const campaignName = String(context.metadata.campaign_id ?? "Campaign");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hi ${escapeHtml(context.userName)},</p>
  <p>This is step ${context.stepNumber} of your ${escapeHtml(templateName)} sequence.</p>
  ${context.variant ? `<p><small>Variant: ${escapeHtml(context.variant)}</small></p>` : ""}
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
  <p style="color: #6b7280; font-size: 12px;">
    Campaign: ${escapeHtml(campaignName)}<br>
    You're receiving this because you're enrolled in this workflow.
  </p>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
