import { z } from "zod";

export const sendSmsReviewRequestSchema = z.object({
  borrowerName: z.string().min(1, "Borrower name is required"),
  borrowerPhone: z.string().min(1, "Phone number is required"),
  loanOfficerId: z.string().uuid("Invalid loan officer"),
  templateId: z.string().uuid("Invalid template"),
  scheduledAt: z.string().datetime().optional(),
});

export type SendSmsReviewRequestInput = z.infer<typeof sendSmsReviewRequestSchema>;

export const sendSmsVideoRequestSchema = z.object({
  borrowerName: z.string().min(1, "Customer name is required"),
  borrowerPhone: z.string().min(1, "Phone number is required"),
  loanOfficerId: z.string().uuid("Invalid team member"),
  templateId: z.string().uuid("Invalid template"),
});

export type SendSmsVideoRequestInput = z.infer<typeof sendSmsVideoRequestSchema>;

export const recordInlineConsentSchema = z.object({
  phone: z.string().min(1, "Phone number is required"),
  consentLanguage: z.string().min(1, "Consent language is required"),
});

export type RecordInlineConsentInput = z.infer<typeof recordInlineConsentSchema>;

export const checkSmsSendReadinessSchema = z.object({
  borrowerPhone: z.string().min(1, "Phone number is required"),
  templateId: z.string().uuid("Invalid template"),
});

export type CheckSmsSendReadinessInput = z.infer<typeof checkSmsSendReadinessSchema>;
