"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Bell, Envelope as Mail, Clock, Warning as AlertTriangle } from "@phosphor-icons/react";
import type { NotificationPreferences, DigestFrequency } from "@/lib/notifications/types";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/notifications/types";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/notifications/actions";
import { DAYS_OF_WEEK } from "@/lib/constants/days";

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona (AZ)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "UTC", label: "UTC" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i.toString(),
  label: `${i === 0 ? 12 : i > 12 ? i - 12 : i}:00 ${i >= 12 ? "PM" : "AM"}`,
}));

export function NotificationPreferencesCard() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [preferences, setPreferences] = React.useState<Partial<NotificationPreferences> | null>(
    null
  );

  React.useEffect(() => {
    const fetchPreferences = async () => {
      setLoading(true);
      const prefs = await getNotificationPreferences();
      setPreferences(prefs || DEFAULT_NOTIFICATION_PREFERENCES);
      setLoading(false);
    };
    fetchPreferences();
  }, []);

  const handleSave = async (
    updates: Partial<Omit<NotificationPreferences, "id" | "user_id" | "created_at" | "updated_at">>
  ) => {
    setSaving(true);
    const result = await updateNotificationPreferences(updates);
    if (result.success) {
      setPreferences((prev) => (prev ? { ...prev, ...updates } : updates));
      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated.",
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to save preferences",
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-5 w-32" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
        <CardDescription>Configure how and when you receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* In-App Notifications */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">In-App Notifications</h4>
            </div>
            <Switch
              checked={preferences?.in_app_enabled ?? true}
              onCheckedChange={(checked) => handleSave({ in_app_enabled: checked })}
              disabled={saving}
            />
          </div>

          {preferences?.in_app_enabled && (
            <div className="grid gap-3 rounded-lg border p-4">
              <NotificationToggle
                label="New reviews"
                description="When you receive a new review"
                checked={preferences?.in_app_new_review ?? true}
                onCheckedChange={(checked) => handleSave({ in_app_new_review: checked })}
                disabled={saving}
              />
              <NotificationToggle
                label="Negative reviews"
                description="Instant alerts for low ratings"
                checked={preferences?.in_app_negative_review ?? true}
                onCheckedChange={(checked) => handleSave({ in_app_negative_review: checked })}
                disabled={saving}
                important
              />
              <NotificationToggle
                label="Review approved"
                description="When your review is approved"
                checked={preferences?.in_app_review_approved ?? true}
                onCheckedChange={(checked) => handleSave({ in_app_review_approved: checked })}
                disabled={saving}
              />
              <NotificationToggle
                label="Response posted"
                description="When your response is posted"
                checked={preferences?.in_app_response_posted ?? true}
                onCheckedChange={(checked) => handleSave({ in_app_response_posted: checked })}
                disabled={saving}
              />
              <NotificationToggle
                label="Badges earned"
                description="When you earn a new badge"
                checked={preferences?.in_app_badge_earned ?? true}
                onCheckedChange={(checked) => handleSave({ in_app_badge_earned: checked })}
                disabled={saving}
              />
              <NotificationToggle
                label="Mentions"
                description="When someone mentions you"
                checked={preferences?.in_app_mention ?? true}
                onCheckedChange={(checked) => handleSave({ in_app_mention: checked })}
                disabled={saving}
              />
            </div>
          )}
        </section>

        <Separator />

        {/* Email Notifications */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Email Notifications</h4>
            </div>
            <Switch
              checked={preferences?.email_enabled ?? true}
              onCheckedChange={(checked) => handleSave({ email_enabled: checked })}
              disabled={saving}
            />
          </div>

          {preferences?.email_enabled && (
            <div className="grid gap-3 rounded-lg border p-4">
              <NotificationToggle
                label="New reviews"
                description="Email when you receive a new review"
                checked={preferences?.email_new_review ?? true}
                onCheckedChange={(checked) => handleSave({ email_new_review: checked })}
                disabled={saving}
              />
              <NotificationToggle
                label="Negative reviews"
                description="Immediate email for low ratings"
                checked={preferences?.email_negative_review ?? true}
                onCheckedChange={(checked) => handleSave({ email_negative_review: checked })}
                disabled={saving}
                important
              />
              <NotificationToggle
                label="Review approved"
                description="Email when your review is approved"
                checked={preferences?.email_review_approved ?? true}
                onCheckedChange={(checked) => handleSave({ email_review_approved: checked })}
                disabled={saving}
              />
              <NotificationToggle
                label="Response posted"
                description="Email when your response is posted"
                checked={preferences?.email_response_posted ?? true}
                onCheckedChange={(checked) => handleSave({ email_response_posted: checked })}
                disabled={saving}
              />
              <NotificationToggle
                label="Mentions"
                description="Email when someone mentions you"
                checked={preferences?.email_mention ?? true}
                onCheckedChange={(checked) => handleSave({ email_mention: checked })}
                disabled={saving}
              />
            </div>
          )}
        </section>

        <Separator />

        {/* Instant Alerts */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Instant Alerts</h4>
            </div>
            <Switch
              checked={preferences?.instant_alert_enabled ?? true}
              onCheckedChange={(checked) => handleSave({ instant_alert_enabled: checked })}
              disabled={saving}
            />
          </div>

          {preferences?.instant_alert_enabled && (
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Alert threshold</Label>
                  <p className="text-xs text-muted-foreground">
                    Send instant alert for ratings below this value
                  </p>
                </div>
                <Select
                  value={(preferences?.instant_alert_threshold ?? 3).toString()}
                  onValueChange={(value) =>
                    handleSave({ instant_alert_threshold: parseInt(value) })
                  }
                  disabled={saving}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 star</SelectItem>
                    <SelectItem value="2">2 stars</SelectItem>
                    <SelectItem value="3">3 stars</SelectItem>
                    <SelectItem value="4">4 stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </section>

        <Separator />

        {/* Digest */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Digest Summary</h4>
            </div>
            <Switch
              checked={preferences?.digest_enabled ?? false}
              onCheckedChange={(checked) => handleSave({ digest_enabled: checked })}
              disabled={saving}
            />
          </div>

          {preferences?.digest_enabled && (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={preferences?.digest_frequency ?? "daily"}
                    onValueChange={(value) =>
                      handleSave({ digest_frequency: value as DigestFrequency })
                    }
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {preferences?.digest_frequency === "weekly" && (
                  <div className="space-y-2">
                    <Label>Day of week</Label>
                    <Select
                      value={(preferences?.digest_day_of_week ?? 1).toString()}
                      onValueChange={(value) => handleSave({ digest_day_of_week: parseInt(value) })}
                      disabled={saving}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={day.value}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Select
                    value={(preferences?.digest_hour ?? 9).toString()}
                    onValueChange={(value) => handleSave({ digest_hour: parseInt(value) })}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS.map((hour) => (
                        <SelectItem key={hour.value} value={hour.value}>
                          {hour.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={preferences?.digest_timezone ?? "America/New_York"}
                    onValueChange={(value) => handleSave({ digest_timezone: value })}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </section>
      </CardContent>
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
