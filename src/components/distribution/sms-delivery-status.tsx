"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { getMessageStatus, type RecentSmsSend } from "@/lib/sms/send/actions";
import {
  CheckCircle,
  XCircle,
  Clock,
  PaperPlaneRight,
  Spinner,
} from "@phosphor-icons/react";

// ── Status Polling for a single message ──────────────────────────────

interface SmsDeliveryTrackerProps {
  messageId: string;
  onStatusChange?: (status: string) => void;
}

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle; label: string; color: string }> = {
  queued: { icon: Clock, label: "Queued", color: "text-muted-foreground" },
  sent: { icon: PaperPlaneRight, label: "Sent", color: "text-blue-600 dark:text-blue-400" },
  delivered: { icon: CheckCircle, label: "Delivered", color: "text-emerald-600 dark:text-emerald-400" },
  undelivered: { icon: XCircle, label: "Undelivered", color: "text-destructive" },
  failed: { icon: XCircle, label: "Failed", color: "text-destructive" },
};

export function SmsDeliveryTracker({ messageId, onStatusChange }: SmsDeliveryTrackerProps) {
  const [status, setStatus] = useState<string>("queued");
  const [polling, setPolling] = useState(true);
  const pollCount = useRef(0);

  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(async () => {
      pollCount.current++;
      // Stop polling after 10 attempts (30 seconds)
      if (pollCount.current > 10) {
        setPolling(false);
        return;
      }

      const result = await getMessageStatus(messageId);
      if (result.success && result.data) {
        setStatus(result.data.status);
        onStatusChange?.(result.data.status);

        // Stop polling on terminal statuses
        if (["delivered", "undelivered", "failed"].includes(result.data.status)) {
          setPolling(false);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [messageId, polling, onStatusChange]);

  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.queued;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      {polling && (
        <Spinner className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      )}
      <Icon weight="fill" className={`h-4 w-4 ${config.color}`} />
      <span className={`text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    </div>
  );
}

// ── Recent Sends List ────────────────────────────────────────────────

interface RecentSmsListProps {
  sends: RecentSmsSend[];
  isLoading: boolean;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "delivered":
      return <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400">Delivered</Badge>;
    case "sent":
      return <Badge variant="outline" className="text-[10px] border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400">Sent</Badge>;
    case "queued":
      return <Badge variant="outline" className="text-[10px]">Queued</Badge>;
    case "failed":
    case "undelivered":
      return <Badge variant="destructive" className="text-[10px]">{status === "failed" ? "Failed" : "Undelivered"}</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RecentSmsList({ sends, isLoading }: RecentSmsListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Spinner className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sends.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">No recent SMS sends</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sends.map((send) => (
        <div
          key={send.id}
          className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-xs text-muted-foreground truncate">
              {send.toNumberDisplay}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {getStatusBadge(send.status)}
            <span className="text-xs text-muted-foreground">
              {timeAgo(send.createdAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
