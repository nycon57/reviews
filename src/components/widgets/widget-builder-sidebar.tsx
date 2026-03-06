"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Palette,
  Type,
  Filter,
  Globe,
  Settings2,
  Search as SearchIcon,
  History,
  Code2,
} from "lucide-react";
import { VersionList } from "./version-history/version-list";
import {
  GeneralTab,
  ThemeTab,
  ContentTab,
  FiltersTab,
  SEOTab,
  DomainTab,
  AdvancedTab,
} from "./sidebar";
import { EmbedCodePanel } from "./embed-code-panel";
import type { WidgetConfigJson } from "@/lib/widgets/schemas";
import type { WidgetType, WidgetEntityType } from "@/lib/widgets/types";

// ── Tab definitions ─────────────────────────────────────────────────────

const SIDEBAR_TABS = [
  { value: "general", label: "General", icon: Settings2 },
  { value: "theme", label: "Theme", icon: Palette },
  { value: "content", label: "Content", icon: Type },
  { value: "filters", label: "Filters", icon: Filter },
  { value: "seo", label: "SEO", icon: SearchIcon },
  { value: "domains", label: "Domains", icon: Globe },
  { value: "advanced", label: "Advanced", icon: Code2 },
  { value: "history", label: "History", icon: History },
] as const;

// ── Props ──────────────────────────────────────────────────────────────

interface WidgetBuilderSidebarProps {
  config: WidgetConfigJson;
  widgetType: WidgetType;
  entityType: WidgetEntityType;
  entityId: string | null;
  enableStructuredData: boolean;
  structuredDataType: string;
  allowedDomains: string[];
  widgetConfigId?: string;
  currentVersion?: number;
  templateName: string;
  widgetId: string | null;
  onRollbackComplete?: () => void;
  onConfigChange: (config: Partial<WidgetConfigJson>) => void;
  onDomainsChange: (domains: string[]) => void;
  onEntityTypeChange: (entityType: WidgetEntityType) => void;
  onEntityIdChange: (entityId: string | null) => void;
  onStructuredDataChange: (enabled: boolean) => void;
  onStructuredDataTypeChange: (type: string) => void;
}

// ── Main component ─────────────────────────────────────────────────────

export function WidgetBuilderSidebar({
  config,
  widgetType,
  entityType,
  entityId,
  enableStructuredData,
  structuredDataType,
  allowedDomains,
  widgetConfigId,
  currentVersion,
  templateName,
  widgetId,
  onRollbackComplete,
  onConfigChange,
  onDomainsChange,
  onEntityTypeChange,
  onEntityIdChange,
  onStructuredDataChange,
  onStructuredDataTypeChange,
}: WidgetBuilderSidebarProps) {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Section selector */}
      <div className="px-3 py-2.5 border-b border-border bg-muted/50">
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="h-9 text-xs font-medium bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SIDEBAR_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <SelectItem key={tab.value} value={tab.value} className="text-xs">
                  <span className="flex items-center gap-2">
                    <Icon size={14} className="text-muted-foreground shrink-0" />
                    {tab.label}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Tab content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="general" className="mt-0 space-y-6">
            <GeneralTab
              entityType={entityType}
              entityId={entityId}
              onEntityTypeChange={onEntityTypeChange}
              onEntityIdChange={onEntityIdChange}
            />
            <div className="pt-4 border-t border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Embed Code
              </h3>
              <EmbedCodePanel widgetId={widgetId} />
            </div>
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
              name={templateName}
              onStructuredDataChange={onStructuredDataChange}
              onStructuredDataTypeChange={onStructuredDataTypeChange}
            />
          </TabsContent>
          <TabsContent value="domains" className="mt-0">
            <DomainTab allowedDomains={allowedDomains} onDomainsChange={onDomainsChange} />
          </TabsContent>
          <TabsContent value="advanced" className="mt-0">
            <AdvancedTab config={config} onConfigChange={onConfigChange} />
          </TabsContent>
          <TabsContent value="history" className="mt-0">
            {widgetConfigId ? (
              <VersionList
                widgetConfigId={widgetConfigId}
                currentVersion={currentVersion ?? 1}
                onRollbackComplete={onRollbackComplete}
              />
            ) : (
              <div className="text-center py-8">
                <History size={32} className="mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">
                  Save the widget to start tracking version history.
                </p>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
