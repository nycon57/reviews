'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  SpinnerGap as Loader2,
  Warning as AlertTriangle,
  ArrowSquareOut as ExternalLink,
} from "@phosphor-icons/react";
import type { NotificationPreferences } from '@/lib/notifications/types';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/lib/notifications/types';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  testTeamsWebhook,
} from '@/lib/notifications/actions';

// MS Teams icon component
function TeamsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20.625 8.5h-3.125V6.375A1.875 1.875 0 0 0 15.625 4.5h-7.5A1.875 1.875 0 0 0 6.25 6.375V8.5H3.375A1.875 1.875 0 0 0 1.5 10.375v7.25A1.875 1.875 0 0 0 3.375 19.5h17.25a1.875 1.875 0 0 0 1.875-1.875v-7.25A1.875 1.875 0 0 0 20.625 8.5ZM15.625 6.375v2.125H8.125V6.375h7.5ZM3.375 17.625v-7.25H6.25v7.25H3.375Zm4.75 0v-7.25h7.5v7.25h-7.5Zm12.5 0H17.75v-7.25h2.875v7.25Z" />
      <circle cx="19" cy="5" r="3" />
    </svg>
  );
}

export function TeamsIntegrationCard() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [testingTeams, setTestingTeams] = React.useState(false);
  const [preferences, setPreferences] = React.useState<
    Partial<NotificationPreferences> | null
  >(null);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const originalWebhookRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const fetchPreferences = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const prefs = await getNotificationPreferences();
        const resolvedPrefs = prefs || DEFAULT_NOTIFICATION_PREFERENCES;
        setPreferences(resolvedPrefs);
        originalWebhookRef.current = resolvedPrefs.teams_webhook_url ?? null;
      } catch (error) {
        console.error('Failed to fetch notification preferences:', error);
        setFetchError('Failed to load preferences');
        setPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
        originalWebhookRef.current = null;
      } finally {
        setLoading(false);
      }
    };
    fetchPreferences();
  }, []);

  const handleSave = async (
    updates: Partial<
      Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>
    >
  ) => {
    setSaving(true);
    const result = await updateNotificationPreferences(updates);
    if (result.success) {
      setPreferences((prev) => (prev ? { ...prev, ...updates } : updates));
      if ('teams_webhook_url' in updates) {
        originalWebhookRef.current = updates.teams_webhook_url ?? null;
      }
      toast({
        title: 'Settings saved',
        description: 'Your Teams integration settings have been updated.',
      });
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to save settings',
        variant: 'destructive',
      });
    }
    setSaving(false);
  };

  const handleTestTeams = async () => {
    if (!preferences?.teams_webhook_url) return;

    setTestingTeams(true);
    const result = await testTeamsWebhook(preferences.teams_webhook_url);
    if (result.success) {
      toast({
        title: 'Test successful',
        description: 'An Adaptive Card was sent to your Teams channel.',
      });
    } else {
      toast({
        title: 'Test failed',
        description: result.error || 'Failed to send test message',
        variant: 'destructive',
      });
    }
    setTestingTeams(false);
  };

  if (loading) {
    return (
      <Card className="border border-border shadow-soft">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border shadow-soft">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TeamsIcon className="h-5 w-5 text-[#5558AF]" />
            <CardTitle>Microsoft Teams</CardTitle>
            {fetchError ? (
              <Badge variant="destructive" className="text-xs">
                Error
              </Badge>
            ) : (
              <Badge
                variant={preferences?.teams_enabled ? 'default' : 'secondary'}
                className="text-xs"
              >
                {preferences?.teams_enabled ? 'Connected' : 'Not connected'}
              </Badge>
            )}
          </div>
          <Switch
            checked={preferences?.teams_enabled ?? false}
            onCheckedChange={(checked) => handleSave({ teams_enabled: checked })}
            disabled={saving}
          />
        </div>
        <CardDescription>
          {fetchError || 'Send review notifications as Adaptive Cards to your Teams channel'}
        </CardDescription>
      </CardHeader>

      {preferences?.teams_enabled && (
        <CardContent className="space-y-6">
          {/* Webhook URL */}
          <div className="space-y-2">
            <Label htmlFor="teams_webhook_url">Incoming Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                id="teams_webhook_url"
                type="url"
                placeholder="https://...webhook.office.com/webhookb2/..."
                value={preferences?.teams_webhook_url ?? ''}
                onChange={(e) =>
                  setPreferences((prev) =>
                    prev ? { ...prev, teams_webhook_url: e.target.value } : null
                  )
                }
                onBlur={(e) => {
                  if (e.target.value !== originalWebhookRef.current) {
                    handleSave({ teams_webhook_url: e.target.value || null });
                  }
                }}
                disabled={saving}
              />
              <Button
                variant="outline"
                onClick={handleTestTeams}
                disabled={!preferences?.teams_webhook_url || testingTeams}
              >
                {testingTeams ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Test'
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              <a
                href="https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-repwell-teal-300 hover:underline"
              >
                Learn how to create an incoming webhook
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>

          {/* Note about Adaptive Cards */}
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">
              Notifications are sent as{' '}
              <a
                href="https://adaptivecards.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-repwell-teal-300 hover:underline"
              >
                Adaptive Cards
              </a>{' '}
              for rich formatting with star ratings, customer details, and action buttons.
            </p>
          </div>

          {/* Notification Toggles */}
          <div className="space-y-3 rounded-lg border border-border p-4">
            <h4 className="text-sm font-medium mb-3">Notification Events</h4>
            <NotificationToggle
              label="New reviews"
              description="Post to Teams when you receive a new review"
              checked={preferences?.teams_new_review ?? true}
              onCheckedChange={(checked) => handleSave({ teams_new_review: checked })}
              disabled={saving}
            />
            <NotificationToggle
              label="Negative reviews"
              description="Instant alert for low rating reviews"
              checked={preferences?.teams_negative_review ?? true}
              onCheckedChange={(checked) =>
                handleSave({ teams_negative_review: checked })
              }
              disabled={saving}
              important
            />
            <NotificationToggle
              label="Digest summary"
              description="Post daily/weekly digest to Teams"
              checked={preferences?.teams_digest ?? false}
              onCheckedChange={(checked) => handleSave({ teams_digest: checked })}
              disabled={saving}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}

interface NotificationToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  important?: boolean;
}

function NotificationToggle({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  important,
}: NotificationToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {important && <AlertTriangle className="h-3 w-3 text-amber-500" />}
        <div>
          <Label className="text-sm font-normal">{label}</Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}
