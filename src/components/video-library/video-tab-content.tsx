"use client";

import {
  CaretLeft as ChevronLeft,
  CaretRight as ChevronRight,
  FilmStrip as Film,
  MagnifyingGlass as Search,

  ClockCounterClockwise,
  CheckCircle,
  ShareNetwork,
  Timer,
  WarningCircle as AlertCircle,
  DownloadSimple as Download,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useVideoLibrary } from "./video-library-context";
import { VideoBulkActionBar } from "./video-bulk-action-bar";
import { VideoCard } from "./video-card";
import { VideoDialogs } from "./video-dialogs";

// ============================================================================
// Stats Cards
// ============================================================================

function VideoStatsCards() {
  const { state } = useVideoLibrary();
  const { videoStats } = state;

  const avgDuration = videoStats.averageDuration > 0
    ? `${Math.round(videoStats.averageDuration)}s`
    : "0s";

  const statItems = [
    { label: "Total Videos", value: videoStats.total, icon: Film },
    { label: "Pending", value: videoStats.pending, icon: ClockCounterClockwise },
    { label: "Approved", value: videoStats.approved, icon: CheckCircle },
    { label: "Published", value: videoStats.published, icon: ShareNetwork },
    { label: "Avg Duration", value: avgDuration, icon: Timer },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {statItems.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-teal-300/10">
              <Icon className="h-5 w-5 text-repwell-teal-300" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight text-repwell-teal-500">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function VideoTabContent() {
  const { state, actions } = useVideoLibrary();

  return (
    <div className="space-y-6">
      <VideoStatsCards />

      <Card className="border border-border shadow-soft overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <Film className="h-5 w-5 text-repwell-teal-300" />
              </div>
              <CardTitle className="text-lg">Video Reviews ({state.total})</CardTitle>
            </div>
            {state.responses.length > 0 && state.canManage && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all-videos"
                  checked={state.allSelected}
                  onCheckedChange={() => {
                    if (state.allSelected) actions.handleClearSelection();
                    else actions.handleSelectAll();
                  }}
                />
                <Label htmlFor="select-all-videos" className="text-sm cursor-pointer">Select all</Label>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Label htmlFor="search-videos" className="sr-only">
              Search videos
            </Label>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search-videos"
              placeholder="Search videos by customer name..."
              value={state.searchQuery}
              onChange={(e) => actions.setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={state.approvalFilter}
              onValueChange={actions.setApprovalFilter}
            >
              <SelectTrigger className="h-9 w-[140px]">
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
                <SelectTrigger className="h-9 w-[180px]">
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

            {/* TODO: Implement video export functionality */}
            <div className="ml-auto">
              <Button variant="outline" size="sm" className="h-9" disabled title="Export coming soon">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>

          {/* Bulk Action Bar */}
          <VideoBulkActionBar />

          {/* Video Grid or List */}
          {state.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
            </div>
          ) : state.responses.length === 0 ? (
            <div className="relative flex flex-col items-center justify-center py-16 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-repwell-sage-100/40 via-repwell-sage-200/20 to-repwell-teal-300/10" />
              <div className="relative">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-repwell-sage-100 to-repwell-sage-200/50">
                  <AlertCircle className="h-7 w-7 text-repwell-teal-400" />
                </div>
                <p className="font-medium text-repwell-teal-500">No video reviews found</p>
                <p className="mt-1 text-sm text-repwell-teal-300">
                  Video reviews will appear here once customers submit them.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {state.responses.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {state.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/50 pt-4">
              <p className="text-xs text-muted-foreground">
                Showing {(state.page - 1) * state.pageSize + 1} to{" "}
                {Math.min(state.page * state.pageSize, state.total)} of {state.total} results
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => actions.setPage((p: number) => Math.max(1, p - 1))}
                  disabled={state.page === 1 || state.isLoading}
                >
                  <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                  Previous
                </Button>
                <span className="text-xs font-medium text-muted-foreground tabular-nums">
                  {state.page} / {state.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => actions.setPage((p: number) => Math.min(state.totalPages, p + 1))}
                  disabled={state.page === state.totalPages || state.isLoading}
                >
                  Next
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <VideoDialogs />
    </div>
  );
}
