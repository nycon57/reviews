import type { TransitionSection } from "@/lib/competitor-pages";

interface SmoothTransitionSectionProps {
  config: TransitionSection;
}

/**
 * Section 4: Smooth transition / divider section.
 * Full implementation in S117.
 */
export function SmoothTransitionSection({
  config,
}: SmoothTransitionSectionProps) {
  return (
    <div className="text-center">
      <h2 className="font-display text-3xl font-bold md:text-4xl">
        {config.headline}
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-lg opacity-90">
        {config.body}
      </p>
    </div>
  );
}
