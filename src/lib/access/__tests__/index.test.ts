import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/actions", () => ({ unifiedGetUser: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

import { unifiedGetUser } from "@/lib/auth/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAccessContext } from "../index";

/** Mock a users lookup whose `.select().eq().single()` resolves to `result`. */
function mockUsersSingle(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.single = vi.fn(() => Promise.resolve(result));
  (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
    from: vi.fn(() => chain),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getAccessContext single-path resolution (ADR 0006)", () => {
  it("resolves an individual account's org id + real tier from the one organizations row", async () => {
    (unifiedGetUser as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "user-indiv" });
    mockUsersSingle({
      data: {
        id: "user-indiv",
        role: "admin",
        is_owner: true,
        organization_id: "org-indiv",
        organizations: {
          account_type: "individual",
          subscription_tier: "pro",
          subscription_status: "active",
          grace_period_ends_at: null,
        },
      },
      error: null,
    });

    const ctx = await getAccessContext();

    expect(ctx).not.toBeNull();
    expect(ctx?.accountType).toBe("individual");
    expect(ctx?.organizationId).toBe("org-indiv");
    // Real tier is read from the org row — a paying individual is not defaulted to basic.
    expect(ctx?.subscriptionTier).toBe("pro");
    expect(ctx?.isOwner).toBe(true);
  });

  it("resolves an enterprise account through the same single path", async () => {
    (unifiedGetUser as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "user-ent" });
    mockUsersSingle({
      data: {
        id: "user-ent",
        role: "manager",
        is_owner: false,
        organization_id: "org-ent",
        organizations: {
          account_type: "enterprise",
          subscription_tier: "enterprise",
          subscription_status: "active",
          grace_period_ends_at: null,
        },
      },
      error: null,
    });

    const ctx = await getAccessContext();

    expect(ctx?.accountType).toBe("enterprise");
    expect(ctx?.organizationId).toBe("org-ent");
    expect(ctx?.subscriptionTier).toBe("enterprise");
    expect(ctx?.role).toBe("manager");
  });

  it("returns null when the user has no organization", async () => {
    (unifiedGetUser as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "user-orphan" });
    mockUsersSingle({
      data: {
        id: "user-orphan",
        role: "user",
        is_owner: false,
        organization_id: null,
        organizations: null,
      },
      error: null,
    });

    const ctx = await getAccessContext();

    expect(ctx).toBeNull();
  });
});
