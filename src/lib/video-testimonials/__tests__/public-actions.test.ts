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

vi.mock("@/lib/reviews/moderation", () => ({
  screenReviewText: vi.fn().mockResolvedValue({
    verdict: "pass",
    reasons: [],
    provider: "baseline",
  }),
}));

vi.mock("@/lib/reviews/asset-kit", () => ({
  queueQuoteCardKitAfterPublish: vi.fn(),
}));

vi.mock("@/lib/reviews/notifications", () => ({
  notifyReviewNeedsResponse: vi.fn(),
  notifyReviewPublished: vi.fn(),
}));

vi.mock("@/lib/milestones/actions", () => ({
  checkAllMilestonesForReview: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";
import { ensureSmartLinkForSource } from "@/lib/share-studio/service";
import {
  getShareKit,
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
        rating: 5,
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
        if (table === "organizations") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: { settings: null }, error: null }),
            })),
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

  it("does not ensure a public smart link for pending video share kits", async () => {
    const requestQuery = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "req-1",
          organization_id: "org-1",
          user_id: "user-1",
          customer_name: "Jane Customer",
          source_metadata: { share_caption: "I loved working with Loan." },
          users: {
            full_name: "Loan Officer",
            google_place_id: null,
            zillow_profile_url: null,
          },
        },
        error: null,
      }),
    };

    const responseQuery = {
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "resp-1",
          transcription: "Great experience.",
          transcription_status: "completed",
          ai_generated_text: "Jane had a great experience.",
          ai_generation_status: "completed",
          thumbnail_url: null,
          approval_status: "pending",
          quarantined: false,
        },
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
        if (table === "organizations") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: { settings: null }, error: null }),
            })),
          };
        }
        return {};
      }),
    };

    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);

    const result = await getShareKit("test-token");

    expect(result.success).toBe(true);
    expect(result.data?.status).toBe("ready");
    expect(result.data?.smartLinkUrl).toBeNull();
    expect(result.data?.smartLinkPendingApproval).toBe(true);
    expect(ensureSmartLinkForSource).not.toHaveBeenCalled();
  });

  it("ensures a public smart link immediately for 4+ star video share kits", async () => {
    (ensureSmartLinkForSource as ReturnType<typeof vi.fn>).mockResolvedValue({
      url: "/s/great-review",
    });

    const requestQuery = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "req-1",
          organization_id: "org-1",
          user_id: "user-1",
          customer_name: "Jane Customer",
          source_metadata: { share_caption: "I loved working with Loan." },
          users: {
            full_name: "Loan Officer",
            google_place_id: null,
            zillow_profile_url: null,
          },
        },
        error: null,
      }),
    };

    const responseQuery = {
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "resp-1",
          transcription: "Great experience.",
          transcription_status: "completed",
          ai_generated_text: "Jane had a great experience.",
          ai_generation_status: "completed",
          thumbnail_url: null,
          approval_status: "pending",
          customer_rating: 5,
          quarantined: false,
        },
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
        if (table === "organizations") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: { settings: null }, error: null }),
            })),
          };
        }
        return {};
      }),
    };

    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);

    const result = await getShareKit("test-token");

    expect(result.success).toBe(true);
    expect(result.data?.smartLinkUrl).toBe("https://app.repwell.com/s/great-review");
    expect(result.data?.smartLinkPendingApproval).toBe(false);
    expect(ensureSmartLinkForSource).toHaveBeenCalledWith({
      organizationId: "org-1",
      sourceType: "video_testimonial",
      sourceId: "resp-1",
      actorUserId: "user-1",
    });
  });
});
