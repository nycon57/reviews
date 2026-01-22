/**
 * Statistical utilities for A/B testing
 * Implements two-proportion z-test and confidence interval calculations
 * Story S092: Email A/B Testing System
 */

import type { StatisticalSignificance, WinningMetric } from "./types";
import { DEFAULT_ALPHA, DEFAULT_CONFIDENCE_LEVEL } from "./types";

// ============================================================================
// Core Statistical Functions
// ============================================================================

/**
 * Calculate z-score for two-proportion z-test
 * Used to compare two sample proportions (e.g., open rates)
 * @param p1 Proportion for variant A (successes / trials)
 * @param p2 Proportion for variant B (successes / trials)
 * @param n1 Sample size for variant A
 * @param n2 Sample size for variant B
 * @returns z-score
 */
export function calculateZScore(
  p1: number,
  p2: number,
  n1: number,
  n2: number
): number {
  // Handle edge cases
  if (n1 === 0 || n2 === 0) return 0;
  if (p1 === p2) return 0;

  // Pooled proportion under the null hypothesis (H0: p1 = p2)
  const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2);

  // Standard error of the difference
  const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));

  // Handle zero standard error (when pooled proportion is 0 or 1)
  if (se === 0) return 0;

  // Z-score: standardized difference between proportions
  return (p2 - p1) / se;
}

/**
 * Error function approximation (for normal CDF calculation)
 * Uses Abramowitz and Stegun approximation (formula 7.1.26)
 * Accuracy: |error| < 1.5 × 10^-7
 * @param x Input value
 * @returns erf(x)
 */
function erf(x: number): number {
  // Constants for approximation
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  // Save the sign of x
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  // A&S formula 7.1.26
  const t = 1.0 / (1.0 + p * x);
  const y =
    1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

/**
 * Standard normal cumulative distribution function (CDF)
 * @param x Input value
 * @returns P(Z <= x) where Z ~ N(0,1)
 */
function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

/**
 * Calculate p-value from z-score (two-tailed test)
 * @param zScore The z-score from the test
 * @returns Two-tailed p-value
 */
export function calculatePValue(zScore: number): number {
  const absZ = Math.abs(zScore);

  // P(Z > |z|) for standard normal
  const oneTailedP = 1 - normalCDF(absZ);

  // Two-tailed p-value: P(|Z| > |z|) = 2 * P(Z > |z|)
  return 2 * oneTailedP;
}

/**
 * Check if result is statistically significant
 * @param pValue The p-value from the test
 * @param alpha Significance level (default 0.05 for 95% confidence)
 * @returns true if p < alpha (result is significant)
 */
export function isSignificant(pValue: number, alpha: number = DEFAULT_ALPHA): boolean {
  return pValue < alpha;
}

/**
 * Get the critical z-value for a given confidence level (two-tailed)
 * @param confidence Confidence level (e.g., 0.95 for 95%)
 * @returns Critical z-value
 */
export function getCriticalZ(confidence: number): number {
  // Common critical values for efficiency
  if (confidence === 0.90) return 1.645;
  if (confidence === 0.95) return 1.96;
  if (confidence === 0.99) return 2.576;

  // For other values, use inverse normal approximation
  // This is a simplified approximation; for production, consider a lookup table
  const alpha = 1 - confidence;
  const p = 1 - alpha / 2;

  // Rational approximation to inverse normal CDF (Hastings, 1955)
  const c0 = 2.515517;
  const c1 = 0.802853;
  const c2 = 0.010328;
  const d1 = 1.432788;
  const d2 = 0.189269;
  const d3 = 0.001308;

  // Use asymptotic expansion for p close to 1
  const t = Math.sqrt(-2 * Math.log(1 - p));
  return t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);
}

/**
 * Calculate confidence interval for a proportion using Wilson score interval
 * More accurate than normal approximation for small sample sizes and extreme proportions
 * @param successes Number of successes (e.g., emails opened)
 * @param trials Total number of trials (e.g., emails delivered)
 * @param confidence Confidence level (default 0.95 for 95% CI)
 * @returns Object with lower and upper bounds
 */
export function calculateConfidenceInterval(
  successes: number,
  trials: number,
  confidence: number = DEFAULT_CONFIDENCE_LEVEL
): { lower: number; upper: number } {
  // Handle edge cases
  if (trials === 0) {
    return { lower: 0, upper: 0 };
  }

  const p = successes / trials;
  const z = getCriticalZ(confidence);
  const z2 = z * z;

  // Wilson score interval formula
  const denominator = 1 + z2 / trials;
  const center = (p + z2 / (2 * trials)) / denominator;
  const margin =
    (z * Math.sqrt((p * (1 - p)) / trials + z2 / (4 * trials * trials))) / denominator;

  return {
    lower: Math.max(0, center - margin),
    upper: Math.min(1, center + margin),
  };
}

