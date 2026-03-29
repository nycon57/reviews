import Link from "next/link";
import { cn } from "@/lib/utils";
import type { MarketingBreadcrumbItem } from "@/lib/seo/marketing-breadcrumbs";

interface MarketingBreadcrumbsProps {
  items: MarketingBreadcrumbItem[];
  className?: string;
}

/**
 * Server-rendered breadcrumbs for marketing template pages.
 *
 * Uses RepWell design system tokens. Thin slash separators keep it
 * lightweight — the breadcrumb should orient, not compete with the hero.
 *
 * The last item is rendered as non-linked text with `aria-current="page"`.
 * Items without an `href` are also non-linked (parent segments with no
 * index page, e.g. /solutions, /for, /compare).
 */
export function MarketingBreadcrumbs({
  items,
  className,
}: MarketingBreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "relative z-10 pt-24 md:pt-28 pb-0",
        className,
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] tracking-wide">
          {items.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === items.length - 1;

            return (
              <li key={index} className="flex items-center gap-x-1.5">
                {/* Separator — thin slash, not a chunky icon */}
                {!isFirst && (
                  <span
                    className="text-repwell-teal-300/40 select-none"
                    aria-hidden="true"
                  >
                    /
                  </span>
                )}

                {isLast ? (
                  <span
                    className="text-repwell-teal-500 font-medium truncate max-w-[220px] sm:max-w-none"
                    aria-current="page"
                    title={item.label}
                  >
                    {item.label}
                  </span>
                ) : item.href ? (
                  <Link
                    href={item.href}
                    className="text-repwell-teal-300 transition-colors duration-150 hover:text-repwell-teal-500 truncate max-w-[150px] sm:max-w-none"
                    title={item.label}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className="text-repwell-teal-300 truncate max-w-[150px] sm:max-w-none"
                    title={item.label}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
