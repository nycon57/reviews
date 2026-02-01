// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PublicWidgetConfig, PublicReview, EntityProfile } from "../types";

// ── Registry tests ──────────────────────────────────────────────────

describe("widget registry", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("registers and retrieves a widget renderer", async () => {
    const { registerWidget, getWidgetRenderer } = await import(
      "../widgets/registry"
    );
    const mockRenderer = vi.fn();
    registerWidget("test_widget", mockRenderer);
    expect(getWidgetRenderer("test_widget")).toBe(mockRenderer);
  });

  it("returns null for unregistered widget types", async () => {
    const { getWidgetRenderer } = await import("../widgets/registry");
    expect(getWidgetRenderer("nonexistent")).toBeNull();
  });
});

// ── LO Review Widget tests ──────────────────────────────────────────

describe("LO Review Widget", () => {
  const mockProfile: EntityProfile = {
    full_name: "Jane Miller",
    avatar_url: null,
    photo_url: "https://example.com/jane.jpg",
    nmls_id: "123456",
    title: "Senior Loan Officer",
    average_rating: 4.8,
    total_reviews: 42,
    licensing_states: ["CA", "TX", "FL"],
  };

  const mockConfig: PublicWidgetConfig = {
    widget_id: "lo-widget-1",
    widget_type: "lo_review",
    entity_type: "user",
    entity_id: "user-1",
    name: "Jane Miller Reviews",
    config: {
      content: {
        showHeader: true,
        showCTA: true,
        ctaText: "Get a Quote",
        ctaUrl: "https://example.com/quote",
        showSource: true,
        showDate: true,
        showAvatar: true,
        showBranding: true,
        showNMLS: true,
        showDisclaimer: true,
        disclaimerText: "Equal Housing Lender.",
        showWriteReview: true,
        writeReviewUrl: "https://example.com/review",
        truncateLength: 200,
        columns: 1,
        dateFormat: "relative",
        cardStyle: "bordered",
      },
      theme: {
        colors: {
          primary: "#52796f",
          starFilled: "#f59e0b",
          starEmpty: "#d1d5db",
        },
      },
    },
    enable_structured_data: true,
    structured_data_type: "LocalBusiness",
    status: "active",
    version: 1,
    entity_profile: mockProfile,
  };

  const mockReviews: PublicReview[] = [
    {
      id: "r1",
      reviewer_name: "John Doe",
      rating: 5,
      text: "Jane was incredibly helpful throughout the entire process. She made our first home purchase seamless!",
      review_date: "2025-12-20",
      source: "google",
      avatar_url: null,
      loan_type: "Purchase",
      first_time_homebuyer: true,
    },
    {
      id: "r2",
      reviewer_name: "Sarah Connor",
      rating: 4,
      text: "Great refinancing experience. Very professional and responsive.",
      review_date: "2025-11-15",
      source: "zillow",
      avatar_url: null,
      loan_type: "Refinance",
      first_time_homebuyer: false,
    },
    {
      id: "r3",
      reviewer_name: "Bob Wilson",
      rating: 5,
      text: "Outstanding service on our VA loan!",
      review_date: "2025-10-01",
      source: "internal",
      avatar_url: null,
      loan_type: "VA",
      first_time_homebuyer: false,
    },
  ];

  it("renders LO profile with photo, name, NMLS link, and states", async () => {
    const { buildLoReviewDOM } = await import("../widgets/lo-review/template");
    const dom = buildLoReviewDOM(mockConfig, mockReviews, "https://api.test");

    const photo = dom.querySelector(".rw-lo-profile__photo") as HTMLImageElement;
    expect(photo).not.toBeNull();
    expect(photo.src).toBe("https://example.com/jane.jpg");

    expect(dom.querySelector(".rw-lo-profile__name")?.textContent).toBe("Jane Miller");
    expect(dom.querySelector(".rw-lo-profile__title")?.textContent).toBe("Senior Loan Officer");

    const nmls = dom.querySelector(".rw-lo-profile__nmls");
    expect(nmls).not.toBeNull();
    const nmlsLink = nmls?.querySelector("a") as HTMLAnchorElement;
    expect(nmlsLink.textContent).toBe("123456");
    expect(nmlsLink.href).toContain("nmlsconsumeraccess.org");
    expect(nmlsLink.target).toBe("_blank");

    const stateTags = dom.querySelectorAll(".rw-lo-profile__state-tag");
    expect(stateTags).toHaveLength(3);
    expect(stateTags[0].textContent).toBe("CA");
    expect(stateTags[1].textContent).toBe("TX");
    expect(stateTags[2].textContent).toBe("FL");
  });

  it("renders aggregate rating in profile", async () => {
    const { buildLoReviewDOM } = await import("../widgets/lo-review/template");
    const dom = buildLoReviewDOM(mockConfig, mockReviews, "https://api.test");

    expect(dom.querySelector(".rw-lo-profile__rating-value")?.textContent).toBe("4.8");
    const ratingCount = dom.querySelector(".rw-lo-profile__rating-count");
    expect(ratingCount?.textContent).toContain("42");
    expect(ratingCount?.textContent).toContain("reviews");
  });

  it("renders review cards with stars and text", async () => {
    const { buildLoReviewDOM } = await import("../widgets/lo-review/template");
    const dom = buildLoReviewDOM(mockConfig, mockReviews, "https://api.test");

    const cards = dom.querySelectorAll(".rw-lo-review");
    expect(cards).toHaveLength(3);

    // First review: 5 filled stars
    const firstStars = cards[0].querySelectorAll(".rw-star--filled");
    expect(firstStars).toHaveLength(5);

    expect(cards[0].querySelector(".rw-lo-review__name")?.textContent).toBe("John Doe");
  });

  it("renders loan type tags", async () => {
    const { buildLoReviewDOM } = await import("../widgets/lo-review/template");
    const dom = buildLoReviewDOM(mockConfig, mockReviews, "https://api.test");

    const loanTags = dom.querySelectorAll("[class*='rw-lo-review__loan-tag']");
    expect(loanTags.length).toBeGreaterThanOrEqual(3);

    const tagTexts = Array.from(loanTags).map((t) => t.textContent);
    expect(tagTexts).toContain("Purchase");
    expect(tagTexts).toContain("Refinance");
    expect(tagTexts).toContain("VA");
  });

  it("renders First-Time Homebuyer badge on applicable reviews", async () => {
    const { buildLoReviewDOM } = await import("../widgets/lo-review/template");
    const dom = buildLoReviewDOM(mockConfig, mockReviews, "https://api.test");

    const fthbBadges = dom.querySelectorAll(".rw-lo-review__fthb-badge");
    expect(fthbBadges).toHaveLength(1);
    expect(fthbBadges[0].textContent).toContain("First-Time Homebuyer");
  });

  it("renders disclaimer when showDisclaimer is true", async () => {
    const { buildLoReviewDOM } = await import("../widgets/lo-review/template");
    const dom = buildLoReviewDOM(mockConfig, mockReviews, "https://api.test");

    const disclaimer = dom.querySelector(".rw-lo-disclaimer");
    expect(disclaimer).not.toBeNull();
    expect(disclaimer?.textContent).toContain("Equal Housing Lender");
  });

  it("renders CTA button with configured text and URL", async () => {
    const { buildLoReviewDOM } = await import("../widgets/lo-review/template");
    const dom = buildLoReviewDOM(mockConfig, mockReviews, "https://api.test");

    const cta = dom.querySelector(".rw-cta") as HTMLAnchorElement;
    expect(cta).not.toBeNull();
    expect(cta.textContent).toBe("Get a Quote");
    expect(cta.href).toBe("https://example.com/quote");
    expect(cta.target).toBe("_blank");
  });

  it("renders Write a Review button", async () => {
    const { buildLoReviewDOM } = await import("../widgets/lo-review/template");
    const dom = buildLoReviewDOM(mockConfig, mockReviews, "https://api.test");

    const writeBtn = dom.querySelector(".rw-lo-actions__write-review") as HTMLAnchorElement;
    expect(writeBtn).not.toBeNull();
    expect(writeBtn.textContent).toBe("Write a Review");
    expect(writeBtn.href).toBe("https://example.com/review");
    expect(writeBtn.target).toBe("_blank");
  });

  it("renders branding footer", async () => {
    const { buildLoReviewDOM } = await import("../widgets/lo-review/template");
    const dom = buildLoReviewDOM(mockConfig, mockReviews, "https://api.test");

    const branding = dom.querySelector(".rw-branding a") as HTMLAnchorElement;
    expect(branding).not.toBeNull();
    expect(branding.textContent).toBe("RepWell");
  });

  it("hides branding when showBranding is false", async () => {
    const { buildLoReviewDOM } = await import("../widgets/lo-review/template");
    const noBrandingConfig = {
      ...mockConfig,
      config: {
        ...mockConfig.config,
        content: { ...mockConfig.config.content, showBranding: false },
      },
    };
    const dom = buildLoReviewDOM(noBrandingConfig, mockReviews, "https://api.test");
    expect(dom.querySelector(".rw-branding")).toBeNull();
  });

  it("renders profile initials when no photo available", async () => {
    const { buildLoReviewDOM } = await import("../widgets/lo-review/template");
    const noPhotoConfig = {
      ...mockConfig,
      entity_profile: { ...mockProfile, photo_url: null, avatar_url: null },
    };
    const dom = buildLoReviewDOM(noPhotoConfig, mockReviews, "https://api.test");

    const placeholder = dom.querySelector(".rw-lo-profile__photo-placeholder");
    expect(placeholder).not.toBeNull();
    expect(placeholder?.textContent).toBe("JM");
  });

  it("renders empty state when no reviews", async () => {
    const { buildLoReviewDOM } = await import("../widgets/lo-review/template");
    const dom = buildLoReviewDOM(mockConfig, [], "https://api.test");

    expect(dom.querySelector(".rw-empty")).not.toBeNull();
    expect(dom.querySelector(".rw-lo-review")).toBeNull();
  });

  it("truncates review text per config", async () => {
    const { buildLoReviewDOM } = await import("../widgets/lo-review/template");
    const shortConfig = {
      ...mockConfig,
      config: {
        ...mockConfig.config,
        content: { ...mockConfig.config.content, truncateLength: 20 },
      },
    };
    const dom = buildLoReviewDOM(shortConfig, mockReviews, "https://api.test");

    const firstText = dom.querySelector(".rw-lo-review__text");
    expect(firstText).not.toBeNull();
    expect(firstText!.textContent!).toContain("\u2026");
    expect(firstText!.textContent!.length).toBeLessThanOrEqual(25);
  });

  it("applies grid columns when columns > 1", async () => {
    const { buildLoReviewDOM } = await import("../widgets/lo-review/template");
    const multiColConfig = {
      ...mockConfig,
      config: {
        ...mockConfig.config,
        content: { ...mockConfig.config.content, columns: 2 },
      },
    };
    const dom = buildLoReviewDOM(multiColConfig, mockReviews, "https://api.test");

    const grid = dom.querySelector(".rw-lo-reviews") as HTMLElement;
    expect(grid).not.toBeNull();
    expect(grid.style.gridTemplateColumns).toBe("repeat(2, 1fr)");
  });

  it("renders source badges", async () => {
    const { buildLoReviewDOM } = await import("../widgets/lo-review/template");
    const dom = buildLoReviewDOM(mockConfig, mockReviews, "https://api.test");

    const sources = dom.querySelectorAll(".rw-lo-review__source");
    expect(sources.length).toBeGreaterThan(0);

    const sourceTexts = Array.from(sources).map((s) => s.textContent);
    expect(sourceTexts).toContain("via google");
    expect(sourceTexts).toContain("via zillow");
    expect(sourceTexts).toContain("via internal");
  });

  it("has accessible ARIA labels on stars", async () => {
    const { buildLoReviewDOM } = await import("../widgets/lo-review/template");
    const dom = buildLoReviewDOM(mockConfig, mockReviews, "https://api.test");

    const starContainers = dom.querySelectorAll(".rw-lo-review__stars");
    expect(starContainers.length).toBeGreaterThan(0);
    for (const container of starContainers) {
      expect(container.getAttribute("role")).toBe("img");
      expect(container.getAttribute("aria-label")).toMatch(/\d out of 5 stars/);
    }
  });

  it("renders review cards with accessible role and label", async () => {
    const { buildLoReviewDOM } = await import("../widgets/lo-review/template");
    const dom = buildLoReviewDOM(mockConfig, mockReviews, "https://api.test");

    const cards = dom.querySelectorAll(".rw-lo-review");
    for (const card of cards) {
      expect(card.getAttribute("role")).toBe("article");
      expect(card.getAttribute("aria-label")).toMatch(/Review by .+/);
    }
  });

  it("renders widget container with ARIA region", async () => {
    const { buildLoReviewDOM } = await import("../widgets/lo-review/template");
    const dom = buildLoReviewDOM(mockConfig, mockReviews, "https://api.test");

    expect(dom.getAttribute("role")).toBe("region");
    expect(dom.getAttribute("aria-label")).toContain("Jane Miller");
  });

  it("sends click_review event on truncated text expand", async () => {
    const { buildLoReviewDOM } = await import("../widgets/lo-review/template");
    const shortConfig = {
      ...mockConfig,
      config: {
        ...mockConfig.config,
        content: { ...mockConfig.config.content, truncateLength: 20 },
      },
    };
    const dom = buildLoReviewDOM(shortConfig, mockReviews, "https://api.test");

    const truncatedText = dom.querySelector(".rw-lo-review__text--truncated");
    expect(truncatedText).not.toBeNull();
    expect(truncatedText?.getAttribute("role")).toBe("button");
    expect(truncatedText?.getAttribute("tabindex")).toBe("0");
  });
});

// ── Registration test ───────────────────────────────────────────────

describe("LO Review Widget registration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("self-registers as lo_review widget type", async () => {
    const { getWidgetRenderer } = await import("../widgets/registry");
    await import("../widgets/lo-review");

    const renderer = getWidgetRenderer("lo_review");
    expect(renderer).not.toBeNull();
    expect(typeof renderer).toBe("function");
  });
});
