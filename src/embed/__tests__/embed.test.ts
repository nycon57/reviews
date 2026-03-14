// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { PublicWidgetConfig, PublicReview } from "../types";

// ── Discovery tests ─────────────────────────────────────────────────

describe("discoverWidgets", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("finds elements with data-repwell-widget attribute", async () => {
    const { discoverWidgets } = await import("../core/discovery");

    const div1 = document.createElement("div");
    div1.setAttribute("data-repwell-widget", "widget-abc");
    const div2 = document.createElement("div");
    div2.setAttribute("data-repwell-widget", "widget-xyz");
    document.body.appendChild(div1);
    document.body.appendChild(div2);

    const widgets = discoverWidgets();
    expect(widgets).toHaveLength(2);
    expect(widgets[0].widgetId).toBe("widget-abc");
    expect(widgets[1].widgetId).toBe("widget-xyz");
  });

  it("skips elements that are already initialized", async () => {
    const { discoverWidgets } = await import("../core/discovery");

    const div = document.createElement("div");
    div.setAttribute("data-repwell-widget", "widget-abc");
    div.setAttribute("data-repwell-initialized", "rw-1");
    document.body.appendChild(div);

    const widgets = discoverWidgets();
    expect(widgets).toHaveLength(0);
  });

  it("skips elements with empty widget ID", async () => {
    const { discoverWidgets } = await import("../core/discovery");

    const div = document.createElement("div");
    div.setAttribute("data-repwell-widget", "");
    document.body.appendChild(div);

    const widgets = discoverWidgets();
    expect(widgets).toHaveLength(0);
  });

  it("captures optional entity override attributes", async () => {
    const { discoverWidgets } = await import("../core/discovery");

    const div = document.createElement("div");
    div.setAttribute("data-repwell-widget", "widget-abc");
    div.setAttribute("data-repwell-entity-type", "user");
    div.setAttribute("data-repwell-entity-id", "123e4567-e89b-12d3-a456-426614174000");
    document.body.appendChild(div);

    const widgets = discoverWidgets();
    expect(widgets).toHaveLength(1);
    expect(widgets[0].entityOverride).toEqual({
      entityType: "user",
      entityId: "123e4567-e89b-12d3-a456-426614174000",
    });
  });
});

// ── Skeleton tests ──────────────────────────────────────────────────

describe("skeleton", () => {
  it("renders and removes skeleton in shadow root", async () => {
    const { renderSkeleton, removeSkeleton } = await import("../core/skeleton");

    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });

    renderSkeleton(shadow);
    expect(shadow.querySelector(".rw-skeleton")).not.toBeNull();
    expect(shadow.querySelector(".rw-shimmer")).not.toBeNull();

    removeSkeleton(shadow);
    expect(shadow.querySelector(".rw-skeleton")).toBeNull();
  });

  it("sets aria-busy on skeleton wrapper", async () => {
    const { renderSkeleton } = await import("../core/skeleton");

    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });

    renderSkeleton(shadow);
    const skeleton = shadow.querySelector(".rw-skeleton");
    expect(skeleton?.getAttribute("aria-busy")).toBe("true");
  });
});

// ── Renderer tests ──────────────────────────────────────────────────

