import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/actions", () => ({ unifiedGetUser: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

import { unifiedGetUser } from "@/lib/auth/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getReviewsBySource } from "../manager-actions";

type Result = { data?: unknown; error?: unknown };

function createQueryBuilder(result: Result) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test double
  const builder: any = {};
  for (const method of ["select", "eq", "gte", "lte", "order"]) {
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

describe("getReviewsBySource", () => {
  it("filters approved org reviews by range and returns labeled source counts", async () => {
    (unifiedGetUser as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "user-1" });

    const supabase = createSupabaseMock({
      users: [
        {
          data: {
            id: "user-1",
            organization_id: "org-1",
            branch_id: null,
            role: "admin",
          },
        },
      ],
      reviews: [
        {
          data: [
            { source: "google" },
            { source: "google" },
            { source: "internal" },
            { source: "video-testimonial" },
          ],
        },
      ],
    });

    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(supabase);

    const result = await getReviewsBySource({
      startDate: "2026-06-01T00:00:00.000Z",
      endDate: "2026-07-01T00:00:00.000Z",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual([
      { source: "google", label: "Google", count: 2 },
      { source: "internal", label: "Survey", count: 1 },
      { source: "video-testimonial", label: "Video review", count: 1 },
    ]);

    const reviewsQuery = supabase.builders.reviews[0];
    expect(reviewsQuery.select).toHaveBeenCalledWith("source");
    expect(reviewsQuery.eq).toHaveBeenCalledWith("organization_id", "org-1");
    expect(reviewsQuery.eq).toHaveBeenCalledWith("status", "approved");
    expect(reviewsQuery.gte).toHaveBeenCalledWith(
      "review_date",
      "2026-06-01T00:00:00.000Z"
    );
    expect(reviewsQuery.lte).toHaveBeenCalledWith(
      "review_date",
      "2026-07-01T00:00:00.000Z"
    );
  });
});
