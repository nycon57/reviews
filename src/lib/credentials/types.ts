import { z } from "zod";

// Credential type enum
export const credentialTypes = [
  "nmls",
  "state_real_estate",
  "insurance",
  "cpa",
  "series_7",
  "other",
] as const;

export type CredentialType = (typeof credentialTypes)[number];

// Credential display names
export const credentialTypeLabels: Record<CredentialType, string> = {
  nmls: "NMLS",
  state_real_estate: "State Real Estate License",
  insurance: "Insurance License",
  cpa: "CPA Certification",
  series_7: "Series 7 License",
  other: "Other",
};

// Database row type
export interface UserCredentialRow {
  id: string;
  user_id: string;
  organization_id: string;
  credential_type: string;
  credential_number: string;
  issuing_authority: string | null;
  issued_date: string | null;
  expiry_date: string | null;
  is_verified: boolean;
  verified_at: string | null;
  is_public: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Application type
export interface UserCredential {
  id: string;
  userId: string;
  organizationId: string;
  credentialType: CredentialType | string;
  credentialNumber: string;
  issuingAuthority: string | null;
  issuedDate: string | null;
  expiryDate: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
  isPublic: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Validation schemas
export const createCredentialSchema = z.object({
  credentialType: z.string().min(1, "Credential type is required"),
  credentialNumber: z.string().min(1, "Credential number is required"),
  issuingAuthority: z.string().optional(),
  issuedDate: z.string().optional(),
  expiryDate: z.string().optional(),
  isPublic: z.boolean().optional().default(true),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const updateCredentialSchema = z.object({
  id: z.string().uuid(),
  credentialType: z.string().optional(),
  credentialNumber: z.string().optional(),
  issuingAuthority: z.string().optional().nullable(),
  issuedDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const verifyCredentialSchema = z.object({
  id: z.string().uuid(),
  isVerified: z.boolean(),
});

// Result types
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// Transform functions
export function rowToCredential(row: UserCredentialRow): UserCredential {
  return {
    id: row.id,
    userId: row.user_id,
    organizationId: row.organization_id,
    credentialType: row.credential_type,
    credentialNumber: row.credential_number,
    issuingAuthority: row.issuing_authority,
    issuedDate: row.issued_date,
    expiryDate: row.expiry_date,
    isVerified: row.is_verified,
    verifiedAt: row.verified_at,
    isPublic: row.is_public,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
