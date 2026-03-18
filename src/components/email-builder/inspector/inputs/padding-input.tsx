"use client";

import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "@phosphor-icons/react";
import { Label } from "@/components/ui/label";
import { RawSliderInput } from "./raw-slider-input";

interface Padding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface PaddingInputProps {
  label: string;
  value: Padding | null | undefined;
  onChange: (value: Padding) => void;
}

const DEFAULT_PADDING: Padding = { top: 0, bottom: 0, left: 0, right: 0 };

export function PaddingInput({ label, value, onChange }: PaddingInputProps) {
  const current = value ?? DEFAULT_PADDING;

  function update(side: keyof Padding, v: number) {
    onChange({ ...current, [side]: v });
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="space-y-1.5">
        <RawSliderInput
          icon={<ArrowUp size={14} />}
          value={current.top}
          onChange={(v) => update("top", v)}
          max={80}
          suffix="px"
        />
        <RawSliderInput
          icon={<ArrowDown size={14} />}
          value={current.bottom}
          onChange={(v) => update("bottom", v)}
          max={80}
          suffix="px"
        />
        <RawSliderInput
          icon={<ArrowLeft size={14} />}
          value={current.left}
          onChange={(v) => update("left", v)}
          max={80}
          suffix="px"
        />
        <RawSliderInput
          icon={<ArrowRight size={14} />}
          value={current.right}
          onChange={(v) => update("right", v)}
          max={80}
          suffix="px"
        />
      </div>
    </div>
  );
}
