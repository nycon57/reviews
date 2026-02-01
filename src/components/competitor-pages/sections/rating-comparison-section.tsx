"use client";

import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import type { RatingComparison, PlatformRatings } from "@/lib/competitor-pages";
import { cn } from "@/lib/utils";
import { Star, Trophy, Minus } from "@phosphor-icons/react";

interface RatingComparisonSectionProps {
  config: RatingComparison;
  competitorName: string;
}

/** Rating platforms we display, in order. */
const PLATFORMS = [
  { key: "g2" as const, label: "G2" },
  { key: "capterra" as const, label: "Capterra" },
  { key: "trustpilot" as const, label: "Trustpilot" },
] as const;

type PlatformKey = (typeof PLATFORMS)[number]["key"];

/** Extract a numeric score for a given platform from PlatformRatings. */
function getScore(ratings: PlatformRatings, platform: PlatformKey): number | null {
  switch (platform) {
    case "g2":
      return ratings.g2Score;
    case "capterra":
      return ratings.capterra ?? null;
    case "trustpilot":
      return ratings.trustpilot ?? null;
  }
}

/** Get review count for G2 (only platform with counts in the data). */
function getReviewCount(ratings: PlatformRatings, platform: PlatformKey): number | null {
  if (platform === "g2") return ratings.g2ReviewCount;
  return null;
}

/** Render star visualization for a score (0–5). */
function StarRating({ score }: { score: number }) {
  const fullStars = Math.floor(score);
  const hasHalf = score - fullStars >= 0.25;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} weight="fill" className="h-4 w-4 text-amber-400" />
      ))}
      {hasHalf && (
        <div className="relative h-4 w-4">
          <Star weight="regular" className="absolute inset-0 h-4 w-4 text-amber-400/30" />
          <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
            <Star weight="fill" className="h-4 w-4 text-amber-400" />
          </div>
        </div>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} weight="regular" className="h-4 w-4 text-amber-400/30" />
      ))}
    </div>
  );
}

