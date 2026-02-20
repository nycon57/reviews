"use client";

import { useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, X } from "@phosphor-icons/react";
import type { Question, MultipleChoiceQuestion } from "@/types/survey.types";

interface MultipleChoiceSettingsProps {
  question: MultipleChoiceQuestion;
  onChange: (q: Question) => void;
}

export function MultipleChoiceSettings({ question, onChange }: MultipleChoiceSettingsProps) {
  const defaultOptionsRef = useRef([
    { id: crypto.randomUUID(), label: "Option 1", value: "option_1" },
    { id: crypto.randomUUID(), label: "Option 2", value: "option_2" },
  ]);
  const defaultOptions = defaultOptionsRef.current;
  const config = question.config ?? { options: defaultOptions, allowMultiple: false, allowOther: false };
  const options = config.options ?? defaultOptions;

  const updateConfig = (updates: Partial<MultipleChoiceQuestion["config"]>) => {
    onChange({
      ...question,
      config: { ...config, ...updates },
    });
  };

  const addOption = () => {
    const newOption = {
      id: globalThis.crypto.randomUUID(),
      label: `Option ${options.length + 1}`,
      value: `option_${options.length + 1}`,
    };
    updateConfig({ options: [...options, newOption] });
  };

  const updateOption = (
    index: number,
    updates: Partial<MultipleChoiceQuestion["config"]["options"][0]>,
  ) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], ...updates };
    updateConfig({ options: newOptions });
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== index);
    updateConfig({ options: newOptions });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label htmlFor="allow-multiple" className="cursor-pointer">
              Allow Multiple Selections
            </Label>
            <p className="text-xs text-muted-foreground">
              Respondents can select more than one option
            </p>
          </div>
          <Switch
            id="allow-multiple"
            checked={config.allowMultiple ?? false}
            onCheckedChange={(checked) => updateConfig({ allowMultiple: checked })}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label htmlFor="allow-other" className="cursor-pointer">
              Allow &quot;Other&quot; Option
            </Label>
            <p className="text-xs text-muted-foreground">
              Add a text field for custom responses
            </p>
          </div>
          <Switch
            id="allow-other"
            checked={config.allowOther ?? false}
            onCheckedChange={(checked) => updateConfig({ allowOther: checked })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Answer Options</Label>
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground">
                {index + 1}.
              </div>
              <Input
                value={option.label}
                onChange={(e) => updateOption(index, { label: e.target.value })}
                placeholder={`Option ${index + 1}`}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => removeOption(index)}
                disabled={options.length <= 2}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={addOption}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Option
        </Button>
      </div>
    </div>
  );
}
