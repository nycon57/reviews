// Shared types, constants, and utilities for video testimonials
// This file is NOT a "use server" module, so it can export constants

// ============================================================================
// Shared Utility Functions
// ============================================================================

/** Format duration from seconds to MM:SS */
export function formatDuration(seconds: number | null): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/** Format relationship type for display */
export function formatRelationship(relationship: string | null): string {
  if (!relationship) return "Customer";
  return RELATIONSHIP_LABELS[relationship] || "Customer";
}

/** Escape HTML entities to prevent XSS */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Validate URL is safe for rendering (only http/https protocols) */
export function validateSafeUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

/** Validate hex color format to prevent CSS injection */
export function validateHexColor(color: string | null): string | null {
  if (!color) return null;
  const hexPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
  return hexPattern.test(color) ? color : null;
}

// ============================================================================
// Constants
// ============================================================================

/** Relationship type labels for display */
export const RELATIONSHIP_LABELS: Record<string, string> = {
  home_buyer: "Home Buyer",
  refinancer: "Refinancer",
  first_time_buyer: "First-Time Home Buyer",
  investor: "Real Estate Investor",
  business_owner: "Business Owner",
  other: "Customer",
};

// Allowed relationship values - must match RELATIONSHIP_OPTIONS in the form
export const VALID_RELATIONSHIPS = [
  "home_buyer",
  "refinancer",
  "first_time_buyer",
  "investor",
  "business_owner",
  "other",
] as const;

export type RelationshipType = (typeof VALID_RELATIONSHIPS)[number];

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PublicVideoTestimonialRequest {
  id: string;
  token: string;
  status: string;
  maxDurationSeconds: number;
  promptText: string | null;
  expiresAt: string | null;
  submittedAt: string | null;
  customerName: string;
  customerEmail: string;
  loanOfficer: {
    id: string;
    fullName: string;
    photoUrl: string | null;
    title: string | null;
  };
  organization: {
    id: string;
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
  };
}

export interface CustomerInfoInput {
  displayName: string;
  relationship: RelationshipType;
}

export interface ConsentInput {
  videoRecordingConsent: boolean;
  usageRightsConsent: boolean;
  aiTextGenerationConsent: boolean;
  marketingConsent?: boolean;
}

export interface SubmitCustomerInfoInput {
  token: string;
  customerInfo: CustomerInfoInput;
  consents: ConsentInput;
}
