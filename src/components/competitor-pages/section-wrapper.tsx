import { cn } from "@/lib/utils";

/** Background variants for alternating section rhythm */
export type SectionBackground = "white" | "subtle" | "muted" | "dark" | "gradient";

interface SectionWrapperProps {
  /** Unique section identifier for anchor links */
  id: string;
  /** Background variant for visual rhythm between sections */
  background?: SectionBackground;
  /** Override the default max-width container */
  wide?: boolean;
  /** Remove vertical padding (used for flush sections like logo bars) */
  flush?: boolean;
  /** Enable content-visibility:auto for below-fold sections (skips rendering until near viewport) */
  lazyRender?: boolean;
  /** Estimated intrinsic height hint for content-visibility:auto (prevents CLS) */
  estimatedHeight?: string;
  children: React.ReactNode;
  className?: string;
}

const backgroundClasses: Record<SectionBackground, string> = {
  white: "bg-white",
  subtle: "bg-background-subtle",
  muted: "bg-background-muted",
  dark: "bg-repwell-teal-500 text-white",
  gradient:
    "bg-gradient-to-b from-repwell-teal-500 to-repwell-teal-400 text-white",
};

/**
 * Wraps each competitor comparison page section with consistent
 * spacing, max-width container, scroll-anchor, and background color.
 */
export function SectionWrapper({
  id,
  background = "white",
  wide = false,
  flush = false,
  lazyRender = false,
  estimatedHeight = "600px",
  children,
  className,
}: SectionWrapperProps) {
  return (
    <section
      id={id}
      className={cn(
        backgroundClasses[background],
        // Scroll offset to account for sticky header
        "scroll-mt-20",
        className,
      )}
      style={
        lazyRender
          ? {
              contentVisibility: "auto",
              containIntrinsicSize: `auto ${estimatedHeight}`,
            }
          : undefined
      }
    >
      <div
        className={cn(
          "mx-auto px-4 sm:px-6 lg:px-8",
          wide ? "max-w-[1400px]" : "max-w-7xl",
          flush ? "py-0" : "py-16 md:py-24 lg:py-32",
        )}
      >
        {children}
      </div>
    </section>
  );
}
