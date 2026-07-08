import {
  Bell,
  Check,
  Star,
  Warning as AlertTriangle,
  Chats as MessageSquare,
  EnvelopeOpen,
  Trophy,
  FileText,
} from "@phosphor-icons/react";
import type { ElementType } from "react";
import type { NotificationType } from "./types";

interface NotificationTypeConfig {
  icon: ElementType;
  colorClass: string;
  label: string;
}

export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, NotificationTypeConfig> = {
  new_review: {
    icon: Star,
    colorClass: "bg-amber-100 text-amber-600",
    label: "New Review",
  },
  negative_review: {
    icon: AlertTriangle,
    colorClass: "bg-red-100 text-red-600",
    label: "Negative Review",
  },
  review_approved: {
    icon: Check,
    colorClass: "bg-green-100 text-green-600",
    label: "Review Published",
  },
  review_rejected: {
    icon: AlertTriangle,
    colorClass: "bg-red-100 text-red-600",
    label: "Review Removed",
  },
  review_needs_response: {
    icon: EnvelopeOpen,
    colorClass: "bg-amber-100 text-amber-600",
    label: "Needs response",
  },
  review_dispute: {
    icon: AlertTriangle,
    colorClass: "bg-red-100 text-red-600",
    label: "Review Dispute",
  },
  response_posted: {
    icon: MessageSquare,
    colorClass: "bg-blue-100 text-blue-600",
    label: "Response Posted",
  },
  badge_earned: {
    icon: Trophy,
    colorClass: "bg-purple-100 text-purple-600",
    label: "Badge Earned",
  },
  milestone_reached: {
    icon: Trophy,
    colorClass: "bg-purple-100 text-purple-600",
    label: "Milestone Reached",
  },
  mention: {
    icon: MessageSquare,
    colorClass: "bg-blue-100 text-blue-600",
    label: "Mention",
  },
  report_ready: {
    icon: FileText,
    colorClass: "bg-indigo-100 text-indigo-600",
    label: "Report Ready",
  },
  digest: {
    icon: FileText,
    colorClass: "bg-indigo-100 text-indigo-600",
    label: "Digest",
  },
  system: {
    icon: Bell,
    colorClass: "bg-muted text-muted-foreground",
    label: "System",
  },
};

export function getNotificationTypeConfig(type: NotificationType | string): NotificationTypeConfig {
  return (
    NOTIFICATION_TYPE_CONFIG[type as NotificationType] ?? {
      ...NOTIFICATION_TYPE_CONFIG.system,
      label: type,
    }
  );
}
