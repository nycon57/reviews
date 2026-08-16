// @vitest-environment jsdom

import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WidgetConfigJson } from "@/lib/widgets/schemas";
import { WidgetPreview } from "../widget-preview";

const { getPreviewData } = vi.hoisted(() => ({
  getPreviewData: vi.fn(async () => ({
    success: true,
    data: {
      profile: {
        full_name: "Preview User",
        average_rating: 4.8,
        total_reviews: 3,
      },
      reviews: [],
    },
  })),
}));

vi.mock("@/lib/widgets/actions", () => ({
  getPreviewData,
}));

describe("WidgetPreview layout", () => {
  let container: HTMLDivElement;
  let root: Root;
  const reactActEnvironment = globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  };

  beforeEach(() => {
    reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    globalThis.HTMLElement.prototype.scrollIntoView = vi.fn();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("applies theme layout padding and card style to review previews", async () => {
    const config: WidgetConfigJson = {
      theme: {
        colors: {
          primary: "#52796f",
          background: "#ffffff",
          text: "#1a1a2e",
          border: "#e5e7eb",
        },
        layout: {
          maxWidth: "640px",
          padding: "28px",
          borderRadius: "20px",
          shadow: "lg",
          cardStyle: "elevated",
        },
      },
      content: {
        showHeader: true,
        showCTA: false,
        cardStyle: "flat",
        truncateLength: 180,
      },
    };

    await act(async () => {
      root.render(
        <WidgetPreview
          config={config}
          widgetType="lo_review"
          entityType="user"
          entityId={null}
        />,
      );
    });

    const region = container.querySelector('[role="region"]') as HTMLElement | null;
    const firstCard = container.querySelector("article") as HTMLElement | null;

    expect(region).not.toBeNull();
    expect(firstCard).not.toBeNull();
    expect(region?.style.padding).toBe("28px");
    expect(region?.style.borderRadius).toBe("20px");
    expect(firstCard?.className).toContain("shadow-md");
    expect(firstCard?.className).not.toContain("bg-gray-50");
  });

  it("uses the social proof banner preview and respects truncate length", async () => {
    const config: WidgetConfigJson = {
      theme: {
        colors: {
          primary: "#52796f",
          background: "#ffffff",
          text: "#1a1a2e",
          border: "#e5e7eb",
        },
        layout: {
          padding: "18px",
          borderRadius: "18px",
        },
      },
      content: {
        truncateLength: 20,
      },
    };

    await act(async () => {
      root.render(
        <WidgetPreview
          config={config}
          widgetType="social_proof_banner"
          entityType="organization"
          entityId={null}
        />,
      );
    });

    expect(container.textContent).toContain("Trigger:");
    expect(container.textContent).toContain("Amazing experience");
    expect(container.textContent).toContain("…");
    expect(container.textContent).not.toContain(
      "The team was incredibly responsive and made the whole process seamless.",
    );
  });

  it("derives semantic theme tones for review wall cards instead of relying on hardcoded grays", async () => {
    const config: WidgetConfigJson = {
      theme: {
        colors: {
          primary: "#2563eb",
          background: "#f8fafc",
          text: "#0f172a",
          border: "#cbd5e1",
        },
        layout: {
          cardStyle: "bordered",
        },
      },
      content: {
        showHeader: true,
        headerText: "Latest Reviews",
      },
      wall: {
        columns: 3,
      },
    };

    await act(async () => {
      root.render(
        <WidgetPreview
          config={config}
          widgetType="review_wall"
          entityType="user"
          entityId={null}
        />,
      );
    });

    const themedContainer = container.querySelector(
      'div[style*="--rw-primary"]',
    ) as HTMLElement | null;
    const cards = container.querySelectorAll("article");
    const firstCard = cards[0] as HTMLElement | undefined;
    const normalCard = cards[cards.length - 1] as HTMLElement | undefined;

    expect(themedContainer).not.toBeNull();
    expect(firstCard).not.toBeNull();
    expect(normalCard).not.toBeUndefined();
    expect(
      themedContainer?.style.getPropertyValue("--rw-text-muted"),
    ).toContain("color-mix");
    expect(
      themedContainer?.style.getPropertyValue("--rw-surface-muted"),
    ).toContain("color-mix");
    expect(normalCard?.style.background).toContain("var(--rw-surface");
    expect(normalCard?.getAttribute("style")).toContain("var(--rw-border");
  });

  it("applies semantic theme card surfaces to carousel previews too", async () => {
    const config: WidgetConfigJson = {
      theme: {
        colors: {
          primary: "#0f766e",
          background: "#f0fdfa",
          text: "#134e4a",
          border: "#99f6e4",
        },
        layout: {
          cardStyle: "flat",
        },
      },
      content: {
        showHeader: true,
        headerText: "Client Stories",
      },
      carousel: {
        visibleCards: 1,
      },
    };

    await act(async () => {
      root.render(
        <WidgetPreview
          config={config}
          widgetType="review_carousel"
          entityType="user"
          entityId={null}
        />,
      );
    });

    const firstCard = container.querySelector("article") as HTMLElement | null;

    expect(firstCard).not.toBeNull();
    expect(firstCard?.style.background).toContain("var(--rw-surface-muted");
  });

  it("applies semantic theme card surfaces to company review previews too", async () => {
    const config: WidgetConfigJson = {
      theme: {
        colors: {
          primary: "#0f766e",
          background: "#f0fdfa",
          text: "#134e4a",
          border: "#99f6e4",
        },
        layout: {
          cardStyle: "flat",
        },
      },
      content: {
        showHeader: true,
        showFilters: true,
      },
    };

    await act(async () => {
      root.render(
        <WidgetPreview
          config={config}
          widgetType="company_review"
          entityType="organization"
          entityId={null}
        />,
      );
    });

    const firstCard = container.querySelector("article") as HTMLElement | null;

    expect(firstCard).not.toBeNull();
    expect(firstCard?.style.background).toContain("var(--rw-surface-muted");
  });

  it("uses semantic theme surfaces for star rating badges", async () => {
    const config: WidgetConfigJson = {
      theme: {
        colors: {
          primary: "#0f766e",
          background: "#f0fdfa",
          text: "#134e4a",
          border: "#99f6e4",
        },
      },
    };

    await act(async () => {
      root.render(
        <WidgetPreview
          config={config}
          widgetType="star_rating_badge"
          entityType="organization"
          entityId={null}
        />,
      );
    });

    const badge = container.querySelector('[role="img"]') as HTMLElement | null;

    expect(badge).not.toBeNull();
    expect(badge?.getAttribute("style")).toContain("var(--rw-surface");
    expect(badge?.getAttribute("style")).toContain("var(--rw-border");
  });

  it("uses semantic theme surfaces and muted text for nps badges", async () => {
    const config: WidgetConfigJson = {
      theme: {
        colors: {
          primary: "#2563eb",
          background: "#eff6ff",
          text: "#1e3a8a",
          border: "#bfdbfe",
        },
      },
    };

    await act(async () => {
      root.render(
        <WidgetPreview
          config={config}
          widgetType="nps_score_badge"
          entityType="organization"
          entityId={null}
        />,
      );
    });

    const badge = container.querySelector('[role="img"]') as HTMLElement | null;
    const responseCount = Array.from(container.querySelectorAll("*")).find(
      (element) =>
        element.textContent?.trim() === "Based on 456 responses" &&
        (element.getAttribute("style")?.includes("var(--rw-text-muted") ??
          false),
    ) as HTMLElement | undefined;

    expect(badge).not.toBeNull();
    expect(badge?.getAttribute("style")).toContain("var(--rw-surface");
    expect(badge?.getAttribute("style")).toContain("var(--rw-border");
    expect(responseCount).toBeDefined();
    expect(responseCount?.getAttribute("style")).toContain(
      "var(--rw-text-muted",
    );
  });

  it("uses semantic theme surfaces for social proof notifications", async () => {
    const config: WidgetConfigJson = {
      theme: {
        colors: {
          primary: "#2563eb",
          background: "#eff6ff",
          text: "#1e3a8a",
          border: "#bfdbfe",
          accent: "#1d4ed8",
        },
      },
      content: {
        truncateLength: 48,
      },
    };

    await act(async () => {
      root.render(
        <WidgetPreview
          config={config}
          widgetType="social_proof_banner"
          entityType="organization"
          entityId={null}
        />,
      );
    });

    const notificationCard = Array.from(container.querySelectorAll("div")).find(
      (element) =>
        element.textContent?.includes("Sarah M.") &&
        (element.getAttribute("style")?.includes("var(--rw-surface") ?? false),
    ) as HTMLElement | undefined;

    expect(notificationCard).toBeDefined();
    expect(notificationCard?.getAttribute("style")).toContain(
      "var(--rw-surface",
    );
    expect(notificationCard?.getAttribute("style")).toContain(
      "var(--rw-border",
    );
  });

  it("uses semantic theme surfaces for video testimonial cards and transcript panels", async () => {
    const config: WidgetConfigJson = {
      theme: {
        colors: {
          primary: "#7c3aed",
          background: "#faf5ff",
          text: "#4c1d95",
          border: "#d8b4fe",
        },
        layout: {
          cardStyle: "flat",
        },
      },
      video: {
        transcriptPosition: "below",
      },
    };

    await act(async () => {
      root.render(
        <WidgetPreview
          config={config}
          widgetType="video_testimonial"
          entityType="user"
          entityId={null}
        />,
      );
    });

    const cardContainer = Array.from(container.querySelectorAll("div")).find(
      (element) =>
        element.textContent?.includes("Amanda Torres") &&
        (element.getAttribute("style")?.includes("var(--rw-surface-muted") ??
          false),
    ) as HTMLElement | undefined;
    const transcriptPanel = Array.from(container.querySelectorAll("div")).find(
      (element) =>
        element.textContent?.includes("Transcript") &&
        (element.getAttribute("style")?.includes("var(--rw-surface-muted") ??
          false),
    ) as HTMLElement | undefined;

    expect(cardContainer).toBeDefined();
    expect(cardContainer?.getAttribute("style")).toContain(
      "var(--rw-surface-muted",
    );
    expect(transcriptPanel).toBeDefined();
    expect(transcriptPanel?.getAttribute("style")).toContain(
      "var(--rw-surface-muted",
    );
  });

  it("binds preview heading and body text to theme typography variables", async () => {
    const config: WidgetConfigJson = {
      theme: {
        colors: {
          primary: "#52796f",
          background: "#ffffff",
          text: "#1a1a2e",
          border: "#e5e7eb",
        },
        typography: {
          headerSize: "22px",
          bodySize: "15px",
        },
      },
      content: {
        showHeader: true,
        truncateLength: 180,
      },
    };

    await act(async () => {
      root.render(
        <WidgetPreview
          config={config}
          widgetType="lo_review"
          entityType="user"
          entityId={null}
        />,
      );
    });

    const previewShell = container.querySelector(
      '[style*="--rw-heading-size: 22px"][style*="--rw-body-size: 15px"]',
    ) as HTMLElement | null;
    const heading = Array.from(container.querySelectorAll("div")).find(
      (element) => element.textContent?.trim() === "Sarah Johnson",
    ) as HTMLElement | undefined;
    const reviewText = Array.from(container.querySelectorAll("p")).find(
      (element) =>
        element.textContent?.includes(
          "Exceptional experience from start to finish.",
        ) ?? false,
    ) as HTMLElement | undefined;

    expect(previewShell).not.toBeNull();
    expect(heading?.getAttribute("style")).toContain(
      "font-size: var(--rw-heading-size, 18px)",
    );
    expect(reviewText?.getAttribute("style")).toContain(
      "font-size: var(--rw-body-size, 14px)",
    );
  });

  it("applies heading and body typography tokens to review wall card content", async () => {
    const config: WidgetConfigJson = {
      theme: {
        colors: {
          primary: "#52796f",
          background: "#ffffff",
          text: "#1a1a2e",
          border: "#e5e7eb",
        },
        typography: {
          headerSize: "24px",
          bodySize: "16px",
        },
      },
      content: {
        showHeader: false,
      },
      wall: {
        columns: 3,
      },
    };

    await act(async () => {
      root.render(
        <WidgetPreview
          config={config}
          widgetType="review_wall"
          entityType="user"
          entityId={null}
        />,
      );
    });

    const previewShell = container.querySelector(
      '[style*="--rw-heading-size: 24px"][style*="--rw-body-size: 16px"]',
    ) as HTMLElement | null;
    const reviewerInitials = Array.from(container.querySelectorAll("div")).find(
      (element) => element.textContent?.trim() === "MC",
    ) as HTMLElement | undefined;
    const reviewerName = Array.from(container.querySelectorAll("span")).find(
      (element) => element.textContent?.trim() === "Michael Chen",
    ) as HTMLElement | undefined;
    const reviewText = Array.from(container.querySelectorAll("p")).find(
      (element) =>
        element.textContent?.includes(
          "Exceptional experience from start to finish.",
        ) ?? false,
    ) as HTMLElement | undefined;

    expect(previewShell).not.toBeNull();
    expect(reviewerInitials?.getAttribute("style")).toContain(
      "calc(var(--rw-body-size, 14px) * 0.86)",
    );
    expect(reviewerName?.getAttribute("style")).toContain(
      "calc(var(--rw-heading-size, 18px) * 0.8)",
    );
    expect(reviewText?.getAttribute("style")).toContain(
      "font-size: var(--rw-body-size, 14px)",
    );
  });
});
