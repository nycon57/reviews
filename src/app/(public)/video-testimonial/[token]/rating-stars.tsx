"use client";

import { Star } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const RATING_LABELS = ["Poor", "Fair", "Good", "Great", "Excellent"] as const;

/** Required tap-to-rate 1-5 stars shown on the About-you step. */
export function RatingStars({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (rating: number) => void;
  label: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="font-sans text-sm font-medium text-repwell-teal-500">{label}</legend>
      <div role="radiogroup" aria-label={label} className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const selected = star <= value;
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} star${star === 1 ? "" : "s"}`}
              onClick={() => onChange(star)}
              className="flex h-11 w-11 items-center justify-center rounded-lg transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-repwell-teal-300 active:scale-95"
            >
              <Star
                size={30}
                weight={selected ? "fill" : "regular"}
                className={cn(
                  "transition-colors",
                  selected ? "text-amber-400" : "text-repwell-sage-200"
                )}
              />
            </button>
          );
        })}
        {value > 0 && (
          <span className="ml-2 font-sans text-sm font-medium text-repwell-teal-400">
            {RATING_LABELS[value - 1]}
          </span>
        )}
      </div>
    </fieldset>
  );
}