describe("renderWidget", () => {
  const mockConfig: PublicWidgetConfig = {
    widget_id: "test-widget",
    widget_type: "lo_review",
    entity_type: "user",
    entity_id: null,
    name: "Test Widget",
    config: {
      content: {
        showHeader: true,
        headerText: "Our Reviews",
        showCTA: false,
        showSource: true,
        showDate: true,
        showAvatar: true,
        showBranding: true,
        truncateLength: 200,
      },
    },
    enable_structured_data: true,
    structured_data_type: "LocalBusiness",
    status: "active",
    version: 1,
  };

  const mockReviews: PublicReview[] = [
    {
      id: "r1",
      reviewer_name: "John Doe",
      rating: 5,
      text: "Excellent service!",
      review_date: "2025-12-01",
      source: "google",
      avatar_url: null,
      loan_type: null,
      first_time_homebuyer: null,
      loan_officer_name: null,
    },
    {
      id: "r2",
      reviewer_name: "Jane Smith",
      rating: 4,
      text: "Great experience overall.",
      review_date: "2025-11-15",
      source: "zillow",
      avatar_url: null,
      loan_type: null,
      first_time_homebuyer: null,
      loan_officer_name: null,
    },
  ];

  it("renders reviews inside shadow root", async () => {
    const { renderWidget } = await import("../core/renderer");

    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });

    renderWidget(shadow, mockConfig, mockReviews);

    expect(shadow.querySelector(".rw-widget")).not.toBeNull();
    expect(shadow.querySelectorAll(".rw-review")).toHaveLength(2);
  });

  it("renders header with average rating", async () => {
    const { renderWidget } = await import("../core/renderer");

    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });

    renderWidget(shadow, mockConfig, mockReviews);

    const subtitle = shadow.querySelector(".rw-widget__subtitle");
    expect(subtitle?.textContent).toContain("4.5");
    expect(subtitle?.textContent).toContain("2 reviews");
  });

  it("renders star ratings", async () => {
    const { renderWidget } = await import("../core/renderer");

    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });

    renderWidget(shadow, mockConfig, mockReviews);

    const firstCard = shadow.querySelector(".rw-review");
    const stars = firstCard?.querySelectorAll(".rw-star");
    expect(stars?.length).toBe(5);

    const filled = firstCard?.querySelectorAll(".rw-star--filled");
    expect(filled?.length).toBe(5); // 5-star review
  });

  it("renders empty state when no reviews", async () => {
    const { renderWidget } = await import("../core/renderer");

    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });

    renderWidget(shadow, mockConfig, []);

    expect(shadow.querySelector(".rw-empty")).not.toBeNull();
    expect(shadow.querySelector(".rw-review")).toBeNull();
  });

  it("renders branding link", async () => {
    const { renderWidget } = await import("../core/renderer");

    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });

    renderWidget(shadow, mockConfig, mockReviews);

    const branding = shadow.querySelector(".rw-branding a");
    expect(branding?.textContent).toBe("RepWell");
    expect((branding as HTMLAnchorElement)?.href).toBe("https://repwell.com/");
  });

  it("renders NMLS disclaimer when configured", async () => {
    const { renderWidget } = await import("../core/renderer");

    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });

    const configWithNMLS = {
      ...mockConfig,
      config: {
        ...mockConfig.config,
        content: { ...mockConfig.config.content, showNMLS: true },
      },
    };

    renderWidget(shadow, configWithNMLS, mockReviews);
    expect(shadow.querySelector(".rw-disclaimer")).not.toBeNull();
  });

  it("renders CTA button when configured", async () => {
    const { renderWidget } = await import("../core/renderer");

    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });

    const configWithCTA = {
      ...mockConfig,
      config: {
        ...mockConfig.config,
        content: {
          ...mockConfig.config.content,
          showCTA: true,
          ctaText: "Leave a Review",
          ctaUrl: "https://example.com/review",
        },
      },
    };

    renderWidget(shadow, configWithCTA, mockReviews);
    const cta = shadow.querySelector(".rw-cta") as HTMLAnchorElement;
    expect(cta).not.toBeNull();
    expect(cta.textContent).toBe("Leave a Review");
    expect(cta.target).toBe("_blank");
    expect(cta.rel).toContain("noopener");
  });
});

// ── Error rendering ─────────────────────────────────────────────────

describe("renderError", () => {
  it("renders error fallback message", async () => {
    const { renderError } = await import("../core/renderer");

    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });

    renderError(shadow);
    const err = shadow.querySelector(".rw-error");
    expect(err).not.toBeNull();
    expect(err?.getAttribute("role")).toBe("alert");
  });

  it("renders custom error message", async () => {
    const { renderError } = await import("../core/renderer");

    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });

    renderError(shadow, "Custom error message");
    expect(shadow.querySelector(".rw-error")?.textContent).toBe("Custom error message");
  });
});

// ── Lazy loader tests ───────────────────────────────────────────────

