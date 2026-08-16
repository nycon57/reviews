"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  MagnifyingGlass as Search,
  PaperPlaneRight as Send,
  Plus,
  Images,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/lib/permissions/context";
import { PERMISSIONS } from "@/lib/permissions";
import { ICON_MAP, useFilteredNav, type FilteredNavItem } from "@/lib/nav";

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  href: string;
  icon: React.ElementType;
  category: string;
}

function navItemToResult(item: FilteredNavItem, category: string): SearchResult {
  return {
    id: `nav:${item.href}`,
    title: item.title,
    description: category === "Core" ? "Dashboard page" : `${category} page`,
    href: item.isProLocked ? "/dashboard/organization?tab=billing" : item.href,
    icon: ICON_MAP[item.icon] ?? Search,
    category: "Pages",
  };
}

function matchesQuery(result: SearchResult, query: string): boolean {
  const haystack = [result.title, result.description, result.category]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const needle = query.toLowerCase();

  if (haystack.includes(needle)) {
    return true;
  }

  let index = 0;
  for (const character of haystack) {
    if (character === needle[index]) {
      index += 1;
    }
    if (index === needle.length) {
      return true;
    }
  }

  return false;
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const { coreItems, sections, bottomItems } = useFilteredNav();
  const { hasPermission } = usePermissions();
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const quickLinks = React.useMemo<SearchResult[]>(() => {
    const navResults = [
      ...coreItems.map((item) => navItemToResult(item, "Core")),
      ...sections.flatMap((section) =>
        section.items.map((item) => navItemToResult(item, section.label))
      ),
      ...bottomItems.map((item) => navItemToResult(item, "Account")),
    ];

    const actions: SearchResult[] = [
      ...(hasPermission(PERMISSIONS.SEND_SURVEY)
        ? [
            {
              id: "action:send-review-request",
              title: "Send review request",
              description: "Open the review request workflow",
              href: "/dashboard/reviews?tab=requests",
              icon: Send,
              category: "Actions",
            },
          ]
        : []),
      ...(hasPermission(PERMISSIONS.VIEW_CAMPAIGNS)
        ? [
            {
              id: "action:new-campaign",
              title: "Create campaign",
              description: "Start a review request campaign",
              href: "/dashboard/campaigns",
              icon: Plus,
              category: "Actions",
            },
          ]
        : []),
      ...(hasPermission(PERMISSIONS.VIEW_SHARE_STUDIO)
        ? [
            {
              id: "action:create-social-graphic",
              title: "Create social graphic",
              description: "Design a new social proof graphic",
              href: "/dashboard/social-graphics/new",
              icon: Images,
              category: "Actions",
            },
          ]
        : []),
    ];

    return [...actions, ...navResults];
  }, [bottomItems, coreItems, hasPermission, sections]);

  const filteredResults = React.useMemo(() => {
    if (!query) return quickLinks;
    return quickLinks.filter((item) => matchesQuery(item, query));
  }, [query, quickLinks]);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    onOpenChange(false);
    router.push(result.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredResults.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredResults.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          handleSelect(filteredResults[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        onOpenChange(false);
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden border-border">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <div className="flex items-center border-b border-border px-3">
          <Search className="h-4 w-4 text-repwell-teal-400 dark:text-repwell-sage-100/80 shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, actions..."
            className="h-12 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-3"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredResults.length === 0 ? (
            <div className="py-6 text-center text-sm text-repwell-teal-400 dark:text-repwell-sage-100/80">
              No results found for "{query}"
            </div>
          ) : (
            <div className="space-y-1">
              {filteredResults.map((result, index) => {
                const Icon = result.icon;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
                      selectedIndex === index
                        ? "bg-surface-soft text-heading-accent"
                        : "text-repwell-teal-400 dark:text-repwell-sage-100/80 hover:bg-background hover:text-repwell-teal-500 dark:hover:text-repwell-sage-100"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{result.title}</div>
                      {result.description && (
                        <div className="text-xs text-repwell-teal-400 dark:text-repwell-sage-100/80 truncate">
                          {result.description}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-repwell-teal-400/60 dark:text-repwell-sage-100/50">
                      {result.category}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-repwell-teal-400 dark:text-repwell-sage-100/80">
          <div className="flex items-center gap-2">
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5">
              ↑↓
            </kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5">
              ↵
            </kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5">
              Esc
            </kbd>
            <span>Close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
