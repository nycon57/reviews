"use client";

import * as React from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { ReportFilters } from "@/lib/reporting/types";

interface LoanOfficerOption {
  id: string;
  name: string;
  branch?: string;
}

interface ReportFiltersProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  loanOfficers?: Array<{ id: string; full_name: string; branch: string | null }>;
  branches?: string[];
  className?: string;
}

const performanceStatuses = [
  { value: "excellent" as const, label: "Excellent" },
  { value: "good" as const, label: "Good" },
  { value: "needs_attention" as const, label: "Needs Attention" },
  { value: "at_risk" as const, label: "At Risk" },
];

export function ReportFiltersPanel({
  filters,
  onFiltersChange,
  loanOfficers = [],
  branches = [],
  className,
}: ReportFiltersProps) {
  const [open, setOpen] = React.useState(false);

  // Map loan officers to consistent format
  const mappedLoanOfficers: LoanOfficerOption[] = loanOfficers.map((lo) => ({
    id: lo.id,
    name: lo.full_name,
    branch: lo.branch || undefined,
  }));

  const activeFilterCount = [
    filters.loanOfficerIds?.length ? 1 : 0,
    filters.branches?.length ? 1 : 0,
    filters.performanceStatus?.length ? 1 : 0,
    filters.minRating ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const handleLoanOfficerToggle = (loId: string, checked: boolean) => {
    const currentIds = filters.loanOfficerIds || [];
    if (checked) {
      onFiltersChange({ ...filters, loanOfficerIds: [...currentIds, loId] });
    } else {
      onFiltersChange({
        ...filters,
        loanOfficerIds: currentIds.filter((id) => id !== loId),
      });
    }
  };

  const handleBranchToggle = (branch: string, checked: boolean) => {
    const currentBranches = filters.branches || [];
    if (checked) {
      onFiltersChange({ ...filters, branches: [...currentBranches, branch] });
    } else {
      onFiltersChange({
        ...filters,
        branches: currentBranches.filter((b) => b !== branch),
      });
    }
  };

  const handlePerformanceToggle = (
    status: "excellent" | "good" | "needs_attention" | "at_risk",
    checked: boolean
  ) => {
    const currentStatuses = filters.performanceStatus || [];
    if (checked) {
      onFiltersChange({ ...filters, performanceStatus: [...currentStatuses, status] });
    } else {
      onFiltersChange({
        ...filters,
        performanceStatus: currentStatuses.filter((s) => s !== status),
      });
    }
  };

  const clearFilters = () => {
    onFiltersChange({});
    setOpen(false);
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filter Report</h4>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-auto p-1 text-xs"
                >
                  Clear all
                </Button>
              )}
            </div>

            {mappedLoanOfficers.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Loan Officers</Label>
                <div className="max-h-32 space-y-2 overflow-y-auto">
                  {mappedLoanOfficers.map((lo) => (
                    <div key={lo.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`lo-${lo.id}`}
                        checked={filters.loanOfficerIds?.includes(lo.id) || false}
                        onCheckedChange={(checked) =>
                          handleLoanOfficerToggle(lo.id, !!checked)
                        }
                      />
                      <label
                        htmlFor={`lo-${lo.id}`}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        {lo.name}
                        {lo.branch && (
                          <span className="ml-1 text-muted-foreground">
                            ({lo.branch})
                          </span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {branches.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Branches</Label>
                <div className="flex flex-wrap gap-2">
                  {branches.map((branch) => (
                    <div key={branch} className="flex items-center gap-1">
                      <Checkbox
                        id={`branch-${branch}`}
                        checked={filters.branches?.includes(branch) || false}
                        onCheckedChange={(checked) =>
                          handleBranchToggle(branch, !!checked)
                        }
                      />
                      <label
                        htmlFor={`branch-${branch}`}
                        className="cursor-pointer text-sm"
                      >
                        {branch}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium">Performance Status</Label>
              <div className="flex flex-wrap gap-2">
                {performanceStatuses.map((status) => (
                  <div key={status.value} className="flex items-center gap-1">
                    <Checkbox
                      id={`status-${status.value}`}
                      checked={
                        filters.performanceStatus?.includes(status.value) || false
                      }
                      onCheckedChange={(checked) =>
                        handlePerformanceToggle(status.value, !!checked)
                      }
                    />
                    <label
                      htmlFor={`status-${status.value}`}
                      className="cursor-pointer text-sm"
                    >
                      {status.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Minimum Rating</Label>
              <Select
                value={filters.minRating?.toString() || "none"}
                onValueChange={(v) =>
                  onFiltersChange({
                    ...filters,
                    minRating: v === "none" ? undefined : parseFloat(v),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Any rating</SelectItem>
                  <SelectItem value="4">4+ stars</SelectItem>
                  <SelectItem value="4.5">4.5+ stars</SelectItem>
                  <SelectItem value="5">5 stars only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active filter badges */}
      {activeFilterCount > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {filters.loanOfficerIds?.map((loId) => {
            const lo = mappedLoanOfficers.find((l) => l.id === loId);
            return (
              <Badge
                key={loId}
                variant="secondary"
                className="cursor-pointer gap-1"
                onClick={() => handleLoanOfficerToggle(loId, false)}
              >
                {lo?.name || loId}
                <X className="h-3 w-3" />
              </Badge>
            );
          })}
          {filters.branches?.map((branch) => (
            <Badge
              key={branch}
              variant="secondary"
              className="cursor-pointer gap-1"
              onClick={() => handleBranchToggle(branch, false)}
            >
              {branch}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          {filters.performanceStatus?.map((status) => (
            <Badge
              key={status}
              variant="secondary"
              className="cursor-pointer gap-1"
              onClick={() => handlePerformanceToggle(status, false)}
            >
              {status.replace("_", " ")}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          {filters.minRating && (
            <Badge
              variant="secondary"
              className="cursor-pointer gap-1"
              onClick={() => onFiltersChange({ ...filters, minRating: undefined })}
            >
              {filters.minRating}+ stars
              <X className="h-3 w-3" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
