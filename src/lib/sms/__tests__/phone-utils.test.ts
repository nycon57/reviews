import { describe, it, expect } from "vitest";
import {
  toE164,
  isValidE164,
  formatForDisplay,
  maskPhone,
  getAreaCode,
} from "../phone-utils";

describe("toE164", () => {
  it("normalizes a 10-digit number", () => {
    expect(toE164("2125551234")).toBe("+12125551234");
  });

  it("normalizes a number with +1 prefix", () => {
    expect(toE164("+12125551234")).toBe("+12125551234");
  });

  it("normalizes a number with 1 prefix (no +)", () => {
    expect(toE164("12125551234")).toBe("+12125551234");
  });

  it("strips parentheses, dashes, spaces", () => {
    expect(toE164("(212) 555-1234")).toBe("+12125551234");
  });

  it("strips dots", () => {
    expect(toE164("212.555.1234")).toBe("+12125551234");
  });

  it("handles +1 with formatting", () => {
    expect(toE164("+1 (212) 555-1234")).toBe("+12125551234");
  });

  it("returns null for empty string", () => {
    expect(toE164("")).toBeNull();
  });

  it("returns null for non-numeric input", () => {
    expect(toE164("not-a-phone")).toBeNull();
  });

  it("returns null for too few digits", () => {
    expect(toE164("12345")).toBeNull();
  });

  it("returns null for too many digits", () => {
    expect(toE164("121255512345")).toBeNull();
  });

  it("returns null for null-ish input", () => {
    expect(toE164(null as unknown as string)).toBeNull();
    expect(toE164(undefined as unknown as string)).toBeNull();
  });
});

describe("isValidE164", () => {
  it("validates a correct E.164 number", () => {
    expect(isValidE164("+12125551234")).toBe(true);
  });

  it("rejects without + prefix", () => {
    expect(isValidE164("12125551234")).toBe(false);
  });

  it("rejects non-US numbers", () => {
    expect(isValidE164("+442071234567")).toBe(false);
  });

  it("rejects too short", () => {
    expect(isValidE164("+1212555")).toBe(false);
  });
});

describe("formatForDisplay", () => {
  it("formats E.164 to (XXX) XXX-XXXX", () => {
    expect(formatForDisplay("+12125551234")).toBe("(212) 555-1234");
  });

  it("returns input unchanged for non-E.164", () => {
    expect(formatForDisplay("not-a-number")).toBe("not-a-number");
  });
});

describe("maskPhone", () => {
  it("masks last 2 digits", () => {
    expect(maskPhone("+12125551234")).toBe("(212) 555-12**");
  });

  it("returns full mask for invalid input", () => {
    expect(maskPhone("bad")).toBe("***-***-****");
  });
});

describe("getAreaCode", () => {
  it("extracts area code from E.164", () => {
    expect(getAreaCode("+12125551234")).toBe("212");
  });

  it("returns null for invalid", () => {
    expect(getAreaCode("bad")).toBeNull();
  });
});
