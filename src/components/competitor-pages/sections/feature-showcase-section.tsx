import type { FeatureCard } from "@/lib/competitor-pages";

interface FeatureShowcaseSectionProps {
  features: FeatureCard[];
}

/**
 * Section 7: Feature showcase cards.
 * Full implementation in S119.
 */
export function FeatureShowcaseSection({
  features,
}: FeatureShowcaseSectionProps) {
  return (
    <div>
      <h2 className="text-center font-display text-3xl font-bold text-repwell-teal-500 md:text-4xl">
        Feature Showcase
      </h2>
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-border bg-white p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-repwell-teal-500">
              {f.title}
            </h3>
            <p className="mt-2 text-sm text-repwell-teal-400">
              {f.description}
            </p>
            {f.badge && (
              <span className="mt-3 inline-block rounded-full bg-repwell-sage-100/50 px-3 py-1 text-xs font-semibold text-repwell-teal-300">
                {f.badge}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
