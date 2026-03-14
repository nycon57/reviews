// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { PublicReview, PublicWidgetConfig } from "../types";
import { COMPANY_REVIEW_STYLES } from "../widgets/company-review/styles";
import { BRANCH_REVIEW_STYLES } from "../widgets/branch-review/styles";
import { REVIEW_CAROUSEL_STYLES } from "../widgets/review-carousel/styles";
import { SOCIAL_PROOF_BANNER_STYLES } from "../widgets/social-proof-banner/styles";
import { renderSocialProofBannerWidget } from "../widgets/social-proof-banner";

describe("embed layout styles", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    localStorage.clear();
  });

  afterEach(() => {
    document.body.replaceChildren();
    localStorage.clear();
  });

  it("uses theme layout CSS variables in company, branch, carousel, and social banner styles", () => {
    expect(COMPANY_REVIEW_STYLES).toContain("padding:var(--rw-padding,16px)");
    expect(COMPANY_REVIEW_STYLES).toContain("box-shadow:var(--rw-shadow,");

    expect(BRANCH_REVIEW_STYLES).toContain("padding:var(--rw-padding,16px)");
    expect(BRANCH_REVIEW_STYLES).toContain("box-shadow:var(--rw-shadow,");

    expect(REVIEW_CAROUSEL_STYLES).toContain("padding: var(--rw-padding, 16px);");

    expect(SOCIAL_PROOF_BANNER_STYLES).toContain(
      "border-radius: var(--rw-radius, 12px);",
    );
    expect(SOCIAL_PROOF_BANNER_STYLES).toContain("padding: var(--rw-padding,");
  });

  it("uses configured truncate length for social proof banner snippets", async () => {
    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });

    const config: PublicWidgetConfig = {
      widget_id: "banner-123",
      widget_type: "social_proof_banner",
      entity_type: "organization",
      entity_id: null,
      name: "Banner",
      status: "active",
      version: 1,
      config: {
        content: {
          truncateLength: 20,
        },
        socialProofBanner: {
          displayMode: "notification",
          trigger: "immediate",
        },
      },
      enable_structured_data: true,
      structured_data_type: "Organization",
    };

    const reviews: PublicReview[] = [
      {
        id: "r1",
        reviewer_name: "Alex Morgan",
        rating: 5,
        text: "This service was incredibly detailed, responsive, and easy to trust from day one.",
        review_date: "2026-02-01",
        source: "google",
        avatar_url: null,
        loan_type: null,
        first_time_homebuyer: null,
        loan_officer_name: "Jamie Rivers",
      },
    ];

    renderSocialProofBannerWidget(shadow, config, reviews, "https://app.repwell.com");

    const bannerHost = document.body.querySelector(
      '[data-repwell-banner="banner-123"]',
    ) as HTMLElement | null;
    const bannerRoot = bannerHost?.shadowRoot;
    const snippet = bannerRoot?.querySelector(
      ".rw-spb-notification__snippet",
    ) as HTMLElement | null;

    expect(snippet).not.toBeNull();
    expect(snippet?.textContent).toContain("This service was");
    expect(snippet?.textContent).toContain("…");
    expect(snippet?.textContent).not.toContain("responsive, and easy to trust");
  });
});
