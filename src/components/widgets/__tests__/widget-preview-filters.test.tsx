// @vitest-environment jsdom

import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WidgetConfigJson } from "@/lib/widgets/schemas";
import { WidgetPreview } from "../widget-preview";

const { getPreviewData } = vi.hoisted(() => ({
  getPreviewData: vi.fn(
    async (
      _entityType?: string,
      _entityId?: string | null,
      filters?: {
        minRating?: number;
        maxReviews?: number;
        sortOrder?: "newest" | "oldest" | "highest" | "lowest";
      },
    ) => {
      const allReviews = [
        {
          id: "r-top",
          reviewer_name: "Top Rated",
          rating: 5,
          text: "Excellent from start to finish.",
          review_date: "2024-01-01T00:00:00.000Z",
          source: "google",
          avatar_url: null,
          loan_type: null,
          first_time_homebuyer: false,
        },
        {
          id: "r-mid",
          reviewer_name: "Mid Rated",
          rating: 4,
          text: "Strong communication throughout.",
          review_date: "2024-01-03T00:00:00.000Z",
          source: "zillow",
          avatar_url: null,
          loan_type: null,
          first_time_homebuyer: false,
        },
        {
          id: "r-low",
          reviewer_name: "Low Rated",
          rating: 3,
          text: "This should be filtered out.",
          review_date: "2024-01-04T00:00:00.000Z",
          source: "internal",
          avatar_url: null,
          loan_type: null,
          first_time_homebuyer: false,
        },
      ];

      let reviews = [...allReviews];

      if (filters?.minRating) {
        reviews = reviews.filter((review) => review.rating >= filters.minRating!);
      }

      switch (filters?.sortOrder) {
        case "highest":
          reviews.sort(
            (a, b) =>
              b.rating - a.rating ||
              new Date(b.review_date).getTime() -
                new Date(a.review_date).getTime(),
          );
          break;
        case "lowest":
          reviews.sort(
            (a, b) =>
              a.rating - b.rating ||
              new Date(b.review_date).getTime() -
                new Date(a.review_date).getTime(),
          );
          break;
        case "oldest":
          reviews.sort(
            (a, b) =>
              new Date(a.review_date).getTime() -
              new Date(b.review_date).getTime(),
          );
          break;
        default:
          reviews.sort(
            (a, b) =>
              new Date(b.review_date).getTime() -
              new Date(a.review_date).getTime(),
          );
      }

      if (filters?.maxReviews) {
        reviews = reviews.slice(0, filters.maxReviews);
      }

      return {
        success: true,
        data: {
          profile: {
            organization_name: "Preview Org",
            average_rating: 4.7,
            total_reviews: 29,
            rating_distribution: null,
            source_breakdown: null,
          },
          reviews,
        },
      };
    },
  ),
}));

vi.mock("@/lib/widgets/actions", () => ({
  getPreviewData,
}));

describe("WidgetPreview filters", () => {
  let container: HTMLDivElement;
  let root: Root;
  const reactActEnvironment = globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  };

  beforeEach(() => {
    reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("uses live organization data and reflects configured review filters in the preview", async () => {
    const config: WidgetConfigJson = {
      filters: {
        minRating: 4,
        maxReviews: 2,
        sortOrder: "highest",
      },
      content: {
        showFilters: false,
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

    await act(async () => {
      vi.advanceTimersByTime(350);
      await Promise.resolve();
    });

    expect(getPreviewData).toHaveBeenCalledWith(
      "organization",
      null,
      expect.objectContaining({
        minRating: 4,
        maxReviews: 2,
        sortOrder: "highest",
      }),
      "en",
    );

    const reviewCards = Array.from(container.querySelectorAll("article"));

    expect(reviewCards).toHaveLength(2);
    expect(reviewCards[0]?.textContent).toContain("Top Rated");
    expect(reviewCards[1]?.textContent).toContain("Mid Rated");
    expect(container.textContent).toContain("29 reviews");
    expect(container.textContent).not.toContain("Low Rated");
    expect(container.textContent).not.toContain("Michael Chen");
  });
});
