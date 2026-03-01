import { useMemo } from "react";
import { usePermissions } from "@/lib/permissions/context";
import { NAV_CONFIG, type NavItemConfig, type NavSectionConfig } from "./config";

export interface FilteredNavItem extends NavItemConfig {
  /** True when item requires Pro but user can't access Pro features */
  isProLocked: boolean;
}

export interface FilteredNavSection {
  label: string;
  items: FilteredNavItem[];
}

export interface FilteredNav {
  coreItems: FilteredNavItem[];
  sections: FilteredNavSection[];
  bottomItems: FilteredNavItem[];
}

/**
 * Returns the navigation structure filtered by the current user's permissions.
 * Shared between sidebar and mobile nav so both render identical items.
 */
export function useFilteredNav(): FilteredNav {
  const { hasPermission, canAccessProFeature, userContext } = usePermissions();
  const proAccess = canAccessProFeature();

  return useMemo(() => {
    const isEnterpriseUser =
      userContext?.accountType === "enterprise" && userContext.role === "user";

    const filterItems = (items: NavItemConfig[]): FilteredNavItem[] =>
      items
        .filter((item) => !item.permission || hasPermission(item.permission))
        .map((item) => ({
          ...item,
          isProLocked: !!item.requiresPro && !proAccess,
        }));

    const filterSections = (sections: NavSectionConfig[]): FilteredNavSection[] =>
      sections
        .filter((section) => !(section.hideForEnterpriseUser && isEnterpriseUser))
        .map((section) => ({
          label: section.label,
          items: filterItems(section.items),
        }))
        .filter((section) => section.items.length > 0);

    return {
      coreItems: filterItems(NAV_CONFIG.coreItems),
      sections: filterSections(NAV_CONFIG.sections),
      bottomItems: filterItems(NAV_CONFIG.bottomItems),
    };
  }, [hasPermission, proAccess, userContext]);
}
