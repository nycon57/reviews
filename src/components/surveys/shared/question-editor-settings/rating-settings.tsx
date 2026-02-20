"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Question, RatingQuestion } from "@/types/survey.types";

interface RatingSettingsProps {
  question: RatingQuestion;
  onChange: (q: Question) => void;
}

export function RatingSettings({ question, onChange }: RatingSettingsProps) {
  const config = question.config ?? { maxRating: 5 };
  const updateConfig = (updates: Partial<RatingQuestion["config"]>) => {
    onChange({
      ...question,
      config: { ...config, ...updates },
    });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="max-rating">Rating Scale</Label>
        <Select
          value={String(config.maxRating ?? 5)}
          onValueChange={(v) => updateConfig({ maxRating: Number(v) })}
        >
          <SelectTrigger id="max-rating" className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">1-5 Stars</SelectItem>
            <SelectItem value="10">1-10 Stars</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="low-label">Low Rating Label</Label>
          <Input
            id="low-label"
            value={config.labels?.low || ""}
            onChange={(e) =>
              updateConfig({
                labels: { ...config.labels, low: e.target.value },
              })
            }
            placeholder="e.g., Poor"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="high-label">High Rating Label</Label>
          <Input
            id="high-label"
            value={config.labels?.high || ""}
            onChange={(e) =>
              updateConfig({
                labels: { ...config.labels, high: e.target.value },
              })
            }
            placeholder="e.g., Excellent"
            className="mt-1.5"
          />
        </div>
      </div>
    </div>
  );
}
