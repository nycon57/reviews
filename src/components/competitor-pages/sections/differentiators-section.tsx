import type { DifferentiatorCard } from "@/lib/competitor-pages";

interface DifferentiatorsSectionProps {
  differentiators: DifferentiatorCard[];
  competitorName: string;
}

/**
 * Section 6: Key differentiator cards.
 * Full implementation in S118.
 */
export function DifferentiatorsSection({
  differentiators,
  competitorName,
}: DifferentiatorsSectionProps) {
  return (
    <div>
      <h2 className="text-center font-display text-3xl font-bold text-repwell-teal-500 md:text-4xl">
        Why RepWell Over {competitorName}
      </h2>
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {differentiators.map((d) => (
          <div
            key={d.title}
            className="rounded-xl border border-border bg-white p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-repwell-teal-500">
              {d.title}
            </h3>
            <p className="mt-2 text-sm text-repwell-teal-400">
              {d.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
