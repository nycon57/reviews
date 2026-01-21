import type {
  SurveyInvitationEmailData,
  SurveyReminderEmailData,
  NewReviewNotificationEmailData,
  ReviewPendingApprovalEmailData,
  ReviewApprovedEmailData,
  ReviewRejectedEmailData,
  ScheduledReportEmailData,
  NegativeReviewAlertEmailData,
  NotificationDigestEmailData,
  ReviewResponseToReviewerEmailData,
  VideoTestimonialInvitationEmailData,
  VideoTestimonialReminderEmailData,
  VideoTestimonialReceivedEmailData,
  VideoTestimonialApprovedEmailData,
  VideoTestimonialPendingApprovalEmailData,
} from "./types";
import { emailConfig } from "./client";

// ============================================================================
// Security Helper Functions
// ============================================================================

// HTML escape function to prevent XSS attacks
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// URL validation function to prevent javascript: and data: URI injection
function sanitizeUrl(url: string): string {
  const allowedProtocols = ["http:", "https:", "mailto:"];
  try {
    const parsed = new URL(url);
    if (!allowedProtocols.includes(parsed.protocol)) {
      return "#"; // Return safe fallback
    }
    return url;
  } catch {
    return "#"; // Invalid URL, return safe fallback
  }
}

// Subject line sanitization to prevent email header injection
function sanitizeSubject(subject: string): string {
  return subject.replace(/[\r\n]/g, "");
}

// ============================================================================
// Display Helper Functions
// ============================================================================

// Helper to generate star rating HTML
function generateStarRating(rating: number): string {
  const fullStars = Math.floor(rating);
  const stars: string[] = [];
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push("★");
    } else {
      stars.push("☆");
    }
  }
  return `<span style="color: #f59e0b; font-size: 24px;">${stars.join("")}</span>`;
}

// Base email wrapper
function wrapInEmailTemplate(
  content: string,
  unsubscribeUrl: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RepWell</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          ${content}
        </table>
        <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
          <tr>
            <td align="center" style="color: #71717a; font-size: 12px; padding: 0 20px;">
              <p style="margin: 0 0 8px 0;">Powered by RepWell</p>
              <p style="margin: 0;">
                <a href="${unsubscribeUrl}" style="color: #71717a; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

// Survey invitation email template
export function getSurveyInvitationEmail(data: SurveyInvitationEmailData): {
  subject: string;
  html: string;
} {
  const subject = `${data.organizationName} - Share your feedback with ${data.loanOfficerName}`;

  const logoSection = data.organizationLogoUrl
    ? `<img src="${data.organizationLogoUrl}" alt="${data.organizationName}" style="max-height: 48px; max-width: 200px;">`
    : `<span style="font-size: 24px; font-weight: bold; color: #18181b;">${data.organizationName}</span>`;

  const photoSection = data.loanOfficerPhotoUrl
    ? `<img src="${data.loanOfficerPhotoUrl}" alt="${data.loanOfficerName}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;">`
    : `<div style="width: 80px; height: 80px; border-radius: 50%; background-color: #e4e4e7; display: flex; align-items: center; justify-content: center; font-size: 32px; color: #71717a;">${data.loanOfficerName.charAt(0)}</div>`;

  const transactionText = data.transactionType
    ? `for your recent ${data.transactionType}`
    : "for your recent transaction";

  const unsubscribeUrl = `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(data.toEmail)}`;

  const content = `
    <tr>
      <td style="padding: 32px; text-align: center; background-color: #fafafa; border-bottom: 1px solid #e4e4e7;">
        ${logoSection}
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          ${photoSection}
        </div>
        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">
          Hi ${data.customerName},
        </h1>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #52525b; text-align: center;">
          Thank you ${transactionText} with ${data.loanOfficerName}. We'd love to hear about your experience!
        </p>
        <p style="margin: 0 0 32px 0; font-size: 16px; color: #52525b; text-align: center;">
          Your feedback helps us provide better service and helps others make informed decisions.
        </p>
        <div style="text-align: center;">
          <a href="${data.surveyUrl}" style="display: inline-block; padding: 16px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
            Share Your Feedback
          </a>
        </div>
        <p style="margin: 32px 0 0 0; font-size: 14px; color: #71717a; text-align: center;">
          This survey takes less than 2 minutes to complete.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInEmailTemplate(content, unsubscribeUrl),
  };
}

// 3-day reminder email template
export function getSurveyReminder3DayEmail(data: SurveyReminderEmailData): {
  subject: string;
  html: string;
} {
  const subject = `Reminder: Share your feedback with ${data.loanOfficerName}`;

  const unsubscribeUrl = `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(data.toEmail)}`;

  const content = `
    <tr>
      <td style="padding: 32px; text-align: center; background-color: #fafafa; border-bottom: 1px solid #e4e4e7;">
        <span style="font-size: 24px; font-weight: bold; color: #18181b;">${data.organizationName}</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 32px;">
        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">
          Hi ${data.customerName},
        </h1>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #52525b; text-align: center;">
          We noticed you haven't had a chance to share your feedback about your experience with ${data.loanOfficerName} yet.
        </p>
        <p style="margin: 0 0 32px 0; font-size: 16px; color: #52525b; text-align: center;">
          Your opinion matters to us! It only takes a couple of minutes.
        </p>
        <div style="text-align: center;">
          <a href="${data.surveyUrl}" style="display: inline-block; padding: 16px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
            Complete Survey
          </a>
        </div>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInEmailTemplate(content, unsubscribeUrl),
  };
}

// 7-day reminder email template
export function getSurveyReminder7DayEmail(data: SurveyReminderEmailData): {
  subject: string;
  html: string;
} {
  const subject = `Last chance: Share your feedback with ${data.loanOfficerName}`;

  const unsubscribeUrl = `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(data.toEmail)}`;

  const content = `
    <tr>
      <td style="padding: 32px; text-align: center; background-color: #fafafa; border-bottom: 1px solid #e4e4e7;">
        <span style="font-size: 24px; font-weight: bold; color: #18181b;">${data.organizationName}</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 32px;">
        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">
          Hi ${data.customerName},
        </h1>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #52525b; text-align: center;">
          This is your last reminder to share your feedback about your experience with ${data.loanOfficerName}.
        </p>
        <p style="margin: 0 0 32px 0; font-size: 16px; color: #52525b; text-align: center;">
          We value your opinion and would really appreciate hearing from you before this survey expires.
        </p>
        <div style="text-align: center;">
          <a href="${data.surveyUrl}" style="display: inline-block; padding: 16px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
            Complete Survey Now
          </a>
        </div>
        <p style="margin: 32px 0 0 0; font-size: 14px; color: #71717a; text-align: center;">
          This survey link will expire soon.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInEmailTemplate(content, unsubscribeUrl),
  };
}

// New review notification email template
export function getNewReviewNotificationEmail(
  data: NewReviewNotificationEmailData
): {
  subject: string;
  html: string;
} {
  const subject = `New ${data.rating}-star review from ${data.customerName}`;

  const unsubscribeUrl = `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(data.toEmail)}`;

  const reviewTextSection = data.reviewText
    ? `
        <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0; font-size: 16px; color: #52525b; font-style: italic;">
            "${data.reviewText}"
          </p>
        </div>
      `
    : "";

  const content = `
    <tr>
      <td style="padding: 32px; text-align: center; background-color: #fafafa; border-bottom: 1px solid #e4e4e7;">
        <span style="font-size: 24px; font-weight: bold; color: #18181b;">RepWell</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 32px;">
        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">
          New Review Received!
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 16px; color: #52525b; text-align: center;">
          Hi ${data.loanOfficerName}, you've received a new review from ${data.customerName}.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          ${generateStarRating(data.rating)}
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #71717a;">
            ${data.rating} out of 5 stars
          </p>
        </div>
        ${reviewTextSection}
        <p style="margin: 0 0 32px 0; font-size: 14px; color: #71717a; text-align: center;">
          Received on ${data.reviewDate}
        </p>
        <div style="text-align: center;">
          <a href="${data.dashboardUrl}" style="display: inline-block; padding: 16px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
            View in Dashboard
          </a>
        </div>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInEmailTemplate(content, unsubscribeUrl),
  };
}

