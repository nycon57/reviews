"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleNotch, LinkSimple, Info } from "@phosphor-icons/react";
import { getSmartLinkSettings } from "@/lib/share-studio/actions";

export function SmartLinksTab() {
  const [ctaUrl, setCtaUrl] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [loading, setLoading] = useState(true);

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
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

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
          These settings appear on your Smart Links and professional profile page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-muted-foreground">CTA Destination URL</p>
          <p className="text-sm rounded-md border bg-muted/50 px-3 py-2">
            {ctaUrl || <span className="text-muted-foreground italic">Not set</span>}
          </p>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium text-muted-foreground">CTA Button Text</p>
          <p className="text-sm rounded-md border bg-muted/50 px-3 py-2">
            {ctaText || <span className="text-muted-foreground italic">Not set</span>}
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-repwell-sage-100/30 dark:bg-repwell-teal-300/10 p-3">
          <Info className="h-4 w-4 text-repwell-teal-300 shrink-0 mt-0.5" />
          <p className="text-xs text-repwell-teal-300">
            CTA settings are managed from your Profile tab under Business Settings
            (individual accounts) or by your organization admin (enterprise accounts).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
