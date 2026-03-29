import { TrendUp, TrendDown } from "@phosphor-icons/react/dist/ssr";
import type { CustomerMetric } from "@/lib/customers/types";

interface CustomerResultsProps {
  metrics: readonly CustomerMetric[];
}

export function CustomerResults({ metrics }: CustomerResultsProps) {
  return (
    <section className="bg-background-subtle py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-4 text-center font-display text-2xl font-bold text-repwell-teal-500 md:text-3xl">
          Results
        </h2>
        <p className="mx-auto mb-12 max-w-xl text-center text-repwell-teal-400">
          Before and after metrics that speak for themselves.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => {
            const isPositive =
              metric.percentageChange.startsWith("+") ||
              metric.percentageChange === "New capability" ||
              metric.percentageChange === "Full coverage";
            const isReduction = metric.percentageChange.startsWith("-");

            return (
              <div
                key={metric.label}
                className="rounded-2xl border border-border bg-white p-6"
              >
                <p className="mb-4 text-sm font-medium text-repwell-teal-300">
                  {metric.label}
                </p>

                {/* Percentage change highlight */}
                <div className="mb-4 flex items-center gap-2">
                  {(isPositive || isReduction) && (
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        isReduction
                          ? "bg-repwell-sage-100 text-repwell-teal-300"
                          : "bg-repwell-sage-100 text-repwell-sage-200"
                      }`}
                    >
                      {isReduction ? (
                        <TrendDown weight="bold" className="h-4 w-4" />
                      ) : (
                        <TrendUp weight="bold" className="h-4 w-4" />
                      )}
                    </div>
                  )}
                  <span className="font-display text-2xl font-bold text-repwell-teal-500">
                    {metric.percentageChange}
                  </span>
                </div>

                {/* Before/After */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-background-subtle p-3">
                    <p className="text-xs font-medium text-repwell-teal-300 uppercase">
                      Before
                    </p>
                    <p className="mt-1 text-sm font-semibold text-repwell-teal-500">
                      {metric.before}
                    </p>
                  </div>
                  <div className="rounded-lg bg-repwell-sage-100/40 p-3">
                    <p className="text-xs font-medium text-repwell-teal-300 uppercase">
                      After
                    </p>
                    <p className="mt-1 text-sm font-semibold text-repwell-teal-500">
                      {metric.after}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
