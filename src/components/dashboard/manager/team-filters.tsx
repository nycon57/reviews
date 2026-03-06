"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  X,
} from "@phosphor-icons/react";
import type { FilterOptions } from "@/lib/dashboard";

interface TeamFiltersProps {
  options: FilterOptions;
  selectedBranch: string;
  onBranchChange: (branch: string) => void;
  onClearFilters: () => void;
}

export function TeamFilters({
  options,
  selectedBranch,
  onBranchChange,
  onClearFilters,
}: TeamFiltersProps) {
  const hasFilters = selectedBranch !== "all";

  return (
    <div className="flex flex-wrap items-center gap-3">
      {options.branches.length > 0 && (
        <Select value={selectedBranch} onValueChange={onBranchChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {options.branches.map((branch) => (
              <SelectItem key={branch} value={branch}>
                {branch}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-9 px-2 text-muted-foreground"
        >
          <X className="mr-1 h-3 w-3" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
