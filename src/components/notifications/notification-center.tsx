"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  Check,
  Checks as CheckCheck,
  Gear as Settings,
  Archive,
} from "@phosphor-icons/react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { getNotificationTypeConfig } from "@/lib/notifications/config";
import type { NotificationWithDetails } from "@/lib/notifications/types";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationsAsRead,
} from "@/lib/notifications/actions";
import { useArchivableNotifications } from "./use-archivable-notifications";

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationWithDetails[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [marking, setMarking] = React.useState(false);

  // Fetch unread count on mount
  React.useEffect(() => {
    const fetchUnreadCount = async () => {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    };
    fetchUnreadCount();

    // Refresh unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when popover opens
  React.useEffect(() => {
    if (open) {
      const fetchNotifications = async () => {
        setLoading(true);
        const { notifications: data } = await getNotifications({ limit: 20 });
        setNotifications(data);
        setLoading(false);
      };
      fetchNotifications();
    }
  }, [open]);

  const handleMarkAllAsRead = async () => {
    setMarking(true);
    const result = await markNotificationsAsRead();
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    }
    setMarking(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markNotificationsAsRead([notificationId]);
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const { handleArchive } = useArchivableNotifications({
    notifications,
    setNotifications,
    setUnreadCount,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative h-9 w-9", className)}
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleMarkAllAsRead}
                disabled={marking}
              >
                <CheckCheck className="mr-1 h-3 w-3" />
                Mark all read
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
              <Link href="/dashboard/settings" aria-label="Notification settings">
                <Settings className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Notifications list */}
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="space-y-4 p-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 rounded-full bg-muted p-3">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                No notifications yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                We&apos;ll notify you when something happens
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <NotificationItem
                    notification={notification}
                    onMarkAsRead={() => handleMarkAsRead(notification.id)}
                    onArchive={() => handleArchive(notification.id)}
                    onClick={() => {
                      if (!notification.is_read) {
                        handleMarkAsRead(notification.id);
                      }
                      setOpen(false);
                    }}
                  />
                  {index < notifications.length - 1 && <Separator />}
                </React.Fragment>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t px-4 py-2">
          <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
            <Link href="/dashboard/notifications">View all notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface NotificationItemProps {
  notification: NotificationWithDetails;
  onMarkAsRead: () => void;
  onArchive: () => void;
  onClick: () => void;
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onArchive,
  onClick,
}: NotificationItemProps) {
  const { icon: Icon, colorClass } = getNotificationTypeConfig(notification.type);

  const content = (
    <div
      className={cn(
        "group relative flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
        !notification.is_read && "bg-primary/5"
      )}
    >
      {/* Icon */}
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", colorClass)}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm", !notification.is_read && "font-medium")}>
            {notification.title}
          </p>
          {!notification.is_read && (
            <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          {formatRelativeTime(notification.created_at)}
        </p>
      </div>

      {/* Actions (visible on hover) */}
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {!notification.is_read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMarkAsRead();
            }}
            title="Mark as read"
            aria-label={`Mark notification as read: ${notification.title}`}
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onArchive();
          }}
          title="Archive"
          aria-label={`Archive notification: ${notification.title}`}
        >
          <Archive className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );

  if (notification.action_url) {
    return (
      <Link href={notification.action_url} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return <div onClick={onClick}>{content}</div>;
}
