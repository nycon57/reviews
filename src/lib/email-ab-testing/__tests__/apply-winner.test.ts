import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/actions", () => ({ unifiedGetUser: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
  createUntypedAdminClient: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { unifiedGetUser } from "@/lib/auth/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyWinnerToFuture } from "../actions";
import {
  resolveEmailTypeSend,
  resolveEmailTypeOverride,
  assignRunningTestVariant,
} from "../overrides";

type Result = { data?: unknown; error?: unknown };

/**
 * Per-table queued Supabase double (house pattern). Table calls resolve at
 * await / single / maybeSingle in FIFO order; `rpc` resolves from its own queue.
 */
function createSupabaseMock(plan: {
  tables?: Record<string, Result[]>;
  rpc?: Result[];
}) {
  const queues: Record<string, Result[]> = {};
  for (const [t, results] of Object.entries(plan.tables ?? {})) queues[t] = [...results];
  const rpcQueue = [...(plan.rpc ?? [])];

  function next(table: string): Result {
    const q = queues[table];
    if (!q || q.length === 0) throw new Error(`No queued result for "${table}"`);
    return q.shift() as Result;
  }

  function makeBuilder(table: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test double
    const builder: any = {};
    for (const m of ["select", "eq", "is", "in", "order", "range", "limit", "update", "insert", "upsert", "delete"]) {
      builder[m] = vi.fn(() => builder);
    }
    builder.maybeSingle = vi.fn(() => Promise.resolve(next(table)));
    builder.single = vi.fn(() => Promise.resolve(next(table)));
    builder.then = (resolve: (v: Result) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(next(table)).then(resolve, reject);
    return builder;
  }

  return {
    from: vi.fn((table: string) => makeBuilder(table)),
    rpc: vi.fn(() => {
      if (rpcQueue.length === 0) throw new Error("No queued rpc result");
      return Promise.resolve(rpcQueue.shift() as Result);
    }),
  };
}

function asAdmin() {
  (unifiedGetUser as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "admin1" });
}

const adminUserRow: Result = {
  data: { id: "admin1", organization_id: "org1", role: "admin" },
};

beforeEach(() => vi.clearAllMocks());

describe("applyWinnerToFuture", () => {
  it("persists the winning subject/preview and stamps the applied columns", async () => {
    asAdmin();
    const mock = createSupabaseMock({
      tables: {
        users: [adminUserRow],
        email_ab_tests: [
          {
            data: {
              id: "test1",
              organization_id: "org1",
              email_type: "survey_invitation",
              winner_variant: "B",
              variants: [
                { id: "A", name: "Control", subjectLine: "Old" },
                { id: "B", name: "Punchy", subjectLine: "New & better", previewText: "Peek" },
              ],
            },
          },
          { error: null }, // the winner_applied_at stamp update
        ],
        email_type_overrides: [{ error: null }], // upsert
      },
    });
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mock);

    const result = await applyWinnerToFuture("test1");

    expect(result.success).toBe(true);
    // Override upsert carried the winning variant's copy.
    const overrideBuilder = mock.from.mock.results.find(
      (r, i) => mock.from.mock.calls[i]?.[0] === "email_type_overrides"
    )?.value;
    expect(overrideBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org1",
        email_type: "survey_invitation",
        subject_line: "New & better",
        preview_text: "Peek",
        source_ab_test_id: "test1",
        applied_by: "admin1",
      }),
      { onConflict: "organization_id,email_type" }
    );
    expect(result.data?.message).toContain("survey_invitation");
  });

  it("refuses to apply a winner with no subject or preview (content/send-time test)", async () => {
    asAdmin();
    const mock = createSupabaseMock({
      tables: {
        users: [adminUserRow],
        email_ab_tests: [
          {
            data: {
              id: "test2",
              organization_id: "org1",
              email_type: "welcome_1_access",
              winner_variant: "B",
              variants: [
                { id: "A", name: "Control" },
                { id: "B", name: "Later send", sendTimeOffsetHours: 6 },
              ],
            },
          },
        ],
      },
    });
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mock);

    const result = await applyWinnerToFuture("test2");
    expect(result.success).toBe(false);
    expect(result.error).toContain("subject-line");
  });

  it("returns a pending-migration error when the override table is missing", async () => {
    asAdmin();
    const mock = createSupabaseMock({
      tables: {
        users: [adminUserRow],
        email_ab_tests: [
          {
            data: {
              id: "test3",
              organization_id: "org1",
              email_type: "survey_invitation",
              winner_variant: "A",
              variants: [{ id: "A", name: "Control", subjectLine: "Hi" }],
            },
          },
        ],
        email_type_overrides: [{ error: { code: "42P01" } }],
      },
    });
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mock);

    const result = await applyWinnerToFuture("test3");
    expect(result.success).toBe(false);
    expect(result.error).toContain("migration");
  });

  it("rejects when no winner has been declared", async () => {
    asAdmin();
    const mock = createSupabaseMock({
      tables: {
        users: [adminUserRow],
        email_ab_tests: [
          {
            data: {
              id: "test4",
              organization_id: "org1",
              email_type: "survey_invitation",
              winner_variant: null,
              variants: [],
            },
          },
        ],
      },
    });
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mock);

    const result = await applyWinnerToFuture("test4");
    expect(result.success).toBe(false);
    expect(result.error).toContain("No winner");
  });
});

