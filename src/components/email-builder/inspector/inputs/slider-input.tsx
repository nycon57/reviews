"use client";

import { useId } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface SliderInputProps {
  label: string;
  value: number | null | undefined;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  defaultValue?: number;
}

export function SliderInput({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix = "",
  defaultValue = 0,
}: SliderInputProps) {
  const id = useId();
  const currentValue = value ?? defaultValue;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs">{label}</Label>
        <span className="text-xs tabular-nums text-muted-foreground">
          {currentValue}
          {suffix}
        </span>
      </div>
      <Slider
        id={id}
        value={[currentValue]}
        onValueChange={(payload) => {
          const v = Array.isArray(payload) ? payload[0] : undefined;
          if (v != null) onChange(v);
        }}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}
