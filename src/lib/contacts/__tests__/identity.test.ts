import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { normalizeEmail, normalizePhone, sha256Email } from "../identity";

describe("normalizeEmail", () => {
  it("lowercases and trims", () => {
    expect(normalizeEmail("  Jane.Doe@Example.COM ")).toBe("jane.doe@example.com");
  });

  it("returns null for empty / nullish input", () => {
    expect(normalizeEmail("")).toBeNull();
    expect(normalizeEmail("   ")).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
    expect(normalizeEmail(undefined)).toBeNull();
  });

  it("rejects malformed addresses", () => {
    expect(normalizeEmail("nope")).toBeNull();
    expect(normalizeEmail("@example.com")).toBeNull();
    expect(normalizeEmail("jane@")).toBeNull();
    expect(normalizeEmail("a@b@c.com")).toBeNull();
    expect(normalizeEmail("jane doe@example.com")).toBeNull();
  });

  it("treats case-different spellings as the same identity", () => {
    expect(normalizeEmail("A@B.com")).toBe(normalizeEmail("a@b.com"));
  });
});

describe("normalizePhone", () => {
  it("formats a bare US 10-digit number as +1 E.164", () => {
    expect(normalizePhone("(415) 555-0123")).toBe("+14155550123");
    expect(normalizePhone("415.555.0123")).toBe("+14155550123");
    expect(normalizePhone("4155550123")).toBe("+14155550123");
  });

  it("keeps an existing country code", () => {
    expect(normalizePhone("+1 415 555 0123")).toBe("+14155550123");
    expect(normalizePhone("14155550123")).toBe("+14155550123");
    expect(normalizePhone("+44 20 7946 0958")).toBe("+442079460958");
  });

  it("treats a 00 international prefix as +", () => {
    expect(normalizePhone("0044 20 7946 0958")).toBe("+442079460958");
  });

  it("returns null on garbage", () => {
    expect(normalizePhone("call me")).toBeNull();
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone("123")).toBeNull(); // too short for E.164
    expect(normalizePhone("1234567890123456")).toBeNull(); // too long
  });
});

describe("sha256Email", () => {
  it("hashes the normalized form so spellings collide", () => {
    const expected = createHash("sha256").update("jane@example.com").digest("hex");
    expect(sha256Email("  Jane@Example.com ")).toBe(expected);
    expect(sha256Email("jane@example.com")).toBe(sha256Email("JANE@EXAMPLE.COM"));
  });

  it("returns null when the email cannot be normalized", () => {
    expect(sha256Email("not-an-email")).toBeNull();
    expect(sha256Email(null)).toBeNull();
  });
});
