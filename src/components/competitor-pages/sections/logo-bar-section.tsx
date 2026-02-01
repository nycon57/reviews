import type { LogoBarItem } from "@/lib/competitor-pages";

interface LogoBarSectionProps {
  logos: LogoBarItem[];
}

/**
 * Section 2: Scrolling customer logo bar.
 * Full implementation in S116.
 */
export function LogoBarSection({ logos }: LogoBarSectionProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-8 py-8 opacity-60 grayscale">
      {logos.map((logo) => (
        <div key={logo.name} className="flex items-center gap-2">
          <span className="text-sm font-medium text-repwell-teal-400">
            {logo.name}
          </span>
        </div>
      ))}
    </div>
  );
}
