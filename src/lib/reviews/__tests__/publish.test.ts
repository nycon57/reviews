import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ModerationResult } from "@/lib/reviews/moderation";

const mocks = vi.hoisted(() => {
  const afterCallbacks: Array<() => Promise<void>> = [];
  return {
    afterCallbacks,
    after: vi.fn((callback: () => Promise<void>) => {
      afterCallbacks.push(callback);
    }),
    checkAllMilestonesForReview: vi.fn(),
    notifyReviewNeedsResponse: vi.fn(),
    notifyReviewPublished: vi.fn(),
    queueQuoteCardKitForReviews: vi.fn(),
    screenReviewText: vi.fn(),
    sendReviewResponseConfirmationEmail: vi.fn(),
  };
});

vi.mock("next/server", () => ({
  after: mocks.after,
}));

vi.mock("@/lib/milestones/actions", () => ({
  checkAllMilestonesForReview: mocks.checkAllMilestonesForReview,
}));

vi.mock("@/lib/share-studio/service", () => ({
  queueQuoteCardKitForReviews: mocks.queueQuoteCardKitForReviews,
}));

vi.mock("@/lib/reviews/notifications", () => ({
  notifyReviewNeedsResponse: mocks.notifyReviewNeedsResponse,
  notifyReviewPublished: mocks.notifyReviewPublished,
}));

vi.mock("@/lib/reviews/moderation", () => ({
  screenReviewText: mocks.screenReviewText,
}));

vi.mock("@/lib/reviews/response-confirmation", () => ({
  sendReviewResponseConfirmationEmail: mocks.sendReviewResponseConfirmationEmail,
}));

import { publishReviewIfClean } from "@/lib/reviews/publish";

type ReviewRow = {
  id: string;
  organization_id: string;
  user_id: string;
  rating: number;
  status: string;
  is_published: boolean | null;
  response_text?: string | null;
  response_status?: string | null;
  [key: string]: unknown;
};

type MockDb = {
  reviews: ReviewRow[];
  organizations: Array<{ id: string; settings: Record<string, unknown> | null }>;
};

function matches(row: Record<string, unknown>, filters: Array<[string, unknown]>) {
  return filters.every(([column, value]) => row[column] === value);
}

function createMockSupabase(db: MockDb) {
  return {
    from(table: keyof MockDb) {
      const filters: Array<[string, unknown]> = [];
      let updatePayload: Record<string, unknown> | null = null;
      let selected: string | null = null;

      const execute = () => {
        const rows = db[table] as Array<Record<string, unknown>>;
        let matched = rows.filter((row) => matches(row, filters));

        if (updatePayload) {
          matched = matched.map((row) => {
            Object.assign(row, updatePayload);
            return row;
          });
        }

        return Promise.resolve({ data: selected ? matched : null, error: null });
      };

      const query = {
        select(columns: string) {
          selected = columns;
          return query;
        },
        update(payload: Record<string, unknown>) {
          updatePayload = payload;
          return query;
        },
        eq(column: string, value: unknown) {
          filters.push([column, value]);
          return query;
        },
        maybeSingle() {
          const rows = db[table] as Array<Record<string, unknown>>;
          const row = rows.find((candidate) => matches(candidate, filters)) ?? null;
          return Promise.resolve({ data: row, error: null });
        },
        then<TResult1 = unknown, TResult2 = never>(
          onfulfilled?:
            | ((value: { data: unknown; error: null }) => TResult1 | PromiseLike<TResult1>)
            | null,
          onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
        ) {
          return execute().then(onfulfilled, onrejected);
        },
      };

      return query;
    },
  };
}

function baseDb(review?: Partial<ReviewRow>): MockDb {
  return {
    organizations: [
      {
        id: "org-1",
        settings: { videoCelebrationThreshold: 4 },
      },
    ],
    reviews: [
      {
        id: "review-1",
        organization_id: "org-1",
        user_id: "user-1",
        rating: 5,
        status: "pending",
        is_published: false,
        response_text: null,
        response_status: null,
        ...review,
      },
    ],
  };
}

const pass: ModerationResult = {
  verdict: "pass",
  reasons: [],
  provider: "baseline",
};

const quarantine: ModerationResult = {
  verdict: "quarantine",
  reasons: ["profanity"],
  provider: "baseline",
};

beforeEach(() => {
  mocks.afterCallbacks.length = 0;
  mocks.after.mockClear();
  mocks.checkAllMilestonesForReview.mockReset().mockResolvedValue(undefined);
  mocks.notifyReviewNeedsResponse.mockReset().mockResolvedValue(undefined);
  mocks.notifyReviewPublished.mockReset().mockResolvedValue(undefined);
  mocks.queueQuoteCardKitForReviews.mockReset().mockResolvedValue(undefined);
  mocks.screenReviewText.mockReset().mockResolvedValue(pass);
  mocks.sendReviewResponseConfirmationEmail.mockReset().mockResolvedValue({
    sent: true,
    email: "reviewer@example.com",
  });
});

