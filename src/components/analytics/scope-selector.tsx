"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type AnalyticsScope = "personal" | "team" | "organization";

interface ScopeSelectorProps {
  userRole: "admin" | "manager" | "user";
  value: AnalyticsScope;
  onValueChange: (scope: AnalyticsScope) => void;
}

export function ScopeSelector({
  userRole,
  value,
  onValueChange,
}: ScopeSelectorProps) {
  if (userRole === "user") {
    return null;
  }

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={value}
      onValueChange={(v) => {
        // Prevent deselection (empty string)
        if (v) onValueChange(v as AnalyticsScope);
      }}
    >
      <ToggleGroupItem
        value="personal"
        className="data-[state=on]:bg-repwell-teal-300 data-[state=on]:text-white"
      >
        My Performance
      </ToggleGroupItem>
      <ToggleGroupItem
        value="team"
        className="data-[state=on]:bg-repwell-teal-300 data-[state=on]:text-white"
      >
        My Team
      </ToggleGroupItem>
      {userRole === "admin" && (
        <ToggleGroupItem
          value="organization"
          className="data-[state=on]:bg-repwell-teal-300 data-[state=on]:text-white"
        >
          Organization
        </ToggleGroupItem>
      )}
    </ToggleGroup>
  );
}
