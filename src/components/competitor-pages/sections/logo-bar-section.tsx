import Image from "next/image";
import type { LogoBarItem } from "@/lib/competitor-pages";

interface LogoBarSectionProps {
  logos: LogoBarItem[];
}

/**
 * Section 2: Horizontally scrolling customer logo bar.
 *
 * Uses CSS @keyframes for infinite scroll (no JS), pauses on hover,
 * and applies gradient fade masks on left/right edges. Logos are
 * duplicated to create a seamless loop.
 *
 * Animation styles defined in globals.css (.logo-bar-scroll, .logo-bar-mask).
 */
export function LogoBarSection({ logos }: LogoBarSectionProps) {
  if (logos.length === 0) return null;

  // Duplicate logos for seamless infinite scroll
  const allLogos = [...logos, ...logos];

  return (
    <div className="py-10 md:py-14">
      <p className="mb-8 text-center font-sans text-sm font-medium text-repwell-teal-300">
        Trusted by mortgage professionals nationwide
      </p>

      {/* Scroll container with gradient masks */}
      <div
        className="logo-bar-mask group relative overflow-hidden"
        aria-label="Customer logos"
        role="marquee"
      >
        {/* Scrolling track */}
        <div className="logo-bar-scroll flex w-max items-center gap-12 md:gap-16 group-hover:[animation-play-state:paused]">
          {allLogos.map((logo, i) => (
            <div
              key={`${logo.name}-${i}`}
              className="flex-shrink-0 opacity-60 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
            >
              <Image
                src={logo.logoUrl}
                alt={logo.name}
                width={120}
                height={40}
                className="h-8 w-auto object-contain md:h-10"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
