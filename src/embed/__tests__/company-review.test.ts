// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import type {
  PublicWidgetConfig,
  PublicReview,
  EntityProfile,
} from "../types";

// ── Test data ────────────────────────────────────────────────────────

const mockProfile: EntityProfile = {
  full_name: "Acme Mortgage",
  avatar_url: null,
  photo_url: null,
  nmls_id: "789012",
  title: null,
  average_rating: 4.6,
  total_reviews: 128,
  licensing_states: null,
  logo_url: "https://example.com/logo.png",
  organization_name: "Acme Mortgage Corp",
  rating_distribution: { 5: 80, 4: 30, 3: 10, 2: 5, 1: 3 },
  source_breakdown: [
    { source: "google", count: 75, average: 4.7 },
    { source: "zillow", count: 40, average: 4.5 },
    { source: "internal", count: 13, average: 4.3 },
  ],
};

const mockConfig: PublicWidgetConfig = {
  widget_id: "co-widget-1",
  widget_type: "company_review",
  entity_type: "organization",
  entity_id: "org-1",
  name: "Acme Mortgage Reviews",
  config: {
    content: {
      showHeader: true,
      showCTA: true,
      ctaText: "Get Started",
      ctaUrl: "https://example.com/apply",
      showSource: true,
      showDate: true,
      showAvatar: true,
      showBranding: true,
      showDisclaimer: true,
      disclaimerText: "Equal Housing Lender.",
      showWriteReview: true,
      writeReviewUrl: "https://example.com/review",
      truncateLength: 200,
      columns: 1,
      dateFormat: "relative",
      cardStyle: "bordered",
      showFilters: true,
      showRatingDistribution: true,
      showSourceBreakdown: true,
      reviewsPerPage: 10,
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
  structured_data_type: "Organization",
  status: "active",
  version: 1,
  entity_profile: mockProfile,
};

function makeReviews(count: number): PublicReview[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `r${i + 1}`,
    reviewer_name: `Reviewer ${i + 1}`,
    rating: (i % 5) + 1,
    text: `This is review number ${i + 1}. It contains some sample text for testing purposes.`,
    review_date: new Date(Date.now() - i * 86_400_000).toISOString(),
    source: ["google", "zillow", "internal"][i % 3],
    avatar_url: null,
    loan_type: ["Purchase", "Refinance", "VA", "FHA", "Jumbo"][i % 5],
    first_time_homebuyer: i % 4 === 0,
    loan_officer_name: null,
  }));
}

const threeReviews = makeReviews(3);

// ── Company Review Widget tests ──────────────────────────────────────

