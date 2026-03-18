"use client";

import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { X } from "@phosphor-icons/react";

const PRESET_COLORS = [
  "#000000",
  "#333333",
  "#555555",
  "#888888",
  "#bbbbbb",
  "#ffffff",
  "#2f3e46",
  "#354f52",
  "#52796f",
  "#84a98c",
  "#cad2c5",
  "#f8faf8",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
];

function Swatch({
  color,
  isActive,
  onClick,
}: {
  color: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`h-6 w-6 rounded border transition-all ${
        isActive
          ? "border-primary ring-2 ring-primary/30"
          : "border-border hover:border-primary/50"
      }`}
      style={{ backgroundColor: color }}
      onClick={onClick}
      aria-label={`Select color ${color}`}
    />
  );
}

interface ColorInputProps {
  label: string;
  value: string | null | undefined;
  onChange: (value: string) => void;
}

export function ColorInput({ label, value, onChange }: ColorInputProps) {
  const [open, setOpen] = useState(false);
  const currentColor = value ?? "#000000";

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm transition-colors hover:bg-accent"
          >
            <span
              className="h-5 w-5 shrink-0 rounded border border-border"
              style={{ backgroundColor: currentColor }}
            />
            <span className="flex-1 text-left font-mono text-xs">
              {currentColor}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start" side="left">
          <div className="space-y-3">
            <HexColorPicker
              color={currentColor}
              onChange={onChange}
              style={{ width: "100%" }}
            />
            <Input
              value={currentColor}
              onChange={(e) => onChange(e.target.value)}
              className="h-8 font-mono text-xs"
              placeholder="#000000"
            />
            <div className="grid grid-cols-6 gap-1.5">
              {PRESET_COLORS.map((c) => (
                <Swatch
                  key={c}
                  color={c}
                  isActive={currentColor.toLowerCase() === c.toLowerCase()}
                  onClick={() => onChange(c)}
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface NullableColorInputProps {
  label: string;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  defaultValue?: string;
}

export function NullableColorInput({
  label,
  value,
  onChange,
  defaultValue = "#000000",
}: NullableColorInputProps) {
  const [open, setOpen] = useState(false);
  const hasValue = value != null;
  const currentColor = value ?? defaultValue;

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-1.5">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex h-9 flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm transition-colors hover:bg-accent"
            >
              {hasValue ? (
                <>
                  <span
                    className="h-5 w-5 shrink-0 rounded border border-border"
                    style={{ backgroundColor: currentColor }}
                  />
                  <span className="flex-1 text-left font-mono text-xs">
                    {currentColor}
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">
                  No color set
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start" side="left">
            <div className="space-y-3">
              <HexColorPicker
                color={currentColor}
                onChange={(c) => onChange(c)}
                style={{ width: "100%" }}
              />
              <Input
                value={currentColor}
                onChange={(e) => onChange(e.target.value)}
                className="h-8 font-mono text-xs"
                placeholder="#000000"
              />
              <div className="grid grid-cols-6 gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <Swatch
                    key={c}
                    color={c}
                    isActive={currentColor.toLowerCase() === c.toLowerCase()}
                    onClick={() => onChange(c)}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {hasValue && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => onChange(null)}
            aria-label="Clear color"
          >
            <X size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}
