"use client";

import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface RadioGroupOption {
  value: string;
  label?: string;
  icon?: ReactNode;
}

interface RadioGroupInputProps {
  label: string;
  value: string | null | undefined;
  onChange: (value: string) => void;
  options: RadioGroupOption[];
}

export function RadioGroupInput({
  label,
  value,
  onChange,
  options,
}: RadioGroupInputProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <ToggleGroup
        type="single"
        value={value ?? ""}
        onValueChange={(v) => {
          if (v) onChange(v);
        }}
        className="justify-start"
      >
        {options.map((opt) => (
          <ToggleGroupItem
            key={opt.value}
            value={opt.value}
            aria-label={opt.label ?? opt.value}
            size="sm"
          >
            {opt.icon ?? opt.label ?? opt.value}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
