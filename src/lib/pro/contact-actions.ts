"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, emailConfig } from "@/lib/email/client";

const contactSchema = z.object({
  professionalId: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  message: z.string().min(1).max(2000),
});

export async function contactProfessional(input: {
  professionalId: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input. Please check your details." };
  }

  const { professionalId, name, email, phone, message } = parsed.data;

  try {
    const supabase = createAdminClient();

    // Fetch the professional's email and name
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", professionalId)
      .eq("is_active", true)
      .single();

    if (userError || !user?.email) {
      return { success: false, error: "Could not find professional contact information." };
    }

    const resend = getResendClient();

    const phoneLine = phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : "";

    await resend.emails.send({
      from: emailConfig.defaultFromEmail,
      to: user.email,
      replyTo: email,
      subject: `New message from ${name} via your RepWell profile`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2a7c6f;">New Message from Your Profile</h2>
          <p>Hi ${escapeHtml(user.full_name || "there")},</p>
          <p>Someone reached out to you via your RepWell professional profile.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
          <p><strong>From:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
          ${phoneLine}
          <p><strong>Message:</strong></p>
          <blockquote style="border-left: 3px solid #2a7c6f; margin: 8px 0; padding: 8px 16px; color: #4a5568;">
            ${escapeHtml(message).replace(/\n/g, "<br />")}
          </blockquote>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
          <p style="font-size: 12px; color: #718096;">
            This message was sent via RepWell. Reply directly to this email to respond to ${escapeHtml(name)}.
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
