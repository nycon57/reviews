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
  FileText,
  Star,
  Gear as Settings,
  ChartBar as BarChart3,
  PaperPlaneRight as Send,
  SquaresFour as LayoutDashboard,
  TrendUp as TrendingUp,
  Bell,
  Users,
  Question as HelpCircle,
  Code,
  Sparkle,
  ClipboardText,
  Buildings,
  Trophy,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  href: string;
  icon: React.ElementType;
  category: string;
}

const quickLinks: SearchResult[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Overview and key metrics",
    href: "/dashboard",
    icon: LayoutDashboard,
    category: "Pages",
  },
  {
    id: "reviews",
    title: "Reviews",
    description: "View and manage all reviews",
    href: "/dashboard/reviews",
    icon: Star,
    category: "Pages",
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "View performance metrics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    category: "Pages",
  },
  {
    id: "trends",
    title: "Trends",
    description: "Analytics trends over time",
    href: "/dashboard/analytics/trends",
    icon: TrendingUp,
    category: "Pages",
  },
  {
    id: "surveys",
    title: "Surveys",
    description: "Create and manage surveys",
    href: "/dashboard/surveys",
    icon: FileText,
    category: "Pages",
  },
  {
    id: "campaigns",
    title: "Campaigns",
    description: "Review request campaigns",
    href: "/dashboard/campaigns",
    icon: Send,
    category: "Pages",
  },
  {
    id: "team",
    title: "Team",
    description: "Manage team members",
    href: "/dashboard/team",
    icon: Users,
    category: "Pages",
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "View all notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    category: "Pages",
  },
  {
    id: "settings",
    title: "Settings",
    description: "Account and app settings",
    href: "/dashboard/settings",
    icon: Settings,
    category: "Pages",
  },
  {
    id: "help",
    title: "Help",
    description: "Documentation and support",
    href: "/dashboard/help",
    icon: HelpCircle,
    category: "Pages",
  },
  {
    id: "widgets",
    title: "Widgets",
    description: "Embeddable review widgets",
    href: "/dashboard/widgets",
    icon: Code,
    category: "Pages",
  },
  {
    id: "insights",
    title: "AI Insights",
    description: "AI-powered analysis of your reviews",
    href: "/dashboard/insights",
    icon: Sparkle,
    category: "Pages",
  },
  {
    id: "approvals",
    title: "Approvals",
    description: "Review and approve Share Studio edits",
    href: "/dashboard/approvals",
    icon: ClipboardText,
    category: "Pages",
  },
  {
    id: "organization",
    title: "Organization",
    description: "Organization settings and branding",
    href: "/dashboard/organization",
    icon: Buildings,
    category: "Pages",
  },
  {
    id: "leaderboard",
    title: "Leaderboard",
    description: "Team performance rankings",
    href: "/dashboard/analytics/leaderboard",
    icon: Trophy,
    category: "Pages",
  },
];

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredResults = React.useMemo(() => {
    if (!query) return quickLinks;
    const lowerQuery = query.toLowerCase();
    return quickLinks.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery)
    );
  }, [query]);

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
