"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  Clock,
  Globe,
  Moon,
  Lock,
  Sparkles,
  BarChart3,
  Trophy,
  Megaphone,
  Gift,
  MailCheck,
} from "lucide-react";
import type { EmailPreferences, EmailPreferencesWithToken } from "@/lib/email-preferences/types";
import {
  EMAIL_CATEGORIES,
  COMMON_TIMEZONES,
  FREQUENCY_OPTIONS,
  TIME_OPTIONS,
} from "@/lib/email-preferences/types";
import {
  getEmailPreferencesByToken,
  updateEmailPreferencesByToken,
  resubscribeByToken,
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

export default function PublicEmailPreferencesPage() {
  const params = useParams();
  const { toast } = useToast();
  const token = params.token as string;

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [preferences, setPreferences] = React.useState<EmailPreferencesWithToken | null>(null);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function loadPreferences() {
      setLoading(true);
      try {
        const prefs = await getEmailPreferencesByToken(token);
        if (cancelled) return;

        if (prefs) {
          if (!prefs.is_valid) {
            setError("This link has expired. Please contact support for a new link.");
          } else {
            setPreferences(prefs);
          }
        } else {
          setError("Invalid link. Please check your email for a valid link.");
        }
      } catch {
        if (!cancelled) {
          setError("An unexpected error occurred. Please try again later.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadPreferences();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Cleanup timeout for saved state to prevent memory leak
  React.useEffect(() => {
    if (saved) {
      const timer = setTimeout(() => setSaved(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saved]);

  const handleSave = React.useCallback(async (updates: Partial<EmailPreferences>) => {
    setSaving(true);
    setSaved(false);

    try {
      const result = await updateEmailPreferencesByToken(token, updates);
      if (result.success) {
        setPreferences((prev) => (prev ? { ...prev, ...updates } : null));
        setSaved(true);
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
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [token, toast]);

  const handleResubscribe = React.useCallback(async () => {
    setSaving(true);
    try {
      const result = await resubscribeByToken(token);
      if (result.success) {
        // Reload preferences
        const prefs = await getEmailPreferencesByToken(token);
        if (prefs) {
          setPreferences(prefs);
        }
        toast({
          title: "Resubscribed",
          description: "You have been resubscribed to emails.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to resubscribe",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [token, toast]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-repwell-sage-50">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-repwell-sage-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-lg font-semibold">Unable to Load Preferences</h2>
            <p className="mt-2 text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-6" asChild>
              <a href="mailto:support@repwell.com">Contact Support</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isUnsubscribed = !preferences?.email_enabled || preferences?.email_frequency_mode === "none";

  return (
    <div className="min-h-screen bg-repwell-sage-50 py-12">
      <div className="mx-auto max-w-2xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <Image
            src="/logo.svg"
            alt="RepWell"
            width={140}
            height={40}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-semibold text-repwell-teal-500">Email Preferences</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your email preferences for{" "}
            <span className="font-medium text-foreground">{preferences?.email}</span>
          </p>
        </div>

        {/* Save indicator */}
        {saved && (
          <div className="mb-6 flex items-center justify-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Preferences saved successfully</span>
          </div>
        )}

        {/* Unsubscribed State */}
        {isUnsubscribed ? (
          <Card className="mb-6">
            <CardContent className="py-8 text-center">
              <div className="mx-auto rounded-full bg-muted p-3 w-fit">
                <Mail className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">You&apos;re Unsubscribed</h2>
              <p className="mt-2 text-muted-foreground">
                You are currently not receiving marketing emails from RepWell.
              </p>
              <Button className="mt-6" onClick={handleResubscribe} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MailCheck className="mr-2 h-4 w-4" />
                )}
                Resubscribe to Emails
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Master Email Toggle */}
            <Card className="mb-6">
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
                    <Label className="text-base font-medium">All Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Master toggle for all email notifications
                    </p>
                  </div>
                  <Switch
                    checked={preferences?.email_enabled ?? true}
                    onCheckedChange={(checked) => handleSave({ email_enabled: checked })}
                    disabled={saving}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Email Categories */}
            {preferences?.email_enabled && (
              <Card className="mb-6">
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
                            <div className="mt-0.5 rounded-md bg-repwell-sage-100/50 p-2">
                              <Icon className="h-4 w-4 text-repwell-teal-400" />
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
              <Card className="mb-6">
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
                              ? "border-repwell-teal-300 bg-repwell-sage-100/30"
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
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Moon className="h-5 w-5" />
                        Quiet Hours
                      </CardTitle>
                      <CardDescription>
                        Pause non-urgent emails during specific hours
                      </CardDescription>
                    </div>
                    <Switch
                      aria-label="Enable quiet hours"
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
                      Critical alerts will still be delivered immediately.
                    </p>
                  </CardContent>
                )}
              </Card>
            )}
          </>
        )}

        {/* Footer Links */}
        <div className="mt-8 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Want to unsubscribe from all emails?{" "}
            <Link href={`/unsubscribe/${token}`} className="underline hover:text-foreground">
              Click here
            </Link>
          </p>
          <p className="text-xs text-muted-foreground">
            Having trouble?{" "}
            <a href="mailto:support@repwell.com" className="underline hover:text-foreground">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
