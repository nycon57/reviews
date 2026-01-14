import type {
  SurveyInvitationEmailData,
  SurveyReminderEmailData,
  NewReviewNotificationEmailData,
  ReviewPendingApprovalEmailData,
  ReviewApprovedEmailData,
  ReviewRejectedEmailData,
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
  <title>ReviewHub</title>
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
              <p style="margin: 0 0 8px 0;">Powered by ReviewHub</p>
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
        <span style="font-size: 24px; font-weight: bold; color: #18181b;">ReviewHub</span>
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
        <span style="font-size: 24px; font-weight: bold; color: #18181b;">ReviewHub</span>
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
        <span style="font-size: 24px; font-weight: bold; color: #18181b;">ReviewHub</span>
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
        <span style="font-size: 24px; font-weight: bold; color: #18181b;">ReviewHub</span>
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
