import { describe, it, expect } from "vitest";
import {
  validateStructuredData,
  getValidationStatus,
  getRecommendedSchemaTypes,
  recommendSchemaType,
} from "../seo-validation";
import type { JsonLdOutput } from "../structured-data-generator";

function makeValidJsonLd(overrides?: Partial<JsonLdOutput>): JsonLdOutput {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Test Corp",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.5",
      reviewCount: 10,
      bestRating: "5",
      worstRating: "1",
    },
    review: [
      {
        "@type": "Review",
        author: { "@type": "Person", name: "Jane Doe" },
        datePublished: "2024-01-15",
        reviewRating: {
          "@type": "Rating",
          ratingValue: 5,
          bestRating: 5,
          worstRating: 1,
        },
        reviewBody: "Great service!",
      },
    ],
    ...overrides,
  };
}

describe("validateStructuredData", () => {
  it("returns valid for well-formed JSON-LD", () => {
    const result = validateStructuredData(makeValidJsonLd());
    expect(result.valid).toBe(true);
    expect(result.errors).toBe(0);
  });

  it("reports error for missing @context", () => {
    const jsonLd = makeValidJsonLd();
    delete (jsonLd as Record<string, unknown>)["@context"];
    const result = validateStructuredData(jsonLd as JsonLdOutput);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.field === "@context" && i.severity === "error")).toBe(true);
  });

  it("reports error for missing @type", () => {
    const jsonLd = makeValidJsonLd();
    delete (jsonLd as Record<string, unknown>)["@type"];
    const result = validateStructuredData(jsonLd as JsonLdOutput);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.field === "@type")).toBe(true);
  });

  it("reports error for missing name", () => {
    const jsonLd = makeValidJsonLd({ name: "" });
    const result = validateStructuredData(jsonLd);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.field === "name")).toBe(true);
  });

  it("reports error for out-of-range ratingValue", () => {
    const jsonLd = makeValidJsonLd({
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "6.0",
        reviewCount: 5,
        bestRating: "5",
        worstRating: "1",
      },
    });
    const result = validateStructuredData(jsonLd);
    expect(result.valid).toBe(false);
    expect(
      result.issues.some(
        (i) =>
          i.field === "aggregateRating.ratingValue" && i.severity === "error"
      )
    ).toBe(true);
  });

  it("reports info when no aggregateRating present", () => {
    const jsonLd = makeValidJsonLd();
    delete jsonLd.aggregateRating;
    delete jsonLd.review;
    const result = validateStructuredData(jsonLd);
    expect(result.valid).toBe(true);
    expect(
      result.issues.some(
        (i) => i.field === "aggregateRating" && i.severity === "info"
      )
    ).toBe(true);
  });

  it("reports warning for anonymous review authors", () => {
    const jsonLd = makeValidJsonLd({
      review: [
        {
          "@type": "Review",
          author: { "@type": "Person", name: "Anonymous" },
          datePublished: "2024-01-15",
          reviewRating: {
            "@type": "Rating",
            ratingValue: 4,
            bestRating: 5,
            worstRating: 1,
          },
          reviewBody: "Good",
        },
      ],
    });
    const result = validateStructuredData(jsonLd);
    expect(
      result.issues.some(
        (i) => i.field.includes("author.name") && i.severity === "warning"
      )
    ).toBe(true);
  });

  it("reports warning for >10 review snippets", () => {
    const reviews = Array.from({ length: 12 }, (_, i) => ({
      "@type": "Review" as const,
      author: { "@type": "Person" as const, name: `User ${i}` },
      datePublished: "2024-01-15",
      reviewRating: {
        "@type": "Rating" as const,
        ratingValue: 4,
        bestRating: 5,
        worstRating: 1,
      },
      reviewBody: "Review text",
    }));
    const jsonLd = makeValidJsonLd({ review: reviews });
    const result = validateStructuredData(jsonLd);
    expect(
      result.issues.some((i) => i.field === "review" && i.severity === "warning")
    ).toBe(true);
  });

  it("reports warning for LocalBusiness without address", () => {
    const jsonLd = makeValidJsonLd({ "@type": "LocalBusiness" });
    const result = validateStructuredData(jsonLd);
    expect(
      result.issues.some(
        (i) => i.field === "address" && i.severity === "warning"
      )
    ).toBe(true);
  });

  it("reports info for Organization without url", () => {
    const jsonLd = makeValidJsonLd({ "@type": "Organization" });
    const result = validateStructuredData(jsonLd);
    expect(
      result.issues.some((i) => i.field === "url" && i.severity === "info")
    ).toBe(true);
  });

  it("provides quick fixes for common issues", () => {
    const jsonLd = makeValidJsonLd();
    (jsonLd as Record<string, unknown>)["@context"] = "http://wrong.org";
    const result = validateStructuredData(jsonLd as JsonLdOutput);
    const contextIssue = result.issues.find((i) => i.field === "@context");
    expect(contextIssue?.fix).toBeDefined();
    expect(contextIssue?.fix?.suggestedValue).toBe("https://schema.org");
  });
});

describe("getValidationStatus", () => {
  it("returns 'valid' when no errors or warnings", () => {
    expect(
      getValidationStatus({ valid: true, errors: 0, warnings: 0, issues: [] })
    ).toBe("valid");
  });

  it("returns 'errors' when errors present", () => {
    expect(
      getValidationStatus({
        valid: false,
        errors: 1,
        warnings: 0,
        issues: [],
      })
    ).toBe("errors");
  });

  it("returns 'warnings' when only warnings present", () => {
    expect(
      getValidationStatus({ valid: true, errors: 0, warnings: 2, issues: [] })
    ).toBe("warnings");
  });
});

describe("getRecommendedSchemaTypes", () => {
  it("returns Person for user entity type", () => {
    expect(getRecommendedSchemaTypes("user")).toEqual(["Person"]);
  });

  it("returns business types for branch entity type", () => {
    const types = getRecommendedSchemaTypes("branch");
    expect(types).toContain("LocalBusiness");
    expect(types).toContain("FinancialService");
  });

  it("returns Organization for unknown entity type", () => {
    expect(getRecommendedSchemaTypes("unknown")).toEqual(["Organization"]);
  });
});

describe("recommendSchemaType", () => {
  it("recommends Person for user entity", () => {
    const rec = recommendSchemaType("user");
    expect(rec.type).toBe("Person");
  });

  it("recommends FinancialService for mortgage branch", () => {
    const rec = recommendSchemaType("branch", "Mortgage Lending");
    expect(rec.type).toBe("FinancialService");
  });

  it("recommends LocalBusiness for non-mortgage branch", () => {
    const rec = recommendSchemaType("branch", "Retail");
    expect(rec.type).toBe("LocalBusiness");
  });

  it("recommends Organization for generic org", () => {
    const rec = recommendSchemaType("organization");
    expect(rec.type).toBe("Organization");
  });

  it("recommends FinancialService for mortgage org", () => {
    const rec = recommendSchemaType("organization", "Mortgage Finance");
    expect(rec.type).toBe("FinancialService");
  });
});
