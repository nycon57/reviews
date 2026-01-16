/**
 * Encompass Payload Transformer
 *
 * Transforms Encompass webhook payloads into RepWell's internal survey trigger format.
 * Supports both:
 * 1. Direct Encompass milestone webhooks (native format)
 * 2. Custom payloads from Encompass middleware/integrations
 */

import { z } from "zod";

// Schema for Encompass native milestone webhook payload
// Based on Encompass Developer Connect webhook documentation
export const encompassNativePayloadSchema = z.object({
  eventId: z.string().optional(),
  eventType: z.string(), // e.g., "milestone", "create", "update"
  eventTime: z.string().optional(),
  resourceType: z.string().optional(), // e.g., "Loan"
  resourceId: z.string(), // Loan GUID
  resourceRef: z.string().optional(), // REST API URL to loan resource
  meta: z
    .object({
      resourceId: z.string().optional(),
      instanceId: z.string().optional(),
      userId: z.string().optional(),
      resourceRef: z.string().optional(),
    })
    .optional(),
  // Milestone-specific fields
  milestone: z
    .object({
      name: z.string().optional(),
      id: z.string().optional(),
      doneDate: z.string().optional(),
    })
    .optional(),
  // Loan data (if included in payload)
  loan: z
    .object({
      borrower: z
        .object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          homePhone: z.string().optional(),
          cellPhone: z.string().optional(),
        })
        .optional(),
      coBorrower: z
        .object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          email: z.string().optional(),
        })
        .optional(),
      loanOfficer: z
        .object({
          name: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
        })
        .optional(),
      loanNumber: z.string().optional(),
      loanAmount: z.number().optional(),
      propertyAddress: z
        .object({
          street: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zip: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

// Schema for custom/simplified Encompass payload (from middleware or custom integration)
export const encompassCustomPayloadSchema = z.object({
  event_type: z.literal("encompass.milestone"),
  milestone: z.string().min(1), // "Funded", "Clear to Close", etc.
  loan_id: z.string().min(1),
  loan_officer_email: z.string().email(),
  borrower_name: z.string().min(1),
  borrower_email: z.string().email(),
  borrower_phone: z.string().optional(),
  co_borrower_name: z.string().optional(),
  co_borrower_email: z.string().email().optional(),
  loan_amount: z.number().optional(),
  property_address: z.string().optional(),
  loan_number: z.string().optional(),
  milestone_date: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type EncompassNativePayload = z.infer<typeof encompassNativePayloadSchema>;
export type EncompassCustomPayload = z.infer<typeof encompassCustomPayloadSchema>;

// Internal normalized format for survey trigger
export interface NormalizedEncompassPayload {
  eventType: "encompass.milestone";
  milestone: string;
  loanId: string;
  loanNumber?: string;
  loanOfficerEmail: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  loanAmount?: number;
  propertyAddress?: string;
  milestoneDate?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Detect if payload is native Encompass format or custom format
 */
export function detectEncompassPayloadType(
  payload: unknown
): "native" | "custom" | "unknown" {
  if (typeof payload !== "object" || payload === null) {
    return "unknown";
  }

  const obj = payload as Record<string, unknown>;

  // Custom format has event_type: "encompass.milestone"
  if (obj.event_type === "encompass.milestone") {
    return "custom";
  }

  // Native format has eventType and resourceId
  if (obj.eventType && obj.resourceId) {
    return "native";
  }

  return "unknown";
}

/**
 * Transform native Encompass webhook payload to internal format
 */
export function transformNativeEncompassPayload(
  payload: EncompassNativePayload
): NormalizedEncompassPayload | null {
  // Extract milestone name
  const milestoneName = payload.milestone?.name;
  if (!milestoneName) {
    return null;
  }

  // Extract loan data
  const loan = payload.loan;
  if (!loan) {
    // Can't create survey without loan data
    return null;
  }

  const borrower = loan.borrower;
  const loanOfficer = loan.loanOfficer;

  if (!borrower?.email || !loanOfficer?.email) {
    return null;
  }

  // Build customer name
  const customerName = [borrower.firstName, borrower.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (!customerName) {
    return null;
  }

  // Build customer phone (prefer cell, then home, then generic)
  const customerPhone =
    borrower.cellPhone || borrower.homePhone || borrower.phone;

  // Build property address
  const addr = loan.propertyAddress;
  const propertyAddress = addr
    ? [addr.street, addr.city, addr.state, addr.zip].filter(Boolean).join(", ")
    : undefined;

  return {
    eventType: "encompass.milestone",
    milestone: milestoneName,
    loanId: payload.resourceId,
    loanNumber: loan.loanNumber,
    loanOfficerEmail: loanOfficer.email,
    customerName,
    customerEmail: borrower.email,
    customerPhone,
    loanAmount: loan.loanAmount,
    propertyAddress,
    milestoneDate: payload.milestone?.doneDate || payload.eventTime,
    metadata: {
      source: "encompass_native",
      eventId: payload.eventId,
      resourceRef: payload.resourceRef,
      instanceId: payload.meta?.instanceId,
    },
  };
}

/**
 * Transform custom Encompass payload to internal format
 */
export function transformCustomEncompassPayload(
  payload: EncompassCustomPayload
): NormalizedEncompassPayload {
  return {
    eventType: "encompass.milestone",
    milestone: payload.milestone,
    loanId: payload.loan_id,
    loanNumber: payload.loan_number,
    loanOfficerEmail: payload.loan_officer_email,
    customerName: payload.borrower_name,
    customerEmail: payload.borrower_email,
    customerPhone: payload.borrower_phone,
    loanAmount: payload.loan_amount,
    propertyAddress: payload.property_address,
    milestoneDate: payload.milestone_date,
    metadata: {
      source: "encompass_custom",
      ...payload.metadata,
    },
  };
}

/**
 * Main transformer function - detects format and transforms to internal format
 */
export function transformEncompassPayload(
  payload: unknown
): { data: NormalizedEncompassPayload; error: null } | { data: null; error: string } {
  const payloadType = detectEncompassPayloadType(payload);

  if (payloadType === "custom") {
    const validated = encompassCustomPayloadSchema.safeParse(payload);
    if (!validated.success) {
      return {
        data: null,
        error: `Invalid custom Encompass payload: ${validated.error.errors[0]?.message}`,
      };
    }
    return {
      data: transformCustomEncompassPayload(validated.data),
      error: null,
    };
  }

  if (payloadType === "native") {
    const validated = encompassNativePayloadSchema.safeParse(payload);
    if (!validated.success) {
      return {
        data: null,
        error: `Invalid native Encompass payload: ${validated.error.errors[0]?.message}`,
      };
    }

    const transformed = transformNativeEncompassPayload(validated.data);
    if (!transformed) {
      return {
        data: null,
        error:
          "Unable to extract required data from Encompass payload. Ensure milestone, borrower email, and loan officer email are included.",
      };
    }

    return { data: transformed, error: null };
  }

  return {
    data: null,
    error: "Unrecognized Encompass payload format",
  };
}

/**
 * Common Encompass milestone names for documentation/UI
 */
export const COMMON_ENCOMPASS_MILESTONES = [
  { name: "Funded", description: "Loan has been funded" },
  { name: "Clear to Close", description: "Loan cleared for closing" },
  { name: "Loan Submitted", description: "Application submitted" },
  { name: "Underwriting Approved", description: "Approved by underwriting" },
  { name: "Closing Scheduled", description: "Closing date scheduled" },
  { name: "Docs Out", description: "Closing documents sent" },
  { name: "Docs Signed", description: "Closing documents signed" },
  { name: "Suspended", description: "Loan suspended" },
  { name: "Denied", description: "Loan denied" },
] as const;
