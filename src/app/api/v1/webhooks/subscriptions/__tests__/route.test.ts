import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-keys/validate", () => ({
  withApiAuth:
    (handler: (request: NextRequest, context: Record<string, unknown>) => Promise<Response>) =>
    (request: NextRequest) =>
      handler(request, {
        apiKeyId: "api_key_1",
        organizationId: "org_1",
        scopes: ["webhooks:manage"],
        requestId: "req_test",
        rateLimit: {
          isAllowed: true,
          currentCount: 0,
          limitCount: 1000,
          resetAt: "2026-01-01T00:00:00.000Z",
          remaining: 999,
        },
      }),
}));

describe("POST /api/v1/webhooks/subscriptions", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("rejects non-HTTPS target URLs", async () => {
    const { POST } = await import("../route");
    const response = await POST(
      new NextRequest("http://localhost/api/v1/webhooks/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          target_url: "http://example.com/webhook",
          events: ["review.published"],
        }),
      })
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
      },
    });
  });

  it("rejects events outside the catalog", async () => {
    const { POST } = await import("../route");
    const response = await POST(
      new NextRequest("http://localhost/api/v1/webhooks/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          target_url: "https://example.com/webhook",
          events: ["survey.created"],
        }),
      })
    );

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error.details.errors[0].field).toBe("events.0");
  });
});