describe("lazy-loader", () => {
  let intersectionCb: IntersectionObserverCallback;
  let mockObserve: ReturnType<typeof vi.fn>;
  let mockUnobserve: ReturnType<typeof vi.fn>;
  let mockDisconnect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    mockObserve = vi.fn();
    mockUnobserve = vi.fn();
    mockDisconnect = vi.fn();

    vi.stubGlobal("IntersectionObserver", class {
      constructor(cb: IntersectionObserverCallback) {
        intersectionCb = cb;
      }
      observe = mockObserve;
      unobserve = mockUnobserve;
      disconnect = mockDisconnect;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("observe registers element and fires callback on intersection", async () => {
    const { observe } = await import("../core/lazy-loader");
    const el = document.createElement("div");
    const cb = vi.fn();

    observe(el, cb);
    expect(mockObserve).toHaveBeenCalledWith(el);

    intersectionCb(
      [{ isIntersecting: true, target: el } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver
    );
    expect(cb).toHaveBeenCalledOnce();
  });

  it("supports multiple elements with independent callbacks", async () => {
    const { observe } = await import("../core/lazy-loader");
    const el1 = document.createElement("div");
    const el2 = document.createElement("div");
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    observe(el1, cb1);
    observe(el2, cb2);

    // Only el1 intersects
    intersectionCb(
      [{ isIntersecting: true, target: el1 } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver
    );
    expect(cb1).toHaveBeenCalledOnce();
    expect(cb2).not.toHaveBeenCalled();

    // Now el2 intersects
    intersectionCb(
      [{ isIntersecting: true, target: el2 } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver
    );
    expect(cb2).toHaveBeenCalledOnce();
  });

  it("does not fire for non-intersecting entries", async () => {
    const { observe } = await import("../core/lazy-loader");
    const el = document.createElement("div");
    const cb = vi.fn();

    observe(el, cb);
    intersectionCb(
      [{ isIntersecting: false, target: el } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver
    );
    expect(cb).not.toHaveBeenCalled();
  });

  it("disconnectObserver cleans up without errors", async () => {
    const { disconnectObserver } = await import("../core/lazy-loader");
    expect(() => disconnectObserver()).not.toThrow();
  });
});

// ── API Client tests ────────────────────────────────────────────────

describe("api-client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetchConfig constructs correct URL", async () => {
    const { fetchConfig } = await import("../core/api-client");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ widget_id: "test" }),
    });
    globalThis.fetch = mockFetch;

    const controller = new AbortController();
    await fetchConfig("https://app.repwell.com", "my-widget", controller.signal);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://app.repwell.com/api/v1/widgets/my-widget/config",
      expect.objectContaining({
        headers: { Accept: "application/json" },
      })
    );
  });

  it("fetchConfig includes entity override query params", async () => {
    const { fetchConfig } = await import("../core/api-client");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ widget_id: "test" }),
    });
    globalThis.fetch = mockFetch;

    const controller = new AbortController();
    await fetchConfig(
      "https://app.repwell.com",
      "my-widget",
      controller.signal,
      {
        entityType: "branch",
        entityId: "123e4567-e89b-12d3-a456-426614174111",
      }
    );

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("entityType=branch");
    expect(calledUrl).toContain("entityId=123e4567-e89b-12d3-a456-426614174111");
  });

  it("fetchReviews includes cursor and limit params", async () => {
    const { fetchReviews } = await import("../core/api-client");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ reviews: [], pagination: {} }),
    });
    globalThis.fetch = mockFetch;

    const controller = new AbortController();
    await fetchReviews("https://app.repwell.com", "my-widget", controller.signal, 20, "cursor-abc");

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("limit=20");
    expect(calledUrl).toContain("cursor=cursor-abc");
  });

  it("fetchReviews includes entity override query params", async () => {
    const { fetchReviews } = await import("../core/api-client");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ reviews: [], pagination: {} }),
    });
    globalThis.fetch = mockFetch;

    const controller = new AbortController();
    await fetchReviews(
      "https://app.repwell.com",
      "my-widget",
      controller.signal,
      10,
      undefined,
      undefined,
      {
        entityType: "organization",
        entityId: null,
      }
    );

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("entityType=organization");
    expect(calledUrl).not.toContain("entityId=");
  });

  it("throws on non-OK response", async () => {
    const { fetchConfig } = await import("../core/api-client");

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        error: "Entity overrides are not supported for this widget type",
        code: "UNSUPPORTED_ENTITY_OVERRIDE",
      }),
    });

    const controller = new AbortController();
    await expect(
      fetchConfig("https://app.repwell.com", "missing", controller.signal)
    ).rejects.toMatchObject<{
      message: string;
      status: number;
      code: string;
    }>({
      message: "Entity overrides are not supported for this widget type",
      status: 400,
      code: "UNSUPPORTED_ENTITY_OVERRIDE",
    });
  });
});

