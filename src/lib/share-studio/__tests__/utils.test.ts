import { describe, expect, it } from "vitest";

import { platformLabel } from "../utils";

describe("platformLabel", () => {
  it("does not append Review to video testimonial labels", () => {
    expect(platformLabel("video_testimonial")).toBe("Video Testimonial");
    expect(platformLabel("Video_testimonial")).toBe("Video Testimonial");
  });

  it("uses human-readable review source labels", () => {
    expect(platformLabel("google")).toBe("Google Review");
    expect(platformLabel("partner_portal")).toBe("Partner Portal Review");
    expect(platformLabel("")).toBe("Verified Review");
  });
});
