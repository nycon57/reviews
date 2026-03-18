"use client";

import { RadioGroupInput } from "./radio-group-input";

interface FontWeightInputProps {
  label: string;
  value: "bold" | "normal" | null | undefined;
  onChange: (value: "bold" | "normal") => void;
}

export function FontWeightInput({
  label,
  value,
  onChange,
}: FontWeightInputProps) {
  return (
    <RadioGroupInput
      label={label}
      value={value}
      onChange={(v) => onChange(v as "bold" | "normal")}
      options={[
        { value: "normal", label: "Normal" },
        { value: "bold", label: "Bold" },
      ]}
    />
  );
}