// ============================================================================
// High-Level A/B Testing Functions
// ============================================================================

/**
 * Calculate full statistical significance analysis between two variants
 * @param variantA Object with successes and trials for variant A (typically control)
 * @param variantB Object with successes and trials for variant B (test variant)
 * @param metric The metric being tested (for labeling)
 * @param confidence Confidence level (default 0.95)
 * @returns Complete statistical analysis
 */
export function calculateStatisticalSignificance(
  variantA: { successes: number; trials: number },
  variantB: { successes: number; trials: number },
  metric: WinningMetric,
  confidence: number = DEFAULT_CONFIDENCE_LEVEL
): Omit<StatisticalSignificance, "variantA" | "variantB"> {
  // Calculate proportions (rates)
  const rateA = variantA.trials > 0 ? variantA.successes / variantA.trials : 0;
  const rateB = variantB.trials > 0 ? variantB.successes / variantB.trials : 0;

  // Calculate z-score for two-proportion test
  const zScore = calculateZScore(rateA, rateB, variantA.trials, variantB.trials);

  // Calculate p-value (two-tailed)
  const pValue = calculatePValue(zScore);

  // Check significance at the given confidence level
  const alpha = 1 - confidence;
  const significant = isSignificant(pValue, alpha);

  // Calculate confidence intervals for each variant
  const ciA = calculateConfidenceInterval(variantA.successes, variantA.trials, confidence);
  const ciB = calculateConfidenceInterval(variantB.successes, variantB.trials, confidence);

  // Calculate effect size (difference between variants)
  const absoluteDifference = rateB - rateA;
  const relativeDifference = rateA > 0 ? (absoluteDifference / rateA) * 100 : 0;

  return {
    metric,
    zScore: Number(zScore.toFixed(4)),
    pValue: Number(pValue.toFixed(6)),
    isSignificant: significant,
    confidenceLevel: confidence * 100,
    sampleSizeA: variantA.trials,
    sampleSizeB: variantB.trials,
    rateA: Number((rateA * 100).toFixed(2)),
    rateB: Number((rateB * 100).toFixed(2)),
    absoluteDifference: Number((absoluteDifference * 100).toFixed(2)),
    relativeDifference: Number(relativeDifference.toFixed(2)),
    confidenceIntervalA: {
      lower: Number((ciA.lower * 100).toFixed(2)),
      upper: Number((ciA.upper * 100).toFixed(2)),
    },
    confidenceIntervalB: {
      lower: Number((ciB.lower * 100).toFixed(2)),
      upper: Number((ciB.upper * 100).toFixed(2)),
    },
  };
}

/**
 * Calculate required sample size per variant for A/B test
 * Uses formula for two-proportion z-test with specified power
 * @param baselineRate Current conversion rate (e.g., 0.10 for 10%)
 * @param minimumDetectableEffect Minimum effect to detect (e.g., 0.02 for 2pp lift)
 * @param power Statistical power (default 0.8 for 80% power)
 * @param alpha Significance level (default 0.05)
 * @returns Required sample size per variant
 */
export function calculateRequiredSampleSize(
  baselineRate: number,
  minimumDetectableEffect: number,
  power: number = 0.8,
  alpha: number = DEFAULT_ALPHA
): number {
  // Z-scores for alpha (two-tailed) and power (one-tailed)
  const zAlpha = getCriticalZ(1 - alpha); // 1.96 for alpha = 0.05
  const zBeta = getCriticalZ(1 - 2 * (1 - power)); // 0.84 for power = 0.8

  // Expected rates
  const p1 = baselineRate;
  const p2 = baselineRate + minimumDetectableEffect;

  // Ensure valid rates
  if (p2 <= 0 || p2 >= 1 || p1 <= 0 || p1 >= 1) {
    return Infinity;
  }

  // Pooled proportion (under null hypothesis)
  const pooledP = (p1 + p2) / 2;

  // Sample size formula for two-proportion test
  const numerator = Math.pow(
    zAlpha * Math.sqrt(2 * pooledP * (1 - pooledP)) +
      zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)),
    2
  );
  const denominator = Math.pow(p2 - p1, 2);

  const sampleSize = numerator / denominator;

  return Math.ceil(sampleSize);
}

/**
 * Determine which variant is winning based on metric
 * @param results Array of variant results with metrics
 * @param metric The winning metric to compare
 * @returns ID of winning variant or null if no clear winner
 */