// Review pending approval email template (sent to managers)
export function getReviewPendingApprovalEmail(
  data: ReviewPendingApprovalEmailData
): {
  subject: string;
  html: string;
} {
  const subject = `Review Pending Approval: ${data.rating}-star from ${data.customerName}`;

  const unsubscribeUrl = `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(data.toEmail)}`;

  const reviewTextSection = data.reviewText
    ? `
        <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0; font-size: 16px; color: #52525b; font-style: italic;">
            "${data.reviewText}"
          </p>
        </div>
      `
    : `
        <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0; font-size: 14px; color: #71717a; text-align: center;">
            No written review provided
          </p>
        </div>
      `;

  const content = `
    <tr>
      <td style="padding: 32px; text-align: center; background-color: #fef3c7; border-bottom: 1px solid #fcd34d;">
        <span style="font-size: 24px; font-weight: bold; color: #18181b;">RepWell</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 32px;">
        <div style="background-color: #fef3c7; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
          <span style="font-size: 14px; font-weight: 600; color: #92400e;">Action Required</span>
        </div>
        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">
          New Review Awaiting Approval
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 16px; color: #52525b; text-align: center;">
          Hi ${data.managerName}, a new review for ${data.loanOfficerName} requires your approval.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          ${generateStarRating(data.rating)}
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #71717a;">
            ${data.rating} out of 5 stars from ${data.customerName}
          </p>
        </div>
        ${reviewTextSection}
        <p style="margin: 0 0 32px 0; font-size: 14px; color: #71717a; text-align: center;">
          Submitted on ${data.reviewDate}
        </p>
        <div style="text-align: center;">
          <a href="${data.approvalQueueUrl}" style="display: inline-block; padding: 16px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
            Review &amp; Approve
          </a>
        </div>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInEmailTemplate(content, unsubscribeUrl),
  };
}

// Review approved notification email template (sent to loan officers)
export function getReviewApprovedEmail(data: ReviewApprovedEmailData): {
  subject: string;
  html: string;
} {
  const subject = `Your ${data.rating}-star review has been approved!`;

  const unsubscribeUrl = `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(data.toEmail)}`;

  const reviewTextSection = data.reviewText
    ? `
        <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0; font-size: 16px; color: #52525b; font-style: italic;">
            "${data.reviewText}"
          </p>
        </div>
      `
    : "";

  const content = `
    <tr>
      <td style="padding: 32px; text-align: center; background-color: #dcfce7; border-bottom: 1px solid #86efac;">
        <span style="font-size: 24px; font-weight: bold; color: #18181b;">RepWell</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="display: inline-block; background-color: #dcfce7; color: #166534; padding: 8px 16px; border-radius: 999px; font-size: 14px; font-weight: 600;">
            Approved
          </span>
        </div>
        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">
          Great News, ${data.loanOfficerName}!
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 16px; color: #52525b; text-align: center;">
          Your review from ${data.customerName} has been approved and is now live on your profile.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          ${generateStarRating(data.rating)}
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #71717a;">
            ${data.rating} out of 5 stars
          </p>
        </div>
        ${reviewTextSection}
        <div style="text-align: center; margin-top: 32px;">
          <a href="${data.dashboardUrl}" style="display: inline-block; padding: 16px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
            View Your Reviews
          </a>
        </div>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInEmailTemplate(content, unsubscribeUrl),
  };
}

// Review rejected notification email template (sent to loan officers)
export function getReviewRejectedEmail(data: ReviewRejectedEmailData): {
  subject: string;
  html: string;
} {
  const subject = `Review Update: ${data.rating}-star review not published`;

  const unsubscribeUrl = `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(data.toEmail)}`;

  const content = `
    <tr>
      <td style="padding: 32px; text-align: center; background-color: #fef2f2; border-bottom: 1px solid #fecaca;">
        <span style="font-size: 24px; font-weight: bold; color: #18181b;">RepWell</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="display: inline-block; background-color: #fef2f2; color: #991b1b; padding: 8px 16px; border-radius: 999px; font-size: 14px; font-weight: 600;">
            Not Published
          </span>
        </div>
        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">
          Review Update
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 16px; color: #52525b; text-align: center;">
          Hi ${data.loanOfficerName}, the ${data.rating}-star review from ${data.customerName} was not approved for publication.
        </p>
        <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #18181b;">
            Reason:
          </p>
          <p style="margin: 0; font-size: 16px; color: #52525b;">
            ${data.rejectionReason}
          </p>
        </div>
        <p style="margin: 0 0 32px 0; font-size: 14px; color: #71717a; text-align: center;">
          If you have questions about this decision, please contact your manager.
        </p>
        <div style="text-align: center;">
          <a href="${data.dashboardUrl}" style="display: inline-block; padding: 16px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
            View Dashboard
          </a>
        </div>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInEmailTemplate(content, unsubscribeUrl),
  };
}

// Scheduled report email template
export function getScheduledReportEmail(data: ScheduledReportEmailData): {
  subject: string;
  html: string;
} {
  const subject = `${data.reportName} - ${data.reportPeriod}`;

  const unsubscribeUrl = `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(data.toEmail)}`;

  // Generate star rating display
  const ratingDisplay = generateStarRating(Math.round(data.summary.averageRating));

  // Determine NPS color based on score
  const npsColor = data.summary.npsScore >= 50 ? "#16a34a" : data.summary.npsScore >= 0 ? "#f59e0b" : "#dc2626";

  const content = `
    <tr>
      <td style="padding: 32px; text-align: center; background-color: #6366f1; border-bottom: 1px solid #4f46e5;">
        <span style="font-size: 24px; font-weight: bold; color: #ffffff;">${data.organizationName}</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 32px;">
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">
          ${data.reportName}
        </h1>
        <p style="margin: 0 0 32px 0; font-size: 14px; color: #71717a; text-align: center;">
          ${data.reportPeriod}
        </p>

        <!-- Summary Stats Grid -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
          <tr>
            <td style="padding: 16px; background-color: #f4f4f5; border-radius: 8px 0 0 0; text-align: center; border-right: 1px solid #e4e4e7; border-bottom: 1px solid #e4e4e7;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #71717a; text-transform: uppercase;">Total Reviews</p>
              <p style="margin: 0; font-size: 24px; font-weight: 700; color: #18181b;">${data.summary.totalReviews}</p>
            </td>
            <td style="padding: 16px; background-color: #f4f4f5; border-radius: 0 8px 0 0; text-align: center; border-bottom: 1px solid #e4e4e7;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #71717a; text-transform: uppercase;">Avg Rating</p>
              <p style="margin: 0; font-size: 24px; font-weight: 700; color: #18181b;">${data.summary.averageRating.toFixed(1)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px; background-color: #f4f4f5; border-radius: 0 0 0 8px; text-align: center; border-right: 1px solid #e4e4e7;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #71717a; text-transform: uppercase;">NPS Score</p>
              <p style="margin: 0; font-size: 24px; font-weight: 700; color: ${npsColor};">${data.summary.npsScore}</p>
            </td>
            <td style="padding: 16px; background-color: #f4f4f5; border-radius: 0 0 8px 0; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #71717a; text-transform: uppercase;">CSAT Score</p>
              <p style="margin: 0; font-size: 24px; font-weight: 700; color: #18181b;">${data.summary.csatScore}%</p>
            </td>
          </tr>
        </table>

        <div style="text-align: center; margin: 24px 0;">
          ${ratingDisplay}
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #71717a;">
            Average Rating: ${data.summary.averageRating.toFixed(1)} out of 5
          </p>
        </div>

        <div style="text-align: center; margin-top: 32px;">
          <a href="${data.reportUrl}" style="display: inline-block; padding: 16px 32px; background-color: #6366f1; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
            View Full Report
          </a>
        </div>
        <p style="margin: 24px 0 0 0; font-size: 12px; color: #71717a; text-align: center;">
          This report was automatically generated and sent to you as part of your scheduled reports.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInEmailTemplate(content, unsubscribeUrl),
  };
}

