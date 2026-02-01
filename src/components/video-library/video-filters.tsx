"use client";

import {
  MagnifyingGlass as Search,
  ArrowsClockwise as RefreshCw,
  GridFour as LayoutGrid,
  List,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { useVideoLibrary } from "./video-library-context";

export function VideoFilters() {
  const { state, actions } = useVideoLibrary();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 max-w-md">
          <Label htmlFor="search-videos" className="sr-only">
            Search videos
          </Label>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search-videos"
            placeholder="Search by customer name..."
            value={state.searchQuery}
            onChange={(e) => actions.setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={state.approvalFilter}
          onValueChange={actions.setApprovalFilter}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
        {state.canManage && (
          <Select
            value={state.memberFilter}
            onValueChange={actions.setMemberFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Team Members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Team Members</SelectItem>
              {state.teamMembers.map((member) => (
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
          onClick={actions.fetchResponses}
          disabled={state.isLoading}
          aria-label="Refresh"
        >
          <RefreshCw className={cn("h-4 w-4", state.isLoading && "animate-spin")} />
        </Button>
      </div>
      <ToggleGroup
        type="single"
        value={state.viewMode}
        onValueChange={(value) => value && actions.setViewMode(value as "grid" | "list")}
      >
        <ToggleGroupItem value="grid" aria-label="Grid view" size="sm">
          <LayoutGrid className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="list" aria-label="List view" size="sm">
          <List className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
