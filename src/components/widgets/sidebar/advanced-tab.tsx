"use client";

import { Label } from "@/components/ui/label";
import { CustomCSSEditor } from "../custom-css-editor";
import { HooksDocumentation } from "../hooks-documentation";
import type { WidgetConfigJson } from "@/lib/widgets/schemas";

interface AdvancedTabProps {
  config: WidgetConfigJson;
  onConfigChange: (config: Partial<WidgetConfigJson>) => void;
}

export function AdvancedTab({ config, onConfigChange }: AdvancedTabProps) {
  const customCSS = config.advanced?.customCSS ?? "";

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-semibold text-heading mb-1 block">
          Custom CSS
        </Label>
        <p className="text-xs text-muted-foreground mb-3">
          Add custom CSS rules to fine-tune the widget appearance. Rules are
          injected inside the Shadow DOM after built-in styles.
        </p>
        <CustomCSSEditor
          value={customCSS}
          onChange={(css) =>
            onConfigChange({ advanced: { customCSS: css || undefined } })
          }
        />
      </div>

      <div className="border-t pt-4">
        <HooksDocumentation />
      </div>
    </div>
  );
}
