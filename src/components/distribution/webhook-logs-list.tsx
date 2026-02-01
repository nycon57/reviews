"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  ArrowsClockwise as RefreshCw,
  WarningCircle as AlertCircle,
  Plugs as Webhook,
} from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";

interface WebhookLog {
  id: string;
  event_type: string;
  status: string | null;
  created_at: string | null;
  processing_time_ms: number | null;
  error_message: string | null;
  ip_address: string | null;
}

function getStatusBadge(status: string | null) {
  switch (status) {
    case "received":
      return <Badge variant="outline" className="text-blue-600 border-blue-600">Received</Badge>;
    case "processed":
      return <Badge variant="outline" className="text-green-600 border-green-600">Processed</Badge>;
    case "failed":
      return <Badge variant="outline" className="text-red-600 border-red-600">Failed</Badge>;
    case "ignored":
      return <Badge variant="secondary">Ignored</Badge>;
    default:
      return <Badge variant="outline">{status || "Unknown"}</Badge>;
  }
}

export function WebhookLogsList() {
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWebhookLogs = async () => {
      setIsLoading(true);
      setFetchError(null);

      try {
        const response = await fetch("/api/distribution/webhook-logs");
        if (!response.ok) {
          throw new Error(`Failed to fetch webhook logs: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setLogs(data.logs || []);
      } catch (error) {
        console.error("Error fetching webhook logs:", error);
        setFetchError(error instanceof Error ? error.message : "Failed to load webhook logs");
        setLogs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWebhookLogs();
  }, []);

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin opacity-50" />
        <p>Loading webhook logs...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-red-500" />
        <p className="text-red-600">{fetchError}</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No webhook logs found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium font-mono text-sm">{log.event_type}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {log.created_at && formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
              {log.processing_time_ms && (
                <span className="ml-2">({log.processing_time_ms}ms)</span>
              )}
              {log.ip_address && (
                <span className="ml-2">from {log.ip_address}</span>
              )}
            </div>
            {log.error_message && (
              <div className="text-xs text-red-600">{log.error_message}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(log.status)}
          </div>
        </div>
      ))}
    </div>
  );
}
