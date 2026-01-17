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
import { MessageSquare, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import type { NotificationPreferences } from '@/lib/notifications/types';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/lib/notifications/types';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  testSlackWebhook,
} from '@/lib/notifications/actions';

export function SlackIntegrationCard() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [testingSlack, setTestingSlack] = React.useState(false);
  const [preferences, setPreferences] = React.useState<
    Partial<NotificationPreferences> | null
  >(null);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchPreferences = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const prefs = await getNotificationPreferences();
        setPreferences(prefs || DEFAULT_NOTIFICATION_PREFERENCES);
      } catch (error) {
        console.error('Failed to fetch notification preferences:', error);
        setFetchError('Failed to load preferences');
        setPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
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
      toast({
        title: 'Settings saved',
        description: 'Your Slack integration settings have been updated.',
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

  const handleTestSlack = async () => {
    if (!preferences?.slack_webhook_url) return;

    setTestingSlack(true);
    const result = await testSlackWebhook(preferences.slack_webhook_url);
    if (result.success) {
      toast({
        title: 'Test successful',
        description: 'A test message was sent to your Slack channel.',
      });
    } else {
      toast({
        title: 'Test failed',
        description: result.error || 'Failed to send test message',
        variant: 'destructive',
      });
    }
    setTestingSlack(false);
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
            <MessageSquare className="h-5 w-5 text-[#4A154B]" />
            <CardTitle>Slack</CardTitle>
            {fetchError ? (
              <Badge variant="destructive" className="text-xs">
                Error
              </Badge>
            ) : (
              <Badge
                variant={preferences?.slack_enabled ? 'default' : 'secondary'}
                className="text-xs"
              >
                {preferences?.slack_enabled ? 'Connected' : 'Not connected'}
              </Badge>
            )}
          </div>
          <Switch
            checked={preferences?.slack_enabled ?? false}
            onCheckedChange={(checked) => handleSave({ slack_enabled: checked })}
            disabled={saving}
          />
        </div>
        <CardDescription>
          {fetchError || 'Send review notifications to your Slack workspace'}
        </CardDescription>
      </CardHeader>

      {preferences?.slack_enabled && (
        <CardContent className="space-y-6">
          {/* Webhook URL */}
          <div className="space-y-2">
            <Label htmlFor="slack_webhook_url">Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                id="slack_webhook_url"
                type="url"
                placeholder="https://hooks.slack.com/services/..."
                value={preferences?.slack_webhook_url ?? ''}
                onChange={(e) =>
                  setPreferences((prev) =>
                    prev ? { ...prev, slack_webhook_url: e.target.value } : null
                  )
                }
                onBlur={(e) => {
                  if (e.target.value !== preferences?.slack_webhook_url) {
                    handleSave({ slack_webhook_url: e.target.value || null });
                  }
                }}
                disabled={saving}
              />
              <Button
                variant="outline"
                onClick={handleTestSlack}
                disabled={!preferences?.slack_webhook_url || testingSlack}
              >
                {testingSlack ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Test'
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              <a
                href="https://api.slack.com/messaging/webhooks"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-repwell-teal-300 hover:underline"
              >
                Learn how to create a webhook
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>

          {/* Channel */}
          <div className="space-y-2">
            <Label htmlFor="slack_channel">Channel (optional)</Label>
            <Input
              id="slack_channel"
              placeholder="#reviews"
              value={preferences?.slack_channel ?? ''}
              onChange={(e) =>
                setPreferences((prev) =>
                  prev ? { ...prev, slack_channel: e.target.value } : null
                )
              }
              onBlur={(e) => {
                if (e.target.value !== preferences?.slack_channel) {
                  handleSave({ slack_channel: e.target.value || null });
                }
              }}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              Override the default channel set in the webhook
            </p>
          </div>

          {/* Notification Toggles */}
          <div className="space-y-3 rounded-lg border border-border p-4">
            <h4 className="text-sm font-medium mb-3">Notification Events</h4>
            <NotificationToggle
              label="New reviews"
              description="Post to Slack when you receive a new review"
              checked={preferences?.slack_new_review ?? true}
              onCheckedChange={(checked) => handleSave({ slack_new_review: checked })}
              disabled={saving}
            />
            <NotificationToggle
              label="Negative reviews"
              description="Instant alert for low rating reviews"
              checked={preferences?.slack_negative_review ?? true}
              onCheckedChange={(checked) =>
                handleSave({ slack_negative_review: checked })
              }
              disabled={saving}
              important
            />
            <NotificationToggle
              label="Digest summary"
              description="Post daily/weekly digest to Slack"
              checked={preferences?.slack_digest ?? false}
              onCheckedChange={(checked) => handleSave({ slack_digest: checked })}
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
