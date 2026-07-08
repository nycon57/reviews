"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  Check,
  Checks as CheckCheck,
  Archive,
  CaretLeft as ChevronLeft,
  CaretRight as ChevronRight,
  Gear as Settings,
  Tray as Inbox,
  Funnel as Filter,
} from "@phosphor-icons/react";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { NOTIFICATION_TYPE_CONFIG, getNotificationTypeConfig } from "@/lib/notifications/config";
import type { NotificationWithDetails, NotificationType } from "@/lib/notifications/types";
import {
  getNotifications,
  markNotificationsAsRead,
  archiveNotification,
  unarchiveNotification,
} from "@/lib/notifications/actions";
import { formatDistanceToNow, format } from "date-fns";

interface NotificationsListProps {
  initialNotifications: NotificationWithDetails[];
  initialTotal: number;
  initialUnreadCount: number;
}

type FilterType = "all" | "unread" | NotificationType;

const PAGE_SIZE = 20;
const TYPE_FILTERS: NotificationType[] = [
  "new_review",
  "negative_review",
  "review_approved",
  "response_posted",
  "badge_earned",
  "mention",
  "report_ready",
  "system",
];

export function NotificationsList({
  initialNotifications,
  initialTotal,
  initialUnreadCount,
}: NotificationsListProps) {
  const { toast } = useToast();
  const [notifications, setNotifications] = React.useState<NotificationWithDetails[]>(initialNotifications);
  const [defaultNotifications, setDefaultNotifications] =
    React.useState<NotificationWithDetails[]>(initialNotifications);
  const [total, setTotal] = React.useState(initialTotal);
  const [defaultTotal, setDefaultTotal] = React.useState(initialTotal);
  const [unreadCount, setUnreadCount] = React.useState(initialUnreadCount);
  const [loading, setLoading] = React.useState(false);
  const [filter, setFilter] = React.useState<FilterType>("all");
  const [page, setPage] = React.useState(1);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [bulkActioning, setBulkActioning] = React.useState(false);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Fetch notifications when filter or page changes
  const fetchNotifications = React.useCallback(async () => {
    setLoading(true);
    const offset = (page - 1) * PAGE_SIZE;
    const result = await getNotifications({
      limit: PAGE_SIZE,
      offset,
      unreadOnly: filter === "unread",
      type: filter !== "all" && filter !== "unread" ? filter : undefined,
    });
    setNotifications(result.notifications);
    setTotal(result.total);
    setLoading(false);
    setSelectedIds(new Set());
  }, [filter, page]);

  // The server now filters by type and unread state, so render the fetched list
  // directly (client-side filtering produced wrong counts and pagination).
  const displayedNotifications = notifications;

  // Restore the server-rendered first page when returning to the default view —
  // done during render (prev-comparison) so stale filtered rows never paint.
  const isDefaultView = filter === "all" && page === 1;
  const [prevIsDefaultView, setPrevIsDefaultView] = React.useState(true);
  if (isDefaultView !== prevIsDefaultView) {
    setPrevIsDefaultView(isDefaultView);
    if (isDefaultView) {
      setNotifications(defaultNotifications);
      setTotal(defaultTotal);
      setSelectedIds(new Set());
    }
  }

  React.useEffect(() => {
    if (!isDefaultView) {
      fetchNotifications();
    }
  }, [isDefaultView, fetchNotifications]);

  const handleMarkAllAsRead = async () => {
    setBulkActioning(true);
    const result = await markNotificationsAsRead();
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setDefaultNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    }
    setBulkActioning(false);
  };

  const handleMarkSelectedAsRead = async () => {
    if (selectedIds.size === 0) return;
    setBulkActioning(true);
    const ids = Array.from(selectedIds);
    const result = await markNotificationsAsRead(ids);
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) =>
          selectedIds.has(n.id) ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      setDefaultNotifications((prev) =>
        prev.map((n) =>
          selectedIds.has(n.id) ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => {
        const unreadMarked = notifications.filter((n) => selectedIds.has(n.id) && !n.is_read).length;
        return Math.max(0, prev - unreadMarked);
      });
      setSelectedIds(new Set());
    }
    setBulkActioning(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markNotificationsAsRead([notificationId]);
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      setDefaultNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const restoreArchivedNotification = React.useCallback(
    async (
      notification: NotificationWithDetails,
      archiveIndex: number,
      defaultArchiveIndex: number
    ) => {
      const result = await unarchiveNotification(notification.id);
      if (!result.success) {
        toast({
          title: "Could not restore notification",
          description: result.error || "Please try again.",
          variant: "destructive",
        });
        return;
      }

      setNotifications((prev) => {
        if (prev.some((item) => item.id === notification.id)) return prev;
        const next = [...prev];
        next.splice(Math.min(archiveIndex, next.length), 0, {
          ...notification,
          is_archived: false,
          archived_at: null,
        });
        return next;
      });
      if (defaultArchiveIndex >= 0) {
        setDefaultNotifications((prev) => {
          if (prev.some((item) => item.id === notification.id)) return prev;
          const next = [...prev];
          next.splice(Math.min(defaultArchiveIndex, next.length), 0, {
            ...notification,
            is_archived: false,
            archived_at: null,
          });
          return next;
        });
      }
      setTotal((prev) => prev + 1);
      setDefaultTotal((prev) => prev + 1);
      if (!notification.is_read) {
        setUnreadCount((prev) => prev + 1);
      }
    },
    [toast]
  );

  const handleArchive = async (notificationId: string) => {
    const notification = notifications.find((n) => n.id === notificationId);
    const archiveIndex = notifications.findIndex((n) => n.id === notificationId);
    const defaultArchiveIndex = defaultNotifications.findIndex((n) => n.id === notificationId);
    const result = await archiveNotification(notificationId);
    if (!result.success) {
      toast({
        title: "Could not archive notification",
        description: result.error || "Please try again.",
        variant: "destructive",
      });
      return;
    }

    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    setDefaultNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(notificationId);
      return next;
    });
    setTotal((prev) => Math.max(0, prev - 1));
    setDefaultTotal((prev) => Math.max(0, prev - 1));
    if (notification && !notification.is_read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    if (notification) {
      toast({
        title: "Notification archived",
        description: "You can undo this action.",
        action: (
          <ToastAction
            altText="Undo archive"
            onClick={() =>
              void restoreArchivedNotification(notification, archiveIndex, defaultArchiveIndex)
            }
          >
            Undo
          </ToastAction>
        ),
      });
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === displayedNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedNotifications.map((n) => n.id)));
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settings</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/settings">Manage Preferences</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={filter}
                onValueChange={(value) => {
                  setFilter(value as FilterType);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter notifications" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Notifications</SelectItem>
                  <SelectItem value="unread">Unread Only</SelectItem>
                  {TYPE_FILTERS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {NOTIFICATION_TYPE_CONFIG[type].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkSelectedAsRead}
                  disabled={bulkActioning}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Mark Selected as Read ({selectedIds.size})
                </Button>
              )}
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={bulkActioning}
                >
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Mark All as Read
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-muted-foreground">
                No notifications found
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {filter === "unread"
                  ? "You're all caught up!"
                  : "We'll notify you when something happens"}
              </p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="flex items-center gap-2 border-b pb-3 mb-2">
                <Checkbox
                  id="select-all"
                  checked={selectedIds.size === displayedNotifications.length && displayedNotifications.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">
                  Select all
                </label>
              </div>

              {/* Notifications List */}
              <div className="divide-y">
                {displayedNotifications.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    selected={selectedIds.has(notification.id)}
                    onToggleSelect={() => toggleSelection(notification.id)}
                    onMarkAsRead={() => handleMarkAsRead(notification.id)}
                    onArchive={() => handleArchive(notification.id)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
                    {Math.min(page * PAGE_SIZE, total)} of {total} notifications
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || loading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface NotificationRowProps {
  notification: NotificationWithDetails;
  selected: boolean;
  onToggleSelect: () => void;
  onMarkAsRead: () => void;
  onArchive: () => void;
}

function NotificationRow({
  notification,
  selected,
  onToggleSelect,
  onMarkAsRead,
  onArchive,
}: NotificationRowProps) {
  const { icon: Icon, colorClass, label: typeLabel } = getNotificationTypeConfig(notification.type);

  const content = (
    <div
      className={cn(
        "group flex items-start gap-4 p-4 transition-colors hover:bg-muted/50",
        !notification.is_read && "bg-primary/5"
      )}
    >
      {/* Checkbox */}
      <div className="pt-1">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelect()}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Icon */}
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", colorClass)}>
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className={cn("text-sm", !notification.is_read && "font-semibold")}>
                {notification.title}
              </p>
              {!notification.is_read && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {notification.message}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <Badge variant="secondary" className="text-xs">
                {typeLabel}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(notification.created_at), "MMM d, yyyy h:mm a")}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {!notification.is_read && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onMarkAsRead();
                }}
                title="Mark as read"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onArchive();
              }}
              title="Archive"
            >
              <Archive className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (notification.action_url) {
    return (
      <Link href={notification.action_url} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
