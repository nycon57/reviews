import { describe, expect, it } from "vitest";

import { formatReviewSource } from "../source-labels";

describe("formatReviewSource", () => {
  it("formats video testimonial source values for display", () => {
    expect(formatReviewSource("video_testimonial")).toBe("Video review");
    expect(formatReviewSource("Video_testimonial")).toBe("Video review");
    expect(formatReviewSource("video-testimonial")).toBe("Video review");
  });

  it("preserves known review source labels", () => {
    expect(formatReviewSource("google")).toBe("Google");
    expect(formatReviewSource("internal")).toBe("Survey");
  });

  it("humanizes unknown source values", () => {
    expect(formatReviewSource("partner_portal")).toBe("Partner Portal");
    expect(formatReviewSource(null)).toBe("Unknown");
  });
});
