import type { MortgageFeature } from "@/lib/competitor-pages";

interface MortgageSpecificSectionProps {
  features: MortgageFeature[];
}

/**
 * Section 10: Mortgage-specific features.
 * Full implementation in S121.
 */
export function MortgageSpecificSection({
  features,
}: MortgageSpecificSectionProps) {
  return (
    <div>
      <h2 className="text-center font-display text-3xl font-bold text-repwell-teal-500 md:text-4xl">
        Built for Mortgage Professionals
      </h2>
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
          </div>
        ))}
      </div>
    </div>
  );
}
