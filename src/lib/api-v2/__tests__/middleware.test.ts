import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return {
    ...actual,
    after: (callback: () => void | Promise<void>) => {
      void callback();
    },
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OPEN_TIER_RATE_LIMIT, withOpenTier } from "../middleware";

function mockSupabaseRpc(result: {
  data?: unknown;
  error?: unknown;
}): { rpc: ReturnType<typeof vi.fn>; insert: ReturnType<typeof vi.fn> } {
  const insert = vi.fn().mockResolvedValue({ error: null });
  const rpc = vi.fn().mockResolvedValue({
    data: result.data ?? null,
    error: result.error ?? null,
  });

  (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
    rpc,
    from: vi.fn().mockReturnValue({ insert }),
  });

  return { rpc, insert };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("withOpenTier", () => {
  it("allows requests under the minute limit", async () => {
    const { rpc } = mockSupabaseRpc({
      data: [{ is_allowed: true, current_count: 1, retry_after_seconds: 60 }],
    });
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));
    const request = new NextRequest("http://localhost/api/v2/professionals", {
      headers: { "x-forwarded-for": "203.0.113.8" },
    });

    const response = await withOpenTier(handler)(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("X-RepWell-Source")).toBe(
      "repwell-public-api-v2"
    );
    expect(handler).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith("check_minute_rate_limit", {
      p_bucket: "v2-open",
      p_window_key: expect.stringMatching(/^[a-f0-9]{64}$/),
      p_limit: OPEN_TIER_RATE_LIMIT,
    });
  });

  it("returns 429 with Retry-After when the minute limit is exceeded", async () => {
    mockSupabaseRpc({
      data: [{ is_allowed: false, current_count: 61, retry_after_seconds: 45 }],
    });
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));
    const request = new NextRequest("http://localhost/api/v2/professionals", {
      headers: { "x-forwarded-for": "203.0.113.8" },
    });

    const response = await withOpenTier(handler)(request);

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("45");
    await expect(response.json()).resolves.toEqual({
      error: "rate_limit_exceeded",
      retry_after: 45,
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("fails closed when the rate-limit RPC fails", async () => {
    mockSupabaseRpc({
      error: { message: "database unavailable" },
    });
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));
    const request = new NextRequest("http://localhost/api/v2/professionals", {
      headers: { "x-forwarded-for": "203.0.113.8" },
    });

    const response = await withOpenTier(handler)(request);

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(handler).not.toHaveBeenCalled();
  });
});
