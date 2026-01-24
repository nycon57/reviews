import { Resend } from "resend";

// Singleton Resend client instance
let resendClient: Resend | null = null;

export function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error("Missing RESEND_API_KEY environment variable");
    }

    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

// Email configuration
export const emailConfig = {
  // Default from address - should be configured per organization
  defaultFromEmail:
    process.env.RESEND_FROM_EMAIL || "noreply@repwell.ai",
  defaultFromName: process.env.RESEND_FROM_NAME || "RepWell",

  // Base URL for links in emails
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // Webhook signing secret (set in Resend dashboard)
  webhookSecret: process.env.RESEND_WEBHOOK_SECRET,

  // Physical mailing address for CAN-SPAM compliance (REQUIRED)
  // Update this to your actual company address
  companyAddress:
    process.env.COMPANY_MAILING_ADDRESS ||
    "Repwell Inc., 123 Main Street, Suite 100, San Francisco, CA 94105",

  // Unsubscribe email for List-Unsubscribe header
  unsubscribeEmail: process.env.UNSUBSCRIBE_EMAIL || "unsubscribe@repwell.ai",
};

export function getFromAddress(orgName?: string): string {
  const name = orgName || emailConfig.defaultFromName;
  return `${name} <${emailConfig.defaultFromEmail}>`;
}
