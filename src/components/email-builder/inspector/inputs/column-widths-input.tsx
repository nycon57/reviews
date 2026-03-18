"use client";

import { Label } from "@/components/ui/label";
import { TextDimensionInput } from "./text-dimension-input";

type FixedWidths = [
  number | null | undefined,
  number | null | undefined,
  number | null | undefined,
];

interface ColumnWidthsInputProps {
  label: string;
  value: FixedWidths | null | undefined;
  onChange: (value: FixedWidths) => void;
  columnsCount: 2 | 3;
}

export function ColumnWidthsInput({
  label,
  value,
  onChange,
  columnsCount,
}: ColumnWidthsInputProps) {
  const current: FixedWidths = value ?? [null, null, null];

  function updateColumn(index: number, v: number | null) {
    const next: FixedWidths = [...current];
    next[index] = v;
    onChange(next);
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <TextDimensionInput
            label="Col 1"
            value={current[0]}
            onChange={(v) => updateColumn(0, v)}
          />
        </div>
        <div className="flex-1">
          <TextDimensionInput
            label="Col 2"
            value={current[1]}
            onChange={(v) => updateColumn(1, v)}
          />
        </div>
        {columnsCount === 3 && (
          <div className="flex-1">
            <TextDimensionInput
              label="Col 3"
              value={current[2]}
              onChange={(v) => updateColumn(2, v)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
