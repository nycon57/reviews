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

  it("throws on non-OK response", async () => {
    const { fetchConfig } = await import("../core/api-client");

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({}),
    });

    const controller = new AbortController();
    await expect(
      fetchConfig("https://app.repwell.com", "missing", controller.signal)
    ).rejects.toThrow("HTTP 404");
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
