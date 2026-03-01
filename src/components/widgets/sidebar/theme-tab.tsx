"use client";

import { useState, useMemo, useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Check } from "lucide-react";
import { ThemePresetSelector } from "../theme-preset-selector";
import { getPreset } from "@/lib/widgets/theme-presets";
import { FONT_OPTIONS, getContrastWarnings, buildBrandMatchPreset } from "@/lib/widgets/theme-utils";
import { getOrgBrandColors } from "@/lib/widgets/actions";
import { ColorField } from "./shared-fields";
import type { WidgetConfigJson } from "@/lib/widgets/schemas";

// ── Searchable font dropdown ────────────────────────────────────────────

function FontFamilySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return FONT_OPTIONS;
    const lower = search.toLowerCase();
    return FONT_OPTIONS.filter((f) => f.label.toLowerCase().includes(lower));
  }, [search]);

  const currentLabel = FONT_OPTIONS.find((f) => f.value === value)?.label ?? "System Default";

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 text-xs mt-1">
        <SelectValue>{currentLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <div className="px-2 pb-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fonts\u2026"
            className="h-7 text-xs"
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
        {filtered.length === 0 && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">No fonts found</div>
        )}
        {filtered.map((font) => (
          <SelectItem key={font.value} value={font.value}>
            <span className="flex items-center gap-2">
              {font.label}
              {font.type === "google" && (
                <span className="text-[9px] px-1 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">
                  Google
                </span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ── Contrast warning indicator ──────────────────────────────────────────

function ContrastWarnings({ colors }: { colors: Record<string, string | undefined> }) {
  const warnings = useMemo(
    () =>
      getContrastWarnings({
        primary: colors.primary,
        background: colors.background,
        text: colors.text,
        accent: colors.accent,
      }),
    [colors.primary, colors.background, colors.text, colors.accent],
  );

  const failing = warnings.filter((w) => !w.passNormal);

  if (failing.length === 0) {
    return (
      <div className="flex items-center gap-1.5 py-1.5 px-2 rounded-md bg-green-50 border border-green-200">
        <Check size={12} className="text-green-600 flex-shrink-0" />
        <span className="text-[10px] text-green-700 font-medium">
          All color pairs meet WCAG AA contrast
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {failing.map((w) => (
        <div
          key={w.pair}
          className="flex items-center gap-1.5 py-1.5 px-2 rounded-md bg-amber-50 border border-amber-200"
        >
          <AlertTriangle size={12} className="text-amber-600 flex-shrink-0" />
          <span className="text-[10px] text-amber-700">
            <span className="font-medium">{w.pair}</span>{" "}
            <span className="text-amber-600">
              {w.ratio}:1 {w.passLarge ? "(large text OK)" : "(fails AA)"}
            </span>
          </span>
          <div className="ml-auto flex gap-0.5">
            <div
              className="w-3 h-3 rounded-sm border border-amber-300"
              style={{ background: w.textColor }}
            />
            <div
              className="w-3 h-3 rounded-sm border border-amber-300"
              style={{ background: w.bgColor }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Theme Tab ───────────────────────────────────────────────────────────

interface ThemeTabProps {
  config: WidgetConfigJson;
  onConfigChange: (config: Partial<WidgetConfigJson>) => void;
}

export function ThemeTab({ config, onConfigChange }: ThemeTabProps) {
  const preset = config.theme?.preset ?? "clean_white";
  const colors = config.theme?.colors ?? {};
  const typography = config.theme?.typography ?? {};
  const layout = config.theme?.layout ?? {};

  // Parse numeric values from CSS strings for sliders
  const parsePx = (val: string | undefined, fallback: number): number => {
    if (!val) return fallback;
    const num = parseInt(val, 10);
    return isNaN(num) ? fallback : num;
  };

  const headerSizePx = parsePx(typography.headerSize, 18);
  const bodySizePx = parsePx(typography.bodySize, 14);
  const maxWidthPx = parsePx(layout.maxWidth, 600);
  const paddingPx = parsePx(layout.padding, 16);
  const borderRadiusPx = parsePx(layout.borderRadius, 8);

  const [isBrandLoading, startBrandTransition] = useTransition();

  const handlePresetChange = (newPreset: string) => {
    if (newPreset === "brand_match") {
      // Fetch org brand colors and derive the theme
      startBrandTransition(async () => {
        const result = await getOrgBrandColors();
        if (result.success) {
          const { primaryColor, secondaryColor, fontFamily } = result.data;
          const brandPreset = buildBrandMatchPreset(primaryColor, secondaryColor, fontFamily);
          onConfigChange({
            theme: {
              preset: "brand_match",
              colors: brandPreset.colors,
              typography: brandPreset.typography,
              layout: brandPreset.layout,
            },
          });
        } else {
          // Fallback to static brand_match preset
          const fallback = getPreset("brand_match");
          onConfigChange({
            theme: {
              preset: "brand_match",
              colors: { ...fallback.colors },
              typography: { ...fallback.typography },
              layout: { ...fallback.layout },
            },
          });
        }
      });
      return;
    }

    const presetData = getPreset(newPreset);
    onConfigChange({
      theme: {
        preset: newPreset as NonNullable<WidgetConfigJson["theme"]>["preset"],
        colors: { ...presetData.colors },
        typography: { ...presetData.typography },
        layout: { ...presetData.layout },
      },
    });
  };

  const handleColorChange = (key: string, value: string) => {
    onConfigChange({
      theme: {
        ...config.theme,
        preset: "custom",
        colors: { ...colors, [key]: value },
      },
    });
  };

  const updateTypography = (field: string, value: string) => {
    onConfigChange({
      theme: {
        ...config.theme,
        typography: { ...typography, [field]: value },
      },
    });
  };

  const updateLayout = (field: string, value: string) => {
    onConfigChange({
      theme: {
        ...config.theme,
        layout: { ...layout, [field]: value },
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Preset selector */}
      <div>
        <Label className="text-sm font-semibold text-repwell-teal-500 mb-2 block">
          Theme Preset
        </Label>
        <ThemePresetSelector value={preset} onChange={handlePresetChange} />
        {isBrandLoading && (
          <p className="text-[10px] text-repwell-teal-300 mt-1.5 animate-pulse">
            Loading brand colors...
          </p>
        )}
      </div>

      {/* Colors */}
      <div>
        <Label className="text-sm font-semibold text-repwell-teal-500 mb-3 block">
          Colors
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <ColorField
            label="Primary"
            value={colors.primary ?? "#52796f"}
            onChange={(v) => handleColorChange("primary", v)}
          />
          <ColorField
            label="Background"
            value={colors.background ?? "#ffffff"}
            onChange={(v) => handleColorChange("background", v)}
          />
          <ColorField
            label="Text"
            value={colors.text ?? "#1a1a2e"}
            onChange={(v) => handleColorChange("text", v)}
          />
          <ColorField
            label="Accent"
            value={colors.accent ?? "#52796f"}
            onChange={(v) => handleColorChange("accent", v)}
          />
          <ColorField
            label="Border"
            value={colors.border ?? "#e5e7eb"}
            onChange={(v) => handleColorChange("border", v)}
          />
          <ColorField
            label="Star Filled"
            value={colors.starFilled ?? "#f59e0b"}
            onChange={(v) => handleColorChange("starFilled", v)}
          />
          <ColorField
            label="Star Empty"
            value={colors.starEmpty ?? "#d1d5db"}
            onChange={(v) => handleColorChange("starEmpty", v)}
          />
        </div>
        {/* WCAG contrast warnings */}
        <div className="mt-3">
          <ContrastWarnings colors={colors} />
        </div>
      </div>

      {/* Typography */}
      <div>
        <Label className="text-sm font-semibold text-repwell-teal-500 mb-3 block">
          Typography
        </Label>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Font Family</Label>
            <FontFamilySelect
              value={typography.fontFamily ?? "system-ui"}
              onChange={(v) => updateTypography("fontFamily", v)}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              Heading Size ({headerSizePx}px)
            </Label>
            <Slider
              value={[headerSizePx]}
              onValueChange={([v]) => updateTypography("headerSize", `${v}px`)}
              min={12}
              max={32}
              step={1}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              Body Size ({bodySizePx}px)
            </Label>
            <Slider
              value={[bodySizePx]}
              onValueChange={([v]) => updateTypography("bodySize", `${v}px`)}
              min={10}
              max={20}
              step={1}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Layout */}
      <div>
        <Label className="text-sm font-semibold text-repwell-teal-500 mb-3 block">
          Layout
        </Label>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">
              Max Width ({maxWidthPx}px)
            </Label>
            <Slider
              value={[maxWidthPx]}
              onValueChange={([v]) => updateLayout("maxWidth", `${v}px`)}
              min={300}
              max={1200}
              step={10}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              Padding ({paddingPx}px)
            </Label>
            <Slider
              value={[paddingPx]}
              onValueChange={([v]) => updateLayout("padding", `${v}px`)}
              min={0}
              max={48}
              step={2}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              Border Radius ({borderRadiusPx}px)
            </Label>
            <Slider
              value={[borderRadiusPx]}
              onValueChange={([v]) => updateLayout("borderRadius", `${v}px`)}
              min={0}
              max={24}
              step={1}
              className="mt-2"
            />
          </div>

          {/* Shadow dropdown */}
          <div>
            <Label className="text-xs text-muted-foreground">Shadow</Label>
            <Select
              value={layout.shadow ?? "sm"}
              onValueChange={(v) => updateLayout("shadow", v)}
            >
              <SelectTrigger className="h-8 text-xs mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="md">Medium</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
                <SelectItem value="xl">Extra Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Card style radio buttons */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Card Style</Label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: "flat", label: "Flat" },
                  { value: "elevated", label: "Elevated" },
                  { value: "bordered", label: "Bordered" },
                  { value: "glass", label: "Glass" },
                ] as const
              ).map((style) => {
                const isActive = (layout.cardStyle ?? "bordered") === style.value;
                return (
                  <button
                    key={style.value}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => updateLayout("cardStyle", style.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
                      isActive
                        ? "bg-repwell-teal-300 text-white border-repwell-teal-300 shadow-sm"
                        : "bg-white text-repwell-teal-400 border-border hover:border-repwell-sage-200"
                    }`}
                  >
                    {style.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
