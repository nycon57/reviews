import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/access", () => ({ getAccessContext: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createUntypedAdminClient: vi.fn() }));

import { getAccessContext } from "@/lib/access";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { getContacts, getContactTimeline } from "../queries";

type Result = { data?: unknown; error?: unknown; count?: number };

/** Per-table queued Supabase double; resolves at await / maybeSingle in call order. */
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
    for (const m of ["select", "eq", "is", "not", "in", "or", "order", "range", "limit"]) {
      builder[m] = vi.fn(() => builder);
    }
    builder.maybeSingle = vi.fn(() => Promise.resolve(next(table)));
    builder.single = vi.fn(() => Promise.resolve(next(table)));
    builder.then = (resolve: (v: Result) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(next(table)).then(resolve, reject);
    return builder;
  }

  return { from: vi.fn((table: string) => makeBuilder(table)) };
}

function useMock(plan: Record<string, Result[]>) {
  (createUntypedAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(
    createSupabaseMock(plan)
  );
}

function setCtx(overrides: Record<string, unknown> = {}) {
  (getAccessContext as ReturnType<typeof vi.fn>).mockResolvedValue({
    organizationId: "org1",
    userId: "ux",
    role: "admin",
    ...overrides,
  });
}

beforeEach(() => vi.clearAllMocks());

describe("getContacts", () => {
  it("enriches rows with owner name, suppression status, and last activity", async () => {
    setCtx();
    useMock({
      contacts: [
        {
          count: 2,
          data: [
            {
              id: "c1",
              name: "Jane",
              email: "jane@x.com",
              phone: null,
              owner_user_id: "u2",
              source: "import",
              created_at: "2026-01-01T00:00:00Z",
              updated_at: "2026-06-01T00:00:00Z",
            },
            {
              id: "c2",
              name: "John",
              email: "john@x.com",
              phone: null,
              owner_user_id: null,
              source: "survey",
              created_at: "2026-02-01T00:00:00Z",
              updated_at: "2026-05-01T00:00:00Z",
            },
          ],
        },
      ],
      users: [{ data: [{ id: "u2", full_name: "Alice Owner" }] }],
      contact_suppressions: [{ data: [{ contact_id: "c1" }] }],
      surveys: [{ data: [{ contact_id: "c1", created_at: "2026-06-15T00:00:00Z" }] }],
      video_testimonial_requests: [
        { data: [{ contact_id: "c2", created_at: "2026-06-20T00:00:00Z" }] },
      ],
      reviews: [{ data: [] }],
    });

    const { contacts, total } = await getContacts({ page: 1, pageSize: 25 });

    expect(total).toBe(2);
    const c1 = contacts.find((c) => c.id === "c1")!;
    const c2 = contacts.find((c) => c.id === "c2")!;
    expect(c1.ownerName).toBe("Alice Owner");
    expect(c1.suppressed).toBe(true);
    expect(c1.lastActivityAt).toBe("2026-06-15T00:00:00Z");
    expect(c2.ownerName).toBeNull();
    expect(c2.suppressed).toBe(false);
    expect(c2.lastActivityAt).toBe("2026-06-20T00:00:00Z");
  });
});

describe("getContactTimeline", () => {
  it("assembles a newest-first timeline across surveys, videos, and reviews", async () => {
    setCtx();
    useMock({
      contacts: [
        {
          data: {
            id: "c1",
            name: "Jane",
            email: "jane@x.com",
            phone: null,
            owner_user_id: "u2",
            source: "import",
            erased_at: null,
            organization_id: "org1",
            created_at: "2026-01-01T00:00:00Z",
          },
        },
      ],
      surveys: [{ data: [{ id: "s1", status: "completed", created_at: "2026-03-01T00:00:00Z" }] }],
      video_testimonial_requests: [
        { data: [{ id: "v1", status: "submitted", created_at: "2026-04-01T00:00:00Z" }] },
      ],
      reviews: [
        {
          data: [
            {
              id: "r1",
              status: "approved",
              rating: 5,
              is_published: true,
              created_at: "2026-05-01T00:00:00Z",
            },
          ],
        },
      ],
      contact_suppressions: [
        { data: [{ channel: "email", reason: "unsubscribed", created_at: "2026-05-02T00:00:00Z" }] },
      ],
      users: [{ data: [{ id: "u2", full_name: "Alice Owner" }] }],
    });

    const result = await getContactTimeline("c1");
    expect(result).not.toBeNull();
    const { contact, timeline } = result!;

    expect(contact.ownerName).toBe("Alice Owner");
    expect(contact.suppressions).toEqual([
      { channel: "email", reason: "unsubscribed", createdAt: "2026-05-02T00:00:00Z" },
    ]);
    expect(timeline.map((t) => t.kind)).toEqual(["review", "video", "survey"]);
    expect(timeline[0]).toMatchObject({ kind: "review", isPublished: true, rating: 5 });
  });

  it("returns null when the contact is in another org", async () => {
    setCtx();
    useMock({
      contacts: [
        {
          data: {
            id: "c1",
            name: "Jane",
            email: "jane@x.com",
            phone: null,
            owner_user_id: "u2",
            source: "import",
            erased_at: null,
            organization_id: "other-org",
            created_at: "2026-01-01T00:00:00Z",
          },
        },
      ],
    });

    await expect(getContactTimeline("c1")).resolves.toBeNull();
  });
});
