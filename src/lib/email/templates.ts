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
  const subject = `${data.organizationName} - Share a video testimonial with ${data.loanOfficerName}`;

  const logoSection = data.organizationLogoUrl
    ? `<img src="${data.organizationLogoUrl}" alt="${data.organizationName}" style="max-height: 48px; max-width: 200px;">`
    : `<span style="font-size: 24px; font-weight: bold; color: #18181b;">${data.organizationName}</span>`;

  const photoSection = data.loanOfficerPhotoUrl
    ? `<img src="${data.loanOfficerPhotoUrl}" alt="${data.loanOfficerName}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;">`
    : `<div style="width: 80px; height: 80px; border-radius: 50%; background-color: #e4e4e7; display: inline-flex; align-items: center; justify-content: center; font-size: 32px; color: #71717a;">${data.loanOfficerName.charAt(0)}</div>`;

  const transactionText = data.transactionType
    ? `for your recent ${data.transactionType}`
    : "for your recent transaction";

  const durationText = data.maxDurationSeconds
    ? `(up to ${formatDuration(data.maxDurationSeconds)})`
    : "(up to 2 minutes)";

  const promptSection = data.promptText
    ? `
        <div style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase;">
            Suggested Topic
          </p>
          <p style="margin: 0; font-size: 14px; color: #52525b;">
            ${data.promptText}
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
          Hi ${data.customerName},
        </h1>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #52525b; text-align: center;">
          Thank you ${transactionText} with ${data.loanOfficerName}. We'd love for you to share a short video testimonial about your experience!
        </p>

        <div style="background-color: #eff6ff; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #1e40af;">
            <strong>Recording a video is easy:</strong><br>
            Just click the button below and record from your phone or computer ${durationText}
          </p>
        </div>

        ${promptSection}

        <div style="text-align: center; margin-top: 32px;">
          <a href="${data.requestUrl}" style="display: inline-block; padding: 16px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
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
  const subject = `Reminder: Share a video testimonial with ${data.loanOfficerName}`;

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
          We noticed you haven't had a chance to share your video testimonial about your experience with ${data.loanOfficerName} yet.
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
          <a href="${data.requestUrl}" style="display: inline-block; padding: 16px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
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
  const subject = `Final reminder: Share your video testimonial`;

  const unsubscribeUrl = `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(data.toEmail)}`;

  const content = `
    <tr>
      <td style="padding: 32px; text-align: center; background-color: #fef2f2; border-bottom: 1px solid #fecaca;">
        <span style="font-size: 24px; font-weight: bold; color: #18181b;">${data.organizationName}</span>
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
          Hi ${data.customerName},
        </h1>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #52525b; text-align: center;">
          This is your last chance to share a video testimonial about your experience with ${data.loanOfficerName}.
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
          <a href="${data.requestUrl}" style="display: inline-block; padding: 16px 32px; background-color: #dc2626; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
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
  const subject = `New video testimonial from ${data.customerName}`;

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
          Great News, ${data.loanOfficerName}!
        </h1>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #52525b; text-align: center;">
          ${data.customerName} has submitted a video testimonial about their experience with you.
        </p>

        <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #71717a;">
            Submitted on ${data.submittedAt}
          </p>
          ${durationText ? `<p style="margin: 0; font-size: 14px; color: #71717a;">${durationText}</p>` : ""}
        </div>

        <p style="margin: 0 0 32px 0; font-size: 16px; color: #52525b; text-align: center;">
          The video is now pending review. You'll be notified once it's approved and ready to share.
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

// Video testimonial approved notification email template (sent to LO)
export function getVideoTestimonialApprovedEmail(
  data: VideoTestimonialApprovedEmailData
): {
  subject: string;
  html: string;
} {
  const subject = `Your video testimonial from ${data.customerName} is approved!`;

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
          Great News, ${data.loanOfficerName}!
        </h1>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #52525b; text-align: center;">
          The video testimonial from ${data.customerName} has been approved and is now available in your library.
        </p>

        <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #71717a;">
            Approved on ${data.approvedAt}
          </p>
        </div>

        <p style="margin: 0 0 32px 0; font-size: 16px; color: #52525b; text-align: center;">
          You can now share this video testimonial on your profile, social media, and marketing materials.
        </p>

        <div style="text-align: center;">
          <a href="${data.dashboardUrl}" style="display: inline-block; padding: 16px 32px; background-color: #16a34a; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
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
  const subject = `Video Testimonial Pending Approval: ${data.customerName}`;

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
          Hi ${data.managerName}, a new video testimonial for ${data.loanOfficerName} requires your review and approval.
        </p>

        <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 8px 0;">
                <span style="font-size: 14px; color: #71717a;">Customer:</span>
                <span style="font-size: 14px; color: #18181b; font-weight: 600; float: right;">${data.customerName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e4e4e7;">
                <span style="font-size: 14px; color: #71717a;">Loan Officer:</span>
                <span style="font-size: 14px; color: #18181b; font-weight: 600; float: right;">${data.loanOfficerName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e4e4e7;">
                <span style="font-size: 14px; color: #71717a;">Submitted:</span>
                <span style="font-size: 14px; color: #18181b; float: right;">${data.submittedAt}</span>
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
