import { describe, it, expect } from "vitest";
import {
  extractMergeFields,
  validateMergeFields,
  renderTemplate,
  renderTemplatePreview,
  SAMPLE_MERGE_DATA,
  SUPPORTED_MERGE_FIELDS,
} from "../merge-engine";

describe("extractMergeFields", () => {
  it("extracts all merge fields from a template", () => {
    const body = "Hi {{first_name}}, thanks for working with {{lo_name}} at {{company_name}}!";
    const fields = extractMergeFields(body);
    expect(fields).toEqual(["first_name", "lo_name", "company_name"]);
  });

  it("returns empty array for template with no fields", () => {
    expect(extractMergeFields("Hello there!")).toEqual([]);
  });

  it("deduplicates repeated fields", () => {
    const body = "{{first_name}} and {{first_name}} again";
    expect(extractMergeFields(body)).toEqual(["first_name"]);
  });

  it("extracts all supported field types", () => {
    const body = SUPPORTED_MERGE_FIELDS.map((f) => `{{${f}}}`).join(" ");
    const fields = extractMergeFields(body);
    expect(fields).toEqual([...SUPPORTED_MERGE_FIELDS]);
  });
});

describe("validateMergeFields", () => {
  it("returns valid for supported fields", () => {
    const result = validateMergeFields("Hi {{first_name}}, {{lo_name}} here.");
    expect(result.valid).toBe(true);
    expect(result.fields).toEqual(["first_name", "lo_name"]);
    expect(result.unsupportedFields).toEqual([]);
    expect(result.malformedPatterns).toEqual([]);
  });

  it("flags unsupported fields", () => {
    const result = validateMergeFields("Hi {{unknown_field}}!");
    expect(result.valid).toBe(false);
    expect(result.unsupportedFields).toEqual(["unknown_field"]);
  });

  it("detects malformed merge field syntax with spaces", () => {
    const result = validateMergeFields("Hi {{ first_name }}!");
    expect(result.valid).toBe(false);
    expect(result.malformedPatterns.length).toBeGreaterThan(0);
  });

  it("returns valid for template with no fields", () => {
    const result = validateMergeFields("No merge fields here.");
    expect(result.valid).toBe(true);
    expect(result.fields).toEqual([]);
  });
});

describe("renderTemplate", () => {
  it("replaces merge fields with context values", () => {
    const body = "Hi {{first_name}}, thanks for working with {{lo_name}}! Reply STOP to opt out.";
    const result = renderTemplate(body, {
      first_name: "Alice",
      lo_name: "Bob Johnson",
    });
    expect(result.body).toBe("Hi Alice, thanks for working with Bob Johnson! Reply STOP to opt out.");
    expect(result.unresolvedFields).toEqual([]);
    expect(result.optOutAppended).toBe(false);
  });

  it("auto-appends opt-out language when missing", () => {
    const body = "Hi {{first_name}}, leave us a review!";
    const result = renderTemplate(body, { first_name: "Alice" });
    expect(result.body).toContain("Reply STOP to opt out.");
    expect(result.optOutAppended).toBe(true);
  });

  it("does not append opt-out if already present", () => {
    const body = "Hi {{first_name}}! Reply STOP to opt out.";
    const result = renderTemplate(body, { first_name: "Alice" });
    expect(result.optOutAppended).toBe(false);
    // Should not have double opt-out
    expect(result.body.match(/Reply STOP/gi)?.length).toBe(1);
  });

  it("leaves unresolved fields as-is and reports them", () => {
    const body = "Hi {{first_name}}, {{lo_name}} at {{company_name}}. Reply STOP to opt out.";
    const result = renderTemplate(body, { first_name: "Alice" });
    expect(result.body).toContain("{{lo_name}}");
    expect(result.body).toContain("{{company_name}}");
    expect(result.unresolvedFields).toEqual(["lo_name", "company_name"]);
  });

  it("calculates correct segment info", () => {
    const body = "Short message. Reply STOP to opt out.";
    const result = renderTemplate(body, {});
    expect(result.segmentInfo.segments).toBe(1);
    expect(result.segmentInfo.encoding).toBe("GSM-7");
  });

  it("handles empty context", () => {
    const body = "Hi {{first_name}}! Reply STOP to opt out.";
    const result = renderTemplate(body, {});
    expect(result.body).toContain("{{first_name}}");
    expect(result.unresolvedFields).toEqual(["first_name"]);
  });
});

describe("renderTemplatePreview", () => {
  it("renders with sample data", () => {
    const body = "Hi {{first_name}}, thanks for working with {{lo_name}} at {{company_name}}! Reply STOP to opt out.";
    const result = renderTemplatePreview(body);
    expect(result.body).toContain(SAMPLE_MERGE_DATA.first_name);
    expect(result.body).toContain(SAMPLE_MERGE_DATA.lo_name);
    expect(result.body).toContain(SAMPLE_MERGE_DATA.company_name);
    expect(result.unresolvedFields).toEqual([]);
  });

  it("resolves all supported merge fields", () => {
    const body = SUPPORTED_MERGE_FIELDS.map((f) => `{{${f}}}`).join(" ");
    const result = renderTemplatePreview(body);
    expect(result.unresolvedFields).toEqual([]);
    // Verify no unresolved {{}} syntax remains
    expect(result.body).not.toMatch(/\{\{[a-z_]+\}\}/);
  });
});
