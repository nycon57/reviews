import { describe, it, expect } from "vitest";
import {
  widgetConfigJsonSchema,
  updateWidgetInputSchema,
  listWidgetsInputSchema,
  getWidgetInputSchema,
} from "../schemas";

describe("widgetConfigJsonSchema", () => {
  it("accepts an empty object", () => {
    const result = widgetConfigJsonSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts a full valid config", () => {
    const result = widgetConfigJsonSchema.safeParse({
      theme: {
        preset: "clean_white",
        colors: {
          primary: "#3B82F6",
          secondary: "#10B981",
          background: "#ffffff",
          text: "rgb(30, 30, 30)",
        },
        typography: {
          fontFamily: "Inter",
          headerSize: "24px",
          bodySize: "1rem",
        },
        layout: {
          maxWidth: "600px",
          padding: "16px",
          borderRadius: "8px",
          gap: "12px",
        },
      },
      content: {
        showHeader: true,
        headerText: "What our customers say",
        showCTA: true,
        ctaText: "Write a Review",
        ctaUrl: "https://example.com/review",
        showSource: true,
        showDate: true,
        showAvatar: true,
        showBranding: false,
        truncateLength: 200,
        language: "en",
        showNMLS: true,
        showDisclaimer: true,
      },
      filters: {
        minRating: 4,
        dateRange: { start: "2024-01-01", end: "2024-12-31" },
        sources: ["google", "zillow"],
        maxReviews: 50,
        sortOrder: "newest",
        featuredOnly: false,
        keywords: ["great service"],
        loanTypes: ["conventional", "fha"],
      },
      carousel: {
        autoplay: true,
        interval: 5000,
        showArrows: true,
        showDots: true,
        slidesPerView: 3,
      },
      banner: {
        position: "bottom",
        dismissible: true,
        showAfterScroll: 300,
        animation: "slide",
      },
      seo: {
        title: "Customer Reviews",
        description: "Read what our customers say",
        keywords: ["reviews", "mortgage"],
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid hex color", () => {
    const result = widgetConfigJsonSchema.safeParse({
      theme: { colors: { primary: "not-a-color" } },
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid CSS value for typography", () => {
    const result = widgetConfigJsonSchema.safeParse({
      theme: { typography: { headerSize: "large" } },
    });
    expect(result.success).toBe(false);
  });

  it("accepts 3-digit hex color", () => {
    const result = widgetConfigJsonSchema.safeParse({
      theme: { colors: { primary: "#fff" } },
    });
    expect(result.success).toBe(true);
  });

  it("accepts rgb color", () => {
    const result = widgetConfigJsonSchema.safeParse({
      theme: { colors: { primary: "rgb(255, 0, 128)" } },
    });
    expect(result.success).toBe(true);
  });

  it("rejects maxReviews > 100", () => {
    const result = widgetConfigJsonSchema.safeParse({
      filters: { maxReviews: 101 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects maxReviews < 1", () => {
    const result = widgetConfigJsonSchema.safeParse({
      filters: { maxReviews: 0 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects minRating > 5", () => {
    const result = widgetConfigJsonSchema.safeParse({
      filters: { minRating: 6 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid sortOrder", () => {
    const result = widgetConfigJsonSchema.safeParse({
      filters: { sortOrder: "random" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid theme preset", () => {
    const result = widgetConfigJsonSchema.safeParse({
      theme: { preset: "invalid_preset" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid banner position", () => {
    const result = widgetConfigJsonSchema.safeParse({
      banner: { position: "left" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects carousel interval below 1000ms", () => {
    const result = widgetConfigJsonSchema.safeParse({
      carousel: { interval: 500 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects carousel interval above 30000ms", () => {
    const result = widgetConfigJsonSchema.safeParse({
      carousel: { interval: 31000 },
    });
    expect(result.success).toBe(false);
  });

  it("accepts partial config sections", () => {
    const result = widgetConfigJsonSchema.safeParse({
      content: { showHeader: true },
      filters: { minRating: 3 },
    });
    expect(result.success).toBe(true);
  });
});

describe("updateWidgetInputSchema", () => {
  it("accepts a valid update with only id", () => {
    const result = updateWidgetInputSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(result.success).toBe(true);
  });

  it("accepts partial config update", () => {
    const result = updateWidgetInputSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      config: { theme: { preset: "dark" } },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid id", () => {
    const result = updateWidgetInputSchema.safeParse({
      id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("listWidgetsInputSchema", () => {
  it("accepts empty input and applies defaults", () => {
    const result = listWidgetsInputSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
    }
  });

  it("accepts all filter combinations", () => {
    const result = listWidgetsInputSchema.safeParse({
      page: 2,
      pageSize: 10,
      widget_type: "review_carousel",
      status: "active",
      entity_type: "branch",
      search: "homepage",
    });
    expect(result.success).toBe(true);
  });

  it("rejects page < 1", () => {
    const result = listWidgetsInputSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects pageSize > 100", () => {
    const result = listWidgetsInputSchema.safeParse({ pageSize: 101 });
    expect(result.success).toBe(false);
  });
});

describe("getWidgetInputSchema", () => {
  it("accepts a UUID", () => {
    const result = getWidgetInputSchema.safeParse({
      idOrSlug: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a slug", () => {
    const result = getWidgetInputSchema.safeParse({
      idOrSlug: "my-widget-abc123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty string", () => {
    const result = getWidgetInputSchema.safeParse({ idOrSlug: "" });
    expect(result.success).toBe(false);
  });
});
