"use client";

import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SwitchField } from "./shared-fields";
import { Button } from "@/components/ui/button";
import type { WidgetConfigJson } from "@/lib/widgets/schemas";
import type { WidgetEntityType, WidgetType } from "@/lib/widgets/types";
import { getEntityCtaDefaults } from "@/lib/widgets/actions";
import {
  type EntityCtaDefaults,
  getDefaultCtaLabel,
  isCtaDefaultDriven,
  supportsTruncateLength,
} from "./content-defaults";

function TruncateLengthField({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [localValue, setLocalValue] = useState(String(value));
  const [error, setError] = useState("");

  // Sync from parent when value changes externally
  useEffect(() => {
    setLocalValue(String(value));
    setError("");
  }, [value]);

  const validate = (str: string) => {
    if (str.trim() === "") {
      setError("Enter a number");
      return;
    }
    const v = parseInt(str, 10);
    if (isNaN(v) || v < 0) {
      setError("Must be a positive number");
      return;
    }
    if (v > 2000) {
      setError("Max 2000 characters");
      return;
    }
    setError("");
    onChange(v);
  };

  return (
    <div>
      <Label className="text-xs text-muted-foreground">Max Character Length</Label>
      <Input
        type="number"
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value);
          setError("");
          const v = parseInt(e.target.value, 10);
          if (!isNaN(v) && v >= 0 && v <= 2000) onChange(v);
        }}
        onBlur={() => validate(localValue)}
        min={0}
        max={2000}
        className={`h-8 text-xs mt-1 ${error ? "border-destructive" : ""}`}
        placeholder="300"
      />
      {error && <p className="text-[11px] text-destructive mt-1">{error}</p>}
    </div>
  );
}

interface ContentTabProps {
  config: WidgetConfigJson;
  widgetType: WidgetType;
  entityType: WidgetEntityType;
  entityId: string | null;
  onConfigChange: (config: Partial<WidgetConfigJson>) => void;
}

export function ContentTab({
  config,
  widgetType,
  entityType,
  entityId,
  onConfigChange,
}: ContentTabProps) {
  const content = config.content ?? {};
  const [ctaDefaults, setCtaDefaults] = useState<EntityCtaDefaults | null>(null);
  const previousDefaultsRef = useRef<EntityCtaDefaults | null>(null);

  const update = (field: string, value: unknown) => {
    onConfigChange({ content: { ...content, [field]: value } });
  };

  const canTruncate = supportsTruncateLength(widgetType);

  // Widgets that render individual review cards with reviewer info
  const hasReviewCards = [
    "review_profile", "lo_review", "branch_review", "company_review",
    "review_carousel", "review_wall",
  ].includes(widgetType);
  // Widgets that have a visible header section
  const hasHeader = hasReviewCards || widgetType === "video_testimonial";

  useEffect(() => {
    let cancelled = false;

    void getEntityCtaDefaults(entityType, entityId).then((result) => {
      if (cancelled || !result.success || !result.data) return;
      setCtaDefaults(result.data);
    });

    return () => {
      cancelled = true;
    };
  }, [entityType, entityId]);

  useEffect(() => {
    if (!content.showCTA || !ctaDefaults) return;

    const priorDefaults = previousDefaultsRef.current;
    const shouldApplyDefaults = isCtaDefaultDriven(config.content, priorDefaults);
    previousDefaultsRef.current = ctaDefaults;

    if (!shouldApplyDefaults) return;

    if (content.ctaText === ctaDefaults.text && content.ctaUrl === ctaDefaults.url) {
      return;
    }

    onConfigChange({
      content: {
        ...content,
        ctaText: ctaDefaults.text,
        ctaUrl: ctaDefaults.url,
      },
    });
  }, [
    config.content,
    content,
    content.ctaText,
    content.ctaUrl,
    content.showCTA,
    ctaDefaults,
    onConfigChange,
  ]);

  const hasCustomizedCta =
    content.showCTA === true &&
    !!ctaDefaults &&
    !isCtaDefaultDriven(config.content, ctaDefaults);

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs text-muted-foreground">Language</Label>
        <Select
          value={content.language ?? "en"}
          onValueChange={(v) => update("language", v)}
        >
          <SelectTrigger className="h-8 text-xs mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground mt-1">
          Controls widget UI labels and date formatting. Review text stays in its original language.
        </p>
      </div>

      {hasHeader && (
        <>
          <SwitchField
            label="Show Header"
            checked={content.showHeader !== false}
            onChange={(v) => {
              update("showHeader", v);
              if (v && !content.headerText) {
                update("headerText", "Customer Reviews");
              }
            }}
          />
          {content.showHeader !== false && (
            <div>
              <Label className="text-xs text-muted-foreground">Header Text</Label>
              <Input
                value={content.headerText ?? ""}
                onChange={(e) => update("headerText", e.target.value)}
                className="h-8 text-xs mt-1"
                placeholder="Customer Reviews"
              />
            </div>
          )}
        </>
      )}

      {hasReviewCards && (
        <>
          <SwitchField
            label="Show Avatars"
            checked={content.showAvatar !== false}
            onChange={(v) => update("showAvatar", v)}
          />
          <SwitchField
            label="Show Dates"
            checked={content.showDate !== false}
            onChange={(v) => update("showDate", v)}
          />
          <SwitchField
            label="Show Source"
            checked={content.showSource !== false}
            onChange={(v) => update("showSource", v)}
          />
        </>
      )}

      {canTruncate && (
        <TruncateLengthField
          value={content.truncateLength ?? 300}
          onChange={(v) => update("truncateLength", v)}
        />
      )}

      <div className="border-t border-border pt-4">
        <Label className="text-sm font-semibold text-heading mb-3 block">
          Call to Action
        </Label>
        <SwitchField
          label="Show CTA Button"
          checked={content.showCTA === true}
          onChange={(v) => update("showCTA", v)}
        />
        {content.showCTA && (
          <div className="space-y-2 mt-2">
            <div>
              <Label className="text-xs text-muted-foreground">Button Text</Label>
              <Input
                value={content.ctaText ?? ""}
                onChange={(e) => update("ctaText", e.target.value)}
                className="h-8 text-xs mt-1"
                placeholder={getDefaultCtaLabel(entityType)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Button URL</Label>
              <Input
                value={content.ctaUrl ?? ""}
                onChange={(e) => update("ctaUrl", e.target.value)}
                className="h-8 text-xs mt-1"
                placeholder="https://\u2026"
              />
            </div>
            {hasCustomizedCta && ctaDefaults && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  onClick={() =>
                    onConfigChange({
                      content: {
                        ...content,
                        ctaText: ctaDefaults.text,
                        ctaUrl: ctaDefaults.url,
                      },
                    })
                  }
                >
                  Reset to default
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
