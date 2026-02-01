/**
 * Statistical significance calculations for A/B tests.
 * Uses chi-squared test to compare conversion rates between variants.
 */

export interface VariantMetrics {
  impressions: number;
  clicks: number;
  writeReviewClicks: number;
}

export type ConfidenceLevel =
  | "not_enough_data"
  | "no_significance"
  | "90_confident"
  | "95_confident"
  | "99_confident";

export interface SignificanceResult {
  confidence: ConfidenceLevel;
  chiSquared: number;
  pValue: number;
  /** Estimated days remaining to reach 95% confidence (null if already reached or cannot estimate). */
  estimatedDaysToSignificance: number | null;
}

// Chi-squared critical values for 1 degree of freedom
const CHI_SQ_90 = 2.706;
const CHI_SQ_95 = 3.841;
const CHI_SQ_99 = 6.635;

// Minimum sample size per variant before running the test
const MIN_SAMPLE_SIZE = 30;

/**
 * Compute chi-squared statistic for a 2x2 contingency table.
 * Rows: variant A, variant B
 * Columns: converted, not converted
 */
function chiSquaredTest(
  aConverted: number,
  aTotal: number,
  bConverted: number,
  bTotal: number
): number {
  const total = aTotal + bTotal;
  const totalConverted = aConverted + bConverted;
  const totalNotConverted = total - totalConverted;

  if (total === 0 || totalConverted === 0 || totalNotConverted === 0) {
    return 0;
  }

  // Expected values
  const eA1 = (aTotal * totalConverted) / total;
  const eA0 = (aTotal * totalNotConverted) / total;
  const eB1 = (bTotal * totalConverted) / total;
  const eB0 = (bTotal * totalNotConverted) / total;

  // Chi-squared = sum of (observed - expected)^2 / expected
  const aNotConverted = aTotal - aConverted;
  const bNotConverted = bTotal - bConverted;

  return (
    ((aConverted - eA1) ** 2) / eA1 +
    ((aNotConverted - eA0) ** 2) / eA0 +
    ((bConverted - eB1) ** 2) / eB1 +
    ((bNotConverted - eB0) ** 2) / eB0
  );
}

/**
 * Approximate p-value from chi-squared with 1 degree of freedom
 * using the Wilson-Hilferty approximation.
 */
function approxPValue(chiSq: number): number {
  if (chiSq <= 0) return 1;
  // Use complementary error function approximation
  const z = Math.sqrt(chiSq);
  // Standard normal CDF approximation (Abramowitz & Stegun)
  const t = 1 / (1 + 0.2316419 * z);
  const d = 0.3989422804 * Math.exp(-z * z / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  // Two-tailed p-value for chi-squared with 1 df is same as 2 * (1 - Phi(sqrt(chi2)))
  return 2 * p;
}

function confidenceFromChiSquared(chiSq: number): ConfidenceLevel {
  if (chiSq >= CHI_SQ_99) return "99_confident";
  if (chiSq >= CHI_SQ_95) return "95_confident";
  if (chiSq >= CHI_SQ_90) return "90_confident";
  return "no_significance";
}

/**
 * Calculate statistical significance between two variants using CTR (clicks / impressions).
 */
export function calculateSignificance(
  variantA: VariantMetrics,
  variantB: VariantMetrics,
  daysRunning: number
): SignificanceResult {
  // Not enough data
  if (variantA.impressions < MIN_SAMPLE_SIZE || variantB.impressions < MIN_SAMPLE_SIZE) {
    // Estimate days to significance based on current daily rate
    let estimatedDays: number | null = null;
    if (daysRunning > 0) {
      const totalImpressions = variantA.impressions + variantB.impressions;
      const dailyRate = totalImpressions / daysRunning;
      if (dailyRate > 0) {
        const needed = MIN_SAMPLE_SIZE * 2 - totalImpressions;
        estimatedDays = Math.max(1, Math.ceil(needed / dailyRate));
      }
    }

    return {
      confidence: "not_enough_data",
      chiSquared: 0,
      pValue: 1,
      estimatedDaysToSignificance: estimatedDays,
    };
  }

  const chiSq = chiSquaredTest(
    variantA.clicks,
    variantA.impressions,
    variantB.clicks,
    variantB.impressions
  );

  const pValue = approxPValue(chiSq);
  const confidence = confidenceFromChiSquared(chiSq);

  // Estimate days to 95% confidence if not yet reached
  let estimatedDays: number | null = null;
  if (chiSq < CHI_SQ_95 && daysRunning > 0) {
    // Rough estimate: chi-squared grows linearly with sample size
    const totalImpressions = variantA.impressions + variantB.impressions;
    if (chiSq > 0) {
      const multiplier = CHI_SQ_95 / chiSq;
      const neededImpressions = totalImpressions * multiplier;
      const dailyRate = totalImpressions / daysRunning;
      if (dailyRate > 0) {
        estimatedDays = Math.max(1, Math.ceil((neededImpressions - totalImpressions) / dailyRate));
      }
    }
  }

  return {
    confidence,
    chiSquared: Math.round(chiSq * 1000) / 1000,
    pValue: Math.round(pValue * 10000) / 10000,
    estimatedDaysToSignificance: estimatedDays,
  };
}
