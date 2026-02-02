"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { validateCustomCSS } from "@/lib/widgets/css-validation";

const MAX_CSS_LENGTH = 5000;

interface CustomCSSEditorProps {
  value: string;
  onChange: (css: string) => void;
}

export function CustomCSSEditor({ value, onChange }: CustomCSSEditorProps) {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from parent when value changes externally
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback(
    (newValue: string) => {
      setLocalValue(newValue);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChange(newValue);
      }, 300);
    },
    [onChange],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const warnings = useMemo(() => validateCustomCSS(localValue), [localValue]);
  const charCount = localValue.length;
  const isOverLimit = charCount > MAX_CSS_LENGTH;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-repwell-teal-400">
          Custom CSS
        </Label>
        <span
          className={`text-[10px] tabular-nums ${
            isOverLimit ? "text-red-500 font-medium" : "text-muted-foreground"
          }`}
        >
          {charCount.toLocaleString()} / {MAX_CSS_LENGTH.toLocaleString()}
        </span>
      </div>

      <textarea
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={`.rw-widget {
  /* Override widget styles */
  border-radius: 12px;
}

.rw-review {
  background: #f8fafc;
}`}
        className={`
          w-full min-h-[200px] p-3 text-xs leading-relaxed
          font-mono bg-gray-950 text-gray-100
          border rounded-md resize-y
          placeholder:text-gray-600
          focus:outline-none focus:ring-2 focus:ring-repwell-teal-300/50 focus:border-repwell-teal-300
          ${isOverLimit ? "border-red-500" : "border-border"}
        `}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />

      <p className="text-[10px] text-muted-foreground">
        CSS rules are injected inside the widget Shadow DOM. Use{" "}
        <code className="px-1 py-0.5 bg-muted rounded text-[10px]">.rw-*</code>{" "}
        classes to target widget elements.
      </p>

      {warnings.length > 0 && (
        <div className="space-y-1">
          {warnings.map((warning, i) => (
            <div
              key={i}
              className="flex items-start gap-1.5 text-[11px] text-amber-600 bg-amber-50 rounded px-2 py-1.5"
            >
              <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
