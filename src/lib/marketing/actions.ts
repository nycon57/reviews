"use server";

import { z } from "zod";
import { getResendClient, emailConfig } from "@/lib/email/client";
import { SALES_EMAIL } from "@/lib/brand";

// Contact form schema
const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  phone: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

// Demo request schema
const demoRequestSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().min(1, "Company name is required"),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  teamSize: z.string().optional(),
  message: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
export type DemoRequestData = z.infer<typeof demoRequestSchema>;

export type FormResult = {
  success: boolean;
  error?: string;
};

// Send contact form email
export async function submitContactForm(
  data: ContactFormData
): Promise<FormResult> {
  try {
    const validated = contactFormSchema.parse(data);
    const resend = getResendClient();

    const contactEmail = process.env.CONTACT_EMAIL || "contact@repwell.ai";

    await resend.emails.send({
      from: `RepWell Contact <${emailConfig.defaultFromEmail}>`,
      to: contactEmail,
      replyTo: validated.email,
      subject: `[Contact Form] ${validated.subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${validated.name}</p>
        <p><strong>Email:</strong> ${validated.email}</p>
        ${validated.company ? `<p><strong>Company:</strong> ${validated.company}</p>` : ""}
        ${validated.phone ? `<p><strong>Phone:</strong> ${validated.phone}</p>` : ""}
        <p><strong>Subject:</strong> ${validated.subject}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p>${validated.message.replace(/\n/g, "<br />")}</p>
      `,
    });

    // Send auto-reply to user
    await resend.emails.send({
      from: `RepWell <${emailConfig.defaultFromEmail}>`,
      to: validated.email,
      subject: "We've received your message - RepWell",
      html: `
        <h2>Thank you for contacting us!</h2>
        <p>Hi ${validated.name},</p>
        <p>We've received your message and will get back to you as soon as possible, typically within 1-2 business days.</p>
        <p>In the meantime, you might find these resources helpful:</p>
        <ul>
          <li><a href="${emailConfig.baseUrl}/features">Explore our features</a></li>
          <li><a href="${emailConfig.baseUrl}/pricing">View pricing plans</a></li>
          <li><a href="${emailConfig.baseUrl}/demo">Schedule a demo</a></li>
        </ul>
        <p>Best regards,<br />The RepWell Team</p>
      `,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Contact form error:", error);
    return { success: false, error: "Failed to send message. Please try again." };
  }
}

// Submit demo request
export async function submitDemoRequest(
  data: DemoRequestData
): Promise<FormResult> {
  try {
    const validated = demoRequestSchema.parse(data);
    const resend = getResendClient();

    const salesEmail = process.env.SALES_EMAIL || SALES_EMAIL;

    await resend.emails.send({
      from: `RepWell Demo Request <${emailConfig.defaultFromEmail}>`,
      to: salesEmail,
      replyTo: validated.email,
      subject: `[Demo Request] ${validated.firstName} ${validated.lastName} from ${validated.company}`,
      html: `
        <h2>New Demo Request</h2>
        <p><strong>Name:</strong> ${validated.firstName} ${validated.lastName}</p>
        <p><strong>Email:</strong> ${validated.email}</p>
        <p><strong>Company:</strong> ${validated.company}</p>
        ${validated.jobTitle ? `<p><strong>Job Title:</strong> ${validated.jobTitle}</p>` : ""}
        ${validated.phone ? `<p><strong>Phone:</strong> ${validated.phone}</p>` : ""}
        ${validated.teamSize ? `<p><strong>Team Size:</strong> ${validated.teamSize}</p>` : ""}
        ${validated.message ? `<hr /><p><strong>Message:</strong></p><p>${validated.message.replace(/\n/g, "<br />")}</p>` : ""}
      `,
    });

    // Send confirmation to user
    await resend.emails.send({
      from: `RepWell <${emailConfig.defaultFromEmail}>`,
      to: validated.email,
      subject: "Demo Request Received - RepWell",
      html: `
        <h2>Thank you for your interest in RepWell!</h2>
        <p>Hi ${validated.firstName},</p>
        <p>We've received your demo request and one of our team members will reach out within 24 hours to schedule a personalized demo.</p>
        <p>During the demo, we'll show you how RepWell can help ${validated.company}:</p>
        <ul>
          <li>Automate review collection with smart surveys</li>
          <li>Track NPS, CSAT, and other key metrics</li>
          <li>Leverage AI-powered insights to improve customer experience</li>
          <li>Manage your team's reputation across platforms</li>
        </ul>
        <p>Looking forward to speaking with you!</p>
        <p>Best regards,<br />The RepWell Team</p>
      `,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Demo request error:", error);
    return { success: false, error: "Failed to submit request. Please try again." };
  }
}
