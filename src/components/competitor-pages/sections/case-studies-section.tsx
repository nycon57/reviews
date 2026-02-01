import type { CaseStudy } from "@/lib/competitor-pages";

interface CaseStudiesSectionProps {
  caseStudies: CaseStudy[];
}

/**
 * Section 13: Case studies.
 * Full implementation in S123.
 */
export function CaseStudiesSection({
  caseStudies,
}: CaseStudiesSectionProps) {
  return (
    <div>
      <h2 className="text-center font-display text-3xl font-bold text-repwell-teal-500 md:text-4xl">
        Customer Success Stories
      </h2>
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {caseStudies.map((cs) => (
          <div
            key={cs.companyName}
            className="rounded-xl border border-border bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-repwell-teal-500">
                {cs.companyName}
              </h3>
              <span className="text-xs text-repwell-teal-300">
                {cs.industry}
              </span>
            </div>
            <p className="mt-4 text-sm text-repwell-teal-400 italic">
              &ldquo;{cs.quote}&rdquo;
            </p>
            <div className="mt-4 grid grid-cols-3 gap-4">
              {cs.metrics.map((m) => (
                <div key={m.label} className="text-center">
                  <p className="text-xs text-repwell-teal-300">{m.label}</p>
                  <p className="text-sm font-semibold text-repwell-teal-500">
                    {m.before} &rarr; {m.after}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