export function determineWinner(
  results: Array<{
    variant: string;
    openRate: number;
    clickRate: number;
    isStatisticallySignificant: boolean;
  }>,
  metric: WinningMetric
): string | null {
  if (results.length < 2) return null;

  // Get metric value for each variant
  const metricValues = results.map((r) => {
    const value = metric === "open_rate" ? r.openRate : r.clickRate;
    return { variant: r.variant, value, isSignificant: r.isStatisticallySignificant };
  });

  // Find the best performing variant
  const sorted = [...metricValues].sort((a, b) => b.value - a.value);
  const best = sorted[0];
  const second = sorted[1];

  // If there's a clear winner (best is significantly better)
  if (best && second) {
    // Check if the difference is meaningful (best has at least some lift)
    if (best.value > second.value) {
      return best.variant;
    }
  }

  // No clear winner (tie or insufficient data)
  return null;
}

/**
 * Calculate uplift (relative improvement) from control to variant
 * @param controlRate Control variant rate
 * @param variantRate Test variant rate
 * @returns Uplift as percentage (e.g., 15.5 for 15.5% improvement)
 */
export function calculateUplift(controlRate: number, variantRate: number): number {
  if (controlRate === 0) return variantRate > 0 ? 100 : 0;
  return Number((((variantRate - controlRate) / controlRate) * 100).toFixed(2));
}

/**
 * Check if sample size is sufficient for reliable results
 * @param sampleSize Current sample size
 * @param minimumRequired Minimum required sample size
 * @returns Object with sufficiency status and progress percentage
 */
export function checkSampleSizeSufficiency(
  sampleSize: number,
  minimumRequired: number
): { isSufficient: boolean; percentComplete: number } {
  const percentComplete = minimumRequired > 0 ? (sampleSize / minimumRequired) * 100 : 0;

  return {
    isSufficient: sampleSize >= minimumRequired,
    percentComplete: Number(Math.min(100, percentComplete).toFixed(1)),
  };
}

/**
 * Calculate the power of a test given current sample sizes
 * Useful for understanding if a test has enough data to detect an effect
 * @param rateA Control rate
 * @param rateB Variant rate
 * @param nA Control sample size
 * @param nB Variant sample size
 * @param alpha Significance level
 * @returns Statistical power (0-1)
 */
export function calculatePower(
  rateA: number,
  rateB: number,
  nA: number,
  nB: number,
  alpha: number = DEFAULT_ALPHA
): number {
  if (nA === 0 || nB === 0) return 0;

  // Weighted pooled proportion for proper statistical analysis
  const pooledP = (rateA * nA + rateB * nB) / (nA + nB);
  // Standard error under H0 (null hypothesis: p1 = p2)
  const seNull = Math.sqrt(pooledP * (1 - pooledP) * (1 / nA + 1 / nB));
  // Standard error under Ha (alternative hypothesis: actual rates)
  const seAlt = Math.sqrt(rateA * (1 - rateA) / nA + rateB * (1 - rateB) / nB);

  if (seNull === 0 || seAlt === 0) return 0;

  const zAlpha = getCriticalZ(1 - alpha);
  const effectSize = Math.abs(rateB - rateA);

  // Calculate power: P(reject H0 | H1 is true)
  const zBeta = (effectSize - zAlpha * seNull) / seAlt;

  return normalCDF(zBeta);
}

/**
 * Estimate time remaining for a test to reach statistical significance
 * Based on current data accumulation rate
 * @param currentSampleSize Current total sample size
 * @param requiredSampleSize Required sample size for significance
 * @param hoursElapsed Hours since test started
 * @returns Estimated hours remaining, or null if cannot estimate
 */
export function estimateTimeRemaining(
  currentSampleSize: number,
  requiredSampleSize: number,
  hoursElapsed: number
): number | null {
  if (currentSampleSize >= requiredSampleSize) return 0;
  if (hoursElapsed === 0 || currentSampleSize === 0) return null;

  const ratePerHour = currentSampleSize / hoursElapsed;
  const remaining = requiredSampleSize - currentSampleSize;

  if (ratePerHour === 0) return null;

  return Math.ceil(remaining / ratePerHour);
}

/**
 * Assign a variant for an email based on traffic split
 * Uses weighted random selection
 */
export function assignVariant(
  trafficSplit: Record<string, number>
): string | null {
  const random = Math.random() * 100;
  let cumulative = 0;

  const entries = Object.entries(trafficSplit).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  for (const [variant, percentage] of entries) {
    cumulative += percentage;
    if (random <= cumulative) {
      return variant;
    }
  }

  // Fallback to first variant
  return entries[0]?.[0] || null;
}
