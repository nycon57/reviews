import { z } from "zod";

// User role enum
export const userRoles = ["admin", "manager", "user"] as const;
export type UserRole = (typeof userRoles)[number];

// Address type
export interface UserAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

// Database row type (snake_case)
export interface UserRow {
  id: string;
  organization_id: string | null;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  notification_preferences: Record<string, boolean> | null;
  created_at: string;
  updated_at: string;

  // Contact & Profile
  phone: string | null;
  title: string | null;
  bio: string | null;
  photo_url: string | null;
  personal_website_url: string | null;
  linkedin_url: string | null;
  zillow_profile_url: string | null;

  // Location
  branch_id: string | null;
  region: string | null;
  address: UserAddress | null;

  // Employment
  manager_user_id: string | null;
  hire_date: string | null;

  // Aggregated Metrics
  average_rating: number;
  total_reviews: number;
  nps_score: number | null;
  reputation_score: number;

  // External Integrations
  google_business_id: string | null;
  google_place_id: string | null;

  // Settings
  receive_notifications: boolean;
  auto_request_reviews: boolean;
  timezone: string | null;
}

// Application type (camelCase)
export interface User {
  id: string;
  organizationId: string | null;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  notificationPreferences: Record<string, boolean> | null;
  createdAt: string;
  updatedAt: string;

  // Contact & Profile
  phone: string | null;
  title: string | null;
  bio: string | null;
  photoUrl: string | null;
  personalWebsiteUrl: string | null;
  linkedinUrl: string | null;
  zillowProfileUrl: string | null;

  // Location
  branchId: string | null;
  region: string | null;
  address: UserAddress | null;

  // Employment
  managerUserId: string | null;
  hireDate: string | null;

  // Aggregated Metrics
  averageRating: number;
  totalReviews: number;
  npsScore: number | null;
  reputationScore: number;

  // External Integrations
  googleBusinessId: string | null;
  googlePlaceId: string | null;

  // Settings
  receiveNotifications: boolean;
  autoRequestReviews: boolean;
  timezone: string | null;
}

// Public-safe user profile (excludes sensitive fields)
export interface PublicUser {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  title: string | null;
  bio: string | null;
  photoUrl: string | null;
  personalWebsiteUrl: string | null;
  linkedinUrl: string | null;
  zillowProfileUrl: string | null;
  region: string | null;
  averageRating: number;
  totalReviews: number;
  reputationScore: number;
}

// User with related data
export interface UserWithBranch extends User {
  branch?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface UserWithManager extends User {
  manager?: {
    id: string;
    fullName: string | null;
    email: string;
  } | null;
}

// Validation schemas
const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
});

export const updateUserProfileSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  title: z.string().max(100).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  personalWebsiteUrl: z.string().url().optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable(),
  zillowProfileUrl: z.string().url().optional().nullable(),
  address: addressSchema.optional().nullable(),
  timezone: z.string().optional().nullable(),
});

export const updateUserSettingsSchema = z.object({
  receiveNotifications: z.boolean().optional(),
  autoRequestReviews: z.boolean().optional(),
  notificationPreferences: z.record(z.boolean()).optional(),
});

export const updateUserByAdminSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(userRoles).optional(),
  isActive: z.boolean().optional(),
  phone: z.string().max(20).optional().nullable(),
  title: z.string().max(100).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  branchId: z.string().uuid().optional().nullable(),
  region: z.string().max(100).optional().nullable(),
  managerUserId: z.string().uuid().optional().nullable(),
  hireDate: z.string().optional().nullable(),
  googleBusinessId: z.string().optional().nullable(),
  googlePlaceId: z.string().optional().nullable(),
});

// Result types
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// Public-safe fields for database projection
export const publicUserFields = [
  "id",
  "full_name",
  "avatar_url",
  "title",
  "bio",
  "photo_url",
  "personal_website_url",
  "linkedin_url",
  "zillow_profile_url",
  "region",
  "average_rating",
  "total_reviews",
  "reputation_score",
] as const;

// Transform functions
export function rowToPublicUser(row: Partial<UserRow>): PublicUser {
  if (!row.id) {
    throw new Error("Missing user id in rowToPublicUser");
  }
  return {
    id: row.id,
    fullName: row.full_name ?? null,
    avatarUrl: row.avatar_url ?? null,
    title: row.title ?? null,
    bio: row.bio ?? null,
    photoUrl: row.photo_url ?? null,
    personalWebsiteUrl: row.personal_website_url ?? null,
    linkedinUrl: row.linkedin_url ?? null,
    zillowProfileUrl: row.zillow_profile_url ?? null,
    region: row.region ?? null,
    averageRating: row.average_rating ?? 0,
    totalReviews: row.total_reviews ?? 0,
    reputationScore: row.reputation_score ?? 0,
  };
}

export function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    organizationId: row.organization_id,
    email: row.email,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    role: row.role as UserRole,
    isActive: row.is_active,
    lastLoginAt: row.last_login_at,
    notificationPreferences: row.notification_preferences,
    createdAt: row.created_at,
    updatedAt: row.updated_at,

    // Contact & Profile
    phone: row.phone,
    title: row.title,
    bio: row.bio,
    photoUrl: row.photo_url,
    personalWebsiteUrl: row.personal_website_url,
    linkedinUrl: row.linkedin_url,
    zillowProfileUrl: row.zillow_profile_url,

    // Location
    branchId: row.branch_id,
    region: row.region,
    address: row.address,

    // Employment
    managerUserId: row.manager_user_id,
    hireDate: row.hire_date,

    // Aggregated Metrics
    averageRating: row.average_rating ?? 0,
    totalReviews: row.total_reviews ?? 0,
    npsScore: row.nps_score,
    reputationScore: row.reputation_score ?? 0,

    // External Integrations
    googleBusinessId: row.google_business_id,
    googlePlaceId: row.google_place_id,

    // Settings
    receiveNotifications: row.receive_notifications ?? true,
    autoRequestReviews: row.auto_request_reviews ?? true,
    timezone: row.timezone,
  };
}
