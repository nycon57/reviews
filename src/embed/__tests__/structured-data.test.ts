// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { PublicWidgetConfig, PublicReview, EntityProfile } from "../types";

// ── Helpers ──────────────────────────────────────────────────────────

function makeConfig(overrides: Partial<PublicWidgetConfig> = {}): PublicWidgetConfig {
  return {
    widget_id: "test-widget-123",
    widget_type: "company_review",
    entity_type: "organization",
    entity_id: null,
    name: "Test Widget",
    config: {},
    enable_structured_data: true,
    structured_data_type: null,
    status: "active",
    version: 1,
    ...overrides,
  };
}

function makeReview(overrides: Partial<PublicReview> = {}): PublicReview {
  return {
    id: "review-1",
    reviewer_name: "Jane Doe",
    rating: 5,
    text: "Excellent service, highly recommend!",
    review_date: "2025-06-15T12:00:00Z",
    source: "google",
    avatar_url: null,
    loan_type: null,
    first_time_homebuyer: null,
    loan_officer_name: null,
    ...overrides,
  };
}

function makeProfile(overrides: Partial<EntityProfile> = {}): EntityProfile {
  return {
    full_name: "Test Company",
    avatar_url: null,
    photo_url: null,
    nmls_id: null,
    title: null,
    average_rating: 4.8,
    total_reviews: 24,
    licensing_states: null,
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────

describe("injectStructuredData", () => {
  beforeEach(() => {
    // Clear any injected scripts
    document.head
      .querySelectorAll('script[type="application/ld+json"]')
      .forEach((el) => el.remove());
  });

  afterEach(async () => {
    // Reset the module to clear the internal Map
    const mod = await import("../seo/structured-data");
    mod.removeAllStructuredData();
  });

  it("injects a script tag into document.head when enable_structured_data is true", async () => {
    const { injectStructuredData } = await import("../seo/structured-data");
    const config = makeConfig();
    const reviews = [makeReview()];
    const profile = makeProfile();

    injectStructuredData(config, reviews, profile);

    const script = document.head.querySelector(
      `script[data-repwell-widget-id="${config.widget_id}"]`
    );
    expect(script).not.toBeNull();
    expect(script?.getAttribute("type")).toBe("application/ld+json");
  });

  it("does not inject when enable_structured_data is false", async () => {
    const { injectStructuredData } = await import("../seo/structured-data");
    const config = makeConfig({ enable_structured_data: false });

    injectStructuredData(config, [makeReview()], makeProfile());

    const script = document.head.querySelector(
      `script[data-repwell-widget-id="${config.widget_id}"]`
    );
    expect(script).toBeNull();
  });

  it("prevents duplicate injection for the same widget ID", async () => {
    const { injectStructuredData } = await import("../seo/structured-data");
    const config = makeConfig();
    const reviews = [makeReview()];
    const profile = makeProfile();

    injectStructuredData(config, reviews, profile);
    injectStructuredData(config, reviews, profile);

    const scripts = document.head.querySelectorAll(
      `script[data-repwell-widget-id="${config.widget_id}"]`
    );
    expect(scripts).toHaveLength(1);
  });
});

describe("removeStructuredData", () => {
  it("removes the injected script for a specific widget", async () => {
    const { injectStructuredData, removeStructuredData } = await import(
      "../seo/structured-data"
    );
    const config = makeConfig();

    injectStructuredData(config, [makeReview()], makeProfile());
    expect(
      document.head.querySelector(
        `script[data-repwell-widget-id="${config.widget_id}"]`
      )
    ).not.toBeNull();

    removeStructuredData(config.widget_id);
    expect(
      document.head.querySelector(
        `script[data-repwell-widget-id="${config.widget_id}"]`
      )
    ).toBeNull();
  });

  it("does nothing for unknown widget IDs", async () => {
    const { removeStructuredData } = await import("../seo/structured-data");
    // Should not throw
    expect(() => removeStructuredData("nonexistent")).not.toThrow();
  });
});

describe("buildJsonLdFromWidget (via schemas)", () => {
  it("generates Organization schema for company widgets", async () => {
    const { buildJsonLdFromWidget } = await import("../seo/schemas");
    const config = makeConfig({
      entity_type: "organization",
      structured_data_type: "Organization",
    });
    const reviews = [makeReview(), makeReview({ id: "r2", rating: 4, reviewer_name: "Bob" })];
    const profile = makeProfile({
      organization_name: "Acme Corp",
      url: "https://acme.com",
      logo_url: "https://acme.com/logo.png",
    });

    const result = buildJsonLdFromWidget(config, reviews, profile);

    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("Organization");
    expect(result.name).toBe("Test Company");
    expect(result.url).toBe("https://acme.com");
    expect(result.logo).toBe("https://acme.com/logo.png");
  });

  it("generates LocalBusiness schema for branch widgets with address and telephone", async () => {
    const { buildJsonLdFromWidget } = await import("../seo/schemas");
    const config = makeConfig({
      entity_type: "branch",
      structured_data_type: "LocalBusiness",
    });
    const reviews = [makeReview()];
    const profile = makeProfile({
      full_name: "Downtown Branch",
      address: {
        street: "123 Main St",
        city: "Springfield",
        state: "IL",
        zip: "62701",
        country: "US",
      },
      telephone: "+1-555-123-4567",
    });

    const result = buildJsonLdFromWidget(config, reviews, profile);

    expect(result["@type"]).toBe("LocalBusiness");
    expect(result.name).toBe("Downtown Branch");
    expect(result.telephone).toBe("+1-555-123-4567");
    expect(result.address).toEqual({
      "@type": "PostalAddress",
      streetAddress: "123 Main St",
      addressLocality: "Springfield",
      addressRegion: "IL",
      postalCode: "62701",
      addressCountry: "US",
    });
  });

  it("generates Person schema for LO widgets with jobTitle and worksFor", async () => {
    const { buildJsonLdFromWidget } = await import("../seo/schemas");
    const config = makeConfig({
      entity_type: "user",
      structured_data_type: "Person",
    });
    const reviews = [makeReview()];
    const profile = makeProfile({
      full_name: "John Smith",
      title: "Senior Loan Officer",
      organization_name: "First Mortgage Co",
    });

    const result = buildJsonLdFromWidget(config, reviews, profile);

    expect(result["@type"]).toBe("Person");
    expect(result.name).toBe("John Smith");
    expect(result.jobTitle).toBe("Senior Loan Officer");
    expect(result.worksFor).toEqual({
      "@type": "Organization",
      name: "First Mortgage Co",
    });
  });

  it("generates FinancialService schema for MortgageBroker type", async () => {
    const { buildJsonLdFromWidget } = await import("../seo/schemas");
    const config = makeConfig({
      structured_data_type: "MortgageBroker",
    });
    const reviews = [makeReview()];
    const profile = makeProfile({ logo_url: "https://example.com/logo.png" });

    const result = buildJsonLdFromWidget(config, reviews, profile);

    expect(result["@type"]).toBe("FinancialService");
    expect(result.logo).toBe("https://example.com/logo.png");
  });

  it("resolves default schema type from entity_type when structured_data_type is null", async () => {
    const { buildJsonLdFromWidget } = await import("../seo/schemas");

    // user -> Person
    const personConfig = makeConfig({ entity_type: "user", structured_data_type: null });
    const personResult = buildJsonLdFromWidget(personConfig, [makeReview()], makeProfile({ full_name: "LO Name" }));
    expect(personResult["@type"]).toBe("Person");

    // branch -> LocalBusiness
    const branchConfig = makeConfig({ entity_type: "branch", structured_data_type: null });
    const branchResult = buildJsonLdFromWidget(branchConfig, [makeReview()], makeProfile());
    expect(branchResult["@type"]).toBe("LocalBusiness");

    // organization -> Organization
    const orgConfig = makeConfig({ entity_type: "organization", structured_data_type: null });
    const orgResult = buildJsonLdFromWidget(orgConfig, [makeReview()], makeProfile());
    expect(orgResult["@type"]).toBe("Organization");
  });
});

describe("AggregateRating schema", () => {
  it("includes @type, ratingValue (1 decimal), reviewCount, bestRating (5), worstRating (1)", async () => {
    const { buildJsonLdFromWidget } = await import("../seo/schemas");
    const config = makeConfig({ structured_data_type: "Organization" });
    const reviews = [
      makeReview({ rating: 5 }),
      makeReview({ id: "r2", rating: 4 }),
      makeReview({ id: "r3", rating: 3 }),
    ];
    const profile = makeProfile({ average_rating: 4.0, total_reviews: 3 });

    const result = buildJsonLdFromWidget(config, reviews, profile);
    const agg = result.aggregateRating as unknown as Record<string, unknown>;

    expect(agg).toBeDefined();
    expect(agg["@type"]).toBe("AggregateRating");
    expect(agg.ratingValue).toBe("4.0");
    expect(agg.reviewCount).toBe(3);
    expect(agg.bestRating).toBe("5");
    expect(agg.worstRating).toBe("1");
  });

  it("omits aggregateRating when there are no reviews and no profile rating", async () => {
    const { buildJsonLdFromWidget } = await import("../seo/schemas");
    const config = makeConfig({ structured_data_type: "Organization" });
    const profile = makeProfile({ average_rating: null, total_reviews: null });

    const result = buildJsonLdFromWidget(config, [], profile);

    expect(result.aggregateRating).toBeUndefined();
  });
});

describe("Review schema snippets", () => {
  it("includes @type, author.name, datePublished (ISO 8601), reviewRating, reviewBody", async () => {
    const { buildJsonLdFromWidget } = await import("../seo/schemas");
    const config = makeConfig({ structured_data_type: "Organization" });
    const reviews = [
      makeReview({
        reviewer_name: "Alice",
        rating: 5,
        text: "Great service!",
        review_date: "2025-03-15T10:30:00Z",
      }),
    ];
    const profile = makeProfile({ average_rating: 5.0, total_reviews: 1 });

    const result = buildJsonLdFromWidget(config, reviews, profile);
    const reviewArr = result.review as unknown as Record<string, unknown>[];

    expect(reviewArr).toHaveLength(1);
    const r = reviewArr[0];
    expect(r["@type"]).toBe("Review");
    expect((r.author as Record<string, unknown>).name).toBe("Alice");
    expect(r.datePublished).toBe("2025-03-15");
    expect((r.reviewRating as Record<string, unknown>).ratingValue).toBe(5);
    expect(r.reviewBody).toBe("Great service!");
  });

  it("truncates reviewBody to 200 characters", async () => {
    const { buildJsonLdFromWidget } = await import("../seo/schemas");
    const config = makeConfig({ structured_data_type: "Organization" });
    const longText = "A".repeat(300);
    const reviews = [makeReview({ text: longText })];
    const profile = makeProfile({ average_rating: 5.0, total_reviews: 1 });

    const result = buildJsonLdFromWidget(config, reviews, profile);
    const reviewArr = result.review as unknown as Record<string, unknown>[];

    expect((reviewArr[0].reviewBody as string).length).toBe(200);
  });

  it("limits review snippets to 10", async () => {
    const { buildJsonLdFromWidget } = await import("../seo/schemas");
    const config = makeConfig({ structured_data_type: "Organization" });
    const reviews = Array.from({ length: 15 }, (_, i) =>
      makeReview({ id: `r-${i}`, reviewer_name: `User ${i}` })
    );
    const profile = makeProfile({ average_rating: 5.0, total_reviews: 15 });

    const result = buildJsonLdFromWidget(config, reviews, profile);
    const reviewArr = result.review as unknown as Record<string, unknown>[];

    expect(reviewArr).toHaveLength(10);
  });

  it("uses 'Anonymous' for reviews without a reviewer name", async () => {
    const { buildJsonLdFromWidget } = await import("../seo/schemas");
    const config = makeConfig({ structured_data_type: "Organization" });
    const reviews = [makeReview({ reviewer_name: null })];
    const profile = makeProfile({ average_rating: 5.0, total_reviews: 1 });

    const result = buildJsonLdFromWidget(config, reviews, profile);
    const reviewArr = result.review as unknown as Record<string, unknown>[];
    const author = reviewArr[0].author as Record<string, unknown>;

    expect(author.name).toBe("Anonymous");
  });
});

describe("server-side structured data generator", () => {
  it("generates matching output for all schema types", async () => {
    const { generateStructuredData } = await import(
      "../../lib/widgets/structured-data-generator"
    );

    const entity = { name: "Test Entity" };
    const reviews = [{ rating: 5, customer_name: "Test", text: "Good", review_date: "2025-01-01" }];

    const types = ["LocalBusiness", "Organization", "Person", "FinancialService", "MortgageBroker"];
    for (const type of types) {
      const result = generateStructuredData(type, entity, reviews);
      expect(result["@context"]).toBe("https://schema.org");
      expect(result.name).toBe("Test Entity");
      expect(result.aggregateRating).toBeDefined();
      expect(result.review).toHaveLength(1);
    }
  });

  it("resolves default schema type from entity type", async () => {
    const { resolveDefaultSchemaType } = await import(
      "../../lib/widgets/structured-data-generator"
    );

    expect(resolveDefaultSchemaType("user")).toBe("Person");
    expect(resolveDefaultSchemaType("branch")).toBe("LocalBusiness");
    expect(resolveDefaultSchemaType("organization")).toBe("Organization");
    expect(resolveDefaultSchemaType("unknown")).toBe("Organization");
  });
});