describe("publishReviewIfClean", () => {
  it("publishes a clean review and fans out notifications", async () => {
    const db = baseDb();

    const result = await publishReviewIfClean({
      reviewId: "review-1",
      organizationId: "org-1",
      ownerUserId: "user-1",
      rating: 5,
      customerName: "Pat",
      reviewText: "Great experience.",
      screening: { mode: "compute", text: "Great experience.", customerName: "Pat" },
      supabase: createMockSupabase(db) as never,
      now: "2026-07-07T12:00:00.000Z",
    });

    expect(result.outcome).toBe("published");
    expect(result.belowThreshold).toBe(false);
    expect(db.reviews[0]).toMatchObject({
      status: "approved",
      is_published: true,
      published_at: "2026-07-07T12:00:00.000Z",
      moderation_verdict: "pass",
    });
    expect(mocks.notifyReviewPublished).toHaveBeenCalledWith(
      expect.objectContaining({ belowThreshold: false, reviewId: "review-1" })
    );
    expect(mocks.notifyReviewNeedsResponse).not.toHaveBeenCalled();
    expect(mocks.checkAllMilestonesForReview).toHaveBeenCalledWith(
      "user-1",
      "org-1",
      "user-1",
      5
    );

    await mocks.afterCallbacks[0]();
    expect(mocks.queueQuoteCardKitForReviews).toHaveBeenCalledWith({
      organizationId: "org-1",
      reviewIds: ["review-1"],
      actorUserId: "user-1",
      minRating: 4,
    });
  });

  it("quarantines a failed screen without fan-out", async () => {
    const db = baseDb();
    mocks.screenReviewText.mockResolvedValueOnce(quarantine);

    const result = await publishReviewIfClean({
      reviewId: "review-1",
      organizationId: "org-1",
      ownerUserId: "user-1",
      rating: 5,
      screening: { mode: "compute", text: "Bad text" },
      supabase: createMockSupabase(db) as never,
      now: "2026-07-07T12:00:00.000Z",
    });

    expect(result.outcome).toBe("quarantined");
    expect(db.reviews[0]).toMatchObject({
      status: "pending",
      is_published: false,
      published_at: null,
      moderation_verdict: "quarantine",
      moderation_reasons: ["profanity"],
    });
    expect(mocks.notifyReviewPublished).not.toHaveBeenCalled();
    expect(mocks.after).not.toHaveBeenCalled();
  });

  it("escalates below-threshold published reviews", async () => {
    const db = baseDb({ rating: 3 });

    const result = await publishReviewIfClean({
      reviewId: "review-1",
      organizationId: "org-1",
      ownerUserId: "user-1",
      rating: 3,
      customerName: "Pat",
      screening: { mode: "precomputed", result: pass },
      supabase: createMockSupabase(db) as never,
      now: "2026-07-07T12:00:00.000Z",
    });

    expect(result.outcome).toBe("published");
    expect(result.belowThreshold).toBe(true);
    expect(mocks.notifyReviewPublished).toHaveBeenCalledWith(
      expect.objectContaining({ belowThreshold: true, rating: 3 })
    );
    expect(mocks.notifyReviewNeedsResponse).toHaveBeenCalledWith({
      reviewId: "review-1",
      organizationId: "org-1",
      ownerUserId: "user-1",
      customerName: "Pat",
      rating: 3,
    });
  });

  it("does not replay publish side effects on an idempotent re-call", async () => {
    const db = baseDb();
    const supabase = createMockSupabase(db) as never;
    const params = {
      reviewId: "review-1",
      organizationId: "org-1",
      ownerUserId: "user-1",
      rating: 5,
      screening: { mode: "precomputed" as const, result: pass },
      supabase,
      now: "2026-07-07T12:00:00.000Z",
    };

    const first = await publishReviewIfClean(params);
    const second = await publishReviewIfClean(params);

    expect(first.outcome).toBe("published");
    expect(second.outcome).toBe("already_published");
    expect(mocks.notifyReviewPublished).toHaveBeenCalledTimes(1);
    expect(mocks.notifyReviewNeedsResponse).not.toHaveBeenCalled();
    expect(mocks.checkAllMilestonesForReview).toHaveBeenCalledTimes(1);
  });

  it("surfaces a draft response when the review goes live", async () => {
    const db = baseDb({
      response_text: "Thank you for the kind words.",
      response_status: "draft",
    });

    const result = await publishReviewIfClean({
      reviewId: "review-1",
      organizationId: "org-1",
      ownerUserId: "user-1",
      rating: 5,
      screening: { mode: "precomputed", result: pass },
      supabase: createMockSupabase(db) as never,
      now: "2026-07-07T12:00:00.000Z",
    });

    expect(result.draftResponseSurfaced).toBe(true);
    expect(db.reviews[0]).toMatchObject({
      response_status: "posted",
      response_posted_at: "2026-07-07T12:00:00.000Z",
    });
    expect(mocks.sendReviewResponseConfirmationEmail).toHaveBeenCalledWith({
      reviewId: "review-1",
      organizationId: "org-1",
      responseText: "Thank you for the kind words.",
      supabase: expect.anything(),
    });
  });
});
