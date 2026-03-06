import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
  createUntypedAdminClient: vi.fn(),
}));

vi.mock("@/lib/ai/transcript-to-review", () => ({
  generateReviewFromTranscript: vi.fn(),
}));

vi.mock("@/lib/share-studio/transcription-service", () => ({
  transcribeWithWordTimestamps: vi.fn(),
}));

vi.mock("@/lib/share-studio/service", () => ({
  ensureSmartLinkForSource: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendVideoTestimonialPendingApprovalEmail: vi.fn(),
  sendVideoTestimonialReceivedEmail: vi.fn(),
}));

import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  recordConsentEvent,
  submitCustomerInfoAndConsent,
  submitVideoTestimonial,
} from "../public-actions";

describe("video testimonial public actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects submitCustomerInfoAndConsent when NIL consent is missing", async () => {
    const result = await submitCustomerInfoAndConsent({
      token: "test-token",
      customerInfo: {
        displayName: "Jane Customer",
        relationship: "home_buyer",
      },
      consents: {
        nilConsent: false,
        usageRightsConsent: true,
        aiTextGenerationConsent: true,
      },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("likeness consent");
  });

  it("rejects recordConsentEvent with invalid payload", async () => {
    const result = await recordConsentEvent({
      requestId: "not-a-uuid",
      consentType: "usage_rights",
      granted: true,
      consentVersion: "2026-03-01-v1",
      legalTextSnapshot: "snapshot",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid request ID");
  });

  it("returns existing response for idempotent submitVideoTestimonial retry", async () => {
    const requestQuery = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "req-1",
          status: "recording",
          organization_id: "org-1",
          user_id: "user-1",
          customer_name: "Jane Customer",
          customer_email: "jane@example.com",
          expires_at: null,
          submitted_at: null,
          source_metadata: null,
          users: { full_name: "Loan Officer", email: "lo@example.com" },
          organizations: { name: "Org" },
        },
        error: null,
      }),
    };

    const responseQuery = {
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: "resp-existing" },
        error: null,
      }),
    };

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "video_testimonial_requests") {
          return {
            select: vi.fn(() => requestQuery),
          };
        }
        if (table === "video_testimonial_responses") {
          return {
            select: vi.fn(() => responseQuery),
          };
        }
        return {};
      }),
    };

    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);
    (createUntypedAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);

    const result = await submitVideoTestimonial({
      token: "test-token",
      storagePath: "org-1/req-1/file.webm",
      durationSeconds: 42,
      idempotencyKey: "idem-123",
    });

    expect(result.success).toBe(true);
    expect(result.responseId).toBe("resp-existing");
  });
});

