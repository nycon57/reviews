"use client";

import type { ReactNode } from "react";
import { Slider } from "@/components/ui/slider";

interface RawSliderInputProps {
  icon?: ReactNode;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

export function RawSliderInput({
  icon,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix = "",
}: RawSliderInputProps) {
  return (
    <div className="flex items-center gap-2">
      {icon && (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground">
          {icon}
        </span>
      )}
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="flex-1"
      />
      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {value}
        {suffix}
      </span>
    </div>
  );
}
