import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createUntypedAdminClient: vi.fn(),
}));

import { createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  eraseContact,
  findOrCreateContact,
  isSuppressed,
  reassignContactOwner,
  reinstateContact,
  suppressContact,
} from "../actions";

type Result = { data?: unknown; error?: unknown };
interface CallLog {
  table: string;
  method: string;
  args: unknown[];
}

/**
 * A Supabase mock that returns queued results per table in call order. Each
 * `.from(table)` builder resolves one queued result at its terminal
 * (`.single()`, `.maybeSingle()`, or a bare `await`). Method calls are recorded
 * in `log` for assertions.
 */
function createSupabaseMock(plan: Record<string, Result[]>) {
  const queues: Record<string, Result[]> = {};
  for (const [table, results] of Object.entries(plan)) queues[table] = [...results];
  const log: CallLog[] = [];

  function next(table: string): Result {
    const queue = queues[table];
    if (!queue || queue.length === 0) {
      throw new Error(`No queued result for table "${table}"`);
    }
    return queue.shift() as Result;
  }

  function makeBuilder(table: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test double
    const builder: any = {};
    const chainMethods = [
      "select",
      "insert",
      "update",
      "delete",
      "eq",
      "is",
      "not",
      "in",
      "limit",
      "order",
      "ilike",
      "range",
    ];
    for (const method of chainMethods) {
      builder[method] = vi.fn((...args: unknown[]) => {
        log.push({ table, method, args });
        return builder;
      });
    }
    builder.single = vi.fn(() => {
      log.push({ table, method: "single", args: [] });
      return Promise.resolve(next(table));
    });
    builder.maybeSingle = vi.fn(() => {
      log.push({ table, method: "maybeSingle", args: [] });
      return Promise.resolve(next(table));
    });
    builder.then = (
      resolve: (v: Result) => unknown,
      reject?: (e: unknown) => unknown
    ) => Promise.resolve(next(table)).then(resolve, reject);
    return builder;
  }

  const client = {
    from: vi.fn((table: string) => {
      log.push({ table, method: "from", args: [table] });
      return makeBuilder(table);
    }),
  };

  return { client, log };
}

function useMock(plan: Record<string, Result[]>) {
  const mock = createSupabaseMock(plan);
  (createUntypedAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mock.client);
  return mock;
}

