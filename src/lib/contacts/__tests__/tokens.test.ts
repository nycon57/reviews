import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createUntypedAdminClient: vi.fn(),
}));

// Base URL is now sourced from emailConfig (single source of truth); mock it so
// the resolved origin is stable and independent of process env.
vi.mock("@/lib/email/client", () => ({
  emailConfig: { baseUrl: "https://app.example.com" },
}));

import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { emailConfig } from "@/lib/email/client";
import {
  buildContactUnsubscribeUrl,
  getContactUnsubscribeUrl,
  resolveContactUnsubscribeUrl,
} from "../tokens";

beforeEach(() => {
  vi.clearAllMocks();
  emailConfig.baseUrl = "https://app.example.com";
});

describe("buildContactUnsubscribeUrl", () => {
  it("points at the shared /u/c/[token] route on the configured origin", () => {
    expect(buildContactUnsubscribeUrl("abc123")).toBe(
      "https://app.example.com/u/c/abc123"
    );
  });

  it("strips a trailing slash on the base URL", () => {
    emailConfig.baseUrl = "https://app.example.com/";
    expect(buildContactUnsubscribeUrl("t")).toBe("https://app.example.com/u/c/t");
  });
});

describe("getContactUnsubscribeUrl", () => {
  it("builds the URL from a Contact that already carries its token", () => {
    expect(getContactUnsubscribeUrl({ unsubscribe_token: "tok" })).toBe(
      "https://app.example.com/u/c/tok"
    );
  });

  it("returns null when the token is absent", () => {
    expect(getContactUnsubscribeUrl({ unsubscribe_token: null })).toBeNull();
    expect(getContactUnsubscribeUrl({})).toBeNull();
  });
});

describe("resolveContactUnsubscribeUrl", () => {
  function mockClient(steps: {
    lookup: { data?: unknown; error?: unknown };
    update?: { error?: unknown };
  }) {
    const update = vi.fn((_patch: { unsubscribe_token: string }) => builder);
    const builder = {
      select: vi.fn(() => builder),
      update,
      eq: vi.fn(() => builder),
      is: vi.fn(() => Promise.resolve({ error: steps.update?.error ?? null })),
      maybeSingle: vi.fn(() => Promise.resolve(steps.lookup)),
    };
    const client = { from: vi.fn(() => builder) };
    (createUntypedAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(client);
    return { client, builder, update };
  }

  it("returns the URL for a Contact whose token is present", async () => {
    mockClient({ lookup: { data: { id: "c1", unsubscribe_token: "tok" } } });
    await expect(resolveContactUnsubscribeUrl("c1")).resolves.toBe(
      "https://app.example.com/u/c/tok"
    );
  });

  it("returns null when the Contact does not exist", async () => {
    mockClient({ lookup: { data: null } });
    await expect(resolveContactUnsubscribeUrl("missing")).resolves.toBeNull();
  });

  it("lazily generates and persists a token when the row lacks one", async () => {
    const { update } = mockClient({
      lookup: { data: { id: "c1", unsubscribe_token: null } },
    });
    const url = await resolveContactUnsubscribeUrl("c1");
    expect(update).toHaveBeenCalledTimes(1);
    const persisted = (update.mock.calls[0][0] as { unsubscribe_token: string })
      .unsubscribe_token;
    expect(persisted).toMatch(/^[0-9a-f]{32}$/);
    expect(url).toBe(`https://app.example.com/u/c/${persisted}`);
  });
});
