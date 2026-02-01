"use client";

import type { ReactNode } from "react";
import { useState, useCallback, useEffect, useMemo, useTransition } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Palette,
  Type,
  Filter,
  Globe,
  Settings2,
  Search as SearchIcon,
  Plus,
  X,
  AlertTriangle,
  Check,
} from "lucide-react";
import { ThemePresetSelector, THEME_PRESETS } from "./theme-preset-selector";
import { getPreset } from "@/lib/widgets/theme-presets";
import { DomainAllowlistEditor } from "./domain-allowlist-editor";
import { EntitySelector } from "./entity-selector";
import { FONT_OPTIONS, getContrastWarnings, buildBrandMatchPreset } from "@/lib/widgets/theme-utils";
import { getOrgBrandColors, getFilteredReviewCount } from "@/lib/widgets/actions";
import type { WidgetConfigJson } from "@/lib/widgets/schemas";
import type { WidgetType, WidgetEntityType, WidgetStatus } from "@/lib/widgets/types";

// ── Props ──────────────────────────────────────────────────────────────

interface WidgetBuilderSidebarProps {
  config: WidgetConfigJson;
  widgetType: WidgetType;
  entityType: WidgetEntityType;
  entityId: string | null;
  status: WidgetStatus;
  name: string;
  enableStructuredData: boolean;
  structuredDataType: string;
  allowedDomains: string[];
  onConfigChange: (config: Partial<WidgetConfigJson>) => void;
  onDomainsChange: (domains: string[]) => void;
  onNameChange: (name: string) => void;
  onStatusChange: (status: WidgetStatus) => void;
  onEntityTypeChange: (entityType: WidgetEntityType) => void;
  onEntityIdChange: (entityId: string | null) => void;
  onStructuredDataChange: (enabled: boolean) => void;
  onStructuredDataTypeChange: (type: string) => void;
}

// ── Shared helpers ─────────────────────────────────────────────────────