// Negative review alert email template (instant alert for low ratings)
export function getNegativeReviewAlertEmail(
  data: NegativeReviewAlertEmailData
): {
  subject: string;
  html: string;
} {
  const subject = `Alert: ${data.rating}-star review requires attention`;

  const unsubscribeUrl = `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(data.toEmail)}`;

  const reviewTextSection = data.reviewText
    ? `
        <div style="background-color: #fef2f2; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #fecaca;">
          <p style="margin: 0; font-size: 16px; color: #52525b; font-style: italic;">
            "${data.reviewText}"
          </p>
        </div>
      `
    : `
        <div style="background-color: #fef2f2; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #fecaca;">
          <p style="margin: 0; font-size: 14px; color: #71717a; text-align: center;">
            No written review provided
          </p>
        </div>
      `;

  const content = `
    <tr>
      <td style="padding: 32px; text-align: center; background-color: #dc2626; border-bottom: 1px solid #b91c1c;">
        <span style="font-size: 24px; font-weight: bold; color: #ffffff;">Urgent Alert</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="display: inline-block; background-color: #fef2f2; color: #991b1b; padding: 8px 16px; border-radius: 999px; font-size: 14px; font-weight: 600;">
            Low Rating Alert
          </span>
        </div>
        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">
          Attention Required
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 16px; color: #52525b; text-align: center;">
          Hi ${data.recipientName}, a customer has left a low rating that may require immediate attention.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          ${generateStarRating(data.rating)}
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #dc2626; font-weight: 600;">
            ${data.rating} out of 5 stars from ${data.customerName}
          </p>
        </div>
        ${reviewTextSection}
        <p style="margin: 0 0 32px 0; font-size: 14px; color: #71717a; text-align: center;">
          Received on ${data.reviewDate}
        </p>
        <div style="text-align: center;">
          <a href="${data.dashboardUrl}/reviews/${data.reviewId}" style="display: inline-block; padding: 16px 32px; background-color: #dc2626; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
            View & Respond
          </a>
        </div>
        <p style="margin: 24px 0 0 0; font-size: 12px; color: #71717a; text-align: center;">
          Quick response to negative reviews can help improve customer satisfaction.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInEmailTemplate(content, unsubscribeUrl),
  };
}

// Notification digest email template
export function getNotificationDigestEmail(
  data: NotificationDigestEmailData
): {
  subject: string;
  html: string;
} {
  const subject = `Your ${data.digestPeriod} RepWell Digest`;

  const unsubscribeUrl = `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(data.toEmail)}`;

  // Generate notification items HTML
  const notificationItems = data.notifications
    .slice(0, 10) // Limit to 10 items in email
    .map(
      (notification) => `
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid #e4e4e7;">
            <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #18181b;">
              ${notification.title}
            </p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #52525b;">
              ${notification.message}
            </p>
            <p style="margin: 0; font-size: 12px; color: #71717a;">
              ${notification.createdAt}
            </p>
          </td>
        </tr>
      `
    )
    .join("");

  const moreNotificationsText =
    data.notifications.length > 10
      ? `<p style="margin: 16px 0 0 0; font-size: 14px; color: #71717a; text-align: center;">
          And ${data.notifications.length - 10} more notifications...
        </p>`
      : "";

  // Determine if there are negative reviews requiring attention
  const alertSection =
    data.summary.negativeReviews > 0
      ? `
        <div style="background-color: #fef2f2; border-radius: 8px; padding: 16px; margin-bottom: 24px; border: 1px solid #fecaca; text-align: center;">
          <span style="font-size: 14px; font-weight: 600; color: #991b1b;">
            ⚠️ ${data.summary.negativeReviews} negative review${data.summary.negativeReviews > 1 ? "s" : ""} require${data.summary.negativeReviews === 1 ? "s" : ""} attention
          </span>
        </div>
      `
      : "";

  const content = `
    <tr>
      <td style="padding: 32px; text-align: center; background-color: #6366f1; border-bottom: 1px solid #4f46e5;">
        <span style="font-size: 24px; font-weight: bold; color: #ffffff;">RepWell</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 32px;">
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">
          Your ${data.digestPeriod} Digest
        </h1>
        <p style="margin: 0 0 32px 0; font-size: 14px; color: #71717a; text-align: center;">
          Hi ${data.recipientName}, here's a summary of your recent activity.
        </p>

        ${alertSection}

        <!-- Summary Stats Grid -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
          <tr>
            <td style="padding: 16px; background-color: #f4f4f5; border-radius: 8px 0 0 8px; text-align: center; border-right: 1px solid #e4e4e7;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #71717a; text-transform: uppercase;">Notifications</p>
              <p style="margin: 0; font-size: 24px; font-weight: 700; color: #18181b;">${data.summary.totalNotifications}</p>
            </td>
            <td style="padding: 16px; background-color: #f4f4f5; text-align: center; border-right: 1px solid #e4e4e7;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #71717a; text-transform: uppercase;">New Reviews</p>
              <p style="margin: 0; font-size: 24px; font-weight: 700; color: #16a34a;">${data.summary.newReviews}</p>
            </td>
            <td style="padding: 16px; background-color: #f4f4f5; border-radius: 0 8px 8px 0; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #71717a; text-transform: uppercase;">Needs Attention</p>
              <p style="margin: 0; font-size: 24px; font-weight: 700; color: ${data.summary.negativeReviews > 0 ? "#dc2626" : "#18181b"};">${data.summary.negativeReviews}</p>
            </td>
          </tr>
        </table>

        <!-- Notification List -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 16px; background-color: #f4f4f5; border-bottom: 2px solid #e4e4e7;">
              <p style="margin: 0; font-size: 14px; font-weight: 600; color: #18181b;">Recent Activity</p>
            </td>
          </tr>
          ${notificationItems}
        </table>
        ${moreNotificationsText}

        <div style="text-align: center; margin-top: 32px;">
          <a href="${data.dashboardUrl}" style="display: inline-block; padding: 16px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
            View Dashboard
          </a>
        </div>
        <p style="margin: 24px 0 0 0; font-size: 12px; color: #71717a; text-align: center;">
          You're receiving this digest based on your notification preferences.
          <a href="${data.dashboardUrl}/settings" style="color: #6366f1;">Manage preferences</a>
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInEmailTemplate(content, unsubscribeUrl),
  };
}

