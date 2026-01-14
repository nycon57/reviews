import { NotificationsList } from "@/components/notifications/notifications-list";
import { getNotifications, getUnreadNotificationCount } from "@/lib/notifications/actions";

export const metadata = {
  title: "Notifications | ReviewHub",
  description: "View and manage your notifications",
};

export default async function NotificationsPage() {
  // Fetch initial data server-side
  const [notificationsResult, unreadCount] = await Promise.all([
    getNotifications({ limit: 20, offset: 0 }),
    getUnreadNotificationCount(),
  ]);

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            View and manage all your notifications
          </p>
        </div>
      </div>

      {/* Notifications List Component */}
      <NotificationsList
        initialNotifications={notificationsResult.notifications}
        initialTotal={notificationsResult.total}
        initialUnreadCount={unreadCount}
      />
    </div>
  );
}
