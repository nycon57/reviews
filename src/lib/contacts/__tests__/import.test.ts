import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/access", () => ({ getAccessContext: vi.fn() }));
vi.mock("@/lib/contacts/actions", () => ({
  findOrCreateContact: vi.fn(),
  isSuppressed: vi.fn(),
}));
vi.mock("@/lib/supabase/admin", () => ({ createUntypedAdminClient: vi.fn() }));

import { getAccessContext } from "@/lib/access";
import { findOrCreateContact, isSuppressed } from "@/lib/contacts/actions";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { bulkImportContacts } from "../import";

type MaybeResult = { data: unknown };

/** Minimal builder whose maybeSingle() drains a per-call queue (the existence probe). */
function mockAdmin(existenceProbeResults: MaybeResult[]) {
  const queue = [...existenceProbeResults];
  const builder: Record<string, unknown> = {};
  for (const m of ["select", "eq", "is"]) {
    builder[m] = vi.fn(() => builder);
  }
  builder.maybeSingle = vi.fn(() =>
    Promise.resolve(queue.shift() ?? { data: null })
  );
  (createUntypedAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
    from: vi.fn(() => builder),
  });
}

function setCtx(overrides: Record<string, unknown> = {}) {
  (getAccessContext as ReturnType<typeof vi.fn>).mockResolvedValue({
    organizationId: "org1",
    userId: "u1",
    role: "admin",
    isGracePeriod: false,
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("bulkImportContacts", () => {
  it("errors when the email column is missing from the header", async () => {
    setCtx();
    const result = await bulkImportContacts("name,phone\nJane,555");
    expect(result.created).toBe(0);
    expect(result.errors[0]).toMatch(/email.*column/i);
    expect(findOrCreateContact).not.toHaveBeenCalled();
  });

  it("counts created, merged, suppressed-skipped, and invalid rows", async () => {
    setCtx();
    (isSuppressed as ReturnType<typeof vi.fn>).mockImplementation(
      (_org: string, email: string) => Promise.resolve(email === "blocked@example.com")
    );
    (findOrCreateContact as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "c" });
    // Probe results in row order: jane (existing → merged), john (missing → created).
    mockAdmin([{ data: { id: "existing" } }, { data: null }]);

    const csv = [
      "name,email,phone",
      "Jane Doe,jane@example.com,(415) 555-0123",
      "John New,john@example.com,",
      "Sup Pressed,blocked@example.com,",
      "Bad Row,not-an-email,",
    ].join("\n");

    const result = await bulkImportContacts(csv);

    expect(result.total).toBe(4);
    expect(result.created).toBe(1);
    expect(result.merged).toBe(1);
    expect(result.suppressedSkipped).toBe(1);
    expect(result.invalid).toBe(1);
    // The suppressed row is never written; only jane + john reach the resolver.
    expect(findOrCreateContact).toHaveBeenCalledTimes(2);
  });

  it("refuses to import during the billing grace period", async () => {
    setCtx({ isGracePeriod: true });
    await expect(bulkImportContacts("name,email\nJane,jane@example.com")).rejects.toThrow(
      /grace period/i
    );
  });

  it("forces a regular user's imports to be owned by themselves", async () => {
    setCtx({ role: "user", userId: "u9" });
    (isSuppressed as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    (findOrCreateContact as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "c" });
    mockAdmin([{ data: null }]);

    await bulkImportContacts("name,email\nJane,jane@example.com", "someone-else");

    // Owner argument (4th) is the acting user, not the requested owner.
    expect(findOrCreateContact).toHaveBeenCalledWith(
      "org1",
      expect.objectContaining({ email: "jane@example.com" }),
      "u9",
      "import"
    );
  });
});
