"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface TextDimensionInputProps {
  label: string;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  placeholder?: string;
}

export function TextDimensionInput({
  label,
  value,
  onChange,
  placeholder = "auto",
}: TextDimensionInputProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          value={value ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              onChange(null);
            } else {
              const parsed = Number(raw);
              onChange(Number.isFinite(parsed) ? parsed : null);
            }
          }}
          className="pr-8 text-sm"
          placeholder={placeholder}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          px
        </span>
      </div>
    </div>
  );
}
