"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleNotch, Check, LinkSimple } from "@phosphor-icons/react";
import {
  getSmartLinkSettings,
  updateSmartLinkSettings,
} from "@/lib/share-studio/actions";

export function SmartLinksTab() {
  const [ctaUrl, setCtaUrl] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSmartLinkSettings()
      .then((settings) => {
        if (settings) {
          setCtaUrl(settings.ctaButtonUrl ?? "");
          setCtaText(settings.ctaButtonText ?? "");
        }
      })
      .catch((err) => {
        console.error("Failed to load smart link settings:", err);
        setError("Failed to load settings. Please refresh the page.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const result = await updateSmartLinkSettings(
      ctaUrl.trim() || null,
      ctaText.trim() || null
    );

    setSaving(false);

    if (!result.success) {
      setError(result.error ?? "Failed to save settings");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CircleNotch className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkSimple className="h-5 w-5 text-primary" weight="duotone" />
          Smart Link Defaults
        </CardTitle>
        <CardDescription>
          These settings apply to all new Smart Links you create. They also
          appear on your professional profile page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="cta-url">CTA Destination URL</Label>
          <Input
            id="cta-url"
            type="url"
            placeholder="https://yourwebsite.com/apply"
            value={ctaUrl}
            onChange={(e) => setCtaUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Where the call-to-action button sends visitors on your Smart Link pages.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cta-text">CTA Button Text</Label>
          <Input
            id="cta-text"
            placeholder='e.g. "Get Started" or "Apply Now"'
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <>
              <CircleNotch className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : saved ? (
            <>
              <Check className="h-4 w-4" weight="bold" />
              Saved
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
