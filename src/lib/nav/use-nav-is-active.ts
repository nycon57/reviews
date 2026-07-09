"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { isNavHrefActive } from "./active";
import type { FilteredNavItem, FilteredNavSection } from "./use-filtered-nav";

interface UseNavIsActiveInput {
  coreItems: FilteredNavItem[];
  sections: FilteredNavSection[];
  bottomItems: FilteredNavItem[];
}

export function useNavIsActive({
  coreItems,
  sections,
  bottomItems,
}: UseNavIsActiveInput): (href: string) => boolean {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const allHrefs = useMemo(
    () => [
      ...coreItems.map((item) => item.href),
      ...sections.flatMap((section) => section.items.map((item) => item.href)),
      ...bottomItems.map((item) => item.href),
    ],
    [coreItems, sections, bottomItems]
  );

  return useCallback(
    (href: string) => isNavHrefActive(href, pathname, searchParams, allHrefs),
    [pathname, searchParams, allHrefs]
  );
}