// Review response to reviewer email template (sent to customer when LO responds)
export function getReviewResponseToReviewerEmail(
  data: ReviewResponseToReviewerEmailData
): {
  subject: string;
  html: string;
} {
  const subject = `${data.loanOfficerName} responded to your review`;

  const unsubscribeUrl = `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(data.toEmail)}`;

  const originalReviewSection = data.originalReviewText
    ? `
        <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase;">
            Your Review
          </p>
          <div style="text-align: center; margin-bottom: 12px;">
            ${generateStarRating(data.rating)}
          </div>
          <p style="margin: 0; font-size: 14px; color: #52525b; font-style: italic;">
            "${data.originalReviewText}"
          </p>
        </div>
      `
    : `
        <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase;">
            Your Review
          </p>
          <div style="text-align: center;">
            ${generateStarRating(data.rating)}
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #71717a;">
              ${data.rating}-star rating
            </p>
          </div>
        </div>
      `;

  const content = `
    <tr>
      <td style="padding: 32px; text-align: center; background-color: #fafafa; border-bottom: 1px solid #e4e4e7;">
        <span style="font-size: 24px; font-weight: bold; color: #18181b;">${data.organizationName}</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 32px;">
        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">
          Thank You for Your Feedback!
        </h1>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #52525b; text-align: center;">
          Hi ${data.customerName}, ${data.loanOfficerName} has responded to your review.
        </p>

        ${originalReviewSection}

        <div style="background-color: #dcfce7; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #16a34a;">
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #166534; text-transform: uppercase;">
            Response from ${data.loanOfficerName}
          </p>
          <p style="margin: 0; font-size: 16px; color: #052e16; white-space: pre-wrap;">
            ${data.responseText}
          </p>
        </div>

        <p style="margin: 32px 0 0 0; font-size: 14px; color: #71717a; text-align: center;">
          We appreciate you taking the time to share your experience with us.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInEmailTemplate(content, unsubscribeUrl),
  };
}

// ============================================================================
// Video Testimonial Email Templates
// ============================================================================

// Helper to format duration
function formatDuration(seconds?: number): string {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

// Video testimonial invitation email template (sent to customer)
export function getVideoTestimonialInvitationEmail(
  data: VideoTestimonialInvitationEmailData
): {
  subject: string;
  html: string;
} {
  // Escape user-provided data to prevent XSS
  const safeOrgName = escapeHtml(data.organizationName);
  const safeLOName = escapeHtml(data.loanOfficerName);
  const safeCustomerName = escapeHtml(data.customerName);
  const safeTransactionType = data.transactionType
    ? escapeHtml(data.transactionType)
    : null;
  const safePromptText = data.promptText ? escapeHtml(data.promptText) : null;

  // Sanitize subject to prevent header injection
  const subject = sanitizeSubject(
    `${data.organizationName} - Share a video testimonial with ${data.loanOfficerName}`
  );

  // Sanitize URLs to prevent javascript: URI injection
  const safeLogoUrl = data.organizationLogoUrl
    ? sanitizeUrl(data.organizationLogoUrl)
    : null;
  const safePhotoUrl = data.loanOfficerPhotoUrl
    ? sanitizeUrl(data.loanOfficerPhotoUrl)
    : null;
  const safeRequestUrl = sanitizeUrl(data.requestUrl);

  const logoSection = safeLogoUrl
    ? `<img src="${safeLogoUrl}" alt="${safeOrgName}" style="max-height: 48px; max-width: 200px;">`
    : `<span style="font-size: 24px; font-weight: bold; color: #18181b;">${safeOrgName}</span>`;

  const photoSection = safePhotoUrl
    ? `<img src="${safePhotoUrl}" alt="${safeLOName}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;">`
    : `<div style="width: 80px; height: 80px; border-radius: 50%; background-color: #e4e4e7; display: inline-flex; align-items: center; justify-content: center; font-size: 32px; color: #71717a;">${escapeHtml(data.loanOfficerName.charAt(0))}</div>`;

  const transactionText = safeTransactionType
    ? `for your recent ${safeTransactionType}`
    : "for your recent transaction";

  const durationText = data.maxDurationSeconds
    ? `(up to ${formatDuration(data.maxDurationSeconds)})`
    : "(up to 2 minutes)";

  const promptSection = safePromptText
    ? `
        <div style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase;">
            Suggested Topic
          </p>
          <p style="margin: 0; font-size: 14px; color: #52525b;">
            ${safePromptText}
          </p>
        </div>
      `
    : "";

  const unsubscribeUrl = `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(data.toEmail)}`;

  const content = `
    <tr>
      <td style="padding: 32px; text-align: center; background-color: #fafafa; border-bottom: 1px solid #e4e4e7;">
        ${logoSection}
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          ${photoSection}
        </div>
        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">
          Hi ${safeCustomerName},
        </h1>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #52525b; text-align: center;">
          Thank you ${transactionText} with ${safeLOName}. We'd love for you to share a short video testimonial about your experience!
        </p>

        <div style="background-color: #eff6ff; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #1e40af;">
            <strong>Recording a video is easy:</strong><br>
            Just click the button below and record from your phone or computer ${durationText}
          </p>
        </div>

        ${promptSection}

        <div style="text-align: center; margin-top: 32px;">
          <a href="${safeRequestUrl}" style="display: inline-block; padding: 16px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
            Record Video Testimonial
          </a>
        </div>
        <p style="margin: 32px 0 0 0; font-size: 14px; color: #71717a; text-align: center;">
          Your testimonial helps others make informed decisions and means a lot to us.
        </p>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInEmailTemplate(content, unsubscribeUrl),
  };
}

// Video testimonial 3-day reminder email template
export function getVideoTestimonialReminder3DayEmail(
  data: VideoTestimonialReminderEmailData
): {
  subject: string;
  html: string;
} {
  // Escape user-provided data to prevent XSS
  const safeOrgName = escapeHtml(data.organizationName);
  const safeLOName = escapeHtml(data.loanOfficerName);
  const safeCustomerName = escapeHtml(data.customerName);

  // Sanitize subject to prevent header injection
  const subject = sanitizeSubject(
    `Reminder: Share a video testimonial with ${data.loanOfficerName}`
  );

  // Sanitize URL to prevent javascript: URI injection
  const safeRequestUrl = sanitizeUrl(data.requestUrl);

  const unsubscribeUrl = `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(data.toEmail)}`;

  const content = `
    <tr>
      <td style="padding: 32px; text-align: center; background-color: #fafafa; border-bottom: 1px solid #e4e4e7;">
        <span style="font-size: 24px; font-weight: bold; color: #18181b;">${safeOrgName}</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 32px;">
        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">
          Hi ${safeCustomerName},
        </h1>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #52525b; text-align: center;">
          We noticed you haven't had a chance to share your video testimonial about your experience with ${safeLOName} yet.
        </p>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #52525b; text-align: center;">
          Your story matters! A quick video testimonial takes less than 2 minutes and helps others make informed decisions.
        </p>

        <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #92400e;">
            <strong>Don't miss out!</strong> This invitation will expire soon.
          </p>
        </div>

        <div style="text-align: center; margin-top: 32px;">
          <a href="${safeRequestUrl}" style="display: inline-block; padding: 16px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
            Record Your Video
          </a>
        </div>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInEmailTemplate(content, unsubscribeUrl),
  };
}

// Video testimonial 7-day (final) reminder email template
export function getVideoTestimonialReminder7DayEmail(
  data: VideoTestimonialReminderEmailData
): {
  subject: string;
  html: string;
} {
  // Escape user-provided data to prevent XSS
  const safeOrgName = escapeHtml(data.organizationName);
  const safeLOName = escapeHtml(data.loanOfficerName);
  const safeCustomerName = escapeHtml(data.customerName);

  // Sanitize subject to prevent header injection
  const subject = sanitizeSubject(`Final reminder: Share your video testimonial`);

  // Sanitize URL to prevent javascript: URI injection
  const safeRequestUrl = sanitizeUrl(data.requestUrl);

  const unsubscribeUrl = `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(data.toEmail)}`;

  const content = `
    <tr>
      <td style="padding: 32px; text-align: center; background-color: #fef2f2; border-bottom: 1px solid #fecaca;">
        <span style="font-size: 24px; font-weight: bold; color: #18181b;">${safeOrgName}</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="display: inline-block; background-color: #fef2f2; color: #991b1b; padding: 8px 16px; border-radius: 999px; font-size: 14px; font-weight: 600;">
            Final Reminder
          </span>
        </div>
        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">
          Hi ${safeCustomerName},
        </h1>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #52525b; text-align: center;">
          This is your last chance to share a video testimonial about your experience with ${safeLOName}.
        </p>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #52525b; text-align: center;">
          We value your feedback and would really appreciate hearing from you before this invitation expires.
        </p>

        <div style="background-color: #fee2e2; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #991b1b;">
            <strong>This invitation expires soon!</strong><br>
            Please record your video testimonial today.
          </p>
        </div>

        <div style="text-align: center; margin-top: 32px;">
          <a href="${safeRequestUrl}" style="display: inline-block; padding: 16px 32px; background-color: #dc2626; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
            Record Video Now
          </a>
        </div>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInEmailTemplate(content, unsubscribeUrl),
  };
}

