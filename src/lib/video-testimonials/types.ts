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

/**
 * Threshold for immediate vs queued email sending
 * - ≤ threshold: Send immediately (better UX for single/small requests)
 * - > threshold: Queue for cron processing (avoid HTTP timeout for bulk)
 */
export const IMMEDIATE_SEND_THRESHOLD = 10;

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

// Versioned legal copy for immutable consent audit.
export const VIDEO_TESTIMONIAL_CONSENT_VERSION = "2026-03-01-v1";

export const VIDEO_TESTIMONIAL_LEGAL_TEXT = {
  nilConsent:
    "I consent to the use of my name, image, likeness, voice, and testimonial content in video, audio, and text formats.",
  usageRightsConsent:
    "I grant permission for this testimonial to be used in websites, emails, social posts, sales materials, and other marketing channels.",
  aiTextGenerationConsent:
    "I consent to AI-assisted transcription and generation of draft written testimonials from my recorded video.",
  marketingConsent:
    "I agree to receive occasional marketing communications. I can unsubscribe at any time.",
} as const;

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
  professional: {
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
  nilConsent: boolean;
  usageRightsConsent: boolean;
  aiTextGenerationConsent: boolean;
  marketingConsent?: boolean;
  // Backward-compatible alias used by the existing UI.
  videoRecordingConsent?: boolean;
}

export interface ConsentClientInfo {
  ipAddress?: string | null;
  userAgent?: string | null;
  locale?: string | null;
}

export interface SubmitCustomerInfoInput {
  token: string;
  customerInfo: CustomerInfoInput;
  consents: ConsentInput;
  consentVersion?: string;
  legalTextSnapshotHash?: string;
  clientInfo?: ConsentClientInfo;
}

// ============================================================================
// Video Upload & Submission Types
// ============================================================================

/** Result from creating a signed upload URL */
export interface CreateUploadUrlResult {
  uploadUrl: string;
  storagePath: string;
}

/** Input for submitting a video testimonial after upload */
export interface SubmitVideoInput {
  token: string;
  storagePath: string;
  durationSeconds: number;
  thumbnailPath?: string;
  uploadSessionId?: string;
  idempotencyKey?: string;
  mediaMetadata?: {
    mimeType?: string;
    codec?: string;
    width?: number;
    height?: number;
    fileSizeBytes?: number;
  };
  consentEventIds?: string[];
}

/** Result from creating signed upload URLs for video and thumbnail */
export interface CreateUploadUrlsResult {
  videoUploadUrl: string;
  videoStoragePath: string;
  thumbnailUploadUrl: string;
  thumbnailStoragePath: string;
  uploadSessionId: string;
  resumeToken: string;
  recommendedPartSize: number;
}

/** Result from video submission with AI processing */
export interface VideoSubmissionResult {
  success: boolean;
  responseId?: string;
  generatedReview?: string;
  transcription?: string;
  error?: string;
}

/** Processing status for video upload flow */
export type ProcessingStatus =
  | "pending"
  | "uploading"
  | "transcribing"
  | "generating"
  | "completed"
  | "failed";
