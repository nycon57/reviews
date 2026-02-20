"use server";

import { getResendClient, emailConfig } from "@/lib/email/client";
import { z } from "zod";

const contactSchema = z.object({
  professionalEmail: z.string().email(),
  professionalName: z.string().min(1),
  senderName: z.string().min(1).max(100),
  senderEmail: z.string().email(),
  message: z.string().min(10).max(2000),
});

export async function contactProfessional(input: {
  professionalEmail: string;
  professionalName: string;
  senderName: string;
  senderEmail: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  const { professionalEmail, professionalName, senderName, senderEmail, message } = parsed.data;

  const safeName = escapeHtml(senderName);
  const safeEmail = escapeHtml(senderEmail);
  const safeEmailHref = encodeURIComponent(senderEmail);
  const safeMessage = escapeHtml(message);

  try {
    const resend = getResendClient();
    await resend.emails.send({
      from: emailConfig.defaultFromEmail
        ? `RepWell Directory <${emailConfig.defaultFromEmail}>`
        : "RepWell Directory <noreply@repwell.ai>",
      to: professionalEmail,
      replyTo: senderEmail,
      subject: `New message from ${sanitizeSubjectField(senderName)} via RepWell`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 24px;">
            You received a message through your RepWell directory listing.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 80px;">From</td>
              <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #111827;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td>
              <td style="padding: 8px 0; font-size: 14px; color: #111827;">
                <a href="mailto:${safeEmailHref}" style="color: #0d9488;">${safeEmail}</a>
              </td>
            </tr>
          </table>

          <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <p style="font-size: 14px; color: #374151; white-space: pre-wrap; margin: 0;">${safeMessage}</p>
          </div>

          <a href="mailto:${safeEmailHref}"
             style="display: inline-block; background: #0d9488; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">
            Reply to ${safeName}
          </a>

          <p style="margin-top: 32px; font-size: 12px; color: #9ca3af;">
            This message was sent via your RepWell professional directory listing.
            To stop receiving messages, update your directory preferences.
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (err) {
    console.error("[contactProfessional]", err);
    return { success: false, error: "Failed to send message. Please try again." };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeSubjectField(str: string): string {
  // Strip CR, LF, and other control characters to prevent header injection
  // eslint-disable-next-line no-control-regex
  return str.replace(/[\r\n\x00-\x1f]/g, " ").trim().slice(0, 100) || "Unknown Sender";
}
