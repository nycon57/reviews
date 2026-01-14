'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Bell,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  type ListingAlert,
  PLATFORM_INFO,
  getSeverityColor,
} from '@/lib/listings/types';
import { resolveAlert } from '@/lib/listings/actions';

interface ListingAlertsPanelProps {
  alerts: ListingAlert[];
}

function getAlertIcon(alertType: ListingAlert['alertType']) {
  switch (alertType) {
    case 'nap_mismatch':
    case 'hours_mismatch':
    case 'accuracy_drop':
      return <AlertTriangle className="h-4 w-4" />;
    case 'sync_failed':
    case 'listing_removed':
    case 'photo_rejected':
      return <XCircle className="h-4 w-4" />;
    case 'duplicate_found':
    case 'verification_needed':
      return <Bell className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
}

function getSeverityBadgeVariant(severity: ListingAlert['severity']): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    case 'low':
      return 'secondary';
    default:
      return 'outline';
  }
}

export function ListingAlertsPanel({ alerts: initialAlerts }: ListingAlertsPanelProps) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleResolve = (alertId: string) => {
    startTransition(async () => {
      const result = await resolveAlert(alertId);
      if (result.success) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
        toast({
          title: 'Alert Resolved',
          description: 'The alert has been marked as resolved.',
        });
      } else {
        toast({
          title: 'Failed to Resolve',
          description: result.error || 'Could not resolve the alert.',
          variant: 'destructive',
        });
      }
    });
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
            <p className="text-sm text-muted-foreground">No alerts to review</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Alerts</CardTitle>
            <CardDescription>Issues requiring attention</CardDescription>
          </div>
          <Badge variant="outline">{alerts.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => {
          const platformInfo = alert.platform ? PLATFORM_INFO[alert.platform] : null;

          return (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${getSeverityColor(alert.severity)} text-white shrink-0`}
              >
                {getAlertIcon(alert.alertType)}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium leading-tight">{alert.title}</p>
                    {platformInfo && (
                      <p className="text-xs text-muted-foreground">
                        {platformInfo.name}
                      </p>
                    )}
                  </div>
                  <Badge variant={getSeverityBadgeVariant(alert.severity)} className="text-xs shrink-0">
                    {alert.severity}
                  </Badge>
                </div>
                {alert.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {alert.description}
                  </p>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleResolve(alert.id)}
                    disabled={isPending}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Resolve
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
