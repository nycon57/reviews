"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { Question, TextQuestion } from "@/types/survey.types";

interface TextSettingsProps {
  question: TextQuestion;
  onChange: (q: Question) => void;
}

export function TextSettings({ question, onChange }: TextSettingsProps) {
  const config = question.config ?? { multiline: false };
  const [lengthError, setLengthError] = useState<string | null>(null);

  const updateConfig = (updates: Partial<TextQuestion["config"]>) => {
    const next = { ...config, ...updates };
    const min = next.minLength;
    const max = next.maxLength;
    if (min !== undefined && max !== undefined && min > max) {
      setLengthError("Minimum length cannot exceed maximum length");
      return;
    }
    setLengthError(null);
    onChange({
      ...question,
      config: next,
    });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
        <div>
          <Label htmlFor="multiline" className="cursor-pointer">
            Multi-line Response
          </Label>
          <p className="text-xs text-muted-foreground">
            Allow longer responses with a textarea
          </p>
        </div>
        <Switch
          id="multiline"
          checked={config.multiline ?? false}
          onCheckedChange={(checked) => updateConfig({ multiline: checked })}
        />
      </div>

      <div className="sm:col-span-2">
        <Label htmlFor="placeholder">Placeholder Text</Label>
        <Input
          id="placeholder"
          value={config.placeholder || ""}
          onChange={(e) => updateConfig({ placeholder: e.target.value })}
          placeholder="e.g., Enter your response..."
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="min-length">Minimum Length</Label>
        <Input
          id="min-length"
          type="number"
          min={0}
          max={config.maxLength ?? undefined}
          value={config.minLength || ""}
          onChange={(e) =>
            updateConfig({
              minLength: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          placeholder="No minimum"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="max-length">Maximum Length</Label>
        <Input
          id="max-length"
          type="number"
          min={config.minLength ?? 1}
          value={config.maxLength || ""}
          onChange={(e) =>
            updateConfig({
              maxLength: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          placeholder="No maximum"
          className="mt-1.5"
        />
      </div>

      {lengthError && (
        <p className="text-sm text-destructive sm:col-span-2">{lengthError}</p>
      )}
    </div>
  );
}
