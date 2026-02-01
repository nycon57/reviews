import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Reserved slugs that cannot be used for user or organization profiles
 * These conflict with application routes or are commonly used system terms
 */
const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "settings",
  "dashboard",
  "login",
  "signup",
  "auth",
  "profile",
  "account",
  "help",
  "support",
  "about",
  "contact",
  "terms",
  "privacy",
  "new",
  "edit",
  "delete",
  "search",
  "directory",
  "pro",
  "org",
  "branch",
  "blog",
  "pricing",
  "features",
]);

/**
 * Slug validation result
 */
export interface SlugValidationResult {
  valid: boolean;
  error?: string;
  suggestion?: string;
}

/**
 * Generate a URL-safe slug from a full name
 * @param fullName The person's full name
 * @returns A slugified version (e.g., "John Smith" -> "john-smith")
 */
export function generateUserSlug(fullName: string): string {
  if (!fullName || fullName.trim().length === 0) {
    return "";
  }

  return fullName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^\w\s-]/g, "") // Remove non-word chars except spaces and hyphens
    .replace(/[\s_]+/g, "-") // Replace spaces/underscores with hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-+|-+$/g, "") // Trim leading/trailing hyphens
    .slice(0, 100); // Limit length for safety
}

/**
 * Check if a slug is reserved
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

/**
 * Ensure a slug is unique by checking the database and appending numeric suffix if needed
 * @param baseSlug The base slug to check
 * @param excludeUserId Optional user ID to exclude from uniqueness check (for updates)
 * @returns A unique slug (e.g., "john-smith" or "john-smith-1")
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  excludeUserId?: string
): Promise<string> {
  if (!baseSlug) {
    throw new Error("Base slug cannot be empty");
  }

  const supabase = createAdminClient();
  let slug = baseSlug;

  // Check if slug is reserved
  if (isReservedSlug(slug)) {
    slug = `${slug}-1`;
  }

  // Check if slug already exists
  let query = supabase.from("users").select("id").eq("slug", slug);

  if (excludeUserId) {
    query = query.neq("id", excludeUserId);
  }

  const { data: existing } = await query.maybeSingle();

  if (!existing) {
    return slug;
  }

  // Find a unique slug by appending numbers
  let counter = 1;
  while (counter < 100) {
    const newSlug = `${baseSlug}-${counter}`;

    let checkQuery = supabase.from("users").select("id").eq("slug", newSlug);

    if (excludeUserId) {
      checkQuery = checkQuery.neq("id", excludeUserId);
    }

    const { data } = await checkQuery.maybeSingle();

    if (!data) {
      return newSlug;
    }

    counter++;
  }

  // Fallback: append timestamp if somehow we hit 100 duplicates
  return `${baseSlug}-${Date.now()}`;
}

/**
 * Generate a unique user slug from a full name
 * Combines slug generation with uniqueness check
 * @param fullName The person's full name
 * @param excludeUserId Optional user ID to exclude from uniqueness check
 * @returns A unique, SEO-friendly slug
 */
export async function generateUniqueUserSlug(
  fullName: string,
  excludeUserId?: string
): Promise<string> {
  const baseSlug = generateUserSlug(fullName);

  if (!baseSlug) {
    // Fallback for empty names - use a random suffix
    return `user-${Date.now()}`;
  }

  return ensureUniqueSlug(baseSlug, excludeUserId);
}

/**
 * Validate a slug format (shared between users and organizations)
 * @param slug The slug to validate
 * @returns Validation result with error message if invalid
 */
export function validateSlugFormat(slug: string): SlugValidationResult {
  if (!slug || slug.trim().length === 0) {
    return { valid: false, error: "Slug cannot be empty" };
  }

  if (slug.length < 2) {
    return { valid: false, error: "Slug must be at least 2 characters" };
  }

  if (slug.length > 100) {
    return { valid: false, error: "Slug must be 100 characters or less" };
  }

  // Check for valid characters (lowercase letters, numbers, hyphens)
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return {
      valid: false,
      error: "Slug can only contain lowercase letters, numbers, and hyphens",
      suggestion: generateUserSlug(slug),
    };
  }

  // Check for leading/trailing hyphens
  if (slug.startsWith("-") || slug.endsWith("-")) {
    return {
      valid: false,
      error: "Slug cannot start or end with a hyphen",
      suggestion: slug.replace(/^-+|-+$/g, ""),
    };
  }

  // Check for consecutive hyphens
  if (/--/.test(slug)) {
    return {
      valid: false,
      error: "Slug cannot contain consecutive hyphens",
      suggestion: slug.replace(/-+/g, "-"),
    };
  }

  // Check for reserved slugs
  if (isReservedSlug(slug)) {
    return {
      valid: false,
      error: "This slug is reserved and cannot be used",
    };
  }

  return { valid: true };
}

/**
 * Check if a user slug is available (unique)
 * @param slug The slug to check
 * @param excludeUserId Optional user ID to exclude from uniqueness check
 * @returns True if available, false if taken
 */
export async function isUserSlugAvailable(
  slug: string,
  excludeUserId?: string
): Promise<boolean> {
  const supabase = createAdminClient();

  let query = supabase.from("users").select("id").eq("slug", slug);

  if (excludeUserId) {
    query = query.neq("id", excludeUserId);
  }

  const { data } = await query.maybeSingle();
  return !data;
}

/**
 * Check if an organization slug is available (unique)
 * @param slug The slug to check
 * @param excludeOrgId Optional organization ID to exclude from uniqueness check
 * @returns True if available, false if taken
 */
export async function isOrgSlugAvailable(
  slug: string,
  excludeOrgId?: string
): Promise<boolean> {
  const supabase = createAdminClient();

  let query = supabase.from("organizations").select("id").eq("slug", slug);

  if (excludeOrgId) {
    query = query.neq("id", excludeOrgId);
  }

  const { data } = await query.maybeSingle();
  return !data;
}

/**
 * Validate and check availability of a user slug
 * @param slug The slug to validate
 * @param excludeUserId Optional user ID to exclude from uniqueness check
 * @returns Validation result
 */
export async function validateUserSlug(
  slug: string,
  excludeUserId?: string
): Promise<SlugValidationResult> {
  // First check format
  const formatResult = validateSlugFormat(slug);
  if (!formatResult.valid) {
    return formatResult;
  }

  // Then check availability
  const available = await isUserSlugAvailable(slug, excludeUserId);
  if (!available) {
    return {
      valid: false,
      error: "This URL is already taken",
      suggestion: `${slug}-${Math.floor(Math.random() * 100)}`,
    };
  }

  return { valid: true };
}

/**
 * Validate and check availability of an organization slug
 * @param slug The slug to validate
 * @param excludeOrgId Optional organization ID to exclude from uniqueness check
 * @returns Validation result
 */
export async function validateOrgSlug(
  slug: string,
  excludeOrgId?: string
): Promise<SlugValidationResult> {
  // First check format
  const formatResult = validateSlugFormat(slug);
  if (!formatResult.valid) {
    return formatResult;
  }

  // Then check availability
  const available = await isOrgSlugAvailable(slug, excludeOrgId);
  if (!available) {
    return {
      valid: false,
      error: "This URL is already taken by another organization",
      suggestion: `${slug}-${Math.floor(Math.random() * 100)}`,
    };
  }

  return { valid: true };
}
