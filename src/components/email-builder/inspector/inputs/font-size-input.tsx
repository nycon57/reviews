"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FontSizeInputProps {
  label: string;
  value: number | null | undefined;
  onChange: (value: number) => void;
}

export function FontSizeInput({ label, value, onChange }: FontSizeInputProps) {
  const currentValue = value ?? 16;

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          min={8}
          max={120}
          step={1}
          value={currentValue}
          onChange={(e) => {
            const num = parseInt(e.target.value, 10);
            if (!isNaN(num) && num >= 8) {
              onChange(num);
            }
          }}
          className="h-8 pr-8 text-sm"
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          px
        </span>
      </div>
    </div>
  );
}