/** Find the args passed to the first `method` call against `table`. */
function argsFor(log: CallLog[], table: string, method: string): unknown[] | undefined {
  return log.find((c) => c.table === table && c.method === method)?.args;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("findOrCreateContact", () => {
  it("rejects a request with no valid email", async () => {
    useMock({});
    await expect(
      findOrCreateContact("org1", { email: "garbage" }, "u1", "survey")
    ).rejects.toThrow(/valid email is required/);
  });

  it("refreshes an existing live Contact and reassigns the Owner", async () => {
    const existing = { id: "c1", organization_id: "org1", email: "jane@example.com" };
    const updated = { ...existing, name: "Jane", owner_user_id: "u2" };
    const { client, log } = useMock({ contacts: [{ data: existing }, { data: updated }] });

    const result = await findOrCreateContact(
      "org1",
      { email: "  JANE@example.com ", name: "Jane", phone: "(415) 555-0123" },
      "u2",
      "survey"
    );

    expect(result).toEqual(updated);
    // Second contacts touch is the freshness update carrying normalized values.
    const updateArgs = argsFor(log, "contacts", "update")?.[0] as Record<string, unknown>;
    expect(updateArgs).toMatchObject({
      name: "Jane",
      phone: "+14155550123",
      owner_user_id: "u2",
    });
    expect(client.from).toHaveBeenCalledWith("contacts");
  });

  it("creates a fresh Contact with normalized email + hash when none exists", async () => {
    const created = { id: "c2", organization_id: "org1", email: "new@example.com" };
    const { log } = useMock({
      contacts: [
        { data: null }, // live lookup miss
        { data: null }, // erased-tombstone miss
        { data: created }, // insert
      ],
      contact_suppressions: [
        { data: [] }, // preserve: tombstone-by-hash lookup
        { data: null }, // preserve: tombstone cleanup delete
      ],
    });

    const result = await findOrCreateContact(
      "org1",
      { email: "New@Example.com" },
      "u1",
      "video_testimonial"
    );

    expect(result).toEqual(created);
    const insertArgs = argsFor(log, "contacts", "insert")?.[0] as Record<string, unknown>;
    expect(insertArgs.email).toBe("new@example.com");
    expect(insertArgs.source).toBe("video_testimonial");
    expect(typeof insertArgs.email_sha256).toBe("string");
    expect((insertArgs.email_sha256 as string).length).toBe(64);
  });
});

describe("isSuppressed", () => {
  it("is true when a suppression row exists for org+hash+channel", async () => {
    useMock({ contact_suppressions: [{ data: { id: "s1" } }] });
    await expect(isSuppressed("org1", "jane@example.com", "email")).resolves.toBe(true);
  });

  it("is false when there is no matching suppression", async () => {
    useMock({ contact_suppressions: [{ data: null }] });
    await expect(isSuppressed("org1", "jane@example.com", "email")).resolves.toBe(false);
  });

  it("short-circuits to false (no query) for an unnormalizable email", async () => {
    const { client } = useMock({});
    await expect(isSuppressed("org1", "garbage", "email")).resolves.toBe(false);
    expect(client.from).not.toHaveBeenCalled();
  });
});

describe("suppressContact", () => {
  it("inserts a new suppression carrying the Contact's org and email hash", async () => {
    const { log } = useMock({
      contacts: [{ data: { id: "c1", organization_id: "org1", email_sha256: "hash1" } }],
      contact_suppressions: [
        { data: null }, // existing lookup miss
        { data: null }, // insert
      ],
    });

    await suppressContact("c1", "email", "do_not_contact", "manual");

    const insertArgs = argsFor(log, "contact_suppressions", "insert")?.[0] as Record<
      string,
      unknown
    >;
    expect(insertArgs).toMatchObject({
      contact_id: "c1",
      organization_id: "org1",
      email_sha256: "hash1",
      channel: "email",
      reason: "do_not_contact",
      source: "manual",
    });
  });

  it("updates the reason when the channel is already suppressed", async () => {
    const { log } = useMock({
      contacts: [{ data: { id: "c1", organization_id: "org1", email_sha256: "hash1" } }],
      contact_suppressions: [
        { data: { id: "s1" } }, // existing found
        { data: null }, // update
      ],
    });

    await suppressContact("c1", "email", "bounced");

    const updateArgs = argsFor(log, "contact_suppressions", "update")?.[0] as Record<
      string,
      unknown
    >;
    expect(updateArgs).toMatchObject({ reason: "bounced" });
  });
});

describe("reinstateContact", () => {
  it("removes the contact-linked suppression and any tombstone for the same email", async () => {
    const { log } = useMock({
      contacts: [{ data: { id: "c1", organization_id: "org1", email_sha256: "hash1" } }],
      contact_suppressions: [
        { data: null }, // delete contact-linked
        { data: null }, // delete tombstone
      ],
    });

    await reinstateContact("c1", "email");

    const deletes = log.filter(
      (c) => c.table === "contact_suppressions" && c.method === "delete"
    );
    expect(deletes.length).toBe(2);
  });
});

describe("reassignContactOwner", () => {
  it("updates owner_user_id (and can unassign with null)", async () => {
    const { log } = useMock({ contacts: [{ data: null }] });
    await reassignContactOwner("c1", null);
    const updateArgs = argsFor(log, "contacts", "update")?.[0] as Record<string, unknown>;
    expect(updateArgs).toEqual({ owner_user_id: null });
  });
});

describe("eraseContact", () => {
  const contactRow = {
    data: { id: "c1", organization_id: "org1", owner_user_id: "u1" },
  };
  const noError = { data: null };

  it("erases when the acting user is the Contact Owner", async () => {
    const { log } = useMock({
      contacts: [contactRow, noError], // lookup, then erase update
      surveys: [noError],
      video_testimonial_requests: [noError],
      profile_referrals: [noError],
      reviews: [noError],
    });

    await eraseContact("c1", "u1");

    const eraseArgs = argsFor(log, "contacts", "update")?.[0] as Record<string, unknown>;
    expect(eraseArgs).toMatchObject({ name: null, email: null, phone: null });
    expect(typeof eraseArgs.erased_at).toBe("string");

    const surveyArgs = argsFor(log, "surveys", "update")?.[0] as Record<string, unknown>;
    expect(surveyArgs).toMatchObject({
      customer_name: "Erased Contact",
      customer_phone: null,
    });
    const reviewArgs = argsFor(log, "reviews", "update")?.[0] as Record<string, unknown>;
    expect(reviewArgs).toMatchObject({ customer_name: "Anonymous", customer_email: null });
  });

  it("erases when the acting user is an org admin (not the owner)", async () => {
    useMock({
      contacts: [contactRow, noError],
      users: [{ data: { id: "admin1", role: "admin", organization_id: "org1" } }],
      surveys: [noError],
      video_testimonial_requests: [noError],
      profile_referrals: [noError],
      reviews: [noError],
    });

    await expect(eraseContact("c1", "admin1")).resolves.toBeUndefined();
  });

  it("refuses a non-owner, non-admin acting user", async () => {
    useMock({
      contacts: [contactRow],
      users: [{ data: { id: "u9", role: "loan_officer", organization_id: "org1" } }],
    });

    await expect(eraseContact("c1", "u9")).rejects.toThrow(/not authorized/);
  });
});
