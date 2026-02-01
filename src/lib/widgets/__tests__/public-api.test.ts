import { describe, it, expect } from "vitest";
import { resolveAllowedOrigin, buildCorsHeaders, widgetError, withCorsAndCache } from "../cors";
import { isValidEventType, checkEventRateLimit } from "../public-queries";
import { NextResponse } from "next/server";

describe("resolveAllowedOrigin", () => {
  it("returns '*' when allowedDomains is null", () => {
    expect(resolveAllowedOrigin("https://example.com", null)).toBe("*");
  });
  it("returns '*' when allowedDomains is empty", () => {
    expect(resolveAllowedOrigin("https://example.com", [])).toBe("*");
  });
  it("returns origin when matching", () => {
    expect(resolveAllowedOrigin("https://example.com", ["example.com"])).toBe("https://example.com");
  });
  it("matches subdomains", () => {
    expect(resolveAllowedOrigin("https://app.example.com", ["example.com"])).toBe("https://app.example.com");
  });
  it("returns null for non-matching", () => {
    expect(resolveAllowedOrigin("https://evil.com", ["example.com"])).toBeNull();
  });
  it("returns null when origin is null and domains are set", () => {
    expect(resolveAllowedOrigin(null, ["example.com"])).toBeNull();
  });
  it("is case-insensitive", () => {
    expect(resolveAllowedOrigin("https://Example.COM", ["example.com"])).toBe("https://Example.COM");
  });
});

describe("buildCorsHeaders", () => {
  it("returns standard CORS headers", () => {
    const h = buildCorsHeaders("*");
    expect(h["Access-Control-Allow-Origin"]).toBe("*");
    expect(h["Access-Control-Allow-Methods"]).toBe("GET, POST, OPTIONS");
  });
});

describe("withCorsAndCache", () => {
  it("sets Vary: Origin when origin is not wildcard", () => {
    const res = NextResponse.json({});
    const result = withCorsAndCache(res, "https://example.com", "public, max-age=300");
    expect(result.headers.get("Vary")).toBe("Origin");
    expect(result.headers.get("Access-Control-Allow-Origin")).toBe("https://example.com");
    expect(result.headers.get("Cache-Control")).toBe("public, max-age=300");
  });
  it("does not set Vary: Origin for wildcard", () => {
    const res = NextResponse.json({});
    const result = withCorsAndCache(res, "*", "public, max-age=60");
    expect(result.headers.get("Vary")).toBeNull();
    expect(result.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});

describe("widgetError", () => {
  it("returns correct status and CORS headers", () => {
    const r = widgetError("Not found", "NOT_FOUND", 404);
    expect(r.status).toBe(404);
    expect(r.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(r.headers.get("Cache-Control")).toBe("no-store");
  });
  it("follows { error, code } JSON structure", async () => {
    const r = widgetError("broken", "INTERNAL_ERROR", 500);
    const body = await r.json();
    expect(body).toEqual({ error: "broken", code: "INTERNAL_ERROR" });
  });
});

describe("isValidEventType", () => {
  it("returns true for valid types", () => {
    expect(isValidEventType("impression")).toBe(true);
    expect(isValidEventType("click_cta")).toBe(true);
  });
  it("returns false for invalid types", () => {
    expect(isValidEventType("invalid")).toBe(false);
    expect(isValidEventType("IMPRESSION")).toBe(false);
  });
});

describe("checkEventRateLimit", () => {
  it("allows requests under limit", () => {
    const ip = `test-${Date.now()}`;
    expect(checkEventRateLimit(ip)).toBe(true);
  });
  it("blocks over limit", () => {
    const ip = `test-block-${Date.now()}`;
    for (let i = 0; i < 100; i++) checkEventRateLimit(ip);
    expect(checkEventRateLimit(ip)).toBe(false);
  });
  it("tracks IPs independently", () => {
    const a = `test-a-${Date.now()}`;
    const b = `test-b-${Date.now()}`;
    for (let i = 0; i < 100; i++) checkEventRateLimit(a);
    expect(checkEventRateLimit(b)).toBe(true);
    expect(checkEventRateLimit(a)).toBe(false);
  });
});
