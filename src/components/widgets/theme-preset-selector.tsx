"use client";

const THEME_PRESETS = {
  clean_white: {
    label: "Clean White",
    colors: {
      primary: "#52796f",
      background: "#ffffff",
      text: "#1a1a2e",
      accent: "#52796f",
      border: "#e5e7eb",
      starFilled: "#f59e0b",
      starEmpty: "#d1d5db",
    },
    typography: { fontFamily: "system-ui", headerSize: "18px", bodySize: "14px" },
    layout: { borderRadius: "8px", padding: "16px" },
    preview: { bg: "#ffffff", accent: "#52796f", text: "#1a1a2e" },
  },
  dark: {
    label: "Dark",
    colors: {
      primary: "#60a5fa",
      background: "#1e1e2e",
      text: "#e2e8f0",
      accent: "#60a5fa",
      border: "#334155",
      starFilled: "#fbbf24",
      starEmpty: "#475569",
    },
    typography: { fontFamily: "system-ui", headerSize: "18px", bodySize: "14px" },
    layout: { borderRadius: "8px", padding: "16px" },
    preview: { bg: "#1e1e2e", accent: "#60a5fa", text: "#e2e8f0" },
  },
  brand_match: {
    label: "Brand Match",
    colors: {
      primary: "#52796f",
      background: "#f8faf8",
      text: "#2f3e46",
      accent: "#84a98c",
      border: "#cad2c5",
      starFilled: "#f59e0b",
      starEmpty: "#cad2c5",
    },
    typography: { fontFamily: "system-ui", headerSize: "18px", bodySize: "14px" },
    layout: { borderRadius: "8px", padding: "16px" },
    preview: { bg: "#f8faf8", accent: "#52796f", text: "#2f3e46" },
  },
  mortgage_classic: {
    label: "Mortgage Classic",
    colors: {
      primary: "#1e3a5f",
      background: "#ffffff",
      text: "#1e3a5f",
      accent: "#c5a35a",
      border: "#d4d9e1",
      starFilled: "#c5a35a",
      starEmpty: "#d4d9e1",
    },
    typography: {
      fontFamily: '"Georgia", serif',
      headerSize: "20px",
      bodySize: "14px",
    },
    layout: { borderRadius: "4px", padding: "20px" },
    preview: { bg: "#ffffff", accent: "#1e3a5f", text: "#1e3a5f" },
  },
  modern_minimal: {
    label: "Modern Minimal",
    colors: {
      primary: "#171717",
      background: "#ffffff",
      text: "#171717",
      accent: "#171717",
      border: "#f0f0f0",
      starFilled: "#171717",
      starEmpty: "#e5e5e5",
    },
    typography: { fontFamily: "system-ui", headerSize: "16px", bodySize: "14px" },
    layout: { borderRadius: "2px", padding: "16px" },
    preview: { bg: "#ffffff", accent: "#171717", text: "#171717" },
  },
  trust_badge: {
    label: "Trust Badge",
    colors: {
      primary: "#166534",
      background: "#f0fdf4",
      text: "#14532d",
      accent: "#22c55e",
      border: "#bbf7d0",
      starFilled: "#22c55e",
      starEmpty: "#bbf7d0",
    },
    typography: { fontFamily: "system-ui", headerSize: "18px", bodySize: "14px" },
    layout: { borderRadius: "12px", padding: "16px" },
    preview: { bg: "#f0fdf4", accent: "#166534", text: "#14532d" },
  },
  social_card: {
    label: "Social Card",
    colors: {
      primary: "#7c3aed",
      background: "#ffffff",
      text: "#1f2937",
      accent: "#7c3aed",
      border: "#e5e7eb",
      starFilled: "#f59e0b",
      starEmpty: "#d1d5db",
    },
    typography: { fontFamily: "system-ui", headerSize: "18px", bodySize: "14px" },
    layout: { borderRadius: "16px", padding: "20px" },
    preview: { bg: "#ffffff", accent: "#7c3aed", text: "#1f2937" },
  },
  custom: {
    label: "Custom",
    colors: {
      primary: "#52796f",
      background: "#ffffff",
      text: "#1a1a2e",
      accent: "#52796f",
      border: "#e5e7eb",
      starFilled: "#f59e0b",
      starEmpty: "#d1d5db",
    },
    typography: { fontFamily: "system-ui", headerSize: "18px", bodySize: "14px" },
    layout: { borderRadius: "8px", padding: "16px" },
    preview: { bg: "#ffffff", accent: "#52796f", text: "#1a1a2e" },
  },
} as const;

type ThemePresetKey = keyof typeof THEME_PRESETS;

interface ThemePresetSelectorProps {
  value: ThemePresetKey;
  onChange: (preset: ThemePresetKey) => void;
}

function PresetThumbnail({
  preset,
  presetKey,
}: {
  preset: (typeof THEME_PRESETS)[ThemePresetKey];
  presetKey: ThemePresetKey;
}) {
  const { preview } = preset;
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
                  background:
                    i <= 4
                      ? preset.colors.starFilled
                      : preset.colors.starEmpty,
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
          {/* Mini accent bar */}
          <div className="mt-auto">
            <div
              className="h-2 rounded-sm w-8"
              style={{ background: preview.accent }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function ThemePresetSelector({ value, onChange }: ThemePresetSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {(Object.entries(THEME_PRESETS) as [ThemePresetKey, (typeof THEME_PRESETS)[ThemePresetKey]][]).map(
        ([key, preset]) => {
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
        }
      )}
    </div>
  );
}

export { THEME_PRESETS, type ThemePresetKey };
