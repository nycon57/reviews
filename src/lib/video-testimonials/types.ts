// Shared types and constants for video testimonials
// This file is NOT a "use server" module, so it can export constants

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
