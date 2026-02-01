import { describe, it, expect } from "vitest";
import { calculateSignificance, type VariantMetrics } from "../ab-statistics";

describe("ab-statistics", () => {
  describe("calculateSignificance", () => {
    it("returns not_enough_data when sample size is below minimum", () => {
      const a: VariantMetrics = { impressions: 10, clicks: 2, writeReviewClicks: 0 };
      const b: VariantMetrics = { impressions: 15, clicks: 5, writeReviewClicks: 0 };
      const result = calculateSignificance(a, b, 3);

      expect(result.confidence).toBe("not_enough_data");
      expect(result.chiSquared).toBe(0);
      expect(result.pValue).toBe(1);
    });

    it("estimates days to minimum sample size when collecting data", () => {
      const a: VariantMetrics = { impressions: 10, clicks: 2, writeReviewClicks: 0 };
      const b: VariantMetrics = { impressions: 10, clicks: 5, writeReviewClicks: 0 };
      const result = calculateSignificance(a, b, 2);

      expect(result.confidence).toBe("not_enough_data");
      expect(result.estimatedDaysToSignificance).toBeGreaterThan(0);
    });

    it("returns no_significance when variants perform identically", () => {
      const a: VariantMetrics = { impressions: 1000, clicks: 100, writeReviewClicks: 10 };
      const b: VariantMetrics = { impressions: 1000, clicks: 100, writeReviewClicks: 10 };
      const result = calculateSignificance(a, b, 30);

      expect(result.confidence).toBe("no_significance");
      expect(result.chiSquared).toBe(0);
    });

    it("detects significance when there is a large difference", () => {
      const a: VariantMetrics = { impressions: 1000, clicks: 50, writeReviewClicks: 5 };
      const b: VariantMetrics = { impressions: 1000, clicks: 120, writeReviewClicks: 15 };
      const result = calculateSignificance(a, b, 30);

      expect(result.confidence).toBe("99_confident");
      expect(result.chiSquared).toBeGreaterThan(6.635);
      expect(result.pValue).toBeLessThan(0.01);
    });

    it("returns 95_confident for moderate differences", () => {
      // Using values that should produce chi-squared between 3.841 and 6.635
      const a: VariantMetrics = { impressions: 200, clicks: 20, writeReviewClicks: 2 };
      const b: VariantMetrics = { impressions: 200, clicks: 38, writeReviewClicks: 5 };
      const result = calculateSignificance(a, b, 14);

      expect(["95_confident", "99_confident"]).toContain(result.confidence);
      expect(result.chiSquared).toBeGreaterThan(3.841);
    });

    it("returns null estimatedDaysToSignificance when already significant", () => {
      const a: VariantMetrics = { impressions: 1000, clicks: 50, writeReviewClicks: 5 };
      const b: VariantMetrics = { impressions: 1000, clicks: 120, writeReviewClicks: 15 };
      const result = calculateSignificance(a, b, 30);

      expect(result.estimatedDaysToSignificance).toBeNull();
    });

    it("handles zero clicks gracefully", () => {
      const a: VariantMetrics = { impressions: 100, clicks: 0, writeReviewClicks: 0 };
      const b: VariantMetrics = { impressions: 100, clicks: 0, writeReviewClicks: 0 };
      const result = calculateSignificance(a, b, 7);

      expect(result.confidence).toBe("no_significance");
      expect(result.chiSquared).toBe(0);
    });
  });
});
