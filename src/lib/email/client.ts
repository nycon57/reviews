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
    process.env.RESEND_FROM_EMAIL || "noreply@reviewhub.com",
  defaultFromName: process.env.RESEND_FROM_NAME || "ReviewHub",

  // Base URL for links in emails
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // Webhook signing secret (set in Resend dashboard)
  webhookSecret: process.env.RESEND_WEBHOOK_SECRET,
};

export function getFromAddress(orgName?: string): string {
  const name = orgName || emailConfig.defaultFromName;
  return `${name} <${emailConfig.defaultFromEmail}>`;
}
