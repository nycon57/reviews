import { describe, it, expect } from "vitest";
import {
  checkRespaCompliance,
  checkOptOutLanguage,
  checkBodyLength,
  checkMergeFields,
  validateTemplateBody,
  MAX_TEMPLATE_BODY_LENGTH,
} from "../validators";

describe("checkRespaCompliance", () => {
  it("returns no issues for compliant body", () => {
    const issues = checkRespaCompliance("Hi, please leave us a review!");
    expect(issues).toEqual([]);
  });

  it("detects 'gift card' as prohibited", () => {
    const issues = checkRespaCompliance("Leave a review and get a gift card!");
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("RESPA_PROHIBITED");
    expect(issues[0].severity).toBe("error");
  });

  it("detects 'reward' as prohibited", () => {
    const issues = checkRespaCompliance("Get a reward for your review!");
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("RESPA_PROHIBITED");
  });

  it("detects 'incentive' as prohibited", () => {
    const issues = checkRespaCompliance("We offer an incentive for reviews.");
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("RESPA_PROHIBITED");
  });

  it("detects 'discount' as prohibited", () => {
    const issues = checkRespaCompliance("Get a discount on your next closing!");
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("RESPA_PROHIBITED");
  });

  it("detects 'compensation' as prohibited", () => {
    const issues = checkRespaCompliance("Receive compensation for feedback.");
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("RESPA_PROHIBITED");
  });

  it("detects case-insensitive matches", () => {
    const issues = checkRespaCompliance("Get a GIFT CARD today!");
    expect(issues).toHaveLength(1);
  });

  it("detects multiple prohibited patterns", () => {
    const issues = checkRespaCompliance("Get a reward and a bonus!");
    expect(issues.length).toBeGreaterThanOrEqual(2);
  });
});

describe("checkOptOutLanguage", () => {
  it("returns no issues when opt-out present", () => {
    const issues = checkOptOutLanguage("Leave a review! Reply STOP to opt out.");
    expect(issues).toEqual([]);
  });

  it("returns warning when opt-out missing", () => {
    const issues = checkOptOutLanguage("Leave a review!");
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("MISSING_OPT_OUT");
    expect(issues[0].severity).toBe("warning");
  });

  it("is case-insensitive", () => {
    const issues = checkOptOutLanguage("reply stop to opt out.");
    expect(issues).toEqual([]);
  });
});

describe("checkBodyLength", () => {
  it("returns no issues for valid length", () => {
    const issues = checkBodyLength("Hello!");
    expect(issues).toEqual([]);
  });

  it("returns error for empty body", () => {
    const issues = checkBodyLength("");
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("BODY_EMPTY");
    expect(issues[0].severity).toBe("error");
  });

  it("returns error for body exceeding 480 chars", () => {
    const longBody = "a".repeat(MAX_TEMPLATE_BODY_LENGTH + 1);
    const issues = checkBodyLength(longBody);
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("BODY_TOO_LONG");
    expect(issues[0].severity).toBe("error");
  });

  it("accepts body at exactly 480 chars", () => {
    const exactBody = "a".repeat(MAX_TEMPLATE_BODY_LENGTH);
    const issues = checkBodyLength(exactBody);
    expect(issues).toEqual([]);
  });
});

describe("checkMergeFields", () => {
  it("returns no issues for valid fields", () => {
    const issues = checkMergeFields("Hi {{first_name}}, {{lo_name}} here.");
    expect(issues).toEqual([]);
  });

  it("warns on unsupported fields", () => {
    const issues = checkMergeFields("Hi {{custom_field}}!");
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("UNSUPPORTED_MERGE_FIELD");
    expect(issues[0].severity).toBe("warning");
  });

  it("errors on malformed syntax", () => {
    const issues = checkMergeFields("Hi {{ first_name }}!");
    const malformed = issues.filter((i) => i.code === "MALFORMED_MERGE_FIELD");
    expect(malformed.length).toBeGreaterThan(0);
    expect(malformed[0].severity).toBe("error");
  });
});

describe("validateTemplateBody", () => {
  it("returns valid for a proper template", () => {
    const result = validateTemplateBody(
      "Hi {{first_name}}, thanks for working with {{lo_name}}! Reply STOP to opt out."
    );
    expect(result.valid).toBe(true);
    expect(result.segmentCount).toBeGreaterThan(0);
    expect(result.encoding).toBe("GSM-7");
  });

  it("returns invalid for RESPA violations", () => {
    const result = validateTemplateBody(
      "Get a gift card for your review! Reply STOP to opt out."
    );
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.code === "RESPA_PROHIBITED")).toBe(true);
  });

  it("returns valid with opt-out warning only", () => {
    const result = validateTemplateBody("Hi {{first_name}}, leave us a review!");
    // Only warning (MISSING_OPT_OUT), no errors
    expect(result.valid).toBe(true);
    expect(result.issues.some((i) => i.code === "MISSING_OPT_OUT")).toBe(true);
  });

  it("calculates segment count for GSM-7", () => {
    const result = validateTemplateBody("Hello! Reply STOP to opt out.");
    expect(result.encoding).toBe("GSM-7");
    expect(result.segmentCount).toBe(1);
  });

  it("detects UCS-2 encoding for emoji", () => {
    const result = validateTemplateBody("Hello! \u{1F600} Reply STOP to opt out.");
    expect(result.encoding).toBe("UCS-2");
  });
});
