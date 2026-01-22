"use client";

import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface TrafficSplitSliderProps {
  variants: { id: string; name: string }[];
  value: Record<string, number>;
  onChange: (split: Record<string, number>) => void;
  disabled?: boolean;
}

const VARIANT_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-purple-500",
];

export function TrafficSplitSlider({
  variants,
  value,
  onChange,
  disabled = false,
}: TrafficSplitSliderProps) {
  const [localSplit, setLocalSplit] = useState(value);

  useEffect(() => {
    setLocalSplit(value);
  }, [value]);

  const handleChange = (variantId: string, newValue: number) => {
    if (disabled) return;

    const otherVariants = variants.filter((v) => v.id !== variantId);
    const currentOthersTotal = otherVariants.reduce(
      (sum, v) => sum + (localSplit[v.id] || 0),
      0
    );

    // Calculate how much we need to adjust
    const newOthersTotal = 100 - newValue;
    const adjustment = newOthersTotal - currentOthersTotal;

    // Distribute adjustment proportionally among other variants
    const newSplit: Record<string, number> = { ...localSplit, [variantId]: newValue };

    if (otherVariants.length > 0 && currentOthersTotal > 0) {
      const adjustmentPerPoint = adjustment / currentOthersTotal;
      otherVariants.forEach((v) => {
        const currentVal = localSplit[v.id] || 0;
        const newVal = Math.max(1, Math.round(currentVal * (1 + adjustmentPerPoint)));
        newSplit[v.id] = newVal;
      });

      // Ensure it sums to 100
      const total = Object.values(newSplit).reduce((sum, v) => sum + v, 0);
      if (total !== 100) {
        // Adjust the last variant
        const lastVariant = otherVariants[otherVariants.length - 1];
        if (lastVariant) {
          newSplit[lastVariant.id] = (newSplit[lastVariant.id] || 0) + (100 - total);
        }
      }
    } else if (otherVariants.length === 1) {
      // Only one other variant, give it the remainder
      newSplit[otherVariants[0].id] = 100 - newValue;
    }

    // Ensure all values are positive
    Object.keys(newSplit).forEach((key) => {
      newSplit[key] = Math.max(1, newSplit[key]);
    });

    setLocalSplit(newSplit);
    onChange(newSplit);
  };

  const total = Object.values(localSplit).reduce((sum, v) => sum + v, 0);

  return (
    <div className="space-y-6">
      {/* Visual bar showing split */}
      <div className="h-8 w-full rounded-md overflow-hidden flex">
        {variants.map((variant, index) => {
          const percentage = localSplit[variant.id] || 0;
          return (
            <div
              key={variant.id}
              className={cn(
                VARIANT_COLORS[index % VARIANT_COLORS.length],
                "flex items-center justify-center text-white text-xs font-medium transition-all"
              )}
              style={{ width: `${percentage}%` }}
            >
              {percentage >= 10 && `${percentage}%`}
            </div>
          );
        })}
      </div>

      {/* Individual sliders */}
      <div className="space-y-4">
        {variants.map((variant, index) => (
          <div key={variant.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-3 w-3 rounded-full",
                    VARIANT_COLORS[index % VARIANT_COLORS.length]
                  )}
                />
                {variant.name}
              </Label>
              <span className="text-sm font-medium tabular-nums">
                {localSplit[variant.id] || 0}%
              </span>
            </div>
            <Slider
              value={[localSplit[variant.id] || 0]}
              onValueChange={([newVal]) => handleChange(variant.id, newVal)}
              max={99}
              min={1}
              step={1}
              disabled={disabled || variants.length <= 1}
              className="w-full"
            />
          </div>
        ))}
      </div>

      {/* Total indicator */}
      {total !== 100 && (
        <p className="text-sm text-destructive">
          Total must equal 100% (currently {total}%)
        </p>
      )}
    </div>
  );
}
