import { describe, expect, it } from "vitest";
import {
  computeAverageResponseMs,
  formatResponseDuration,
  averageResponseTimeLabel,
  type ReviewResponseTiming,
} from "../response-time";

const HOUR = 60 * 60 * 1000;

function row(
  publishedAt: string | null,
  responseAt: string | null,
  reviewDate: string | null = null
): ReviewResponseTiming {
  return { published_at: publishedAt, response_at: responseAt, review_date: reviewDate };
}

describe("computeAverageResponseMs", () => {
  it("averages response_at − published_at across responded reviews", () => {
    const rows = [
      row("2026-01-01T00:00:00Z", "2026-01-01T02:00:00Z"), // 2h
      row("2026-01-01T00:00:00Z", "2026-01-01T06:00:00Z"), // 6h
    ];
    expect(computeAverageResponseMs(rows)).toBe(4 * HOUR);
  });

  it("falls back to review_date when published_at is null", () => {
    const rows = [row(null, "2026-01-01T03:00:00Z", "2026-01-01T00:00:00Z")]; // 3h
    expect(computeAverageResponseMs(rows)).toBe(3 * HOUR);
  });

  it("ignores reviews without a response", () => {
    const rows = [
      row("2026-01-01T00:00:00Z", null),
      row("2026-01-01T00:00:00Z", "2026-01-01T05:00:00Z"), // 5h
    ];
    expect(computeAverageResponseMs(rows)).toBe(5 * HOUR);
  });

  it("skips negative (out-of-order) durations", () => {
    const rows = [
      row("2026-01-01T10:00:00Z", "2026-01-01T09:00:00Z"), // -1h, skipped
      row("2026-01-01T00:00:00Z", "2026-01-01T04:00:00Z"), // 4h
    ];
    expect(computeAverageResponseMs(rows)).toBe(4 * HOUR);
  });

  it("returns null when there is no computable timing", () => {
    expect(computeAverageResponseMs([])).toBeNull();
    expect(computeAverageResponseMs([row(null, "2026-01-01T00:00:00Z", null)])).toBeNull();
    expect(computeAverageResponseMs([row("2026-01-01T00:00:00Z", null)])).toBeNull();
  });
});

describe("formatResponseDuration", () => {
  it("formats minutes, hours, and days", () => {
    expect(formatResponseDuration(45 * 60 * 1000)).toBe("45 minutes");
    expect(formatResponseDuration(6 * HOUR)).toBe("6 hours");
    expect(formatResponseDuration(1 * HOUR)).toBe("1 hour");
    expect(formatResponseDuration(60 * HOUR)).toBe("2.5 days");
  });

  it("returns null for null/invalid input so the caller can omit the row", () => {
    expect(formatResponseDuration(null)).toBeNull();
    expect(formatResponseDuration(-1)).toBeNull();
    expect(formatResponseDuration(Number.NaN)).toBeNull();
  });
});

describe("averageResponseTimeLabel", () => {
  it("computes and formats in one step", () => {
    expect(
      averageResponseTimeLabel([row("2026-01-01T00:00:00Z", "2026-01-01T06:00:00Z")])
    ).toBe("6 hours");
  });

  it("returns null when uncomputable", () => {
    expect(averageResponseTimeLabel([])).toBeNull();
  });
});