/** Single rating row comparing RepWell vs competitor on one platform. */
function RatingRow({
  platformLabel,
  repwellScore,
  competitorScore,
  repwellReviewCount,
  competitorReviewCount,
  index,
  isVisible,
}: {
  platformLabel: string;
  repwellScore: number | null;
  competitorScore: number | null;
  repwellReviewCount: number | null;
  competitorReviewCount: number | null;
  index: number;
  isVisible: boolean;
}) {
  const repwellWins =
    repwellScore !== null &&
    competitorScore !== null &&
    repwellScore > competitorScore;
  const competitorWins =
    repwellScore !== null &&
    competitorScore !== null &&
    competitorScore > repwellScore;
  const tied =
    repwellScore !== null &&
    competitorScore !== null &&
    repwellScore === competitorScore;

  return (
    <div
      className={cn(
        "grid grid-cols-3 items-center gap-4 rounded-xl border border-border bg-white px-5 py-4 shadow-sm transition-all duration-500 hover:shadow-md sm:px-6",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
      )}
      style={{ transitionDelay: isVisible ? `${index * 120 + 300}ms` : "0ms" }}
    >
      {/* RepWell score */}
      <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:items-center sm:gap-3">
        {repwellScore !== null ? (
          <>
            <span
              className={cn(
                "font-display text-2xl font-bold sm:text-3xl",
                repwellWins
                  ? "text-repwell-sage-200"
                  : "text-repwell-teal-400",
              )}
            >
              {repwellScore.toFixed(1)}
            </span>
            <div className="flex flex-col items-center gap-0.5 sm:items-start">
              <StarRating score={repwellScore} />
              {repwellReviewCount !== null && (
                <span className="text-xs text-repwell-teal-300">
                  {repwellReviewCount.toLocaleString()} reviews
                </span>
              )}
            </div>
          </>
        ) : (
          <span className="font-sans text-sm text-repwell-teal-300">N/A</span>
        )}
        {repwellWins && (
          <Trophy weight="fill" className="hidden h-4 w-4 text-repwell-sage-200 sm:block" aria-hidden="true" />
        )}
      </div>

      {/* Platform label + winner indicator */}
      <div className="flex flex-col items-center gap-1">
        <span className="font-sans text-xs font-semibold uppercase tracking-wider text-repwell-teal-300">
          {platformLabel}
        </span>
        {repwellWins && (
          <span className="sr-only">RepWell scores higher</span>
        )}
        {competitorWins && (
          <span className="sr-only">Competitor scores higher</span>
        )}
        {tied && (
          <span className="sr-only">Scores are tied</span>
        )}
      </div>

      {/* Competitor score */}
      <div className="flex flex-col items-center gap-1.5 sm:flex-row-reverse sm:items-center sm:gap-3">
        {competitorScore !== null ? (
          <>
            <span
              className={cn(
                "font-display text-2xl font-bold sm:text-3xl",
                competitorWins
                  ? "text-repwell-sage-200"
                  : "text-repwell-teal-400/60",
              )}
            >
              {competitorScore.toFixed(1)}
            </span>
            <div className="flex flex-col items-center gap-0.5 sm:items-end">
              <StarRating score={competitorScore} />
              {competitorReviewCount !== null && (
                <span className="text-xs text-repwell-teal-300">
                  {competitorReviewCount.toLocaleString()} reviews
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1.5">
            <Minus weight="bold" className="h-3.5 w-3.5 text-repwell-teal-300/50" aria-hidden="true" />
            <span className="font-sans text-sm text-repwell-teal-300">N/A</span>
          </div>
        )}
        {competitorWins && (
          <Trophy weight="fill" className="hidden h-4 w-4 text-repwell-sage-200 sm:block" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

/**
 * Section 12: Rating Comparison.
 *
 * Renders a side-by-side comparison of RepWell vs competitor ratings
 * across G2, Capterra, and Trustpilot. Each platform row shows star
 * visualizations, numeric scores, review counts, and a winner indicator.
 *
 * Gracefully handles missing data (shows "N/A" when a platform is absent).
 * All content is driven by config.ratingComparison.
 * Animations are scroll-triggered and respect prefers-reduced-motion.
 */
export function RatingComparisonSection({
  config,
  competitorName,
}: RatingComparisonSectionProps) {
  const { ref: sectionRef, isVisible } = useScrollReveal();

  if (!config.repwell || !config.competitor) return null;

  return (
    <div ref={sectionRef}>
      {/* Section header */}
      <div className="mx-auto max-w-3xl text-center">
        <p
          className={cn(
            "font-sans text-xs font-semibold uppercase tracking-wider text-repwell-teal-300 transition-all duration-500",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          Platform Ratings
        </p>

        <h2
          className={cn(
            "mt-3 font-display text-3xl font-bold tracking-tight text-repwell-teal-500 transition-all duration-500 md:text-4xl lg:text-5xl",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
          )}
          style={{ transitionDelay: isVisible ? "100ms" : "0ms" }}
        >
          How We Compare
        </h2>

        <p
          className={cn(
            "mt-4 font-sans text-lg leading-relaxed text-repwell-teal-400 transition-all duration-500 md:text-xl",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
          )}
          style={{ transitionDelay: isVisible ? "200ms" : "0ms" }}
        >
          See how RepWell stacks up against {competitorName} across major review
          platforms.
        </p>
      </div>

      {/* Column headers */}
      <div className="mx-auto mt-12 max-w-2xl">
        <div
          className={cn(
            "mb-4 grid grid-cols-3 items-end gap-4 px-5 transition-all duration-500 sm:px-6",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
          style={{ transitionDelay: isVisible ? "250ms" : "0ms" }}
        >
          <div className="text-center">
            <span className="font-sans text-sm font-semibold text-repwell-teal-500">
              RepWell
            </span>
          </div>
          <div className="text-center">
            <span className="font-sans text-xs text-repwell-teal-300">
              Platform
            </span>
          </div>
          <div className="text-center">
            <span className="font-sans text-sm font-semibold text-repwell-teal-500">
              {competitorName}
            </span>
          </div>
        </div>

        {/* Rating rows */}
        <div className="flex flex-col gap-3">
          {PLATFORMS.map((platform, i) => (
            <RatingRow
              key={platform.key}
              platformLabel={platform.label}
              repwellScore={getScore(config.repwell, platform.key)}
              competitorScore={getScore(config.competitor, platform.key)}
              repwellReviewCount={getReviewCount(config.repwell, platform.key)}
              competitorReviewCount={getReviewCount(config.competitor, platform.key)}
              index={i}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
