"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MagnifyingGlass as Search,
  Funnel as Filter,
} from "@phosphor-icons/react";
import type { ConversationListItem } from "@/lib/sms/messages/actions";

interface ConversationListProps {
  conversations: ConversationListItem[];
  selectedId: string | null;
  isLoading: boolean;
  statusFilter: string;
  searchQuery: string;
  onSelect: (id: string) => void;
  onStatusFilterChange: (status: string) => void;
  onSearchChange: (query: string) => void;
}

const statusTabs = [
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
];

export function ConversationList({
  conversations,
  selectedId,
  isLoading,
  statusFilter,
  searchQuery,
  onSelect,
  onStatusFilterChange,
  onSearchChange,
}: ConversationListProps) {
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <>
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-repwell-teal-500">Messages</h1>
        </div>

        {/* Search */}
        <div className="px-3 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-repwell-teal-300/60" />
            <Input
              ref={searchInputRef}
              placeholder="Search by phone number..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9 bg-background-subtle border-border text-sm placeholder:text-repwell-teal-300/50"
            />
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="flex px-3 pb-2 gap-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onStatusFilterChange(tab.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150",
                statusFilter === tab.value
                  ? "bg-repwell-sage-100 text-repwell-teal-300"
                  : "text-repwell-teal-400/70 hover:bg-repwell-sage-100/50 hover:text-repwell-teal-400"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-3 space-y-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <ConversationSkeleton key={i} />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Filter className="h-10 w-10 text-repwell-teal-300/30 mb-3" />
            <p className="text-sm font-medium text-repwell-teal-400">
              {searchQuery ? "No matching conversations" : "No conversations yet"}
            </p>
            <p className="text-xs text-repwell-teal-300/60 mt-1">
              {searchQuery
                ? "Try a different search term"
                : "Conversations appear when borrowers reply to SMS messages"}
            </p>
          </div>
        ) : (
          <div className="p-1.5">
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isSelected={conv.id === selectedId}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </>
  );
}

// ── Conversation Item ───────────────────────────────────────────────

interface ConversationItemProps {
  conversation: ConversationListItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const ConversationItem = React.memo(function ConversationItem({
  conversation,
  isSelected,
  onSelect,
}: ConversationItemProps) {
  const initials = conversation.borrowerName
    ? conversation.borrowerName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : conversation.borrowerPhoneDisplay.replace(/[^0-9]/g, "").slice(-2);

  return (
    <button
      onClick={() => onSelect(conversation.id)}
      className={cn(
        "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300/30",
        isSelected
          ? "bg-repwell-sage-100 shadow-sm"
          : "hover:bg-repwell-sage-100/40"
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-10 w-10">
          {conversation.assignedLoAvatar && (
            <AvatarImage src={conversation.assignedLoAvatar} />
          )}
          <AvatarFallback className="bg-repwell-teal-300/10 text-repwell-teal-300 text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        {/* Unread indicator dot */}
        {conversation.unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-repwell-teal-300 text-[9px] font-bold text-white">
            {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-sm truncate",
              conversation.unreadCount > 0
                ? "font-semibold text-repwell-teal-500"
                : "font-medium text-repwell-teal-400"
            )}
          >
            {conversation.borrowerName ?? conversation.borrowerPhoneDisplay}
          </span>
          {conversation.lastMessageAt && (
            <span className="text-[11px] text-repwell-teal-300/60 flex-shrink-0">
              {formatRelativeTime(conversation.lastMessageAt)}
            </span>
          )}
        </div>

        {conversation.lastMessagePreview && (
          <p
            className={cn(
              "text-xs mt-0.5 truncate",
              conversation.unreadCount > 0
                ? "text-repwell-teal-400"
                : "text-repwell-teal-300/60"
            )}
          >
            {conversation.lastMessageDirection === "outbound" && (
              <span className="text-repwell-teal-300/50">You: </span>
            )}
            {conversation.lastMessagePreview}
          </p>
        )}

        {/* Assigned LO name (if different from current context) */}
        {conversation.assignedLoName && (
          <p className="text-[10px] text-repwell-teal-300/50 mt-1">
            Assigned to {conversation.assignedLoName}
          </p>
        )}
      </div>
    </button>
  );
});

// ── Skeleton ────────────────────────────────────────────────────────

function ConversationSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 7) return `${diffDay}d`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
