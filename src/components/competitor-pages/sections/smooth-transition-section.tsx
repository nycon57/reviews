import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import type { TransitionSection } from "@/lib/competitor-pages";
import { cn } from "@/lib/utils";

interface SmoothTransitionSectionProps {
  config: TransitionSection;
}

/**
 * Section 4: Smooth transition section with a reassuring headline
 * and bullet list of what customers keep when switching.
 *
 * Server Component — no client-side interactivity needed.
 * Uses variant prop to control background via SectionWrapper.
 */
export function SmoothTransitionSection({
  config,
}: SmoothTransitionSectionProps) {
  const isDark = config.variant === "dark" || config.variant === "gradient";

  return (
    <div className="mx-auto max-w-3xl text-center">
      {/* Headline */}
      <h2
        className={cn(
          "font-display text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl",
          isDark ? "text-white" : "text-repwell-teal-500",
        )}
      >
        {config.headline}
      </h2>

      {/* Body text */}
      <p
        className={cn(
          "mx-auto mt-4 max-w-2xl font-sans text-lg leading-relaxed",
          isDark ? "text-white/80" : "text-repwell-teal-400",
        )}
      >
        {config.body}
      </p>

      {/* Bullet list */}
      {config.bullets && config.bullets.length > 0 && (
        <ul className="mt-8 inline-flex flex-col gap-3 text-left">
          {config.bullets.map((bullet) => (
            <li key={bullet.text} className="flex items-start gap-3">
              <CheckCircle
                weight="duotone"
                className={cn(
                  "mt-0.5 h-5 w-5 flex-shrink-0",
                  isDark ? "text-repwell-sage-100" : "text-repwell-sage-200",
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  "font-sans text-base leading-relaxed",
                  isDark ? "text-white/90" : "text-repwell-teal-400",
                )}
              >
                {bullet.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