describe("resolveEmailTypeSend", () => {
  it("returns the defaults unchanged when org or email type is missing", async () => {
    const mock = createSupabaseMock({});
    const res = await resolveEmailTypeSend(mock as never, {
      organizationId: null,
      emailType: "survey_invitation",
      subject: "Default subject",
    });
    expect(res).toEqual({ subject: "Default subject", previewText: undefined });
    expect(mock.from).not.toHaveBeenCalled();
  });

  it("assigns a running test's variant subject and returns stamps", async () => {
    const mock = createSupabaseMock({
      tables: {
        email_ab_tests: [
          {
            data: {
              id: "t1",
              test_type: "subject_line",
              variants: [
                { id: "A", subjectLine: "Control subject" },
                { id: "B", subjectLine: "Variant subject" },
              ],
            },
          },
        ],
      },
      rpc: [{ data: "B" }],
    });

    const res = await resolveEmailTypeSend(mock as never, {
      organizationId: "org1",
      emailType: "survey_invitation",
      subject: "Default subject",
    });

    expect(res.subject).toBe("Variant subject");
    expect(res.abTestId).toBe("t1");
    expect(res.abTestVariant).toBe("B");
  });

  it("falls back to an applied override when no test is running", async () => {
    const mock = createSupabaseMock({
      tables: {
        email_ab_tests: [{ data: null }], // no active test
        email_type_overrides: [
          { data: { subject_line: "Winning subject", preview_text: null } },
        ],
      },
    });

    const res = await resolveEmailTypeSend(mock as never, {
      organizationId: "org1",
      emailType: "survey_invitation",
      subject: "Default subject",
    });

    expect(res.subject).toBe("Winning subject");
    expect(res.abTestId).toBeUndefined();
  });

  it("keeps the default subject and never throws when lookups fail", async () => {
    const mock = {
      from: vi.fn(() => {
        throw new Error("db down");
      }),
      rpc: vi.fn(),
    };
    const res = await resolveEmailTypeSend(mock as never, {
      organizationId: "org1",
      emailType: "survey_invitation",
      subject: "Default subject",
    });
    expect(res.subject).toBe("Default subject");
  });
});

describe("override + assignment helpers", () => {
  it("resolveEmailTypeOverride returns null when there is no override", async () => {
    const mock = createSupabaseMock({
      tables: { email_type_overrides: [{ data: null }] },
    });
    const res = await resolveEmailTypeOverride(mock as never, "org1", "survey_invitation");
    expect(res).toBeNull();
  });

  it("assignRunningTestVariant returns null when the RPC yields no variant", async () => {
    const mock = createSupabaseMock({
      tables: {
        email_ab_tests: [
          { data: { id: "t1", test_type: "subject_line", variants: [] } },
        ],
      },
      rpc: [{ data: null }],
    });
    const res = await assignRunningTestVariant(mock as never, "org1", "survey_invitation");
    expect(res).toBeNull();
  });
});
