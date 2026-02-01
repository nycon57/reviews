"use client";

import { useState, useCallback } from "react";
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
} from "lucide-react";
import { ThemePresetSelector, THEME_PRESETS, type ThemePresetKey } from "./theme-preset-selector";
import { DomainAllowlistEditor } from "./domain-allowlist-editor";
import type { WidgetConfigJson } from "@/lib/widgets/schemas";
import type { WidgetType, WidgetEntityType, WidgetStatus } from "@/lib/widgets/types";

// ── Props ──────────────────────────────────────────────────────────────

interface WidgetBuilderSidebarProps {
  config: WidgetConfigJson;
  widgetType: WidgetType;
  entityType: WidgetEntityType;
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
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        className="w-8 h-8 rounded-md border border-border flex-shrink-0 cursor-pointer
          shadow-sm hover:shadow-md transition-shadow"
        style={{ background: value }}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "color";
          input.value = value;
          input.addEventListener("input", (e) => {
            onChange((e.target as HTMLInputElement).value);
          });
          input.click();
        }}
        aria-label={`Pick ${label} color`}
      />
      <div className="flex-1 min-w-0">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 text-xs font-mono mt-0.5"
          placeholder="#000000"
        />
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
  status,
  onNameChange,
  onEntityTypeChange,
  onStatusChange,
}: {
  name: string;
  entityType: WidgetEntityType;
  status: WidgetStatus;
  onNameChange: (name: string) => void;
  onEntityTypeChange: (entityType: WidgetEntityType) => void;
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
          onValueChange={(v) => onEntityTypeChange(v as WidgetEntityType)}
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

// ── Tab: Theme ─────────────────────────────────────────────────────────

function ThemeTab({
  config,
  onConfigChange,
}: {
  config: WidgetConfigJson;
  onConfigChange: (config: Partial<WidgetConfigJson>) => void;
}) {
  const preset = (config.theme?.preset ?? "clean_white") as ThemePresetKey;
  const colors = config.theme?.colors ?? {};

  const handlePresetChange = (newPreset: ThemePresetKey) => {
    const presetData = THEME_PRESETS[newPreset];
    onConfigChange({
      theme: {
        preset: newPreset,
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

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-semibold text-repwell-teal-500 mb-2 block">
          Theme Preset
        </Label>
        <ThemePresetSelector value={preset} onChange={handlePresetChange} />
      </div>

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
      </div>

      <div>
        <Label className="text-sm font-semibold text-repwell-teal-500 mb-3 block">
          Typography
        </Label>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Font Family</Label>
            <Select
              value={config.theme?.typography?.fontFamily ?? "system-ui"}
              onValueChange={(v) =>
                onConfigChange({
                  theme: {
                    ...config.theme,
                    typography: { ...config.theme?.typography, fontFamily: v },
                  },
                })
              }
            >
              <SelectTrigger className="h-8 text-xs mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system-ui">System Default</SelectItem>
                <SelectItem value="'Inter', sans-serif">Inter</SelectItem>
                <SelectItem value="'Roboto', sans-serif">Roboto</SelectItem>
                <SelectItem value="'Open Sans', sans-serif">Open Sans</SelectItem>
                <SelectItem value="'Lato', sans-serif">Lato</SelectItem>
                <SelectItem value="'Poppins', sans-serif">Poppins</SelectItem>
                <SelectItem value="'Georgia', serif">Georgia</SelectItem>
                <SelectItem value="'Merriweather', serif">Merriweather</SelectItem>
                <SelectItem value="'Playfair Display', serif">Playfair Display</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Header Size</Label>
            <Input
              value={config.theme?.typography?.headerSize ?? "18px"}
              onChange={(e) =>
                onConfigChange({
                  theme: {
                    ...config.theme,
                    typography: { ...config.theme?.typography, headerSize: e.target.value },
                  },
                })
              }
              className="h-8 text-xs mt-1"
              placeholder="18px"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Body Size</Label>
            <Input
              value={config.theme?.typography?.bodySize ?? "14px"}
              onChange={(e) =>
                onConfigChange({
                  theme: {
                    ...config.theme,
                    typography: { ...config.theme?.typography, bodySize: e.target.value },
                  },
                })
              }
              className="h-8 text-xs mt-1"
              placeholder="14px"
            />
          </div>
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold text-repwell-teal-500 mb-3 block">
          Layout
        </Label>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Border Radius</Label>
            <Input
              value={config.theme?.layout?.borderRadius ?? "8px"}
              onChange={(e) =>
                onConfigChange({
                  theme: {
                    ...config.theme,
                    layout: { ...config.theme?.layout, borderRadius: e.target.value },
                  },
                })
              }
              className="h-8 text-xs mt-1"
              placeholder="8px"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Max Width</Label>
            <Input
              value={config.theme?.layout?.maxWidth ?? "100%"}
              onChange={(e) =>
                onConfigChange({
                  theme: {
                    ...config.theme,
                    layout: { ...config.theme?.layout, maxWidth: e.target.value },
                  },
                })
              }
              className="h-8 text-xs mt-1"
              placeholder="600px"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Padding</Label>
            <Input
              value={config.theme?.layout?.padding ?? "16px"}
              onChange={(e) =>
                onConfigChange({
                  theme: {
                    ...config.theme,
                    layout: { ...config.theme?.layout, padding: e.target.value },
                  },
                })
              }
              className="h-8 text-xs mt-1"
              placeholder="16px"
            />
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

  const isMortgageRelated = ["lo_review", "branch_review"].includes(widgetType);

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
          <SwitchField
            label="Show NMLS Number"
            checked={content.showNMLS !== false}
            onChange={(v) => update("showNMLS", v)}
          />
          <SwitchField
            label="Show Disclaimer"
            checked={content.showDisclaimer === true}
            onChange={(v) => update("showDisclaimer", v)}
          />
          {content.showDisclaimer && (
            <div className="mt-2">
              <Label className="text-xs text-muted-foreground">Disclaimer Text</Label>
              <Input
                value={(content as Record<string, unknown>).disclaimerText as string ?? ""}
                onChange={(e) => update("disclaimerText", e.target.value)}
                className="h-8 text-xs mt-1"
                placeholder="NMLS# required by state law..."
              />
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
  onConfigChange,
}: {
  config: WidgetConfigJson;
  onConfigChange: (config: Partial<WidgetConfigJson>) => void;
}) {
  const filters = config.filters ?? {};

  const update = (field: string, value: unknown) => {
    onConfigChange({ filters: { ...filters, [field]: value } });
  };

  const dateRange = filters.dateRange ?? {};

  return (
    <div className="space-y-4">
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
          {["google", "zillow", "internal"].map((source) => {
            const isActive = !filters.sources || filters.sources.includes(source);
            return (
              <button
                key={source}
                type="button"
                onClick={() => {
                  const current = filters.sources ?? ["google", "zillow", "internal"];
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
                {source === "internal" ? "RepWell" : source}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <Label className="text-sm font-semibold text-repwell-teal-500 mb-3 block">
          Date Range
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input
              type="date"
              value={dateRange.start ?? ""}
              onChange={(e) =>
                update("dateRange", { ...dateRange, start: e.target.value || undefined })
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
                update("dateRange", { ...dateRange, end: e.target.value || undefined })
              }
              className="h-8 text-xs mt-1"
            />
          </div>
        </div>
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
          {["purchase", "refinance", "va", "fha", "jumbo", "heloc"].map((loanType) => {
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
  onStructuredDataChange,
  onStructuredDataTypeChange,
}: {
  enableStructuredData: boolean;
  structuredDataType: string;
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
              <SelectItem value="ProfessionalService">Professional Service</SelectItem>
              <SelectItem value="Organization">Organization</SelectItem>
              <SelectItem value="Product">Product</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            JSON-LD structured data helps search engines display star ratings in results.
          </p>
        </div>
      )}
    </div>
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
              status={status}
              onNameChange={onNameChange}
              onEntityTypeChange={onEntityTypeChange}
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
            <FiltersTab config={config} onConfigChange={onConfigChange} />
          </TabsContent>
          <TabsContent value="seo" className="mt-0">
            <SEOTab
              enableStructuredData={enableStructuredData}
              structuredDataType={structuredDataType}
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
