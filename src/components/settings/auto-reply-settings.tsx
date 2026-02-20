"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Robot, Info } from "@phosphor-icons/react";
import {
  getAutoReplyFeatureAccess,
  getAutoReplySettings,
  updateAutoReplySettings,
} from "@/lib/reviews/auto-reply-actions";
import { type AutoReplySettings, DEFAULT_AUTO_REPLY_SETTINGS } from "@/lib/reviews/types";

export function AutoReplySettingsCard() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [settings, setSettings] = React.useState<AutoReplySettings>(
    DEFAULT_AUTO_REPLY_SETTINGS
  );

  React.useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const result = await getAutoReplySettings();
        if (result.success && result.data) {
          setSettings(result.data);
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to load auto-reply settings",
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to load auto-reply settings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- toast is stable
  }, []);

  const handleSave = async (updates: Partial<AutoReplySettings>) => {
    setSaving(true);
    const result = await updateAutoReplySettings(updates);
    if (result.success) {
      setSettings((prev) => ({ ...prev, ...updates }));
      toast({
        title: "Settings saved",
        description: "Auto-reply settings have been updated.",
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to save settings",
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
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Robot className="h-5 w-5" />
          AI Auto-Reply
        </CardTitle>
        <CardDescription>
          Automatically generate and post AI responses to new reviews
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Enable Auto-Reply</Label>
            <p className="text-xs text-muted-foreground">
              AI will respond when no manual response is posted within 24 hours
            </p>
          </div>
          <Switch
            checked={settings.auto_reply_enabled}
            onCheckedChange={(checked) =>
              handleSave({ auto_reply_enabled: checked })
            }
            disabled={saving}
          />
        </div>

        {settings.auto_reply_enabled && (
          <div className="space-y-4 rounded-lg border p-4">
            {/* Tone */}
            <div className="space-y-2">
              <Label>Response Tone</Label>
              <Select
                value={settings.auto_reply_tone}
                onValueChange={(value) =>
                  handleSave({
                    auto_reply_tone: value as AutoReplySettings["auto_reply_tone"],
                  })
                }
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="empathetic">Empathetic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Response window */}
            <div className="space-y-2">
              <Label>Response Window</Label>
              <p className="text-xs text-muted-foreground">
                Reviews are auto-responded 24 hours after approval if no manual
                response is posted.
              </p>
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm font-medium">
                24 hours (fixed)
              </div>
            </div>

            {/* Min rating */}
            <div className="space-y-2">
              <Label>Minimum Rating</Label>
              <p className="text-xs text-muted-foreground">
                Only auto-reply to reviews at or above this rating
              </p>
              <Select
                value={settings.auto_reply_min_rating.toString()}
                onValueChange={(value) =>
                  handleSave({
                    auto_reply_min_rating: parseInt(value) as AutoReplySettings["auto_reply_min_rating"],
                  })
                }
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">All reviews</SelectItem>
                  <SelectItem value="3">3+ stars</SelectItem>
                  <SelectItem value="4">4+ stars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3">
              <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">
                Reviews are processed every 15 minutes. Manual responses cancel
                pending auto-replies. Team members can opt out in notification
                preferences.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Tab wrapper that checks subscription tier and renders
 * either the full settings card or the upgrade CTA.
 */
export function AutoReplyTab() {
  const [isPro, setIsPro] = React.useState<boolean | null>(null);
  const [loadError, setLoadError] = React.useState(false);

  React.useEffect(() => {
    const checkTier = async () => {
      try {
        const result = await getAutoReplyFeatureAccess();
        if (result.success && result.data) {
          setIsPro(result.data.hasAccess);
        } else if (result.success && !result.data) {
          // Success but no data payload — treat as error
          setLoadError(true);
        } else if (
          result.error === "Unauthorized" ||
          result.error === "Organization not found"
        ) {
          setIsPro(false);
        } else {
          setLoadError(true);
        }
      } catch {
        setLoadError(true);
      }
    };
    checkTier();
  }, []);

  if (loadError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Robot className="h-5 w-5" />
            AI Auto-Reply
          </CardTitle>
          <CardDescription>
            Failed to load auto-reply settings. Please try again later.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isPro === null) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return isPro ? <AutoReplySettingsCard /> : <AutoReplyUpgradeCTA />;
}

/**
 * Upgrade CTA shown to basic-tier users.
 */
export function AutoReplyUpgradeCTA() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Robot className="h-5 w-5" />
          AI Auto-Reply
        </CardTitle>
        <CardDescription>
          Automatically respond to reviews with AI-generated replies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-dashed p-6 text-center">
          <Robot className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">Available on Professional & Enterprise</p>
          <p className="text-xs text-muted-foreground mt-1">
            Upgrade to automatically respond to reviews with personalized AI
            replies.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
