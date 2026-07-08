import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- preserves function signatures for cache() test doubles
  const passthroughCache = <T extends (...args: any[]) => any>(fn: T): T => fn;

  return {
    ...actual,
    cache: passthroughCache,
  };
});

vi.mock("@/lib/auth/actions", () => ({ unifiedGetUser: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("../client", () => ({
  createChatCompletion: vi.fn(),
  isAIEnabled: vi.fn(() => false),
}));

import { unifiedGetUser } from "@/lib/auth/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAIInsightsData } from "../insights-actions";

type Result = { data?: unknown; error?: unknown };

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function createQueryBuilder(result: Result) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test double
  const builder: any = {};
  for (const method of ["select", "eq", "gte", "lt", "in", "not", "order", "limit"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.single = vi.fn(() => Promise.resolve(result));
  builder.then = (resolve: (value: Result) => unknown, reject?: (error: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return builder;
}

function createSupabaseMock(results: Record<string, Result[]>) {
  const queues = Object.fromEntries(
    Object.entries(results).map(([table, tableResults]) => [table, [...tableResults]])
  );
  const builders: Record<string, ReturnType<typeof createQueryBuilder>[]> = {};

  const from = vi.fn((table: string) => {
    const queue = queues[table];
    if (!queue || queue.length === 0) {
      throw new Error(`No queued result for ${table}`);
    }

    const builder = createQueryBuilder(queue.shift() as Result);
    builders[table] = builders[table] || [];
    builders[table].push(builder);
    return builder;
  });

  return { from, builders };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getAIInsightsData", () => {
  it("derives all review-backed sections from one reviews dataset", async () => {
    (unifiedGetUser as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "user-1" });

    const supabase = createSupabaseMock({
      users: [
        {
          data: {
            id: "user-1",
            organization_id: "org-1",
            role: "admin",
            full_name: "Admin User",
            organizations: {
              subscription_tier: "pro",
              account_type: "team",
            },
          },
        },
      ],
      reviews: [
        {
          data: [
            {
              id: "r1",
              user_id: "user-1",
              review_date: daysAgo(5),
              sentiment_score: 0.9,
              sentiment_label: "positive",
              themes: ["communication", "service"],
              key_phrases: ["Great communication"],
              text: "Great communication and service.",
              rating: 5,
            },
            {
              id: "r2",
              user_id: "user-1",
              review_date: daysAgo(10),
              sentiment_score: -0.6,
              sentiment_label: "negative",
              themes: ["timeliness"],
              key_phrases: ["Slow response"],
              text: "The response felt slow.",
              rating: 2,
            },
            {
              id: "r3",
              user_id: "user-1",
              review_date: daysAgo(45),
              sentiment_score: 0,
              sentiment_label: "neutral",
              themes: ["documentation"],
              key_phrases: ["Paperwork"],
              text: "The paperwork was okay.",
              rating: 3,
            },
            {
              id: "r4",
              user_id: "user-1",
              review_date: daysAgo(240),
              sentiment_score: 0.5,
              sentiment_label: "positive",
              themes: ["communication"],
              key_phrases: ["Helpful"],
              text: "Helpful earlier review.",
              rating: 4,
            },
          ],
        },
      ],
    });

    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(supabase);

    const result = await getAIInsightsData(undefined, 6);

    expect(result.success).toBe(true);
    expect(supabase.from.mock.calls.filter(([table]) => table === "reviews")).toHaveLength(1);
    expect(supabase.builders.reviews[0].select).toHaveBeenCalledWith(
      "review_date, sentiment_score, sentiment_label, themes, key_phrases, text, rating"
    );

    expect(result.data?.sentimentDistribution).toEqual({
      positive: 1,
      neutral: 1,
      negative: 1,
      total: 3,
    });
    expect(result.data?.topKeyPhrases[0]).toMatchObject({
      phrase: "great communication",
      count: 1,
      sentiment: "positive",
      recentOccurrences: 1,
    });
    expect(result.data?.themeFrequencies.map((theme) => theme.theme)).toContain("communication");
    expect(result.data?.recommendations.some((rec) => rec.category === "timeliness")).toBe(true);
    expect(result.data?.summary?.summary).toContain("2 customer reviews");
  });
});