// ── Shadow DOM tests ────────────────────────────────────────────────

describe("shadow-dom", () => {
  it("creates open shadow root with base styles", async () => {
    const { attachShadow } = await import("../core/shadow-dom");

    const host = document.createElement("div");
    const shadow = attachShadow(host);

    expect(shadow.mode).toBe("open");
    expect(shadow.querySelector("style")).not.toBeNull();
    expect(shadow.querySelector("style")?.textContent).toContain(":host");
  });
});

// ── LO Review Widget tests ─────────────────────────────────────────

describe("LO Review Widget", () => {
  const loProfile = {
    full_name: "Sarah Johnson",
    avatar_url: null,
    photo_url: "https://example.com/sarah.jpg",
    nmls_id: "123456",
    title: "Senior Loan Officer",
    average_rating: 4.8,
    total_reviews: 42,
    licensing_states: ["CA", "TX", "FL"],
  };

  const loConfig: PublicWidgetConfig = {
    widget_id: "lo-widget-1",
    widget_type: "lo_review",
    entity_type: "user",
    entity_id: "user-123",
    name: "Sarah Johnson Reviews",
    config: {
      content: {
        showHeader: true,
        headerText: "Reviews for Sarah Johnson",
        showCTA: true,
        ctaText: "Get Pre-Approved",
        ctaUrl: "https://example.com/apply",
        showSource: true,
        showDate: true,
        showAvatar: true,
        showBranding: true,
        showNMLS: true,
        showDisclaimer: true,
        truncateLength: 200,
        showWriteReview: true,
        writeReviewUrl: "https://example.com/write-review",
        cardStyle: "bordered",
        dateFormat: "relative",
      },
    },
    enable_structured_data: true,
    structured_data_type: "LocalBusiness",
    status: "active",
    version: 1,
    entity_profile: loProfile,
  };

  const loReviews: PublicReview[] = [
    {
      id: "r1",
      reviewer_name: "John Doe",
      rating: 5,
      text: "Sarah was amazing! She helped us through the entire process.",
      review_date: "2026-01-15",
      source: "google",
      avatar_url: null,
      loan_type: "Purchase",
      first_time_homebuyer: true,
      loan_officer_name: null,
    },
    {
      id: "r2",
      reviewer_name: "Jane Smith",
      rating: 4,
      text: "Great experience refinancing with Sarah.",
      review_date: "2025-12-01",
      source: "zillow",
      avatar_url: null,
      loan_type: "Refinance",
      first_time_homebuyer: false,
      loan_officer_name: null,
    },
    {
      id: "r3",
      reviewer_name: "Bob Wilson",
      rating: 5,
      text: "Excellent VA loan process.",
      review_date: "2025-11-10",
      source: "internal",
      avatar_url: null,
      loan_type: "VA",
      first_time_homebuyer: null,
      loan_officer_name: null,
    },
  ];

  beforeEach(() => {
    vi.resetModules();
  });

  it("registers lo_review widget type", async () => {
    await import("../widgets/lo-review");
    const { getWidgetRenderer } = await import("../widgets/registry");
    expect(getWidgetRenderer("lo_review")).toBeDefined();
  });

  it("renders profile header with name, photo, NMLS, states, and rating", async () => {
    const { renderLoReviewWidget } = await import("../widgets/lo-review");
    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });
    renderLoReviewWidget(shadow, loConfig, loReviews, "https://app.repwell.com");

    expect(shadow.querySelector(".rw-lo-profile__name")?.textContent).toBe("Sarah Johnson");

    const photo = shadow.querySelector(".rw-lo-profile__photo") as HTMLImageElement;
    expect(photo).not.toBeNull();
    expect(photo?.src).toBe("https://example.com/sarah.jpg");

    const nmlsLink = shadow.querySelector(".rw-lo-profile__nmls a") as HTMLAnchorElement;
    expect(nmlsLink?.textContent).toBe("123456");
    expect(nmlsLink?.href).toContain("nmlsconsumeraccess.org");

    const states = shadow.querySelectorAll(".rw-lo-profile__state-tag");
    expect(states).toHaveLength(3);

    expect(shadow.querySelector(".rw-lo-profile__rating-value")?.textContent).toBe("4.8");
    expect(shadow.querySelector(".rw-lo-profile__rating-count")?.textContent).toBe("42 reviews");
  });

  it("renders initials placeholder when no photo", async () => {
    const { renderLoReviewWidget } = await import("../widgets/lo-review");
    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });

    const noPhotoConfig = {
      ...loConfig,
      entity_profile: { ...loProfile, photo_url: null, avatar_url: null },
    };
    renderLoReviewWidget(shadow, noPhotoConfig, loReviews, "");

    const placeholder = shadow.querySelector(".rw-lo-profile__photo-placeholder");
    expect(placeholder).not.toBeNull();
    expect(placeholder?.textContent).toBe("SJ");
  });

  it("renders review cards with loan type tags and FTHB badge", async () => {
    const { renderLoReviewWidget } = await import("../widgets/lo-review");
    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });
    renderLoReviewWidget(shadow, loConfig, loReviews, "");

    expect(shadow.querySelectorAll(".rw-lo-review")).toHaveLength(3);
    expect(shadow.querySelector(".rw-lo-review__loan-tag--purchase")?.textContent).toBe("Purchase");
    expect(shadow.querySelector(".rw-lo-review__loan-tag--refinance")?.textContent).toBe("Refinance");
    expect(shadow.querySelector(".rw-lo-review__loan-tag--va")?.textContent).toBe("VA");

    const fthb = shadow.querySelectorAll(".rw-lo-review__fthb-badge");
    expect(fthb).toHaveLength(1);
    expect(fthb[0].textContent).toBe("First-Time Buyer");
  });

  it("renders star ratings correctly", async () => {
    const { renderLoReviewWidget } = await import("../widgets/lo-review");
    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });
    renderLoReviewWidget(shadow, loConfig, loReviews, "");

    const firstCard = shadow.querySelector(".rw-lo-review");
    expect(firstCard?.querySelectorAll(".rw-star--filled")).toHaveLength(5);

    const secondCard = shadow.querySelectorAll(".rw-lo-review")[1];
    expect(secondCard?.querySelectorAll(".rw-star--filled")).toHaveLength(4);
    expect(secondCard?.querySelectorAll(".rw-star--empty")).toHaveLength(1);
  });

  it("renders Equal Housing Lender disclaimer", async () => {
    const { renderLoReviewWidget } = await import("../widgets/lo-review");
    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });
    renderLoReviewWidget(shadow, loConfig, loReviews, "");

    expect(shadow.querySelector(".rw-lo-disclaimer")).not.toBeNull();
    expect(shadow.querySelector(".rw-lo-disclaimer__ehl")?.textContent).toContain("Equal Housing Lender");
  });

  it("renders CTA and Write a Review buttons", async () => {
    const { renderLoReviewWidget } = await import("../widgets/lo-review");
    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });
    renderLoReviewWidget(shadow, loConfig, loReviews, "");

    const cta = shadow.querySelector(".rw-cta") as HTMLAnchorElement;
    expect(cta?.textContent).toBe("Get Pre-Approved");
    expect(cta?.target).toBe("_blank");

    const writeBtn = shadow.querySelector(".rw-lo-actions__write-review") as HTMLAnchorElement;
    expect(writeBtn?.textContent).toBe("Write a Review");
    expect(writeBtn?.target).toBe("_blank");
  });

  it("renders branding and hides when configured", async () => {
    const { renderLoReviewWidget } = await import("../widgets/lo-review");
    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });
    renderLoReviewWidget(shadow, loConfig, loReviews, "");

    expect(shadow.querySelector(".rw-branding a")?.textContent).toBe("RepWell");
  });

  it("renders empty state with profile header", async () => {
    const { renderLoReviewWidget } = await import("../widgets/lo-review");
    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });
    renderLoReviewWidget(shadow, loConfig, [], "");

    expect(shadow.querySelector(".rw-empty")).not.toBeNull();
    expect(shadow.querySelector(".rw-lo-review")).toBeNull();
    expect(shadow.querySelector(".rw-lo-profile")).not.toBeNull();
  });

  it("applies ARIA attributes for accessibility", async () => {
    const { renderLoReviewWidget } = await import("../widgets/lo-review");
    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });
    renderLoReviewWidget(shadow, loConfig, loReviews, "");

    expect(shadow.querySelector(".rw-widget")?.getAttribute("role")).toBe("region");
    expect(shadow.querySelector(".rw-lo-review__stars")?.getAttribute("role")).toBe("img");
    expect(shadow.querySelector(".rw-lo-review__stars")?.getAttribute("aria-label")).toContain("out of 5 stars");
    expect(shadow.querySelector(".rw-lo-review")?.getAttribute("role")).toBe("article");

    const nmlsLink = shadow.querySelector(".rw-lo-profile__nmls a");
    expect(nmlsLink?.getAttribute("aria-label")).toContain("NMLS ID 123456");
  });

  it("dispatches to LO renderer via renderWidget", async () => {
    await import("../widgets/lo-review");
    const { renderWidget } = await import("../core/renderer");

    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });
    renderWidget(shadow, loConfig, loReviews, "https://app.repwell.com");

    expect(shadow.querySelector(".rw-lo-profile")).not.toBeNull();
  });

  it("applies saved typography settings to embedded widget styles", async () => {
    const { renderLoReviewWidget } = await import("../widgets/lo-review");
    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });

    const themedConfig: PublicWidgetConfig = {
      ...loConfig,
      config: {
        ...loConfig.config,
        theme: {
          typography: {
            headerSize: "24px",
            bodySize: "16px",
          },
        },
      },
    };

    renderLoReviewWidget(shadow, themedConfig, loReviews, "");

    const styleText = shadow.querySelector("style")?.textContent ?? "";

    expect(host.style.getPropertyValue("--rw-heading-size")).toBe("24px");
    expect(host.style.getPropertyValue("--rw-body-size")).toBe("16px");
    expect(styleText).toMatch(
      /\.rw-lo-profile__name\s*\{[^}]*font-size:\s*var\(--rw-heading-size,\s*18px\)/,
    );
    expect(styleText).toMatch(
      /\.rw-lo-review__text\s*\{[^}]*font-size:\s*var\(--rw-body-size,\s*14px\)/,
    );
  });

  it("applies saved layout settings to embedded widget styles", async () => {
    const { renderLoReviewWidget } = await import("../widgets/lo-review");
    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });

    const themedConfig: PublicWidgetConfig = {
      ...loConfig,
      config: {
        ...loConfig.config,
        theme: {
          layout: {
            maxWidth: "720px",
            padding: "24px",
            borderRadius: "16px",
          },
        },
      },
    };

    renderLoReviewWidget(shadow, themedConfig, loReviews, "");

    expect(host.style.getPropertyValue("--rw-max-width")).toBe("720px");
    expect(host.style.getPropertyValue("--rw-padding")).toBe("24px");
    expect(host.style.getPropertyValue("--rw-radius")).toBe("16px");
  });

  it("supports multi-column grid layout", async () => {
    const { renderLoReviewWidget } = await import("../widgets/lo-review");
    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });

    const multiColConfig = {
      ...loConfig,
      config: {
        ...loConfig.config,
        content: { ...loConfig.config.content, columns: 2 },
      },
    };
    renderLoReviewWidget(shadow, multiColConfig, loReviews, "");

    const grid = shadow.querySelector(".rw-lo-reviews") as HTMLElement;
    expect(grid?.style.gridTemplateColumns).toBe("repeat(2, 1fr)");
  });

  it("applies theme CSS custom properties", async () => {
    const { renderLoReviewWidget } = await import("../widgets/lo-review");
    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });

    const themedConfig = {
      ...loConfig,
      config: {
        ...loConfig.config,
        theme: {
          colors: {
            primary: "#ff0000",
            background: "#000000",
            text: "#ffffff",
            border: "#333333",
          },
        },
      },
    };
    renderLoReviewWidget(shadow, themedConfig, loReviews, "");

    expect(host.style.getPropertyValue("--rw-bg")).toBe("#000000");
    expect(host.style.getPropertyValue("--rw-text")).toBe("#ffffff");
    expect(host.style.getPropertyValue("--rw-primary")).toBe("#ff0000");
    expect(host.style.getPropertyValue("--rw-border")).toBe("#333333");
  });
});