function SwitchField({
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

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [mode, setMode] = useState<"hex" | "rgb">("hex");

  const rgbValue = useMemo(() => {
    const cleaned = value.replace("#", "");
    if (cleaned.length === 6) {
      const r = parseInt(cleaned.slice(0, 2), 16);
      const g = parseInt(cleaned.slice(2, 4), 16);
      const b = parseInt(cleaned.slice(4, 6), 16);
      return `${r}, ${g}, ${b}`;
    }
    return "0, 0, 0";
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
            value={value}
            onChange={(e) => onChange(e.target.value)}
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

function ChipInput({
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

// ── Tab: General ───────────────────────────────────────────────────────

function GeneralTab({
  name,
  entityType,
  entityId,
  status,
  onNameChange,
  onEntityTypeChange,
  onEntityIdChange,
  onStatusChange,
}: {
  name: string;
  entityType: WidgetEntityType;
  entityId: string | null;
  status: WidgetStatus;
  onNameChange: (name: string) => void;
  onEntityTypeChange: (entityType: WidgetEntityType) => void;
  onEntityIdChange: (entityId: string | null) => void;
  onStatusChange: (status: WidgetStatus) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs text-muted-foreground">Widget Name</Label>
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="h-8 text-xs mt-1"
          placeholder="My Review Widget"
        />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Entity Type</Label>
        <Select
          value={entityType}
          onValueChange={(v) => {
            onEntityTypeChange(v as WidgetEntityType);
            onEntityIdChange(null);
          }}
        >
          <SelectTrigger className="h-8 text-xs mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">Loan Officer</SelectItem>
            <SelectItem value="branch">Branch</SelectItem>
            <SelectItem value="organization">Organization</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <EntitySelector
        entityType={entityType}
        entityId={entityId}
        onSelect={(id) => onEntityIdChange(id)}
        label="Entity"
      />

      <div>
        <Label className="text-xs text-muted-foreground">Status</Label>
        <Select
          value={status}
          onValueChange={(v) => onStatusChange(v as WidgetStatus)}
        >
          <SelectTrigger className="h-8 text-xs mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

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
            placeholder="Search fonts..."
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

// ── Tab: Theme ─────────────────────────────────────────────────────────

function ThemeTab({
  config,
  onConfigChange,
}: {
  config: WidgetConfigJson;
  onConfigChange: (config: Partial<WidgetConfigJson>) => void;
}) {
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

// ── Tab: Content ───────────────────────────────────────────────────────

function ContentTab({
  config,
  widgetType,
  onConfigChange,
}: {
  config: WidgetConfigJson;
  widgetType: WidgetType;
  onConfigChange: (config: Partial<WidgetConfigJson>) => void;
}) {
  const content = config.content ?? {};

  const update = (field: string, value: unknown) => {
    onConfigChange({ content: { ...content, [field]: value } });
  };

  const isMortgageRelated = ["lo_review", "branch_review", "company_review"].includes(widgetType);
  const isLOWidget = widgetType === "lo_review";

  return (
    <div className="space-y-4">
      <SwitchField
        label="Show Header"
        checked={content.showHeader !== false}
        onChange={(v) => update("showHeader", v)}
      />
      {content.showHeader !== false && (
        <div>
          <Label className="text-xs text-muted-foreground">Header Text</Label>
          <Input
            value={content.headerText ?? ""}
            onChange={(e) => update("headerText", e.target.value)}
            className="h-8 text-xs mt-1"
            placeholder="Customer Reviews"
          />
        </div>
      )}

      <SwitchField
        label="Show Avatars"
        checked={content.showAvatar !== false}
        onChange={(v) => update("showAvatar", v)}
      />
      <SwitchField
        label="Show Dates"
        checked={content.showDate !== false}
        onChange={(v) => update("showDate", v)}
      />
      <SwitchField
        label="Show Source"
        checked={content.showSource !== false}
        onChange={(v) => update("showSource", v)}
      />
      <SwitchField
        label="Show Branding"
        checked={content.showBranding !== false}
        onChange={(v) => update("showBranding", v)}
      />
      <SwitchField
        label="Show Interactive Filters"
        checked={content.showFilters === true}
        onChange={(v) => update("showFilters", v)}
      />

      <div>
        <Label className="text-xs text-muted-foreground">
          Truncate Length ({content.truncateLength ?? 300} chars)
        </Label>
        <Slider
          value={[content.truncateLength ?? 300]}
          onValueChange={([v]) => update("truncateLength", v)}
          min={0}
          max={1000}
          step={50}
          className="mt-2"
        />
      </div>

      <div className="border-t border-border pt-4">
        <Label className="text-sm font-semibold text-repwell-teal-500 mb-3 block">
          Call to Action
        </Label>
        <SwitchField
          label="Show CTA Button"
          checked={content.showCTA === true}
          onChange={(v) => update("showCTA", v)}
        />
        {content.showCTA && (
          <div className="space-y-2 mt-2">
            <div>
              <Label className="text-xs text-muted-foreground">Button Text</Label>
              <Input
                value={content.ctaText ?? ""}
                onChange={(e) => update("ctaText", e.target.value)}
                className="h-8 text-xs mt-1"
                placeholder="Leave a Review"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Button URL</Label>
              <Input
                value={content.ctaUrl ?? ""}
                onChange={(e) => update("ctaUrl", e.target.value)}
                className="h-8 text-xs mt-1"
                placeholder="https://..."
              />
            </div>
          </div>
        )}
      </div>

      {isMortgageRelated && (
        <div className="border-t border-border pt-4">
          <Label className="text-sm font-semibold text-repwell-teal-500 mb-3 block">
            Compliance
          </Label>
          {isLOWidget ? (
            <div className="flex items-center justify-between py-1">
              <Label className="text-xs font-medium text-repwell-teal-400">Show NMLS Number</Label>
              <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Required</span>
            </div>
          ) : (
            <SwitchField
              label="Show NMLS Number"
              checked={content.showNMLS !== false}
              onChange={(v) => update("showNMLS", v)}
            />
          )}
          <SwitchField
            label="Show Disclaimer &amp; Equal Housing"
            checked={content.showDisclaimer === true}
            onChange={(v) => update("showDisclaimer", v)}
          />
          {content.showDisclaimer && (
            <div className="mt-2">
              <Label className="text-xs text-muted-foreground">Disclaimer Text</Label>
              <Input
                value={content.disclaimerText ?? ""}
                onChange={(e) => update("disclaimerText", e.target.value)}
                className="h-8 text-xs mt-1"
                placeholder="This is not a commitment to lend..."
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Leave empty for default compliance text. Minimum 10px font enforced.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tab: Filters ───────────────────────────────────────────────────────

function FiltersTab({
  config,
  entityType,
  entityId,
  onConfigChange,
}: {
  config: WidgetConfigJson;
  entityType: WidgetEntityType;
  entityId: string | null;
  onConfigChange: (config: Partial<WidgetConfigJson>) => void;
}) {
  const filters = config.filters ?? {};
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [isCountLoading, startCountTransition] = useTransition();

  const update = (field: string, value: unknown) => {
    onConfigChange({ filters: { ...filters, [field]: value } });
  };

  // Fetch matching review count whenever filters change
  const fetchCount = useCallback(() => {
    startCountTransition(async () => {
      const result = await getFilteredReviewCount({
        entityType,
        entityId,
        filters: {
          minRating: filters.minRating,
          dateRange: filters.dateRange,
          sources: filters.sources,
          featuredOnly: filters.featuredOnly,
          keywords: filters.keywords,
          loanTypes: filters.loanTypes,
        },
      });
      if (result.success) {
        setMatchCount(result.data.count);
      }
    });
  }, [entityType, entityId, filters.minRating, filters.dateRange, filters.sources, filters.featuredOnly, filters.keywords, filters.loanTypes]);

  // Re-fetch count when filters change
  const filtersKey = useMemo(
    () => JSON.stringify({ entityType, entityId, filters }),
    [entityType, entityId, filters]
  );
  useEffect(() => { fetchCount(); }, [filtersKey, fetchCount]);

  const dateRange = filters.dateRange ?? {};

  return (
    <div className="space-y-4">
      {/* Matching review count banner */}
      <div className="flex items-center justify-between rounded-md border border-repwell-sage-200/50 bg-repwell-sage-100/20 px-3 py-2">
        <span className="text-xs font-medium text-repwell-teal-400">
          Matching reviews
        </span>
        <span className="text-sm font-semibold text-repwell-teal-500 tabular-nums">
          {isCountLoading ? (
            <span className="inline-block w-6 h-4 bg-repwell-sage-200/40 rounded animate-pulse" />
          ) : (
            matchCount ?? "—"
          )}
        </span>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">
          Minimum Rating ({filters.minRating ?? 1} stars)
        </Label>
        <Slider
          value={[filters.minRating ?? 1]}
          onValueChange={([v]) => update("minRating", v)}
          min={1}
          max={5}
          step={1}
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">
          Max Reviews ({filters.maxReviews ?? 50})
        </Label>
        <Slider
          value={[filters.maxReviews ?? 50]}
          onValueChange={([v]) => update("maxReviews", v)}
          min={1}
          max={100}
          step={1}
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Sort Order</Label>
        <Select
          value={filters.sortOrder ?? "newest"}
          onValueChange={(v) => update("sortOrder", v)}
        >
          <SelectTrigger className="h-8 text-xs mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="highest">Highest Rated</SelectItem>
            <SelectItem value="lowest">Lowest Rated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <SwitchField
        label="Featured Only"
        checked={filters.featuredOnly === true}
        onChange={(v) => update("featuredOnly", v)}
      />

      <div>
        <Label className="text-xs text-muted-foreground">Sources</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {["google", "zillow", "internal", "facebook"].map((source) => {
            const isActive = !filters.sources || filters.sources.includes(source);
            return (
              <button
                key={source}
                type="button"
                onClick={() => {
                  const current = filters.sources ?? ["google", "zillow", "internal", "facebook"];
                  if (isActive) {
                    update("sources", current.filter((s) => s !== source));
                  } else {
                    update("sources", [...current, source]);
                  }
                }}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors capitalize ${
                  isActive
                    ? "bg-repwell-teal-300 text-white border-repwell-teal-300"
                    : "bg-white text-muted-foreground border-border hover:border-repwell-sage-200"
                }`}
              >
                {source === "internal" ? "RepWell" : source.charAt(0).toUpperCase() + source.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <Label className="text-sm font-semibold text-repwell-teal-500 mb-3 block">
          Date Range
        </Label>
        <div className="mb-3">
          <Label className="text-xs text-muted-foreground">Preset</Label>
          <Select
            value={dateRange.preset ?? "all_time"}
            onValueChange={(v) => {
              if (v === "custom") {
                update("dateRange", { ...dateRange, preset: "custom" });
              } else {
                update("dateRange", { preset: v, start: undefined, end: undefined });
              }
            }}
          >
            <SelectTrigger className="h-8 text-xs mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_time">All Time</SelectItem>
              <SelectItem value="last_30d">Last 30 Days</SelectItem>
              <SelectItem value="last_90d">Last 90 Days</SelectItem>
              <SelectItem value="last_year">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(dateRange.preset === "custom" || (!dateRange.preset && (dateRange.start || dateRange.end))) && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">From</Label>
              <Input
                type="date"
                value={dateRange.start ?? ""}
                onChange={(e) =>
                  update("dateRange", { ...dateRange, preset: "custom", start: e.target.value || undefined })
                }
                className="h-8 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input
                type="date"
                value={dateRange.end ?? ""}
                onChange={(e) =>
                  update("dateRange", { ...dateRange, preset: "custom", end: e.target.value || undefined })
                }
                className="h-8 text-xs mt-1"
              />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border pt-4">
        <Label className="text-xs text-muted-foreground mb-2 block">Keywords</Label>
        <ChipInput
          values={filters.keywords ?? []}
          onChange={(v) => update("keywords", v)}
          placeholder="Add keyword..."
        />
      </div>

      <div className="border-t border-border pt-4">
        <Label className="text-xs text-muted-foreground">Loan Types</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {["Purchase", "Refinance", "VA", "FHA", "Jumbo", "USDA", "Conventional"].map((loanType) => {
            const currentTypes = filters.loanTypes ?? [];
            const isActive = currentTypes.includes(loanType);
            return (
              <button
                key={loanType}
                type="button"
                onClick={() => {
                  if (isActive) {
                    update("loanTypes", currentTypes.filter((t) => t !== loanType));
                  } else {
                    update("loanTypes", [...currentTypes, loanType]);
                  }
                }}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors capitalize ${
                  isActive
                    ? "bg-repwell-teal-300 text-white border-repwell-teal-300"
                    : "bg-white text-muted-foreground border-border hover:border-repwell-sage-200"
                }`}
              >
                {loanType}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Tab: SEO ───────────────────────────────────────────────────────────

function SEOTab({
  enableStructuredData,
  structuredDataType,
  entityType,
  name,
  onStructuredDataChange,
  onStructuredDataTypeChange,
}: {
  enableStructuredData: boolean;
  structuredDataType: string;
  entityType: string;
  name: string;
  onStructuredDataChange: (enabled: boolean) => void;
  onStructuredDataTypeChange: (type: string) => void;
}) {
  return (
    <div className="space-y-4">
      <SwitchField
        label="Enable Structured Data"
        checked={enableStructuredData}
        onChange={onStructuredDataChange}
      />

      {enableStructuredData && (
        <>
          <div>
            <Label className="text-xs text-muted-foreground">Schema Type</Label>
            <Select
              value={structuredDataType}
              onValueChange={onStructuredDataTypeChange}
            >
              <SelectTrigger className="h-8 text-xs mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LocalBusiness">Local Business</SelectItem>
                <SelectItem value="FinancialService">Financial Service</SelectItem>
                <SelectItem value="MortgageBroker">Mortgage Broker</SelectItem>
                <SelectItem value="Organization">Organization</SelectItem>
                <SelectItem value="Person">Person</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              JSON-LD structured data helps search engines display star ratings in results.
            </p>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Preview</Label>
            <SeoJsonLdPreview
              schemaType={structuredDataType}
              entityType={entityType}
              name={name}
            />
          </div>
        </>
      )}
    </div>
  );
}

/** Apply syntax highlighting to a JSON string. */
function highlightJson(json: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let i = 0;

  const regex =
    /("(?:[^"\\]|\\.)*")\s*:|("(?:[^"\\]|\\.)*")|(true|false|null)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(json)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`t${i++}`} className="text-gray-500">
          {json.slice(lastIndex, match.index)}
        </span>
      );
    }

    if (match[1]) {
      parts.push(
        <span key={`k${i++}`} className="text-indigo-600">{match[1]}</span>
      );
    } else if (match[2]) {
      parts.push(
        <span key={`s${i++}`} className="text-emerald-600">{match[2]}</span>
      );
    } else if (match[3]) {
      parts.push(
        <span key={`b${i++}`} className="text-amber-600">{match[3]}</span>
      );
    } else if (match[4]) {
      parts.push(
        <span key={`n${i++}`} className="text-blue-600">{match[4]}</span>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < json.length) {
    parts.push(
      <span key={`e${i++}`} className="text-gray-500">
        {json.slice(lastIndex)}
      </span>
    );
  }

  return parts;
}

/** Inline preview of the JSON-LD that will be generated. */
function SeoJsonLdPreview({
  schemaType,
  entityType,
  name,
}: {
  schemaType: string;
  entityType: string;
  name: string;
}) {
  const preview = useMemo(() => {
    const resolvedType = schemaType === "MortgageBroker" ? "FinancialService" : schemaType;
    const schema: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": resolvedType,
      name: name || "Your Widget Name",
    };

    if (entityType === "user" || schemaType === "Person") {
      schema.jobTitle = "Loan Officer";
      schema.worksFor = { "@type": "Organization", name: "Your Company" };
    }

    if (resolvedType === "LocalBusiness") {
      schema.address = {
        "@type": "PostalAddress",
        streetAddress: "123 Main St",
        addressLocality: "Springfield",
        addressRegion: "IL",
        postalCode: "62701",
      };
      schema.telephone = "+1-555-555-5555";
    }

    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: 24,
      bestRating: "5",
      worstRating: "1",
    };

    schema.review = [
      {
        "@type": "Review",
        author: { "@type": "Person", name: "Jane D." },
        datePublished: new Date().toISOString().split("T")[0],
        reviewRating: { "@type": "Rating", ratingValue: 5, bestRating: 5, worstRating: 1 },
        reviewBody: "Excellent service...",
      },
    ];

    return JSON.stringify(schema, null, 2);
  }, [schemaType, entityType, name]);

  const highlighted = useMemo(() => highlightJson(preview), [preview]);

  return (
    <pre className="text-[10px] leading-relaxed bg-gray-950 border border-border rounded-md p-2.5 overflow-x-auto max-h-48 overflow-y-auto font-mono whitespace-pre">
      {highlighted}
    </pre>
  );
}

// ── Tab: Domains ───────────────────────────────────────────────────────

function DomainTab({
  allowedDomains,
  onDomainsChange,
}: {
  allowedDomains: string[];
  onDomainsChange: (domains: string[]) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-semibold text-repwell-teal-500 mb-1 block">
          Allowed Domains
        </Label>
        <p className="text-xs text-muted-foreground mb-3">
          Restrict which domains can embed this widget. Leave empty to allow all domains.
        </p>
        <DomainAllowlistEditor domains={allowedDomains} onChange={onDomainsChange} />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────

export function WidgetBuilderSidebar({
  config,
  widgetType,
  entityType,
  entityId,
  status,
  name,
  enableStructuredData,
  structuredDataType,
  allowedDomains,
  onConfigChange,
  onDomainsChange,
  onNameChange,
  onStatusChange,
  onEntityTypeChange,
  onEntityIdChange,
  onStructuredDataChange,
  onStructuredDataTypeChange,
}: WidgetBuilderSidebarProps) {
  return (
    <div className="h-full flex flex-col bg-white border-r border-border">
      <Tabs defaultValue="general" className="flex-1 flex flex-col">
        <TabsList className="w-full grid grid-cols-6 h-10 rounded-none border-b border-border bg-gray-50/50">
          <TabsTrigger value="general" className="text-xs gap-1 data-[state=active]:bg-white">
            <Settings2 size={14} />
            <span className="hidden xl:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="theme" className="text-xs gap-1 data-[state=active]:bg-white">
            <Palette size={14} />
            <span className="hidden xl:inline">Theme</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="text-xs gap-1 data-[state=active]:bg-white">
            <Type size={14} />
            <span className="hidden xl:inline">Content</span>
          </TabsTrigger>
          <TabsTrigger value="filters" className="text-xs gap-1 data-[state=active]:bg-white">
            <Filter size={14} />
            <span className="hidden xl:inline">Filters</span>
          </TabsTrigger>
          <TabsTrigger value="seo" className="text-xs gap-1 data-[state=active]:bg-white">
            <SearchIcon size={14} />
            <span className="hidden xl:inline">SEO</span>
          </TabsTrigger>
          <TabsTrigger value="domains" className="text-xs gap-1 data-[state=active]:bg-white">
            <Globe size={14} />
            <span className="hidden xl:inline">Domains</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="general" className="mt-0">
            <GeneralTab
              name={name}
              entityType={entityType}
              entityId={entityId}
              status={status}
              onNameChange={onNameChange}
              onEntityTypeChange={onEntityTypeChange}
              onEntityIdChange={onEntityIdChange}
              onStatusChange={onStatusChange}
            />
          </TabsContent>
          <TabsContent value="theme" className="mt-0">
            <ThemeTab config={config} onConfigChange={onConfigChange} />
          </TabsContent>
          <TabsContent value="content" className="mt-0">
            <ContentTab config={config} widgetType={widgetType} onConfigChange={onConfigChange} />
          </TabsContent>
          <TabsContent value="filters" className="mt-0">
            <FiltersTab config={config} entityType={entityType} entityId={entityId} onConfigChange={onConfigChange} />
          </TabsContent>
          <TabsContent value="seo" className="mt-0">
            <SEOTab
              enableStructuredData={enableStructuredData}
              structuredDataType={structuredDataType}
              entityType={entityType}
              name={name}
              onStructuredDataChange={onStructuredDataChange}
              onStructuredDataTypeChange={onStructuredDataTypeChange}
            />
          </TabsContent>
          <TabsContent value="domains" className="mt-0">
            <DomainTab allowedDomains={allowedDomains} onDomainsChange={onDomainsChange} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
