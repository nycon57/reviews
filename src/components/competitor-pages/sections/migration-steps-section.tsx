import type { MigrationSection } from "@/lib/competitor-pages";

interface MigrationStepsSectionProps {
  config: MigrationSection;
}

/**
 * Section 11: Migration steps.
 * Full implementation in S121.
 */
export function MigrationStepsSection({
  config,
}: MigrationStepsSectionProps) {
  return (
    <div>
      <h2 className="text-center font-display text-3xl font-bold text-repwell-teal-500 md:text-4xl">
        Easy Migration
      </h2>
      <div className="mx-auto mt-12 max-w-2xl space-y-8">
        {config.steps.map((step) => (
          <div key={step.number} className="flex gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-repwell-teal-300 text-sm font-bold text-white">
              {step.number}
            </div>
            <div>
              <h3 className="font-semibold text-repwell-teal-500">
                {step.title}
              </h3>
              <p className="mt-1 text-sm text-repwell-teal-400">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      {config.contractBuyoutNote && (
        <p className="mt-8 text-center text-sm font-medium text-repwell-teal-300">
          {config.contractBuyoutNote}
        </p>
      )}
      <p className="mt-2 text-center text-sm text-repwell-teal-400">
        Timeline: {config.timeline}
      </p>
    </div>
  );
}
