import { z } from "zod";

// Onboarding status types
export type OnboardingStatus =
  | "pending"
  | "plan_selected"
  | "payment_complete"
  | "profile_complete"
  | "sms_setup_complete"
  | "completed";

// Schema for plan selection
// Supports both old names (starter/professional) and new names (basic/pro) for backwards compatibility
export const selectPlanSchema = z.object({
  plan: z.enum(["basic", "pro", "starter", "professional", "enterprise"]),
  billingCycle: z.enum(["month", "year"]).default("month"),
});

export type SelectPlanInput = z.infer<typeof selectPlanSchema>;

// Schema for profile setup
export const setupProfileSchema = z.object({
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zip: z.string().optional(),
    country: z.string().optional(),
  }),
  logoUrl: z.string().url().optional().or(z.literal("")),
  primaryColor: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  phone: z.string().optional(),
  companyEmail: z.string().email().optional().or(z.literal("")),
});

export type SetupProfileInput = z.infer<typeof setupProfileSchema>;
