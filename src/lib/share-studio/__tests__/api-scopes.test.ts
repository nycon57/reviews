import { describe, expect, it } from "vitest";
import { API_KEY_SCOPES } from "@/lib/api-keys/types";
import { hasAllScopes, hasScope, type ApiAuthContext } from "@/lib/api-keys/validate";

describe("Share Studio API scopes", () => {
  it("registers required Share Studio scopes", () => {
    expect(API_KEY_SCOPES).toContain("share-studio:read");
    expect(API_KEY_SCOPES).toContain("share-studio:write");
    expect(API_KEY_SCOPES).toContain("share-studio:render");
    expect(API_KEY_SCOPES).toContain("share-studio:publish");
  });

  it("scope helpers support Share Studio scope checks", () => {
    const context: ApiAuthContext = {
      apiKeyId: "key_123",
      organizationId: "org_123",
      requestId: "req_123",
      scopes: ["share-studio:read", "share-studio:render"],
      rateLimit: {
        isAllowed: true,
        currentCount: 2,
        limitCount: 100,
        remaining: 98,
        resetAt: new Date().toISOString(),
      },
    };

    expect(hasScope(context, "share-studio:read")).toBe(true);
    expect(hasScope(context, "share-studio:publish")).toBe(false);
    expect(hasAllScopes(context, ["share-studio:read", "share-studio:render"])).toBe(true);
  });

  it("admin scope grants all Share Studio permissions", () => {
    const context: ApiAuthContext = {
      apiKeyId: "key_admin",
      organizationId: "org_123",
      requestId: "req_admin",
      scopes: ["admin"],
      rateLimit: {
        isAllowed: true,
        currentCount: 1,
        limitCount: 100,
        remaining: 99,
        resetAt: new Date().toISOString(),
      },
    };

    expect(hasScope(context, "share-studio:read")).toBe(true);
    expect(hasScope(context, "share-studio:write")).toBe(true);
    expect(hasScope(context, "share-studio:render")).toBe(true);
    expect(hasScope(context, "share-studio:publish")).toBe(true);
  });
});
