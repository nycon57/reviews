"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

export function SwitchField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <Label className="text-xs font-medium text-repwell-teal-400">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [mode, setMode] = useState<"hex" | "rgb">("hex");
  const [localHex, setLocalHex] = useState(value);
  useEffect(() => { setLocalHex(value); }, [value]);

  const rgbValue = useMemo(() => {
    const cleaned = value.replace("#", "");
    let hex6 = "";
    if (cleaned.length === 6) {
      hex6 = cleaned;
    } else if (cleaned.length === 3) {
      hex6 = cleaned[0] + cleaned[0] + cleaned[1] + cleaned[1] + cleaned[2] + cleaned[2];
    } else {
      return "0, 0, 0";
    }
    const r = parseInt(hex6.slice(0, 2), 16);
    const g = parseInt(hex6.slice(2, 4), 16);
    const b = parseInt(hex6.slice(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }, [value]);

  const handleRgbChange = (rgbStr: string) => {
    const parts = rgbStr.split(",").map((s) => parseInt(s.trim(), 10));
    if (parts.length === 3 && parts.every((n) => !isNaN(n) && n >= 0 && n <= 255)) {
      const hex = `#${parts.map((n) => n.toString(16).padStart(2, "0")).join("")}`;
      onChange(hex);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-shrink-0">
        <input
          type="color"
          value={value.startsWith("#") ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-8 h-8 opacity-0 cursor-pointer"
          aria-label={`Pick ${label} color`}
        />
        <div
          className="w-8 h-8 rounded-md border border-border shadow-sm hover:shadow-md transition-shadow pointer-events-none"
          style={{ background: value }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">{label}</Label>
          <button
            type="button"
            onClick={() => setMode(mode === "hex" ? "rgb" : "hex")}
            className="text-[9px] font-medium text-muted-foreground/60 hover:text-repwell-teal-300 transition-colors uppercase"
          >
            {mode === "hex" ? "RGB" : "HEX"}
          </button>
        </div>
        {mode === "hex" ? (
          <Input
            value={localHex}
            onChange={(e) => {
              const v = e.target.value;
              setLocalHex(v);
              if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) {
                onChange(v);
              }
            }}
            className="h-7 text-xs font-mono mt-0.5"
            placeholder="#000000"
          />
        ) : (
          <Input
            value={rgbValue}
            onChange={(e) => handleRgbChange(e.target.value)}
            className="h-7 text-xs font-mono mt-0.5"
            placeholder="0, 0, 0"
          />
        )}
      </div>
    </div>
  );
}

export function ChipInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  const [inputValue, setInputValue] = useState("");

  const addChip = useCallback(() => {
    const trimmed = inputValue.trim().toLowerCase();
    if (!trimmed || values.includes(trimmed)) return;
    onChange([...values, trimmed]);
    setInputValue("");
  }, [inputValue, values, onChange]);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addChip();
            }
          }}
          placeholder={placeholder}
          className="flex-1 h-7 text-xs"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addChip}
          className="h-7 w-7 p-0"
        >
          <Plus size={14} />
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium
                bg-repwell-sage-100/40 text-repwell-teal-400 rounded-md border border-repwell-sage-200/50"
            >
              {chip}
              <button
                type="button"
                onClick={() => onChange(values.filter((v) => v !== chip))}
                className="text-repwell-teal-400/50 hover:text-red-500 transition-colors"
                aria-label={`Remove ${chip}`}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