// Video testimonial received notification email template (sent to LO)
export function getVideoTestimonialReceivedEmail(
  data: VideoTestimonialReceivedEmailData
): {
  subject: string;
  html: string;
} {
  // Escape user-provided data to prevent XSS
  const safeLOName = escapeHtml(data.loanOfficerName);
  const safeCustomerName = escapeHtml(data.customerName);
  const safeSubmittedAt = escapeHtml(data.submittedAt);

  // Sanitize subject to prevent header injection
  const subject = sanitizeSubject(
    `New video testimonial from ${data.customerName}`
  );

  // Sanitize URL and include testimonialId for direct navigation
  const safeDashboardUrl = sanitizeUrl(
    `${data.dashboardUrl}/testimonials/${data.testimonialId}`
  );

  const unsubscribeUrl = `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(data.toEmail)}`;

  const durationText = data.durationSeconds
    ? `Duration: ${formatDuration(data.durationSeconds)}`
    : "";

  const content = `
    <tr>
      <td style="padding: 32px; text-align: center; background-color: #eff6ff; border-bottom: 1px solid #bfdbfe;">
        <span style="font-size: 24px; font-weight: bold; color: #18181b;">RepWell</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="display: inline-block; background-color: #dbeafe; color: #1d4ed8; padding: 8px 16px; border-radius: 999px; font-size: 14px; font-weight: 600;">
            New Video Testimonial
          </span>
        </div>
        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">
          Great News, ${safeLOName}!
        </h1>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #52525b; text-align: center;">
          ${safeCustomerName} has submitted a video testimonial about their experience with you.
        </p>

        <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #71717a;">
            Submitted on ${safeSubmittedAt}
          </p>
          ${durationText ? `<p style="margin: 0; font-size: 14px; color: #71717a;">${durationText}</p>` : ""}
        </div>

        <p style="margin: 0 0 32px 0; font-size: 16px; color: #52525b; text-align: center;">
          The video is now pending review. You'll be notified once it's approved and ready to share.
        </p>

        <div style="text-align: center;">
          <a href="${safeDashboardUrl}" style="display: inline-block; padding: 16px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
            View in Dashboard
          </a>
        </div>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInEmailTemplate(content, unsubscribeUrl),
  };
}

// Video testimonial approved notification email template (sent to LO)
export function getVideoTestimonialApprovedEmail(
  data: VideoTestimonialApprovedEmailData
): {
  subject: string;
  html: string;
} {
  // Escape user-provided data to prevent XSS
  const safeLOName = escapeHtml(data.loanOfficerName);
  const safeCustomerName = escapeHtml(data.customerName);
  const safeApprovedAt = escapeHtml(data.approvedAt);

  // Sanitize subject to prevent header injection
  const subject = sanitizeSubject(
    `Your video testimonial from ${data.customerName} is approved!`
  );

  // Sanitize URL and include testimonialId for direct navigation
  const safeDashboardUrl = sanitizeUrl(
    `${data.dashboardUrl}/testimonials/${data.testimonialId}`
  );

  const unsubscribeUrl = `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(data.toEmail)}`;

  const content = `
    <tr>
      <td style="padding: 32px; text-align: center; background-color: #dcfce7; border-bottom: 1px solid #86efac;">
        <span style="font-size: 24px; font-weight: bold; color: #18181b;">RepWell</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="display: inline-block; background-color: #dcfce7; color: #166534; padding: 8px 16px; border-radius: 999px; font-size: 14px; font-weight: 600;">
            Approved
          </span>
        </div>
        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">
          Great News, ${safeLOName}!
        </h1>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #52525b; text-align: center;">
          The video testimonial from ${safeCustomerName} has been approved and is now available in your library.
        </p>

        <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #71717a;">
            Approved on ${safeApprovedAt}
          </p>
        </div>

        <p style="margin: 0 0 32px 0; font-size: 16px; color: #52525b; text-align: center;">
          You can now share this video testimonial on your profile, social media, and marketing materials.
        </p>

        <div style="text-align: center;">
          <a href="${safeDashboardUrl}" style="display: inline-block; padding: 16px 32px; background-color: #16a34a; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
            View & Share
          </a>
        </div>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInEmailTemplate(content, unsubscribeUrl),
  };
}

