"use client";

import { useState, useTransition } from "react";
import {
  UserComparisonTable,
  TeamFilters,
} from "@/components/dashboard";
import {
  getUserComparison,
  type UserComparison,
  type FilterOptions,
} from "@/lib/dashboard";
import { TableSkeleton } from "@/components/shared";

interface ManagerDashboardClientProps {
  initialComparison: UserComparison[];
  filterOptions: FilterOptions;
}

export function ManagerDashboardClient({
  initialComparison,
  filterOptions,
}: ManagerDashboardClientProps) {
  const [comparison, setComparison] = useState(initialComparison);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [isPending, startTransition] = useTransition();

  const handleBranchChange = (branch: string) => {
    setSelectedBranch(branch);
    fetchFilteredData(branch, selectedRegion);
  };

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    fetchFilteredData(selectedBranch, region);
  };

  const handleClearFilters = () => {
    setSelectedBranch("all");
    setSelectedRegion("all");
    fetchFilteredData("all", "all");
  };

  const fetchFilteredData = (branch: string, region: string) => {
    startTransition(async () => {
      const result = await getUserComparison(
        branch !== "all" ? branch : undefined,
        region !== "all" ? region : undefined
      );
      if (result.success && result.data) {
        setComparison(result.data);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Team Performance</h2>
        <TeamFilters
          options={filterOptions}
          selectedBranch={selectedBranch}
          selectedRegion={selectedRegion}
          onBranchChange={handleBranchChange}
          onRegionChange={handleRegionChange}
          onClearFilters={handleClearFilters}
        />
      </div>

      {isPending ? (
        <TableSkeleton rows={5} />
      ) : (
        <UserComparisonTable data={comparison} />
      )}
    </div>
  );
}
