import { describe, expect, it } from "vitest";
import {
  coerceAutoReplySettings,
  hasAutoReplyFeature,
} from "../auto-reply-config";

describe("hasAutoReplyFeature", () => {
  it("returns true for pro and enterprise tiers", () => {
    expect(hasAutoReplyFeature("pro")).toBe(true);
    expect(hasAutoReplyFeature("enterprise")).toBe(true);
  });

  it("returns false for non-pro tiers", () => {
    expect(hasAutoReplyFeature("basic")).toBe(false);
    expect(hasAutoReplyFeature(null)).toBe(false);
    expect(hasAutoReplyFeature(undefined)).toBe(false);
  });
});

describe("coerceAutoReplySettings", () => {
  it("returns defaults when settings are empty", () => {
    const settings = coerceAutoReplySettings({});

    expect(settings).toEqual({
      auto_reply_enabled: false,
      auto_reply_tone: "professional",
      auto_reply_delay_hours: 24,
      auto_reply_min_rating: 1,
    });
  });

  it("coerces valid values and forces a 24-hour delay", () => {
    const settings = coerceAutoReplySettings({
      auto_reply_enabled: true,
      auto_reply_tone: "friendly",
      auto_reply_delay_hours: 12,
      auto_reply_min_rating: 4,
    });

    expect(settings).toEqual({
      auto_reply_enabled: true,
      auto_reply_tone: "friendly",
      auto_reply_delay_hours: 24,
      auto_reply_min_rating: 4,
    });
  });

  it("falls back to defaults for invalid values", () => {
    const settings = coerceAutoReplySettings({
      auto_reply_enabled: "yes",
      auto_reply_tone: "casual",
      auto_reply_delay_hours: 48,
      auto_reply_min_rating: 2,
    });

    expect(settings).toEqual({
      auto_reply_enabled: false,
      auto_reply_tone: "professional",
      auto_reply_delay_hours: 24,
      auto_reply_min_rating: 1,
    });
  });
});
