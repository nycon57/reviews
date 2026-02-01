import { describe, it, expect } from "vitest";
import {
  domainMatches,
  isDomainAllowed,
  isValidHostname,
} from "../domain-validation";

describe("domainMatches", () => {
  it("matches exact domain", () => {
    expect(domainMatches("example.com", "example.com")).toBe(true);
  });

  it("matches case-insensitively", () => {
    expect(domainMatches("example.com", "EXAMPLE.COM")).toBe(true);
    expect(domainMatches("Example.Com", "example.com")).toBe(true);
  });

  it("does not match different domain", () => {
    expect(domainMatches("other.com", "example.com")).toBe(false);
  });

  it("does not match subdomain when exact domain is specified", () => {
    expect(domainMatches("sub.example.com", "example.com")).toBe(false);
  });

  it("strips protocol from allowlist entry", () => {
    expect(domainMatches("example.com", "https://example.com")).toBe(true);
    expect(domainMatches("example.com", "http://example.com")).toBe(true);
  });

  it("strips port from allowlist entry", () => {
    expect(domainMatches("example.com", "example.com:8080")).toBe(true);
  });

  it("strips path from allowlist entry", () => {
    expect(domainMatches("example.com", "example.com/path")).toBe(true);
  });

  describe("wildcard support", () => {
    it("*.example.com matches sub.example.com", () => {
      expect(domainMatches("sub.example.com", "*.example.com")).toBe(true);
    });

    it("*.example.com matches deep.sub.example.com", () => {
      expect(domainMatches("deep.sub.example.com", "*.example.com")).toBe(true);
    });

    it("*.example.com matches the base domain itself", () => {
      expect(domainMatches("example.com", "*.example.com")).toBe(true);
    });

    it("*.example.com does not match notexample.com", () => {
      expect(domainMatches("notexample.com", "*.example.com")).toBe(false);
    });

    it("*.example.com does not match other.com", () => {
      expect(domainMatches("other.com", "*.example.com")).toBe(false);
    });
  });
});

describe("isDomainAllowed", () => {
  it("allows any domain when allowlist is empty", () => {
    expect(isDomainAllowed("anything.com", [])).toBe(true);
    expect(isDomainAllowed("anything.com", null)).toBe(true);
  });

  it("allows exact match from allowlist", () => {
    expect(isDomainAllowed("example.com", ["example.com"])).toBe(true);
  });

  it("blocks domain not in allowlist", () => {
    expect(isDomainAllowed("evil.com", ["example.com"])).toBe(false);
  });

  it("supports multiple domains in allowlist", () => {
    const domains = ["example.com", "other.com"];
    expect(isDomainAllowed("example.com", domains)).toBe(true);
    expect(isDomainAllowed("other.com", domains)).toBe(true);
    expect(isDomainAllowed("blocked.com", domains)).toBe(false);
  });

  it("supports wildcard domains in allowlist", () => {
    expect(isDomainAllowed("sub.example.com", ["*.example.com"])).toBe(true);
    expect(isDomainAllowed("other.com", ["*.example.com"])).toBe(false);
  });

  describe("localhost in draft mode", () => {
    it("allows localhost for draft widgets", () => {
      expect(isDomainAllowed("localhost", ["example.com"], "draft")).toBe(true);
    });

    it("allows 127.0.0.1 for draft widgets", () => {
      expect(isDomainAllowed("127.0.0.1", ["example.com"], "draft")).toBe(true);
    });

    it("allows [::1] for draft widgets", () => {
      expect(isDomainAllowed("[::1]", ["example.com"], "draft")).toBe(true);
    });

    it("does not allow localhost for active widgets with allowlist", () => {
      expect(isDomainAllowed("localhost", ["example.com"], "active")).toBe(false);
    });

    it("does not allow localhost for active widgets without explicit draft status", () => {
      expect(isDomainAllowed("localhost", ["example.com"])).toBe(false);
    });
  });
});

describe("isValidHostname", () => {
  it("accepts standard hostnames", () => {
    expect(isValidHostname("example.com")).toBe(true);
    expect(isValidHostname("sub.example.com")).toBe(true);
    expect(isValidHostname("my-site.co.uk")).toBe(true);
  });

  it("accepts wildcard hostnames", () => {
    expect(isValidHostname("*.example.com")).toBe(true);
    expect(isValidHostname("*.sub.example.com")).toBe(true);
  });

  it("rejects invalid hostnames", () => {
    expect(isValidHostname("")).toBe(false);
    expect(isValidHostname("localhost")).toBe(false);
    expect(isValidHostname("127.0.0.1")).toBe(false);
    expect(isValidHostname("https://example.com")).toBe(false);
    expect(isValidHostname("example")).toBe(false);
    expect(isValidHostname("*.")).toBe(false);
    expect(isValidHostname("**example.com")).toBe(false);
  });
});
