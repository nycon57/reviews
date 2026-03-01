"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import type { WidgetConfigJson } from "@/lib/widgets/schemas";
import type { WidgetType, WidgetEntityType } from "@/lib/widgets/types";

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
  onRollbackComplete,
  onConfigChange,
  onDomainsChange,
  onEntityTypeChange,
  onEntityIdChange,
  onStructuredDataChange,
  onStructuredDataTypeChange,
}: WidgetBuilderSidebarProps) {
  return (
    <div className="h-full flex flex-col bg-white border-r border-border">
      <Tabs defaultValue="general" className="flex-1 flex flex-col">
        <TabsList className="w-full grid grid-cols-8 h-10 rounded-none border-b border-border bg-gray-50/50">
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
          <TabsTrigger value="advanced" className="text-xs gap-1 data-[state=active]:bg-white">
            <Code2 size={14} />
            <span className="hidden xl:inline">Advanced</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs gap-1 data-[state=active]:bg-white">
            <History size={14} />
            <span className="hidden xl:inline">History</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="general" className="mt-0">
            <GeneralTab
              entityType={entityType}
              entityId={entityId}
              onEntityTypeChange={onEntityTypeChange}
              onEntityIdChange={onEntityIdChange}
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
