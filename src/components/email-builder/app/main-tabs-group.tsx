"use client";

import {
  PencilSimple,
  Eye,
  Code,
  BracketsCurly,
} from "@phosphor-icons/react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type EditorTab = "editor" | "preview" | "html" | "json";

interface MainTabsGroupProps {
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
}

const TAB_CONFIG: { value: EditorTab; label: string; icon: typeof PencilSimple }[] = [
  { value: "editor", label: "Editor", icon: PencilSimple },
  { value: "preview", label: "Preview", icon: Eye },
  { value: "html", label: "HTML", icon: Code },
];

export function MainTabsGroup({ activeTab, onTabChange }: MainTabsGroupProps) {
  return (
    <div className="inline-flex h-9 items-center rounded-lg bg-muted p-1">
      {TAB_CONFIG.map(({ value, label, icon: Icon }) => (
        <Tooltip key={value}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onTabChange(value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                activeTab === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
