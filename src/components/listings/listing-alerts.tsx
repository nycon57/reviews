'use client';

import { useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  XCircle,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type ListingAlert, PLATFORM_INFO } from '@/lib/listings/types';
import { resolveAlert, markAlertRead } from '@/lib/listings/actions';

interface ListingAlertsProps {
  alerts: ListingAlert[];
  onUpdate?: () => void;
}

function getSeverityIcon(severity: ListingAlert['severity']) {
  switch (severity) {
    case 'critical':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'high':
      return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    case 'medium':
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    case 'low':
      return <Info className="h-5 w-5 text-blue-500" />;
    default:
      return <Info className="h-5 w-5 text-gray-500" />;
  }
}

export function ListingAlerts({ alerts, onUpdate }: ListingAlertsProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleResolve = (alertId: string) => {
    startTransition(async () => {
      const result = await resolveAlert(alertId);
      if (result.success) {
        toast({
          title: 'Alert Resolved',
          description: 'The alert has been marked as resolved.',
        });
        onUpdate?.();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to resolve alert',
          variant: 'destructive',
        });
      }
    });
  };

  const handleMarkRead = (alertId: string) => {
    startTransition(async () => {
      await markAlertRead(alertId);
      onUpdate?.();
    });
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Check className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="font-medium">No Active Alerts</p>
            <p className="text-sm">Your listings are in good shape!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group alerts by severity
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
  const highAlerts = alerts.filter((a) => a.severity === 'high');
  const otherAlerts = alerts.filter((a) => a.severity !== 'critical' && a.severity !== 'high');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Listing Alerts</CardTitle>
            <CardDescription>
              Issues that need your attention
            </CardDescription>
          </div>
          <Badge
            variant={criticalAlerts.length > 0 ? 'destructive' : 'secondary'}
          >
            {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...criticalAlerts, ...highAlerts, ...otherAlerts].map((alert) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onResolve={() => handleResolve(alert.id)}
              onMarkRead={() => handleMarkRead(alert.id)}
              isPending={isPending}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface AlertItemProps {
  alert: ListingAlert;
  onResolve: () => void;
  onMarkRead: () => void;
  isPending: boolean;
}

function AlertItem({ alert, onResolve, onMarkRead, isPending }: AlertItemProps) {
  const platformInfo = alert.platform ? PLATFORM_INFO[alert.platform] : null;

  return (
    <div
      className={`p-4 border rounded-lg space-y-2 ${
        !alert.isRead ? 'bg-muted/50' : ''
      }`}
      onClick={!alert.isRead ? onMarkRead : undefined}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {getSeverityIcon(alert.severity)}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{alert.title}</span>
              <Badge variant="outline" className="text-xs capitalize">
                {alert.severity}
              </Badge>
              {platformInfo && (
                <Badge variant="secondary" className="text-xs">
                  {platformInfo.name}
                </Badge>
              )}
            </div>
            {alert.description && (
              <p className="text-sm text-muted-foreground">{alert.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {new Date(alert.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {platformInfo?.claimUrl && (
            <Button variant="ghost" size="sm" asChild>
              <a href={platformInfo.claimUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onResolve();
            }}
            disabled={isPending}
          >
            <Check className="h-4 w-4 mr-1" />
            Resolve
          </Button>
        </div>
      </div>
    </div>
  );
}