describe("Company Review Widget", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("renders organization header with logo, name, rating, and review count", async () => {
    const { buildCompanyReviewDOM } = await import("../widgets/company-review/template");
    const dom = buildCompanyReviewDOM(mockConfig, threeReviews, "https://api.test");

    const logo = dom.querySelector(".rw-co-header__logo") as HTMLImageElement;
    expect(logo).not.toBeNull();
    expect(logo.src).toBe("https://example.com/logo.png");

    expect(dom.querySelector(".rw-co-header__name")?.textContent).toBe("Acme Mortgage Corp");
    expect(dom.querySelector(".rw-co-header__rating-value")?.textContent).toBe("4.6");
    expect(dom.querySelector(".rw-co-header__rating-count")?.textContent).toContain("128");
    expect(dom.querySelector(".rw-co-header__rating-count")?.textContent).toContain("reviews");
  });

  it("renders rating distribution bar chart", async () => {
    const { buildCompanyReviewDOM } = await import("../widgets/company-review/template");
    const dom = buildCompanyReviewDOM(mockConfig, threeReviews, "https://api.test");

    const distSection = dom.querySelector(".rw-co-distribution");
    expect(distSection).not.toBeNull();
    expect(distSection?.getAttribute("aria-label")).toBe("Rating distribution");

    const rows = distSection?.querySelectorAll(".rw-co-distribution__row");
    expect(rows).toHaveLength(5);

    // 5-star row should have largest bar
    const fiveStarBar = rows?.[0].querySelector(".rw-co-distribution__bar-inner") as HTMLElement;
    expect(fiveStarBar).not.toBeNull();

    // Count labels
    const counts = distSection?.querySelectorAll(".rw-co-distribution__count");
    expect(counts?.[0].textContent).toBe("80"); // 5-star
    expect(counts?.[4].textContent).toBe("3");  // 1-star
  });

  it("renders source breakdown with icons, counts, and averages", async () => {
    const { buildCompanyReviewDOM } = await import("../widgets/company-review/template");
    const dom = buildCompanyReviewDOM(mockConfig, threeReviews, "https://api.test");

    const sourcesSection = dom.querySelector(".rw-co-sources");
    expect(sourcesSection).not.toBeNull();

    const items = sourcesSection?.querySelectorAll(".rw-co-sources__item");
    expect(items).toHaveLength(3);

    // Google source
    const googleName = items?.[0].querySelector(".rw-co-sources__name");
    expect(googleName?.textContent).toBe("Google");
    const googleMeta = items?.[0].querySelector(".rw-co-sources__meta");
    expect(googleMeta?.textContent).toContain("75 reviews");
    expect(googleMeta?.textContent).toContain("4.7 avg");
  });

  it("renders sorting controls when showFilters is true", async () => {
    const { buildCompanyReviewDOM } = await import("../widgets/company-review/template");
    const dom = buildCompanyReviewDOM(mockConfig, threeReviews, "https://api.test");

    const filterBtns = dom.querySelectorAll(".rw-co-filters__btn");
    expect(filterBtns).toHaveLength(3);

    const labels = Array.from(filterBtns).map((b) => b.textContent);
    expect(labels).toContain("Most Recent");
    expect(labels).toContain("Highest Rated");
    expect(labels).toContain("Lowest Rated");

    // First button should be active by default
    expect(filterBtns[0].classList.contains("rw-co-filters__btn--active")).toBe(true);
    expect(filterBtns[0].getAttribute("aria-pressed")).toBe("true");
  });

  it("hides sorting controls when showFilters is false", async () => {
    const { buildCompanyReviewDOM } = await import("../widgets/company-review/template");
    const noFilterConfig = {
      ...mockConfig,
      config: {
        ...mockConfig.config,
        content: { ...mockConfig.config.content, showFilters: false },
      },
    };
    const dom = buildCompanyReviewDOM(noFilterConfig, threeReviews, "https://api.test");

    expect(dom.querySelector(".rw-co-filters__btn")).toBeNull();
  });

  it("renders review cards with stars, name, date, source, and loan type", async () => {
    const { buildCompanyReviewDOM } = await import("../widgets/company-review/template");
    const dom = buildCompanyReviewDOM(mockConfig, threeReviews, "https://api.test");

    const cards = dom.querySelectorAll(".rw-co-review");
    expect(cards).toHaveLength(3);

    // Check first card
    expect(cards[0].querySelector(".rw-co-review__name")?.textContent).toBe("Reviewer 1");
    expect(cards[0].getAttribute("role")).toBe("article");
    expect(cards[0].getAttribute("aria-label")).toContain("Review by Reviewer 1");

    // Stars are present
    const stars = cards[0].querySelectorAll(".rw-star");
    expect(stars.length).toBe(5);
  });

  it("renders CTA and Write Review buttons", async () => {
    const { buildCompanyReviewDOM } = await import("../widgets/company-review/template");
    const dom = buildCompanyReviewDOM(mockConfig, threeReviews, "https://api.test");

    const cta = dom.querySelector(".rw-cta") as HTMLAnchorElement;
    expect(cta).not.toBeNull();
    expect(cta.textContent).toBe("Get Started");
    expect(cta.href).toBe("https://example.com/apply");
    expect(cta.target).toBe("_blank");

    const writeBtn = dom.querySelector(".rw-co-actions__write-review") as HTMLAnchorElement;
    expect(writeBtn).not.toBeNull();
    expect(writeBtn.textContent).toBe("Write a Review");
    expect(writeBtn.href).toBe("https://example.com/review");
  });

  it("renders compliance disclaimer", async () => {
    const { buildCompanyReviewDOM } = await import("../widgets/company-review/template");
    const dom = buildCompanyReviewDOM(mockConfig, threeReviews, "https://api.test");

    const disclaimer = dom.querySelector(".rw-co-disclaimer");
    expect(disclaimer).not.toBeNull();
    expect(disclaimer?.textContent).toContain("Equal Housing Lender");
  });

  it("renders branding footer", async () => {
    const { buildCompanyReviewDOM } = await import("../widgets/company-review/template");
    const dom = buildCompanyReviewDOM(mockConfig, threeReviews, "https://api.test");

    const branding = dom.querySelector(".rw-branding a") as HTMLAnchorElement;
    expect(branding).not.toBeNull();
    expect(branding.textContent).toBe("RepWell");
  });

  it("hides branding when showBranding is false", async () => {
    const { buildCompanyReviewDOM } = await import("../widgets/company-review/template");
    const noBrandingConfig = {
      ...mockConfig,
      config: {
        ...mockConfig.config,
        content: { ...mockConfig.config.content, showBranding: false },
      },
    };
    const dom = buildCompanyReviewDOM(noBrandingConfig, threeReviews, "https://api.test");
    expect(dom.querySelector(".rw-branding")).toBeNull();
  });

  it("renders ARIA region with accessible label", async () => {
    const { buildCompanyReviewDOM } = await import("../widgets/company-review/template");
    const dom = buildCompanyReviewDOM(mockConfig, threeReviews, "https://api.test");

    expect(dom.getAttribute("role")).toBe("region");
    expect(dom.getAttribute("aria-label")).toContain("Acme Mortgage Corp");
  });

  it("renders stars with ARIA labels", async () => {
    const { buildCompanyReviewDOM } = await import("../widgets/company-review/template");
    const dom = buildCompanyReviewDOM(mockConfig, threeReviews, "https://api.test");

    const starContainers = dom.querySelectorAll(".rw-co-review__stars");
    expect(starContainers.length).toBeGreaterThan(0);
    for (const container of starContainers) {
      expect(container.getAttribute("role")).toBe("img");
      expect(container.getAttribute("aria-label")).toMatch(/\d out of 5 stars/);
    }
  });

  it("renders loan type and FTHB tags", async () => {
    const { buildCompanyReviewDOM } = await import("../widgets/company-review/template");
    const dom = buildCompanyReviewDOM(mockConfig, threeReviews, "https://api.test");

    const loanTags = dom.querySelectorAll("[class*='rw-co-review__loan-tag']");
    expect(loanTags.length).toBeGreaterThanOrEqual(3);

    const fthbBadges = dom.querySelectorAll(".rw-co-review__fthb-badge");
    expect(fthbBadges.length).toBeGreaterThanOrEqual(1);
    expect(fthbBadges[0].textContent).toContain("First-Time Homebuyer");
  });

  it("truncates review text per config", async () => {
    const { buildCompanyReviewDOM } = await import("../widgets/company-review/template");
    const shortConfig = {
      ...mockConfig,
      config: {
        ...mockConfig.config,
        content: { ...mockConfig.config.content, truncateLength: 20 },
      },
    };
    const dom = buildCompanyReviewDOM(shortConfig, threeReviews, "https://api.test");

    const firstText = dom.querySelector(".rw-co-review__text");
    expect(firstText).not.toBeNull();
    expect(firstText!.textContent!).toContain("\u2026");
    expect(firstText!.textContent!.length).toBeLessThanOrEqual(25);
  });

  it("renders logo placeholder initials when no logo available", async () => {
    const { buildCompanyReviewDOM } = await import("../widgets/company-review/template");
    const noLogoConfig = {
      ...mockConfig,
      entity_profile: { ...mockProfile, logo_url: null, photo_url: null, avatar_url: null },
    };
    const dom = buildCompanyReviewDOM(noLogoConfig, threeReviews, "https://api.test");

    const placeholder = dom.querySelector(".rw-co-header__logo-placeholder");
    expect(placeholder).not.toBeNull();
    expect(placeholder?.textContent).toBe("AC"); // Acme Corp initials
  });
});

