import { z } from "zod";

export const saveTwilioCredentialsSchema = z.object({
  accountSid: z
    .string()
    .min(1, "Account SID is required")
    .regex(/^AC[a-f0-9]{32}$/, "Account SID must start with AC followed by 32 hex characters"),
  authToken: z
    .string()
    .min(1, "Auth Token is required")
    .min(32, "Auth Token must be at least 32 characters"),
  messagingServiceSid: z
    .string()
    .regex(/^MG[a-f0-9]{32}$/, "Messaging Service SID must start with MG followed by 32 hex characters")
    .optional()
    .or(z.literal("")),
});

export const setDefaultFromNumberSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\+1\d{10}$/, "Phone number must be in E.164 format (+1XXXXXXXXXX)"),
});

export const searchPhoneNumbersSchema = z.object({
  areaCode: z
    .string()
    .regex(/^\d{3}$/, "Area code must be 3 digits")
    .optional()
    .or(z.literal("")),
  numberType: z.enum(["local", "toll_free"]).default("local"),
});

export const purchaseNumberSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\+1\d{10}$/, "Phone number must be in E.164 format"),
});

export const releaseNumberSchema = z.object({
  phoneNumberId: z.string().uuid("Invalid phone number ID"),
});

export type SaveTwilioCredentialsInput = z.infer<typeof saveTwilioCredentialsSchema>;
export type SetDefaultFromNumberInput = z.infer<typeof setDefaultFromNumberSchema>;
export type SearchPhoneNumbersInput = z.infer<typeof searchPhoneNumbersSchema>;
export type PurchaseNumberInput = z.infer<typeof purchaseNumberSchema>;
export type ReleaseNumberInput = z.infer<typeof releaseNumberSchema>;
