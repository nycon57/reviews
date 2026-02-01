import { z } from "zod";

export const updateProfileSchema = z.object({
  // Basic info
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  avatarUrl: z.string().url().optional().or(z.literal("")),

  // Professional details
  title: z.string().max(100, "Title must be 100 characters or less").optional().or(z.literal("")),
  nmlsId: z.string().max(50, "License number must be 50 characters or less").optional().or(z.literal("")),
  bio: z.string().max(500, "Bio must be 500 characters or less").optional().or(z.literal("")),

  // Contact info
  phone: z.string()
    .regex(/^[\d\s\-+()]*$/, "Please enter a valid phone number")
    .max(20, "Phone number is too long")
    .optional()
    .or(z.literal("")),

  // Social/online presence
  personalWebsiteUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  linkedinUrl: z.string().url("Please enter a valid LinkedIn URL").optional().or(z.literal("")),
  zillowProfileUrl: z.string().url("Please enter a valid Zillow URL").optional().or(z.literal("")),

  // Preferences
  timezone: z.string().optional().or(z.literal("")),

  // Cover photo
  bannerUrl: z.string().url().optional().or(z.literal("")),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export interface ProfileResult {
  success: boolean;
  error?: string;
}
