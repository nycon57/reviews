import { describe, expect, it, vi } from "vitest";

// emailConfig is read at import for getBaseUrl(); pin a stable origin.
vi.mock("@/lib/email/client", () => ({
  emailConfig: { baseUrl: "https://app.example.com" },
}));

import { contactPageUrlToOneClickUrl } from "../tokens";

describe("contactPageUrlToOneClickUrl", () => {
  it("converts a /u/c page URL into the POST-capable one-click API URL", () => {
    expect(contactPageUrlToOneClickUrl("https://app.example.com/u/c/abc123")).toBe(
      "https://app.example.com/api/email/unsubscribe?c=abc123"
    );
  });

  it("preserves the token's origin", () => {
    expect(contactPageUrlToOneClickUrl("https://other.host/u/c/tok")).toBe(
      "https://other.host/api/email/unsubscribe?c=tok"
    );
  });

  it("returns null for a non-contact URL", () => {
    expect(
      contactPageUrlToOneClickUrl("https://app.example.com/unsubscribe/xyz")
    ).toBeNull();
  });

  it("returns null for a malformed URL", () => {
    expect(contactPageUrlToOneClickUrl("not a url")).toBeNull();
  });
});
