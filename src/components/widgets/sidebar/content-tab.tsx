"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SwitchField } from "./shared-fields";
import type { WidgetConfigJson } from "@/lib/widgets/schemas";
import type { WidgetType } from "@/lib/widgets/types";

interface ContentTabProps {
  config: WidgetConfigJson;
  widgetType: WidgetType;
  onConfigChange: (config: Partial<WidgetConfigJson>) => void;
}

export function ContentTab({ config, widgetType, onConfigChange }: ContentTabProps) {
  const content = config.content ?? {};

  const update = (field: string, value: unknown) => {
    onConfigChange({ content: { ...content, [field]: value } });
  };

  const isMortgageRelated = ["lo_review", "branch_review", "company_review"].includes(widgetType);
  const isProWidget = widgetType === "lo_review";

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
            <SelectItem value="es">Espa\u00f1ol (Spanish)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground mt-1">
          Controls widget UI labels and date formatting. Review text stays in its original language.
        </p>
      </div>

      <SwitchField
        label="Show Header"
        checked={content.showHeader !== false}
        onChange={(v) => update("showHeader", v)}
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
      <SwitchField
        label="Show Branding"
        checked={content.showBranding !== false}
        onChange={(v) => update("showBranding", v)}
      />
      <SwitchField
        label="Show Interactive Filters"
        checked={content.showFilters === true}
        onChange={(v) => update("showFilters", v)}
      />

      <div>
        <Label className="text-xs text-muted-foreground">
          Truncate Length ({content.truncateLength ?? 300} chars)
        </Label>
        <Slider
          value={[content.truncateLength ?? 300]}
          onValueChange={([v]) => update("truncateLength", v)}
          min={0}
          max={1000}
          step={50}
          className="mt-2"
        />
      </div>

      <div className="border-t border-border pt-4">
        <Label className="text-sm font-semibold text-repwell-teal-500 mb-3 block">
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
                placeholder="Leave a Review"
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
          </div>
        )}
      </div>

      {isMortgageRelated && (
        <div className="border-t border-border pt-4">
          <Label className="text-sm font-semibold text-repwell-teal-500 mb-3 block">
            Compliance
          </Label>
          {isProWidget ? (
            <div className="flex items-center justify-between py-1">
              <Label className="text-xs font-medium text-repwell-teal-400">Show NMLS Number</Label>
              <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Required</span>
            </div>
          ) : (
            <SwitchField
              label="Show NMLS Number"
              checked={content.showNMLS !== false}
              onChange={(v) => update("showNMLS", v)}
            />
          )}
          <SwitchField
            label="Show Disclaimer & Equal Housing"
            checked={content.showDisclaimer === true}
            onChange={(v) => update("showDisclaimer", v)}
          />
          {content.showDisclaimer && (
            <div className="mt-2">
              <Label className="text-xs text-muted-foreground">Disclaimer Text</Label>
              <Input
                value={content.disclaimerText ?? ""}
                onChange={(e) => update("disclaimerText", e.target.value)}
                className="h-8 text-xs mt-1"
                placeholder="This is not a commitment to lend\u2026"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Leave empty for default compliance text. Minimum 10px font enforced.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
