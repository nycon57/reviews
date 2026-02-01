import type { RatingComparison } from "@/lib/competitor-pages";

interface RatingComparisonSectionProps {
  config: RatingComparison;
  competitorName: string;
}

/**
 * Section 12: Rating comparison.
 * Full implementation in S122.
 */
export function RatingComparisonSection({
  config,
  competitorName,
}: RatingComparisonSectionProps) {
  return (
    <div>
      <h2 className="text-center font-display text-3xl font-bold text-repwell-teal-500 md:text-4xl">
        Rating Comparison
      </h2>
      <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-8 text-center">
        <div>
          <h3 className="text-lg font-semibold text-repwell-teal-500">
            RepWell
          </h3>
          <p className="mt-2 font-display text-4xl font-bold text-repwell-teal-300">
            {config.repwell.g2Score}
          </p>
          <p className="text-sm text-repwell-teal-400">
            {config.repwell.g2ReviewCount} G2 reviews
          </p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-repwell-teal-500">
            {competitorName}
          </h3>
          <p className="mt-2 font-display text-4xl font-bold text-repwell-teal-400/60">
            {config.competitor.g2Score}
          </p>
          <p className="text-sm text-repwell-teal-400">
            {config.competitor.g2ReviewCount} G2 reviews
          </p>
        </div>
      </div>
    </div>
  );
}
