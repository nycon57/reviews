import { z } from "zod";

export const brandRegistrationSchema = z.object({
  legalCompanyName: z
    .string()
    .min(1, "Legal company name is required")
    .max(200, "Company name must be 200 characters or fewer"),
  einTaxId: z
    .string()
    .min(1, "EIN/Tax ID is required")
    .regex(
      /^\d{2}-?\d{7}$/,
      "EIN must be 9 digits (XX-XXXXXXX or XXXXXXXXX)"
    ),
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z
    .string()
    .min(2, "State is required")
    .max(2, "Use 2-letter state abbreviation"),
  postalCode: z
    .string()
    .min(5, "ZIP code is required")
    .regex(/^\d{5}(-\d{4})?$/, "ZIP code must be 5 or 9 digits"),
  country: z.string().default("US"),
  websiteUrl: z
    .string()
    .min(1, "Website URL is required")
    .url("Must be a valid URL"),
  vertical: z.string().min(1, "Industry vertical is required"),
  stockTicker: z.string().optional().or(z.literal("")),
  companyType: z.enum(["private", "public", "non_profit"], {
    required_error: "Company type is required",
  }),
});

export type BrandRegistrationInput = z.infer<typeof brandRegistrationSchema>;

export const campaignRegistrationSchema = z.object({
  campaignDescription: z
    .string()
    .min(40, "Description must be at least 40 characters")
    .max(4096, "Description must be 4096 characters or fewer"),
  messageSample: z
    .string()
    .min(20, "Message sample must be at least 20 characters")
    .max(1024, "Message sample must be 1024 characters or fewer"),
  messageFlowDescription: z
    .string()
    .min(40, "Message flow must be at least 40 characters")
    .max(2048, "Message flow must be 2048 characters or fewer"),
  optInDescription: z
    .string()
    .min(20, "Opt-in description must be at least 20 characters")
    .max(2048, "Opt-in description must be 2048 characters or fewer"),
  optInKeywords: z.string().min(1, "At least one opt-in keyword is required"),
  optOutKeywords: z.string().min(1, "At least one opt-out keyword is required"),
  helpKeywords: z.string().min(1, "At least one help keyword is required"),
  subscriberOptInMethods: z
    .array(z.string())
    .min(1, "Select at least one opt-in method"),
});

export type CampaignRegistrationInput = z.infer<typeof campaignRegistrationSchema>;

export const INDUSTRY_VERTICALS = [
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "FINANCIAL", label: "Financial Services" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "RETAIL", label: "Retail" },
  { value: "HEALTH_CARE", label: "Healthcare" },
  { value: "COMMUNICATION", label: "Communication & Media" },
  { value: "EDUCATION", label: "Education" },
  { value: "TECHNOLOGY", label: "Technology" },
  { value: "ENTERTAINMENT", label: "Entertainment" },
  { value: "NON_PROFIT", label: "Non-Profit" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "ENERGY", label: "Energy & Utilities" },
  { value: "TRANSPORTATION", label: "Transportation" },
  { value: "AGRICULTURE", label: "Agriculture" },
  { value: "OTHER", label: "Other" },
] as const;

export const OPT_IN_METHODS = [
  { value: "VERBAL", label: "Verbal consent" },
  { value: "WEB_FORM", label: "Website form or signup" },
  { value: "PAPER_FORM", label: "Paper form" },
  { value: "TEXT_MESSAGE", label: "Text message keyword" },
  { value: "QR_CODE", label: "QR code" },
  { value: "OTHER", label: "Other" },
] as const;

export const DEFAULT_OPT_OUT_KEYWORDS = "STOP, CANCEL, END, QUIT, UNSUBSCRIBE";
export const DEFAULT_HELP_KEYWORDS = "HELP, INFO";
export const DEFAULT_OPT_IN_KEYWORDS = "START, YES";