// ── Empty / 1 review / 50+ reviews states ────────────────────────────

describe("Company Review Widget - review count states", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("renders empty state when 0 reviews", async () => {
    const { buildCompanyReviewDOM } = await import("../widgets/company-review/template");
    const noFilterConfig = {
      ...mockConfig,
      config: {
        ...mockConfig.config,
        content: { ...mockConfig.config.content, showFilters: false },
      },
    };
    const dom = buildCompanyReviewDOM(noFilterConfig, [], "https://api.test");

    expect(dom.querySelector(".rw-empty")).not.toBeNull();
    expect(dom.querySelector(".rw-empty")?.textContent).toBe("No reviews yet.");
    expect(dom.querySelector(".rw-co-review")).toBeNull();
  });

  it("renders correctly with 1 review", async () => {
    const { buildCompanyReviewDOM } = await import("../widgets/company-review/template");
    const oneReview = makeReviews(1);
    const dom = buildCompanyReviewDOM(mockConfig, oneReview, "https://api.test");

    const cards = dom.querySelectorAll(".rw-co-review");
    expect(cards).toHaveLength(1);
    expect(dom.querySelector(".rw-co-load-more")).toBeNull();
  });

  it("renders Load More button with 50+ reviews", async () => {
    const { buildCompanyReviewDOM } = await import("../widgets/company-review/template");
    const manyReviews = makeReviews(55);
    const dom = buildCompanyReviewDOM(mockConfig, manyReviews, "https://api.test");

    // Default perPage is 10, so only 10 shown initially
    const cards = dom.querySelectorAll(".rw-co-review");
    expect(cards).toHaveLength(10);

    const loadMore = dom.querySelector(".rw-co-load-more") as HTMLButtonElement;
    expect(loadMore).not.toBeNull();
    expect(loadMore.textContent).toBe("Load More Reviews");
  });

  it("Load More button shows additional reviews on click", async () => {
    const { buildCompanyReviewDOM } = await import("../widgets/company-review/template");
    const manyReviews = makeReviews(25);
    const dom = buildCompanyReviewDOM(mockConfig, manyReviews, "https://api.test");

    const loadMore = dom.querySelector(".rw-co-load-more") as HTMLButtonElement;
    expect(loadMore).not.toBeNull();

    // Click Load More
    loadMore.click();

    const cards = dom.querySelectorAll(".rw-co-review");
    expect(cards).toHaveLength(20); // 10 + 10

    // Click again
    loadMore.click();
    const cardsAfter = dom.querySelectorAll(".rw-co-review");
    expect(cardsAfter).toHaveLength(25); // all shown

    // Load more should be hidden
    expect(loadMore.style.display).toBe("none");
  });
});

// ── Registration test ───────────────────────────────────────────────

describe("Company Review Widget registration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("self-registers as company_review widget type", async () => {
    const { getWidgetRenderer } = await import("../widgets/registry");
    await import("../widgets/company-review");

    const renderer = getWidgetRenderer("company_review");
    expect(renderer).not.toBeNull();
    expect(typeof renderer).toBe("function");
  });
});
