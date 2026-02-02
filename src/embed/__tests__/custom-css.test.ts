// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { sanitizeCustomCSS, validateCustomCSS } from "../core/css-sanitizer";

describe("sanitizeCustomCSS", () => {
  it("returns empty for falsy input", () => {
    expect(sanitizeCustomCSS("")).toEqual({ sanitized: "", warnings: [] });
    expect(sanitizeCustomCSS(null as unknown as string)).toEqual({ sanitized: "", warnings: [] });
  });

  it("passes through safe CSS unchanged", () => {
    const css = ".rw-widget { border-radius: 8px; color: #333; }";
    const result = sanitizeCustomCSS(css);
    expect(result.sanitized).toBe(css);
    expect(result.warnings).toHaveLength(0);
  });

  it("strips @import rules", () => {
    const css = '@import url("https://evil.com/styles.css"); .rw-widget { color: red; }';
    const result = sanitizeCustomCSS(css);
    expect(result.sanitized).not.toContain("@import");
    expect(result.warnings.some((w) => w.includes("@import"))).toBe(true);
  });

  it("strips data: URLs", () => {
    const css = ".rw-widget { background: url(data:text/css;base64,abc); }";
    const result = sanitizeCustomCSS(css);
    expect(result.sanitized).not.toContain("data:");
    expect(result.warnings.some((w) => w.includes("data:"))).toBe(true);
  });

  it("strips javascript: URLs", () => {
    const css = '.rw-widget { background: url("javascript:alert(1)"); }';
    const result = sanitizeCustomCSS(css);
    expect(result.sanitized).not.toContain("javascript:");
    expect(result.warnings.some((w) => w.includes("javascript:"))).toBe(true);
  });

  it("strips expression()", () => {
    const css = ".rw-widget { width: expression(document.body.clientWidth); }";
    const result = sanitizeCustomCSS(css);
    expect(result.sanitized).not.toContain("expression(");
    expect(result.warnings.some((w) => w.includes("expression"))).toBe(true);
  });

  it("strips behavior property", () => {
    const css = ".rw-widget { behavior: url(xss.htc); }";
    const result = sanitizeCustomCSS(css);
    expect(result.sanitized).not.toContain("behavior:");
    expect(result.warnings.some((w) => w.includes("behavior"))).toBe(true);
  });

  it("rejects CSS exceeding 5000 characters", () => {
    const css = "a".repeat(5001);
    const result = sanitizeCustomCSS(css);
    expect(result.sanitized).toBe("");
    expect(result.warnings[0]).toContain("5000");
  });

  it("allows CSS at exactly 5000 characters", () => {
    const css = ".x{}" + "a".repeat(4996);
    const result = sanitizeCustomCSS(css);
    expect(result.sanitized).toBe(css);
  });
});

describe("validateCustomCSS", () => {
  it("returns empty array for empty input", () => {
    expect(validateCustomCSS("")).toEqual([]);
  });

  it("warns on position:fixed", () => {
    const warnings = validateCustomCSS(".rw-widget { position: fixed; }");
    expect(warnings.some((w) => w.includes("position:fixed"))).toBe(true);
  });

  it("warns on extreme z-index", () => {
    const warnings = validateCustomCSS(".rw-widget { z-index: 99999; }");
    expect(warnings.some((w) => w.includes("z-index"))).toBe(true);
  });

  it("warns on pointer-events:none on :host", () => {
    const warnings = validateCustomCSS(":host { pointer-events: none; }");
    expect(warnings.some((w) => w.includes("pointer-events"))).toBe(true);
  });

  it("does not warn on safe CSS", () => {
    const warnings = validateCustomCSS(".rw-widget { color: blue; padding: 10px; }");
    expect(warnings).toHaveLength(0);
  });

  it("warns on @import", () => {
    const warnings = validateCustomCSS('@import url("styles.css");');
    expect(warnings.some((w) => w.includes("@import"))).toBe(true);
  });

  it("warns when exceeding character limit", () => {
    const warnings = validateCustomCSS("a".repeat(5001));
    expect(warnings.some((w) => w.includes("5000"))).toBe(true);
  });
});
