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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Envelope as Mail,
  Clock,
  Globe,
  Moon,
  CaretLeft as ChevronLeft,
  Lock,
  Sparkle as Sparkles,
  ChartBar as BarChart3,
  Trophy,
  Megaphone,
  Gift,
} from "@phosphor-icons/react";
import type { EmailPreferences } from "@/lib/email-preferences/types";
import {
  EMAIL_CATEGORIES,
  DEFAULT_EMAIL_PREFERENCES,
  COMMON_TIMEZONES,
  FREQUENCY_OPTIONS,
  TIME_OPTIONS,
} from "@/lib/email-preferences/types";
import {
  getEmailPreferences,
  updateEmailPreferences,
} from "@/lib/email-preferences/actions";
import Link from "next/link";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  transactional: Lock,
  onboarding: Sparkles,
  weekly_summary: BarChart3,
  milestones: Trophy,
  product_updates: Gift,
  marketing: Megaphone,
};

export function EmailPreferencesContent() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [preferences, setPreferences] = React.useState<EmailPreferences | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const fetchPreferences = async () => {
      setLoading(true);
      const prefs = await getEmailPreferences();
      if (!cancelled) {
        setPreferences(prefs || DEFAULT_EMAIL_PREFERENCES);
        setLoading(false);
      }
    };
    fetchPreferences();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = React.useCallback(async (updates: Partial<EmailPreferences>) => {
    setSaving(true);
    const result = await updateEmailPreferences(updates);
    if (result.success) {
      setPreferences((prev) => (prev ? { ...prev, ...updates } : updates as EmailPreferences));
      toast({
        title: "Preferences saved",
        description: "Your email preferences have been updated.",
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to save preferences",
        variant: "destructive",
      });
    }
    setSaving(false);
  }, [toast]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="border border-border shadow-soft">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="gap-2 pl-0 text-muted-foreground hover:text-foreground">
        <Link href="/dashboard/settings?tab=notifications">
          <ChevronLeft className="h-4 w-4" />
          Back to Settings
        </Link>
      </Button>

      {/* Master Email Toggle */}
      <Card className="border border-border shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Control all email notifications from RepWell
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label id="all-emails-label" className="text-base font-medium">All Emails</Label>
              <p className="text-sm text-muted-foreground">
                Master toggle for all email notifications
              </p>
            </div>
            <Switch
              aria-labelledby="all-emails-label"
              checked={preferences?.email_enabled ?? true}
              onCheckedChange={(checked) => handleSave({ email_enabled: checked })}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Categories */}
      {preferences?.email_enabled && (
        <Card className="border border-border shadow-soft">
          <CardHeader>
            <CardTitle>Email Categories</CardTitle>
            <CardDescription>
              Choose which types of emails you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {EMAIL_CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICONS[category.id] || Mail;
              const fieldValue = category.canDisable
                ? preferences?.[category.field] ?? true
                : true;

              return (
                <div
                  key={category.id}
                  className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-md bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 p-2">
                        <Icon className="h-4 w-4 text-label" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium">{category.label}</Label>
                          {!category.canDisable && (
                            <Badge variant="secondary" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                        {category.previewExamples.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {category.previewExamples.slice(0, 3).map((example) => (
                              <Badge
                                key={example}
                                variant="outline"
                                className="text-xs font-normal text-muted-foreground"
                              >
                                {example}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {category.canDisable ? (
                      <Switch
                        aria-label={`Enable ${category.label} emails`}
                        checked={fieldValue}
                        onCheckedChange={(checked) =>
                          handleSave({ [category.field]: checked })
                        }
                        disabled={saving}
                      />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Delivery Settings */}
      {preferences?.email_enabled && (
        <Card className="border border-border shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Delivery Settings
            </CardTitle>
            <CardDescription>
              Configure how and when you receive emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Frequency */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Email Frequency</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {FREQUENCY_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    role="radio"
                    aria-checked={preferences?.email_frequency_mode === option.value}
                    tabIndex={0}
                    className={`cursor-pointer rounded-lg border p-4 transition-colors focus:outline-none focus:ring-2 focus:ring-repwell-teal-300 focus:ring-offset-2 ${
                      preferences?.email_frequency_mode === option.value
                        ? "border-repwell-teal-300 bg-repwell-sage-100/30 dark:bg-repwell-teal-300/10"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleSave({ email_frequency_mode: option.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSave({ email_frequency_mode: option.value });
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        aria-hidden="true"
                        className={`h-4 w-4 rounded-full border-2 ${
                          preferences?.email_frequency_mode === option.value
                            ? "border-repwell-teal-300 bg-repwell-teal-300"
                            : "border-muted-foreground"
                        }`}
                      />
                      <span className="font-medium">{option.label}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground pl-6">
                      {option.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Timezone */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Timezone</Label>
              </div>
              <Select
                value={preferences?.email_timezone ?? "America/New_York"}
                onValueChange={(value) => handleSave({ email_timezone: value })}
                disabled={saving}
              >
                <SelectTrigger className="w-full sm:w-72">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Emails will be delivered according to this timezone
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiet Hours */}
      {preferences?.email_enabled && (
        <Card className="border border-border shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle id="quiet-hours-title" className="flex items-center gap-2">
                  <Moon className="h-5 w-5" />
                  Quiet Hours
                </CardTitle>
                <CardDescription>
                  Pause non-urgent emails during specific hours
                </CardDescription>
              </div>
              <Switch
                aria-labelledby="quiet-hours-title"
                checked={preferences?.quiet_hours_enabled ?? false}
                onCheckedChange={(checked) =>
                  handleSave({ quiet_hours_enabled: checked })
                }
                disabled={saving}
              />
            </div>
          </CardHeader>
          {preferences?.quiet_hours_enabled && (
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Select
                    value={preferences?.quiet_hours_start ?? "22:00"}
                    onValueChange={(value) =>
                      handleSave({ quiet_hours_start: value })
                    }
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time.value} value={time.value}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Select
                    value={preferences?.quiet_hours_end ?? "08:00"}
                    onValueChange={(value) =>
                      handleSave({ quiet_hours_end: value })
                    }
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time.value} value={time.value}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Non-urgent emails will be held and delivered after quiet hours end.
                Critical alerts like negative reviews will still be delivered immediately.
              </p>
            </CardContent>
          )}
        </Card>
      )}

      {/* Disabled State Message */}
      {!preferences?.email_enabled && (
        <Card className="border border-border shadow-soft bg-muted/30">
          <CardContent className="py-8 text-center">
            <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-medium text-muted-foreground">
              Email notifications are disabled
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Enable the master toggle above to configure your email preferences.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
