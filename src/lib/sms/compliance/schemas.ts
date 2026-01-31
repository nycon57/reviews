import { z } from "zod";

export const saveQuietHoursSchema = z.object({
  quietHoursEnabled: z.boolean(),
  quietHoursStart: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  quietHoursEnd: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  quietHoursTimezone: z.string().min(1, "Timezone is required"),
  useRecipientTimezone: z.boolean(),
});

export const saveOptOutSettingsSchema = z.object({
  stopResponse: z
    .string()
    .min(1, "STOP response is required")
    .max(320, "Response must be 320 characters or fewer"),
  helpResponse: z
    .string()
    .min(1, "HELP response is required")
    .max(320, "Response must be 320 characters or fewer"),
});

export const saveDoubleOptInSchema = z.object({
  doubleOptInEnabled: z.boolean(),
  doubleOptInMessage: z
    .string()
    .min(1, "Confirmation message is required")
    .max(320, "Message must be 320 characters or fewer"),
});

export const saveConsentLanguageSchema = z.object({
  consentLanguageText: z
    .string()
    .min(1, "Consent language is required")
    .max(1000, "Consent language must be 1000 characters or fewer"),
});

export const complianceReportSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});

export type SaveQuietHoursInput = z.infer<typeof saveQuietHoursSchema>;
export type SaveOptOutSettingsInput = z.infer<typeof saveOptOutSettingsSchema>;
export type SaveDoubleOptInInput = z.infer<typeof saveDoubleOptInSchema>;
export type SaveConsentLanguageInput = z.infer<typeof saveConsentLanguageSchema>;
export type ComplianceReportInput = z.infer<typeof complianceReportSchema>;
