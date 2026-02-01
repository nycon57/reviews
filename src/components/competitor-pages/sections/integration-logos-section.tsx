import type { IntegrationItem } from "@/lib/competitor-pages";

interface IntegrationLogosSectionProps {
  integrations: IntegrationItem[];
}

/**
 * Section 9: Integration logos grid.
 * Full implementation in S120.
 */
export function IntegrationLogosSection({
  integrations,
}: IntegrationLogosSectionProps) {
  return (
    <div>
      <h2 className="text-center font-display text-3xl font-bold text-repwell-teal-500 md:text-4xl">
        Integrations
      </h2>
      <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
        {integrations.map((i) => (
          <div
            key={i.name}
            className="flex h-16 w-32 items-center justify-center rounded-lg border border-border bg-white px-4"
          >
            <span className="text-xs font-medium text-repwell-teal-400">
              {i.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
