// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { applyTheme } from "../styles/theme-engine";
import { COMPANY_REVIEW_STYLES } from "../widgets/company-review/styles";
import { BRANCH_REVIEW_STYLES } from "../widgets/branch-review/styles";
import { LO_REVIEW_STYLES } from "../widgets/lo-review/styles";
import { REVIEW_CAROUSEL_STYLES } from "../widgets/review-carousel/styles";
import { REVIEW_WALL_STYLES } from "../widgets/review-wall/styles";
import { VIDEO_TESTIMONIAL_STYLES } from "../widgets/video-testimonial/styles";

describe("embed theme engine", () => {
  it("derives semantic text and surface tone variables for widgets", () => {
    const host = document.createElement("div");
    const root = host.attachShadow({ mode: "open" });

    applyTheme(root, {
      primary: "#2563eb",
      background: "#f8fafc",
      text: "#0f172a",
      border: "#cbd5e1",
    });

    expect(host.style.getPropertyValue("--rw-text-muted")).toContain("color-mix");
    expect(host.style.getPropertyValue("--rw-text-subtle")).toContain("color-mix");
    expect(host.style.getPropertyValue("--rw-surface-muted")).toContain("color-mix");
    expect(host.style.getPropertyValue("--rw-surface-strong")).toContain("color-mix");
  });

  it("uses semantic theme tones in widget styles instead of raw neutral grays", () => {
    const themedStyles = [
      COMPANY_REVIEW_STYLES,
      BRANCH_REVIEW_STYLES,
      LO_REVIEW_STYLES,
      REVIEW_CAROUSEL_STYLES,
      REVIEW_WALL_STYLES,
      VIDEO_TESTIMONIAL_STYLES,
    ];

    for (const styles of themedStyles) {
      expect(styles).toMatch(/var\(--rw-text-(?:muted|subtle|secondary)/);
      expect(styles).toMatch(
        /var\(--rw-(?:surface|surface-muted|surface-strong|featured-start)/,
      );
    }
  });
});
