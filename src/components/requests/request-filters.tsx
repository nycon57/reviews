"use client";

import {
  MagnifyingGlass as Search,
  ArrowsClockwise as RefreshCw,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
}

interface RequestFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  memberFilter: string;
  onMemberFilterChange: (value: string) => void;
  canManage: boolean;
  teamMembers: TeamMember[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function RequestFilters({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  statusFilter,
  onStatusFilterChange,
  memberFilter,
  onMemberFilterChange,
  canManage,
  teamMembers,
  isLoading,
  onRefresh,
}: RequestFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSearchSubmit();
            }
          }}
          className="pl-9"
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="sent">Sent</SelectItem>
          <SelectItem value="opened">Opened</SelectItem>
          <SelectItem value="submitted">Completed</SelectItem>
          <SelectItem value="expired">Expired</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
      {canManage && (
        <Select value={memberFilter} onValueChange={onMemberFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Team Members" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Team Members</SelectItem>
            {teamMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={isLoading}
      >
        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
      </Button>
    </div>
  );
}
