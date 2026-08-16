// Types
export type {
  NotificationType,
  DigestFrequency,
  Notification,
  NotificationPreferences,
  CreateNotificationParams,
  NotificationWithDetails,
  SlackMessage,
  SlackBlock,
  SlackAttachment,
  DigestEmailData,
  SlackWebhookLog,
} from "./types";

export { DEFAULT_NOTIFICATION_PREFERENCES } from "./types";

// Actions
export {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationsAsRead,
  archiveNotification,
  unarchiveNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  testSlackWebhook,
} from "./actions";

export {
  createNotification,
  sendSlackNotification,
  getPendingDigestNotifications,
  markDigestSent,
  getUsersNeedingDigest,
} from "./system-actions";

export { NOTIFICATION_TYPE_CONFIG, getNotificationTypeConfig } from "./config";
