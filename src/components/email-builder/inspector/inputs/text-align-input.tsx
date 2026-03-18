"use client";

import {
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
} from "@phosphor-icons/react";
import { RadioGroupInput } from "./radio-group-input";

interface TextAlignInputProps {
  label: string;
  value: "left" | "center" | "right" | null | undefined;
  onChange: (value: "left" | "center" | "right") => void;
}

export function TextAlignInput({
  label,
  value,
  onChange,
}: TextAlignInputProps) {
  return (
    <RadioGroupInput
      label={label}
      value={value}
      onChange={(v) => onChange(v as "left" | "center" | "right")}
      options={[
        {
          value: "left",
          label: "Left",
          icon: <TextAlignLeft size={16} />,
        },
        {
          value: "center",
          label: "Center",
          icon: <TextAlignCenter size={16} />,
        },
        {
          value: "right",
          label: "Right",
          icon: <TextAlignRight size={16} />,
        },
      ]}
    />
  );
}