// Video testimonial pending approval notification email template (sent to manager)
export function getVideoTestimonialPendingApprovalEmail(
  data: VideoTestimonialPendingApprovalEmailData
): {
  subject: string;
  html: string;
} {
  // Escape user-provided data to prevent XSS
  const safeManagerName = escapeHtml(data.managerName);
  const safeLOName = escapeHtml(data.loanOfficerName);
  const safeCustomerName = escapeHtml(data.customerName);
  const safeSubmittedAt = escapeHtml(data.submittedAt);

  // Sanitize subject to prevent header injection
  const subject = sanitizeSubject(
    `Video Testimonial Pending Approval: ${data.customerName}`
  );

  // Sanitize URL and include testimonialId for direct navigation
  const safeApprovalUrl = sanitizeUrl(
    `${data.approvalQueueUrl}?testimonialId=${data.testimonialId}`
  );

  const unsubscribeUrl = `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(data.toEmail)}`;

  const durationText = data.durationSeconds
    ? `Duration: ${formatDuration(data.durationSeconds)}`
    : "";

  const content = `
    <tr>
      <td style="padding: 32px; text-align: center; background-color: #fef3c7; border-bottom: 1px solid #fcd34d;">
        <span style="font-size: 24px; font-weight: bold; color: #18181b;">RepWell</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 32px;">
        <div style="background-color: #fef3c7; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
          <span style="font-size: 14px; font-weight: 600; color: #92400e;">Action Required</span>
        </div>
        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">
          New Video Testimonial Awaiting Approval
        </h1>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #52525b; text-align: center;">
          Hi ${safeManagerName}, a new video testimonial for ${safeLOName} requires your review and approval.
        </p>

        <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 8px 0;">
                <span style="font-size: 14px; color: #71717a;">Customer:</span>
                <span style="font-size: 14px; color: #18181b; font-weight: 600; float: right;">${safeCustomerName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e4e4e7;">
                <span style="font-size: 14px; color: #71717a;">Loan Officer:</span>
                <span style="font-size: 14px; color: #18181b; font-weight: 600; float: right;">${safeLOName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e4e4e7;">
                <span style="font-size: 14px; color: #71717a;">Submitted:</span>
                <span style="font-size: 14px; color: #18181b; float: right;">${safeSubmittedAt}</span>
              </td>
            </tr>
            ${
              durationText
                ? `<tr>
              <td style="padding: 8px 0; border-top: 1px solid #e4e4e7;">
                <span style="font-size: 14px; color: #71717a;">Duration:</span>
                <span style="font-size: 14px; color: #18181b; float: right;">${formatDuration(data.durationSeconds)}</span>
              </td>
            </tr>`
                : ""
            }
          </table>
        </div>

        <div style="text-align: center;">
          <a href="${safeApprovalUrl}" style="display: inline-block; padding: 16px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
            Review &amp; Approve
          </a>
        </div>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInEmailTemplate(content, unsubscribeUrl),
  };
}

// =============================================================================
// SURVEY LIFECYCLE EMAIL TEMPLATES
// =============================================================================

/**
 * Survey completion thank you email
 * Sent immediately after a customer submits a survey response
 */
export function getSurveyCompletionThankYouEmail(data: {
  customerName: string;
  loanOfficerName: string;
  loanOfficerPhotoUrl?: string;
  organizationName: string;
  organizationLogoUrl?: string;
  rating: number;
  surveyType: "nps" | "csat" | "post_transaction" | "general";
  feedbackText?: string;
  transactionType?: string;
  toEmail: string;
}): { subject: string; html: string } {
  const safeCustomerName = escapeHtml(data.customerName);
  const safeLOName = escapeHtml(data.loanOfficerName);
  const safeOrgName = escapeHtml(data.organizationName);
  const safeFeedback = data.feedbackText ? escapeHtml(data.feedbackText) : null;
  const safeTransactionType = data.transactionType
    ? escapeHtml(data.transactionType)
    : null;
  const unsubscribeUrl = `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(data.toEmail)}`;

  // Personalize subject based on survey type
  const subjectByType: Record<string, string> = {
    nps: `Thank you for your feedback, ${data.customerName}!`,
    csat: `We appreciate your feedback, ${data.customerName}!`,
    post_transaction: `Thank you for sharing your experience, ${data.customerName}!`,
    general: `Thank you for your feedback, ${data.customerName}!`,
  };

  const subject = sanitizeSubject(subjectByType[data.surveyType] || subjectByType.general);

  // Personalize message based on rating
  const ratingMessage =
    data.rating >= 4
      ? "We're thrilled that you had a great experience!"
      : data.rating === 3
        ? "We value your honest feedback and are always looking to improve."
        : "We're sorry to hear that your experience wasn't ideal. Your feedback helps us improve.";

  // Generate star rating display
  const starRating = Array.from({ length: 5 }, (_, i) =>
    i < data.rating
      ? '<span style="color: #facc15; font-size: 24px;">★</span>'
      : '<span style="color: #e4e4e7; font-size: 24px;">★</span>'
  ).join("");

  // Sanitize URLs to prevent javascript: URI injection
  const safePhotoUrl = data.loanOfficerPhotoUrl
    ? sanitizeUrl(data.loanOfficerPhotoUrl)
    : null;
  const safeLogoUrl = data.organizationLogoUrl
    ? sanitizeUrl(data.organizationLogoUrl)
    : null;

  // LO photo or initials
  const loPhotoHtml = safePhotoUrl
    ? `<img src="${safePhotoUrl}" alt="${safeLOName}" width="64" height="64" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid #84a98c;" />`
    : `<div style="width: 64px; height: 64px; border-radius: 50%; background-color: #cad2c5; display: inline-flex; align-items: center; justify-content: center; font-family: sans-serif; font-size: 24px; font-weight: 600; color: #52796f;">${safeLOName.charAt(0).toUpperCase()}</div>`;

  // Organization logo
  const orgLogoHtml = safeLogoUrl
    ? `<img src="${safeLogoUrl}" alt="${safeOrgName}" height="48" style="height: 48px; max-width: 200px; width: auto;" />`
    : `<span style="font-family: Georgia, serif; font-size: 24px; font-weight: bold; color: #354f52;">${safeOrgName}</span>`;

  const content = `
    <tr>
      <td style="padding: 0;">
        <!-- Gradient accent bar -->
        <div style="height: 4px; background: linear-gradient(to right, #52796f, #84a98c);"></div>

        <!-- Header with org logo -->
        <div style="padding: 32px; text-align: center; border-bottom: 1px solid #e2e8e4;">
          ${orgLogoHtml}
        </div>

        <!-- Main content -->
        <div style="padding: 40px 32px; text-align: center;">
          <!-- LO Photo -->
          <div style="margin-bottom: 24px;">
            ${loPhotoHtml}
          </div>

          <!-- Thank you message -->
          <h1 style="margin: 0 0 16px 0; font-family: Georgia, serif; font-size: 28px; font-weight: bold; color: #354f52; line-height: 1.25;">
            Thank You, ${safeCustomerName}!
          </h1>

          <p style="margin: 0 0 24px 0; font-family: 'Source Sans 3', sans-serif; font-size: 16px; color: #52796f; line-height: 1.625;">
            Your feedback means the world to us and helps ${safeLOName} continue providing excellent service.
          </p>

          <!-- Star rating display -->
          <div style="margin: 32px 0; padding: 24px; background-color: #f8faf8; border-radius: 12px;">
            <p style="margin: 0 0 12px 0; font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #52796f; text-transform: uppercase; letter-spacing: 0.05em;">
              Your Rating
            </p>
            <div style="margin-bottom: 16px;">
              ${starRating}
            </div>
            <p style="margin: 0; font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #354f52;">
              ${escapeHtml(ratingMessage)}
            </p>
          </div>

          ${
            safeFeedback
              ? `
          <!-- Feedback quote -->
          <div style="margin: 24px 0; padding: 20px; background-color: #cad2c5; border-radius: 8px; border-left: 4px solid #52796f;">
            <p style="margin: 0; font-family: 'Source Sans 3', sans-serif; font-size: 14px; font-style: italic; color: #2f3e46; line-height: 1.625;">
              "${safeFeedback}"
            </p>
          </div>
          `
              : ""
          }

          ${
            safeTransactionType
              ? `
          <p style="margin: 24px 0 0 0; font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #84a98c;">
            Transaction type: ${safeTransactionType}
          </p>
          `
              : ""
          }
        </div>

        <!-- Footer message -->
        <div style="padding: 24px 32px; background-color: #f8faf8; border-top: 1px solid #e2e8e4; text-align: center;">
          <p style="margin: 0; font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #52796f;">
            Thank you for choosing ${safeOrgName}. We appreciate your business!
          </p>
        </div>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInEmailTemplate(content, unsubscribeUrl),
  };
}

/**
 * Survey high-rating follow-up email
 * Sent to customers who gave 4-5 stars to encourage Google review
 */
export function getSurveyHighRatingFollowUpEmail(data: {
  customerName: string;
  loanOfficerName: string;
  loanOfficerPhotoUrl?: string;
  organizationName: string;
  organizationLogoUrl?: string;
  rating: number;
  googleReviewUrl?: string;
  surveyType: "nps" | "csat" | "post_transaction" | "general";
  transactionType?: string;
  toEmail: string;
  subjectVariant?: "question" | "statement";
}): { subject: string; html: string } {
  const safeCustomerName = escapeHtml(data.customerName);
  const safeLOName = escapeHtml(data.loanOfficerName);
  const safeOrgName = escapeHtml(data.organizationName);
  const safeGoogleUrl = data.googleReviewUrl
    ? sanitizeUrl(data.googleReviewUrl)
    : null;
  const unsubscribeUrl = `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(data.toEmail)}`;

  // A/B test subject lines - question vs statement format
  const subjectVariants = {
    question: `${data.customerName}, would you share your experience on Google?`,
    statement: `Your feedback can help others, ${data.customerName}`,
  };
  const subjectVariant = data.subjectVariant || "question";
  const subject = sanitizeSubject(subjectVariants[subjectVariant]);

  // Sanitize URLs to prevent javascript: URI injection
  const safePhotoUrl = data.loanOfficerPhotoUrl
    ? sanitizeUrl(data.loanOfficerPhotoUrl)
    : null;
  const safeLogoUrl = data.organizationLogoUrl
    ? sanitizeUrl(data.organizationLogoUrl)
    : null;

  // LO photo or initials
  const loPhotoHtml = safePhotoUrl
    ? `<img src="${safePhotoUrl}" alt="${safeLOName}" width="80" height="80" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #84a98c;" />`
    : `<div style="width: 80px; height: 80px; border-radius: 50%; background-color: #cad2c5; display: inline-flex; align-items: center; justify-content: center; font-family: sans-serif; font-size: 28px; font-weight: 600; color: #52796f;">${safeLOName.charAt(0).toUpperCase()}</div>`;

  // Organization logo
  const orgLogoHtml = safeLogoUrl
    ? `<img src="${safeLogoUrl}" alt="${safeOrgName}" height="48" style="height: 48px; max-width: 200px; width: auto;" />`
    : `<span style="font-family: Georgia, serif; font-size: 24px; font-weight: bold; color: #354f52;">${safeOrgName}</span>`;

  // Star rating display
  const starRating = Array.from({ length: 5 }, (_, i) =>
    i < data.rating
      ? '<span style="color: #facc15; font-size: 28px;">★</span>'
      : '<span style="color: #e4e4e7; font-size: 28px;">★</span>'
  ).join("");

  const content = `
    <tr>
      <td style="padding: 0;">
        <!-- Gradient accent bar -->
        <div style="height: 4px; background: linear-gradient(to right, #52796f, #84a98c);"></div>

        <!-- Header with org logo -->
        <div style="padding: 32px; text-align: center; border-bottom: 1px solid #e2e8e4;">
          ${orgLogoHtml}
        </div>

        <!-- Main content -->
        <div style="padding: 40px 32px; text-align: center;">
          <!-- LO Photo -->
          <div style="margin-bottom: 24px;">
            ${loPhotoHtml}
          </div>

          <!-- Thank you message -->
          <h1 style="margin: 0 0 16px 0; font-family: Georgia, serif; font-size: 28px; font-weight: bold; color: #354f52; line-height: 1.25;">
            We're So Glad You Had a Great Experience!
          </h1>

          <p style="margin: 0 0 24px 0; font-family: 'Source Sans 3', sans-serif; font-size: 16px; color: #52796f; line-height: 1.625;">
            Hi ${safeCustomerName}, thank you again for your wonderful ${data.rating}-star rating! ${safeLOName} truly appreciates your kind words.
          </p>

          <!-- Rating reminder -->
          <div style="margin: 24px 0; padding: 20px; background-color: #f8faf8; border-radius: 12px;">
            <p style="margin: 0 0 8px 0; font-family: 'Source Sans 3', sans-serif; font-size: 12px; color: #84a98c; text-transform: uppercase; letter-spacing: 0.05em;">
              Your Rating
            </p>
            ${starRating}
          </div>

          <!-- Google review request -->
          <div style="margin: 32px 0; padding: 32px; background: linear-gradient(to bottom, #f8faf8, #ffffff); border-radius: 12px; border: 1px solid #e2e8e4;">
            <h2 style="margin: 0 0 16px 0; font-family: Georgia, serif; font-size: 20px; font-weight: bold; color: #354f52;">
              Share Your Experience on Google
            </h2>

            <p style="margin: 0 0 24px 0; font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #52796f; line-height: 1.625;">
              Your review helps others find trustworthy professionals like ${safeLOName}. It only takes a moment and means the world to us.
            </p>

            ${
              safeGoogleUrl
                ? `
            <!-- Large mobile-optimized CTA button -->
            <a href="${safeGoogleUrl}" style="display: inline-block; padding: 18px 48px; background-color: #52796f; color: #ffffff; text-decoration: none; font-family: 'Source Sans 3', sans-serif; font-weight: 600; font-size: 16px; border-radius: 8px; min-width: 200px;">
              ⭐ Leave a Google Review
            </a>
            `
                : `
            <p style="margin: 0; font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #84a98c; font-style: italic;">
              A Google review link will be provided shortly.
            </p>
            `
            }
          </div>

          <!-- Benefits of reviewing -->
          <div style="margin: 24px 0;">
            <p style="margin: 0; font-family: 'Source Sans 3', sans-serif; font-size: 13px; color: #84a98c; line-height: 1.625;">
              💡 <strong>Why review?</strong> Your honest feedback helps future homebuyers make informed decisions and rewards great service.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 24px 32px; background-color: #f8faf8; border-top: 1px solid #e2e8e4; text-align: center;">
          <p style="margin: 0; font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #52796f;">
            Thank you for choosing ${safeOrgName}!
          </p>
        </div>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInEmailTemplate(content, unsubscribeUrl),
  };
}

/**
 * Survey low-rating follow-up email
 * Sent to customers who gave 1-2 stars with empathy + internal escalation
 */
export function getSurveyLowRatingFollowUpEmail(data: {
  customerName: string;
  loanOfficerName: string;
  loanOfficerPhotoUrl?: string;
  organizationName: string;
  organizationLogoUrl?: string;
  rating: number;
  feedbackText?: string;
  surveyType: "nps" | "csat" | "post_transaction" | "general";
  transactionType?: string;
  supportContactEmail?: string;
  supportContactPhone?: string;
  toEmail: string;
}): { subject: string; html: string } {
  const safeCustomerName = escapeHtml(data.customerName);
  const safeLOName = escapeHtml(data.loanOfficerName);
  const safeOrgName = escapeHtml(data.organizationName);
  const safeFeedback = data.feedbackText ? escapeHtml(data.feedbackText) : null;
  const safeSupportEmail = data.supportContactEmail
    ? escapeHtml(data.supportContactEmail)
    : null;
  const safeSupportPhone = data.supportContactPhone
    ? escapeHtml(data.supportContactPhone)
    : null;
  const unsubscribeUrl = `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(data.toEmail)}`;

  const subject = sanitizeSubject(`${data.customerName}, we want to make things right`);

  // Sanitize URLs to prevent javascript: URI injection
  const safeLogoUrl = data.organizationLogoUrl
    ? sanitizeUrl(data.organizationLogoUrl)
    : null;

  // Organization logo
  const orgLogoHtml = safeLogoUrl
    ? `<img src="${safeLogoUrl}" alt="${safeOrgName}" height="48" style="height: 48px; max-width: 200px; width: auto;" />`
    : `<span style="font-family: Georgia, serif; font-size: 24px; font-weight: bold; color: #354f52;">${safeOrgName}</span>`;

  const content = `
    <tr>
      <td style="padding: 0;">
        <!-- Gradient accent bar -->
        <div style="height: 4px; background: linear-gradient(to right, #52796f, #84a98c);"></div>

        <!-- Header with org logo -->
        <div style="padding: 32px; text-align: center; border-bottom: 1px solid #e2e8e4;">
          ${orgLogoHtml}
        </div>

        <!-- Main content -->
        <div style="padding: 40px 32px;">
          <!-- Empathetic opening -->
          <h1 style="margin: 0 0 16px 0; font-family: Georgia, serif; font-size: 28px; font-weight: bold; color: #354f52; line-height: 1.25; text-align: center;">
            We're Sorry, ${safeCustomerName}
          </h1>

          <p style="margin: 0 0 24px 0; font-family: 'Source Sans 3', sans-serif; font-size: 16px; color: #52796f; line-height: 1.625; text-align: center;">
            We're truly sorry to hear that your experience with ${safeLOName} at ${safeOrgName} didn't meet your expectations. Your feedback is invaluable in helping us improve.
          </p>

          ${
            safeFeedback
              ? `
          <!-- Feedback acknowledgment -->
          <div style="margin: 24px 0; padding: 20px; background-color: #fef2f2; border-radius: 8px; border-left: 4px solid #c47c7c;">
            <p style="margin: 0 0 8px 0; font-family: 'Source Sans 3', sans-serif; font-size: 12px; color: #991b1b; text-transform: uppercase; letter-spacing: 0.05em;">
              Your Feedback
            </p>
            <p style="margin: 0; font-family: 'Source Sans 3', sans-serif; font-size: 14px; font-style: italic; color: #2f3e46; line-height: 1.625;">
              "${safeFeedback}"
            </p>
          </div>
          `
              : ""
          }

          <!-- Commitment to improvement -->
          <div style="margin: 32px 0; padding: 24px; background-color: #f8faf8; border-radius: 12px; text-align: center;">
            <h2 style="margin: 0 0 16px 0; font-family: Georgia, serif; font-size: 20px; font-weight: bold; color: #354f52;">
              We Want to Make This Right
            </h2>

            <p style="margin: 0 0 24px 0; font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #52796f; line-height: 1.625;">
              A member of our team will be reaching out to you shortly to discuss your experience and see how we can address your concerns. Your satisfaction is our priority.
            </p>

            <!-- Contact information -->
            <div style="margin: 24px 0; padding: 16px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8e4;">
              <p style="margin: 0 0 8px 0; font-family: 'Source Sans 3', sans-serif; font-size: 12px; color: #84a98c; text-transform: uppercase; letter-spacing: 0.05em;">
                Need Immediate Assistance?
              </p>
              ${
                safeSupportEmail
                  ? `
              <p style="margin: 8px 0 0 0; font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #354f52;">
                📧 <a href="mailto:${safeSupportEmail}" style="color: #52796f; text-decoration: none;">${safeSupportEmail}</a>
              </p>
              `
                  : ""
              }
              ${
                safeSupportPhone
                  ? `
              <p style="margin: 8px 0 0 0; font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #354f52;">
                📞 <a href="tel:${safeSupportPhone}" style="color: #52796f; text-decoration: none;">${safeSupportPhone}</a>
              </p>
              `
                  : ""
              }
              ${
                !safeSupportEmail && !safeSupportPhone
                  ? `
              <p style="margin: 8px 0 0 0; font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #52796f;">
                Please reply to this email and we'll get back to you promptly.
              </p>
              `
                  : ""
              }
            </div>
          </div>

          <!-- Sincere apology -->
          <p style="margin: 24px 0 0 0; font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #52796f; line-height: 1.625; text-align: center;">
            We genuinely appreciate you taking the time to share your experience. Every piece of feedback helps us serve our customers better.
          </p>
        </div>

        <!-- Footer -->
        <div style="padding: 24px 32px; background-color: #f8faf8; border-top: 1px solid #e2e8e4; text-align: center;">
          <p style="margin: 0; font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #52796f;">
            The Team at ${safeOrgName}
          </p>
        </div>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInEmailTemplate(content, unsubscribeUrl),
  };
}

