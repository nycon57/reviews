import Link from "next/link";
import { cn } from "@/lib/utils";
import type { MarketingBreadcrumbItem } from "@/lib/seo/marketing-breadcrumbs";

/**
 * Inline SVG icons — avoids shipping @phosphor-icons/react client-side.
 * Visually matches the Phosphor House and CaretRight icons used elsewhere.
 */
function HouseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M219.31,108.68l-80-80a16,16,0,0,0-22.62,0l-80,80A15.87,15.87,0,0,0,32,120v96a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V120A15.87,15.87,0,0,0,219.31,108.68ZM208,208H48V120l80-80,80,80Z" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z" />
    </svg>
  );
}

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------

interface MarketingBreadcrumbsProps {
  items: MarketingBreadcrumbItem[];
  className?: string;
}

/**
 * Server-rendered breadcrumbs for marketing template pages.
 *
 * Matches the visual style of DirectoryBreadcrumbs (Phosphor-style icons,
 * truncation on mobile, accessible nav/ol structure).
 *
 * The last item is always rendered as non-linked text with `aria-current="page"`.
 * Items without an `href` are also rendered as non-linked text (for parent
 * segments that have no index page, e.g. /solutions, /for, /compare).
 */
export function MarketingBreadcrumbs({
  items,
  className,
}: MarketingBreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center", className)}
    >
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1">
              {/* Separator (skip before first item) */}
              {!isFirst && (
                <ChevronRightIcon className="h-4 w-4 text-muted-foreground/50" />
              )}

              {/* Home item — icon only on mobile, icon + label on sm+ */}
              {isFirst && item.href ? (
                <Link
                  href={item.href}
                  className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <HouseIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              ) : isLast ? (
                /* Current page — never linked */
                <span
                  className="font-medium text-foreground truncate max-w-[200px] sm:max-w-none"
                  aria-current="page"
                  title={item.label}
                >
                  {item.label}
                </span>
              ) : item.href ? (
                /* Linked parent */
                <Link
                  href={item.href}
                  className="text-muted-foreground transition-colors hover:text-foreground truncate max-w-[150px] sm:max-w-none"
                  title={item.label}
                >
                  {item.label}
                </Link>
              ) : (
                /* Non-linked parent (no index page) */
                <span
                  className="text-muted-foreground truncate max-w-[150px] sm:max-w-none"
                  title={item.label}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
