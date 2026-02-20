"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { Question, NPSQuestion } from "@/types/survey.types";

interface NPSSettingsProps {
  question: NPSQuestion;
  onChange: (q: Question) => void;
}

export function NPSSettings({ question, onChange }: NPSSettingsProps) {
  const config = question.config ?? {};
  const updateConfig = (updates: Partial<NPSQuestion["config"]>) => {
    onChange({
      ...question,
      config: { ...config, ...updates },
    });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div>
        <Label htmlFor="detractor-label">Detractor Label (0-6)</Label>
        <Input
          id="detractor-label"
          value={config.labels?.detractor || ""}
          onChange={(e) =>
            updateConfig({
              labels: { ...config.labels, detractor: e.target.value },
            })
          }
          placeholder="e.g., Not at all likely"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="passive-label">Passive Label (7-8)</Label>
        <Input
          id="passive-label"
          value={config.labels?.passive || ""}
          onChange={(e) =>
            updateConfig({
              labels: { ...config.labels, passive: e.target.value },
            })
          }
          placeholder="e.g., Neutral"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="promoter-label">Promoter Label (9-10)</Label>
        <Input
          id="promoter-label"
          value={config.labels?.promoter || ""}
          onChange={(e) =>
            updateConfig({
              labels: { ...config.labels, promoter: e.target.value },
            })
          }
          placeholder="e.g., Extremely likely"
          className="mt-1.5"
        />
      </div>
    </div>
  );
}
