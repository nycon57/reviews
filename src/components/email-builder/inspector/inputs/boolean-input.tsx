"use client";

import { useId } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface BooleanInputProps {
  label: string;
  value: boolean | null | undefined;
  onChange: (value: boolean) => void;
}

export function BooleanInput({ label, value, onChange }: BooleanInputProps) {
  const reactId = useId();
  const id = `boolean-input-${label.toLowerCase().replace(/\s+/g, "-")}-${reactId}`;

  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Switch
        id={id}
        checked={!!value}
        onCheckedChange={(checked) => onChange(checked)}
      />
    </div>
  );
}
