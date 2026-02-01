"use client";

import {
  THEME_PRESETS,
  PRESET_KEYS,
  type ThemePresetConfig,
  type ThemePresetKey,
} from "@/lib/widgets/theme-presets";

// Re-export for consumers that import from this file
export { THEME_PRESETS, type ThemePresetConfig, type ThemePresetKey };

// ── Preview thumbnail ───────────────────────────────────────────────────

function PresetThumbnail({
  preset,
  presetKey,
}: {
  preset: ThemePresetConfig;
  presetKey: string;
}) {
  const { preview, colors, layout } = preset;
  const isCustom = presetKey === "custom";

  return (
    <div
      className="w-full aspect-[4/3] rounded-md overflow-hidden border border-border"
      style={{ background: preview.bg }}
    >
      {isCustom ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="grid grid-cols-2 gap-1 p-2">
            {["#ef4444", "#3b82f6", "#22c55e", "#f59e0b"].map((color) => (
              <div
                key={color}
                className="w-4 h-4 rounded-sm"
                style={{ background: color }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col p-2.5 gap-1.5">
          {/* Mini star row */}
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-[1px]"
                style={{
                  background: i <= 4 ? colors.starFilled : colors.starEmpty,
                }}
              />
            ))}
          </div>
          {/* Mini text lines */}
          <div
            className="h-1.5 rounded-full w-3/4"
            style={{ background: preview.text, opacity: 0.7 }}
          />
          <div
            className="h-1 rounded-full w-1/2"
            style={{ background: preview.text, opacity: 0.3 }}
          />
          {/* Card style indicator + accent bar */}
          <div className="mt-auto flex items-center gap-1">
            <div
              className="h-2 rounded-sm w-8"
              style={{ background: preview.accent }}
            />
            <div
              className="h-1.5 w-1.5 rounded-full opacity-50"
              style={{
                background: preview.accent,
                boxShadow:
                  layout.shadow !== "none"
                    ? "0 1px 2px rgba(0,0,0,0.15)"
                    : "none",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────

interface ThemePresetSelectorProps {
  value: string;
  onChange: (preset: string) => void;
}

export function ThemePresetSelector({ value, onChange }: ThemePresetSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {PRESET_KEYS.map((key) => {
        const preset = THEME_PRESETS[key];
        const isSelected = value === key;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`
              flex flex-col gap-1.5 p-2 rounded-lg border text-left
              transition-all duration-200
              ${
                isSelected
                  ? "border-repwell-teal-300 ring-2 ring-repwell-teal-300/20 bg-repwell-sage-100/20"
                  : "border-border bg-white hover:border-repwell-sage-200 hover:shadow-sm"
              }
            `}
          >
            <PresetThumbnail preset={preset} presetKey={key} />
            <span
              className={`text-xs font-medium ${
                isSelected ? "text-repwell-teal-300" : "text-repwell-teal-500"
              }`}
            >
              {preset.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
