import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/access", () => ({ getAccessContext: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createUntypedAdminClient: vi.fn() }));

import { getAccessContext } from "@/lib/access";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { getRequestFunnelRollup } from "../request-funnel";

type Result = { data?: unknown; error?: unknown };

function createSupabaseMock(plan: Record<string, Result[]>) {
  const queues: Record<string, Result[]> = {};
  for (const [table, results] of Object.entries(plan)) queues[table] = [...results];

  function next(table: string): Result {
    const queue = queues[table];
    if (!queue || queue.length === 0) throw new Error(`No queued result for "${table}"`);
    return queue.shift() as Result;
  }

  function makeBuilder(table: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test double
    const builder: any = {};
    for (const m of ["select", "eq", "in", "gte", "not"]) {
      builder[m] = vi.fn(() => builder);
    }
    builder.then = (resolve: (v: Result) => void, reject?: (e: unknown) => void) =>
      Promise.resolve(next(table)).then(resolve, reject);
    return builder;
  }

  return { from: vi.fn((table: string) => makeBuilder(table)) };
}

beforeEach(() => vi.clearAllMocks());

describe("getRequestFunnelRollup", () => {
  it("aggregates per-professional and org funnel metrics with rates", async () => {
    (getAccessContext as ReturnType<typeof vi.fn>).mockResolvedValue({
      organizationId: "org1",
      userId: "ux",
      role: "admin",
    });
    (createUntypedAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(
      createSupabaseMock({
        loan_officers: [
          {
            data: [
              { id: "lo1", full_name: "Alice", user_id: "u1" },
              { id: "lo2", full_name: "Bob", user_id: "u2" },
            ],
          },
        ],
        surveys: [
          {
            data: [
              {
                id: "s1",
                loan_officer_id: "lo1",
                sent_at: "t",
                opened_at: "t",
                completed_at: "t",
                status: "completed",
              },
              {
                id: "s2",
                loan_officer_id: "lo1",
                sent_at: "t",
                opened_at: null,
                completed_at: null,
                status: "sent",
              },
            ],
          },
        ],
        video_testimonial_requests: [
          {
            data: [
              {
                id: "v1",
                loan_officer_id: "lo2",
                sent_at: "t",
                opened_at: "t",
                submitted_at: "t",
                status: "submitted",
              },
            ],
          },
        ],
        survey_responses: [{ data: [] }],
        video_testimonial_responses: [{ data: [] }],
      })
    );

    const rollup = await getRequestFunnelRollup(30);

    expect(rollup.windowDays).toBe(30);
    expect(rollup.org.requestsSent).toBe(3);
    expect(rollup.org.opened).toBe(2);
    expect(rollup.org.submitted).toBe(2);
    expect(rollup.org.published).toBe(0);
    expect(rollup.org.openRate).toBeCloseTo(2 / 3);

    // Sorted by requestsSent desc: Alice (2) before Bob (1).
    expect(rollup.professionals.map((p) => p.name)).toEqual(["Alice", "Bob"]);
    const alice = rollup.professionals[0];
    expect(alice).toMatchObject({ requestsSent: 2, opened: 1, submitted: 1 });
    expect(alice.openRate).toBeCloseTo(0.5);
    expect(alice.submissionRate).toBeCloseTo(0.5);
    const bob = rollup.professionals[1];
    expect(bob.openRate).toBe(1);
  });

  it("clamps an unsupported window to 30 days", async () => {
    (getAccessContext as ReturnType<typeof vi.fn>).mockResolvedValue({
      organizationId: "org1",
      userId: "ux",
      role: "admin",
    });
    (createUntypedAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(
      createSupabaseMock({ loan_officers: [{ data: [] }] })
    );

    const rollup = await getRequestFunnelRollup(45);
    expect(rollup.windowDays).toBe(30);
    expect(rollup.professionals).toEqual([]);
  });
});
