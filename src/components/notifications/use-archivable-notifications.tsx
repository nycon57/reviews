"use client";

import * as React from "react";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import type { NotificationWithDetails } from "@/lib/notifications/types";
import {
  archiveNotification,
  unarchiveNotification,
} from "@/lib/notifications/actions";

type NotificationSetter = React.Dispatch<
  React.SetStateAction<NotificationWithDetails[]>
>;
type CountSetter = React.Dispatch<React.SetStateAction<number>>;

interface UseArchivableNotificationsOptions {
  notifications: NotificationWithDetails[];
  setNotifications: NotificationSetter;
  setUnreadCount: CountSetter;
  defaultNotifications?: NotificationWithDetails[];
  setDefaultNotifications?: NotificationSetter;
  setSelectedIds?: React.Dispatch<React.SetStateAction<Set<string>>>;
  setTotal?: CountSetter;
  setDefaultTotal?: CountSetter;
}

function restoreIntoList(
  notification: NotificationWithDetails,
  archiveIndex: number
) {
  return (prev: NotificationWithDetails[]) => {
    if (prev.some((item) => item.id === notification.id)) return prev;
    const next = [...prev];
    next.splice(Math.min(archiveIndex, next.length), 0, {
      ...notification,
      is_archived: false,
      archived_at: null,
    });
    return next;
  };
}

export function useArchivableNotifications({
  notifications,
  setNotifications,
  setUnreadCount,
  defaultNotifications,
  setDefaultNotifications,
  setSelectedIds,
  setTotal,
  setDefaultTotal,
}: UseArchivableNotificationsOptions) {
  const { toast } = useToast();

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

      setNotifications(restoreIntoList(notification, archiveIndex));
      if (setDefaultNotifications && defaultArchiveIndex >= 0) {
        setDefaultNotifications(restoreIntoList(notification, defaultArchiveIndex));
      }
      setTotal?.((prev) => prev + 1);
      setDefaultTotal?.((prev) => prev + 1);
      if (!notification.is_read) {
        setUnreadCount((prev) => prev + 1);
      }
    },
    [
      setDefaultNotifications,
      setDefaultTotal,
      setNotifications,
      setTotal,
      setUnreadCount,
      toast,
    ]
  );

  const handleArchive = React.useCallback(
    async (notificationId: string) => {
      const notification = notifications.find((n) => n.id === notificationId);
      const archiveIndex = notifications.findIndex((n) => n.id === notificationId);
      const defaultArchiveIndex =
        defaultNotifications?.findIndex((n) => n.id === notificationId) ?? -1;
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
      setDefaultNotifications?.((prev) =>
        prev.filter((n) => n.id !== notificationId)
      );
      setSelectedIds?.((prev) => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
      setTotal?.((prev) => Math.max(0, prev - 1));
      setDefaultTotal?.((prev) => Math.max(0, prev - 1));
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
                void restoreArchivedNotification(
                  notification,
                  archiveIndex,
                  defaultArchiveIndex
                )
              }
            >
              Undo
            </ToastAction>
          ),
        });
      }
    },
    [
      defaultNotifications,
      notifications,
      restoreArchivedNotification,
      setDefaultNotifications,
      setDefaultTotal,
      setNotifications,
      setSelectedIds,
      setTotal,
      setUnreadCount,
      toast,
    ]
  );

  return { handleArchive };
}