/**
 * Survey response received notification email
 * Sent to the loan officer when a customer submits a survey response
 */
export function getSurveyResponseReceivedNotificationEmail(data: {
  loanOfficerName: string;
  customerName: string;
  customerEmail?: string;
  rating: number;
  feedbackText?: string;
  surveyType: "nps" | "csat" | "post_transaction" | "general";
  transactionType?: string;
  submittedAt: string;
  dashboardUrl: string;
  surveyResponseId: string;
  toEmail: string;
}): { subject: string; html: string } {
  const safeLOName = escapeHtml(data.loanOfficerName);
  const safeCustomerName = escapeHtml(data.customerName);
  const safeCustomerEmail = data.customerEmail
    ? escapeHtml(data.customerEmail)
    : null;
  const safeFeedback = data.feedbackText ? escapeHtml(data.feedbackText) : null;
  const safeTransactionType = data.transactionType
    ? escapeHtml(data.transactionType)
    : null;
  const safeDashboardUrl = sanitizeUrl(data.dashboardUrl);
  const safeSubmittedAt = escapeHtml(data.submittedAt);
  const unsubscribeUrl = `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(data.toEmail)}`;

  // Subject line based on rating
  const ratingEmoji =
    data.rating >= 4 ? "🌟" : data.rating === 3 ? "📊" : "⚠️";
  const subject = sanitizeSubject(`${ratingEmoji} New ${data.rating}-star survey response from ${data.customerName}`);

  // Survey type label
  const surveyTypeLabels: Record<string, string> = {
    nps: "NPS Survey",
    csat: "CSAT Survey",
    post_transaction: "Post-Transaction Survey",
    general: "Feedback Survey",
  };
  const surveyTypeLabel =
    surveyTypeLabels[data.surveyType] || surveyTypeLabels.general;

  // Star rating display
  const starRating = Array.from({ length: 5 }, (_, i) =>
    i < data.rating
      ? '<span style="color: #facc15; font-size: 24px;">★</span>'
      : '<span style="color: #e4e4e7; font-size: 24px;">★</span>'
  ).join("");

  // Rating color and status
  const ratingConfig =
    data.rating >= 4
      ? {
          bgColor: "#dcfce7",
          borderColor: "#86efac",
          textColor: "#166534",
          status: "Positive",
        }
      : data.rating === 3
        ? {
            bgColor: "#fef3c7",
            borderColor: "#fcd34d",
            textColor: "#92400e",
            status: "Neutral",
          }
        : {
            bgColor: "#fef2f2",
            borderColor: "#fecaca",
            textColor: "#991b1b",
            status: "Needs Attention",
          };

  const content = `
    <tr>
      <td style="padding: 0;">
        <!-- Status header -->
        <div style="padding: 24px 32px; background-color: ${ratingConfig.bgColor}; border-bottom: 1px solid ${ratingConfig.borderColor}; text-align: center;">
          <h1 style="margin: 0; font-family: Georgia, serif; font-size: 24px; font-weight: bold; color: ${ratingConfig.textColor};">
            New Survey Response Received
          </h1>
          <p style="margin: 8px 0 0 0; font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: ${ratingConfig.textColor};">
            ${ratingConfig.status} • ${surveyTypeLabel}
          </p>
        </div>

        <!-- Main content -->
        <div style="padding: 32px;">
          <!-- Greeting -->
          <p style="margin: 0 0 24px 0; font-family: 'Source Sans 3', sans-serif; font-size: 16px; color: #2f3e46; line-height: 1.5;">
            Hi ${safeLOName},
          </p>

          <p style="margin: 0 0 24px 0; font-family: 'Source Sans 3', sans-serif; font-size: 16px; color: #52796f; line-height: 1.5;">
            You've received a new survey response from <strong style="color: #354f52;">${safeCustomerName}</strong>.
          </p>

          <!-- Rating display -->
          <div style="margin: 24px 0; padding: 24px; background-color: #f8faf8; border-radius: 12px; text-align: center;">
            <p style="margin: 0 0 12px 0; font-family: 'Source Sans 3', sans-serif; font-size: 12px; color: #84a98c; text-transform: uppercase; letter-spacing: 0.05em;">
              Customer Rating
            </p>
            ${starRating}
            <p style="margin: 12px 0 0 0; font-family: 'Source Sans 3', sans-serif; font-size: 28px; font-weight: bold; color: ${ratingConfig.textColor};">
              ${data.rating} out of 5
            </p>
          </div>

          ${
            safeFeedback
              ? `
          <!-- Customer feedback -->
          <div style="margin: 24px 0; padding: 20px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8e4;">
            <p style="margin: 0 0 8px 0; font-family: 'Source Sans 3', sans-serif; font-size: 12px; color: #84a98c; text-transform: uppercase; letter-spacing: 0.05em;">
              Customer Feedback
            </p>
            <p style="margin: 0; font-family: 'Source Sans 3', sans-serif; font-size: 14px; font-style: italic; color: #2f3e46; line-height: 1.625;">
              "${safeFeedback}"
            </p>
          </div>
          `
              : ""
          }

          <!-- Response details -->
          <div style="margin: 24px 0; padding: 16px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8e4;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding: 8px 0;">
                  <span style="font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #84a98c;">Customer:</span>
                  <span style="font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #2f3e46; font-weight: 600; float: right;">${safeCustomerName}</span>
                </td>
              </tr>
              ${
                safeCustomerEmail
                  ? `
              <tr>
                <td style="padding: 8px 0; border-top: 1px solid #e2e8e4;">
                  <span style="font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #84a98c;">Email:</span>
                  <span style="font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #52796f; float: right;">
                    <a href="mailto:${safeCustomerEmail}" style="color: #52796f; text-decoration: none;">${safeCustomerEmail}</a>
                  </span>
                </td>
              </tr>
              `
                  : ""
              }
              <tr>
                <td style="padding: 8px 0; border-top: 1px solid #e2e8e4;">
                  <span style="font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #84a98c;">Survey Type:</span>
                  <span style="font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #2f3e46; float: right;">${surveyTypeLabel}</span>
                </td>
              </tr>
              ${
                safeTransactionType
                  ? `
              <tr>
                <td style="padding: 8px 0; border-top: 1px solid #e2e8e4;">
                  <span style="font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #84a98c;">Transaction:</span>
                  <span style="font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #2f3e46; float: right;">${safeTransactionType}</span>
                </td>
              </tr>
              `
                  : ""
              }
              <tr>
                <td style="padding: 8px 0; border-top: 1px solid #e2e8e4;">
                  <span style="font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #84a98c;">Submitted:</span>
                  <span style="font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #2f3e46; float: right;">${safeSubmittedAt}</span>
                </td>
              </tr>
            </table>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${safeDashboardUrl}" style="display: inline-block; padding: 16px 32px; background-color: #52796f; color: #ffffff; text-decoration: none; font-family: 'Source Sans 3', sans-serif; font-weight: 600; font-size: 16px; border-radius: 8px;">
              View Full Response
            </a>
          </div>

          ${
            data.rating <= 2
              ? `
          <!-- Low rating action prompt -->
          <div style="margin: 24px 0; padding: 16px; background-color: #fef2f2; border-radius: 8px; border-left: 4px solid #c47c7c; text-align: left;">
            <p style="margin: 0; font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #991b1b;">
              <strong>Action Required:</strong> This customer may benefit from a personal follow-up. Consider reaching out to address their concerns directly.
            </p>
          </div>
          `
              : ""
          }
        </div>

        <!-- Footer -->
        <div style="padding: 24px 32px; background-color: #f8faf8; border-top: 1px solid #e2e8e4; text-align: center;">
          <p style="margin: 0; font-family: 'Source Sans 3', sans-serif; font-size: 14px; color: #52796f;">
            Response ID: ${escapeHtml(data.surveyResponseId)}
          </p>
        </div>
      </td>
    </tr>
  `;

  return {
    subject,
    html: wrapInEmailTemplate(content, unsubscribeUrl),
  };
}
