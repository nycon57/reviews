import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MilestoneRecord, MilestoneType } from "../types";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/auth/actions", () => ({
  unifiedGetUser: vi.fn(),
}));

vi.mock("@/lib/email/send", () => ({
  sendFirstReviewMilestoneEmail: vi.fn(async () => ({ success: true, messageId: "msg-first-review" })),
  sendReviewCountMilestoneEmail: vi.fn(async () => ({ success: true, messageId: "msg-review-count" })),
  sendFirst5StarMilestoneEmail: vi.fn(async () => ({ success: true, messageId: "msg-first-5-star" })),
  sendRatingImprovementMilestoneEmail: vi.fn(async () => ({ success: true, messageId: "msg-rating" })),
  sendNpsImprovementMilestoneEmail: vi.fn(async () => ({ success: true, messageId: "msg-nps" })),
  sendStreakMilestoneEmail: vi.fn(async () => ({ success: true, messageId: "msg-streak" })),
  sendLeaderboardMilestoneEmail: vi.fn(async () => ({ success: true, messageId: "msg-leaderboard" })),
  sendBadgeEarnedMilestoneEmail: vi.fn(async () => ({ success: true, messageId: "msg-badge" })),
  sendProfileCompletionMilestoneEmail: vi.fn(async () => ({ success: true, messageId: "msg-profile" })),
  sendVideoMilestoneEmail: vi.fn(async () => ({ success: true, messageId: "msg-video" })),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendBadgeEarnedMilestoneEmail,
  sendFirst5StarMilestoneEmail,
  sendFirstReviewMilestoneEmail,
  sendLeaderboardMilestoneEmail,
  sendNpsImprovementMilestoneEmail,
  sendProfileCompletionMilestoneEmail,
  sendRatingImprovementMilestoneEmail,
  sendReviewCountMilestoneEmail,
  sendStreakMilestoneEmail,
  sendVideoMilestoneEmail,
} from "@/lib/email/send";
import { dispatchMilestoneEmail } from "../actions";

type QueryState = {
  selectArgs?: unknown[];
  head?: boolean;
};

function createSupabaseMock() {
  function makeBuilder(table: string) {
    const state: QueryState = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test double
    const builder: any = {};
    builder.select = vi.fn((...args: unknown[]) => {
      state.selectArgs = args;
      state.head = typeof args[1] === "object" && args[1] !== null && "head" in args[1]
        ? Boolean((args[1] as { head?: boolean }).head)
        : false;
      return builder;
    });
    for (const method of ["eq", "gt", "not", "or", "order", "limit"]) {
      builder[method] = vi.fn(() => builder);
    }
    builder.maybeSingle = vi.fn(() => Promise.resolve(resolveTable(table, state, true)));
    builder.single = vi.fn(() => Promise.resolve(resolveTable(table, state, true)));
    builder.then = (resolve: (value: unknown) => void, reject?: (error: unknown) => void) =>
      Promise.resolve(resolveTable(table, state, false)).then(resolve, reject);
    return builder;
  }

  return {
    from: vi.fn((table: string) => makeBuilder(table)),
  };
}

function resolveTable(table: string, state: QueryState, single: boolean) {
  if (table === "users" && state.head) {
    return { data: null, count: 12, error: null };
  }
  if (table === "users" && state.selectArgs?.[0] === "id") {
    return { data: [], error: null };
  }
  if (table === "users") {
    return {
      data: {
        id: "user-1",
        full_name: "Jane Pro",
        email: "jane@example.com",
        total_reviews: 25,
        average_rating: 4.7,
        nps_score: 42,
        reputation_score: 91,
      },
      error: null,
    };
  }
  if (table === "organizations") {
    return { data: { name: "Acme Lending" }, error: null };
  }
  if (table === "reviews") {
    return {
      data: {
        id: "review-1",
        customer_name: "Casey Customer",
        rating: 5,
        review_date: "2026-01-02",
      },
      error: null,
    };
  }
  if (table === "badges" && state.head) {
    return { data: null, count: 8, error: null };
  }
  if (table === "badges" && single) {
    return {
      data: {
        name: "Fast Responder",
        description: "Responded quickly",
        icon: "zap",
        category: "performance",
        tier: "gold",
      },
      error: null,
    };
  }
  if (table === "user_badges" && state.head) {
    return { data: null, count: 3, error: null };
  }
  if (table === "survey_responses" && state.head) {
    return { data: null, count: 14, error: null };
  }
  if (table === "testimonials" && state.head) {
    return { data: null, count: 5, error: null };
  }
  return { data: single ? null : [], error: null };
}

function record(
  milestoneType: MilestoneType,
  milestoneValue: number | null,
  milestoneMetadata: Record<string, unknown> = {}
): MilestoneRecord {
  return {
    id: `milestone-${milestoneType}`,
    userId: "user-1",
    organizationId: "org-1",
    milestoneType,
    milestoneKey: milestoneValue === null ? milestoneType : `${milestoneType}_${milestoneValue}`,
    milestoneValue,
    milestoneMetadata,
    achievedAt: new Date("2026-01-01T00:00:00Z"),
    emailSentAt: null,
    emailStatus: "pending",
    emailMessageId: null,
    socialSharedAt: null,
    socialPlatform: null,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(createSupabaseMock());
});

describe("dispatchMilestoneEmail", () => {
  it("dispatches all milestone types to a send wrapper", async () => {
    const cases: Array<[MilestoneRecord, ReturnType<typeof vi.fn>]> = [
      [record("first_review", 1), sendFirstReviewMilestoneEmail as ReturnType<typeof vi.fn>],
      [record("review_milestone", 25, { totalReviews: 25 }), sendReviewCountMilestoneEmail as ReturnType<typeof vi.fn>],
      [record("first_5_star", 5), sendFirst5StarMilestoneEmail as ReturnType<typeof vi.fn>],
      [
        record("rating_improvement", null, { previousRating: 4.2, currentRating: 4.7, improvement: 0.5 }),
        sendRatingImprovementMilestoneEmail as ReturnType<typeof vi.fn>,
      ],
      [
        record("nps_improvement", null, { previousNps: 20, currentNps: 42, improvement: 22, totalResponses: 14 }),
        sendNpsImprovementMilestoneEmail as ReturnType<typeof vi.fn>,
      ],
      [record("streak", 7, { streakType: "response", currentStreak: 7 }), sendStreakMilestoneEmail as ReturnType<typeof vi.fn>],
      [
        record("leaderboard_achievement", 3, { achievementType: "reached_top_3" }),
        sendLeaderboardMilestoneEmail as ReturnType<typeof vi.fn>,
      ],
      [record("badge_earned", null, { badgeId: "badge-1", badgeName: "Fast Responder" }), sendBadgeEarnedMilestoneEmail as ReturnType<typeof vi.fn>],
      [record("profile_completion", 75, { completionPercent: 75 }), sendProfileCompletionMilestoneEmail as ReturnType<typeof vi.fn>],
      [record("video_milestone", 5, { videoCount: 5 }), sendVideoMilestoneEmail as ReturnType<typeof vi.fn>],
    ];

    for (const [milestoneRecord, sender] of cases) {
      const result = await dispatchMilestoneEmail(milestoneRecord);
      expect(result.status).toBe("sent");
      expect(sender).toHaveBeenCalledTimes(1);
    }
  });
});
