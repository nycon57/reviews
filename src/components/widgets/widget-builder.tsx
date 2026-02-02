"use client";

import { useReducer, useCallback, useTransition, useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, ArrowLeft, Loader2, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { WidgetBuilderSidebar } from "./widget-builder-sidebar";
import { WidgetPreview } from "./widget-preview";
import { EmbedCodePanel } from "./embed-code-panel";
import { CreateTestDialog } from "./ab-test/create-test-dialog";
import { createWidget, updateWidget } from "@/lib/widgets/actions";
import type { WidgetConfigJson } from "@/lib/widgets/schemas";
import type { WidgetConfig, WidgetType, WidgetEntityType, WidgetStatus } from "@/lib/widgets/types";
import type { AbTestConfig } from "@/lib/widgets/ab-testing";
import { THEME_PRESETS } from "./theme-preset-selector";

// ── State management ──────────────────────────────────────────────────

interface BuilderState {
  name: string;
  widgetType: WidgetType;
  entityType: WidgetEntityType;
  entityId: string | null;
  config: WidgetConfigJson;
  allowedDomains: string[];
  status: WidgetStatus;
  enableStructuredData: boolean;
  structuredDataType: string;
  widgetId: string | null;
  dbId: string | null;
  currentVersion: number;
  isDirty: boolean;
}

type BuilderAction =
  | { type: "SET_NAME"; payload: string }
  | { type: "SET_CONFIG"; payload: Partial<WidgetConfigJson> }
  | { type: "SET_DOMAINS"; payload: string[] }
  | { type: "SET_STATUS"; payload: WidgetStatus }
  | { type: "SET_ENTITY_TYPE"; payload: WidgetEntityType }
  | { type: "SET_ENTITY_ID"; payload: string | null }
  | { type: "SET_STRUCTURED_DATA"; payload: boolean }
  | { type: "SET_STRUCTURED_DATA_TYPE"; payload: string }
  | { type: "SAVED"; payload: { widgetId: string; dbId: string; version: number } };

function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case "SET_NAME":
      return { ...state, name: action.payload, isDirty: true };

    case "SET_CONFIG": {
      const merged = { ...state.config };
      for (const [key, value] of Object.entries(action.payload)) {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          const existing = (merged as Record<string, unknown>)[key];
          (merged as Record<string, unknown>)[key] =
            existing && typeof existing === "object" && !Array.isArray(existing)
              ? { ...(existing as Record<string, unknown>), ...(value as Record<string, unknown>) }
              : value;
        } else {
          (merged as Record<string, unknown>)[key] = value;
        }
      }
      return { ...state, config: merged, isDirty: true };
    }

    case "SET_DOMAINS":
      return { ...state, allowedDomains: action.payload, isDirty: true };

    case "SET_STATUS":
      return { ...state, status: action.payload, isDirty: true };

    case "SET_ENTITY_TYPE":
      return { ...state, entityType: action.payload, entityId: null, isDirty: true };

    case "SET_ENTITY_ID":
      return { ...state, entityId: action.payload, isDirty: true };

    case "SET_STRUCTURED_DATA":
      return { ...state, enableStructuredData: action.payload, isDirty: true };

    case "SET_STRUCTURED_DATA_TYPE":
      return { ...state, structuredDataType: action.payload, isDirty: true };

    case "SAVED":
      return {
        ...state,
        widgetId: action.payload.widgetId,
        dbId: action.payload.dbId,
        currentVersion: action.payload.version,
        isDirty: false,
      };

    default:
      return state;
  }
}

function getInitialState(widget?: WidgetConfig | null): BuilderState {
  if (widget) {
    const config = (widget.config ?? {}) as WidgetConfigJson;
    return {
      name: widget.name,
      widgetType: widget.widget_type as WidgetType,
      entityType: widget.entity_type as WidgetEntityType,
      entityId: widget.entity_id,
      config,
      allowedDomains: widget.allowed_domains ?? [],
      status: widget.status as WidgetStatus,
      enableStructuredData: widget.enable_structured_data ?? true,
      structuredDataType: widget.structured_data_type ?? "LocalBusiness",
      widgetId: widget.widget_id,
      dbId: widget.id,
      currentVersion: widget.version ?? 1,
      isDirty: false,
    };
  }

  return {
    name: "",
    widgetType: "lo_review",
    entityType: "user",
    entityId: null,
    config: {
      theme: {
        preset: "clean_white",
        colors: { ...THEME_PRESETS.clean_white.colors },
        typography: { ...THEME_PRESETS.clean_white.typography },
        layout: { ...THEME_PRESETS.clean_white.layout },
      },
      content: {
        showHeader: true,
        showAvatar: true,
        showDate: true,
        showSource: true,
        showBranding: true,
        truncateLength: 300,
      },
      filters: {
        minRating: 1,
        maxReviews: 50,
        sortOrder: "newest",
      },
    },
    allowedDomains: [],
    status: "draft",
    enableStructuredData: true,
    structuredDataType: "LocalBusiness",
    widgetId: null,
    dbId: null,
    currentVersion: 1,
    isDirty: false,
  };
}

// ── Component ─────────────────────────────────────────────────────────

interface WidgetBuilderProps {
  widget?: WidgetConfig | null;
}

export function WidgetBuilder({ widget }: WidgetBuilderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [state, dispatch] = useReducer(builderReducer, widget, getInitialState);
  const [mobileTab, setMobileTab] = useState<"settings" | "preview" | "embed">("settings");
  const [showCreateTest, setShowCreateTest] = useState(false);

  // Determine A/B test state from widget data
  const abTestConfig = widget?.ab_test_config as AbTestConfig | null;
  const hasActiveTest = abTestConfig?.enabled && abTestConfig.status === "running";
  const hasAnyTest = !!abTestConfig;
  const isVariant = !!widget?.parent_widget_id;
  const canCreateTest = !!state.dbId && !isVariant && !hasActiveTest;

  // Debounced config changes for live preview
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleConfigChange = useCallback((partial: Partial<WidgetConfigJson>) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dispatch({ type: "SET_CONFIG", payload: partial });
    }, 150);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSave = useCallback(() => {
    if (!state.name.trim()) {
      toast({ title: "Name required", description: "Enter a widget name before saving.", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      if (state.dbId) {
        const result = await updateWidget({
          id: state.dbId,
          name: state.name,
          config: state.config,
          allowed_domains: state.allowedDomains,
          enable_structured_data: state.enableStructuredData,
          structured_data_type: state.structuredDataType,
          status: state.status,
          entity_id: state.entityId ?? undefined,
        });

        if (result.success) {
          dispatch({ type: "SAVED", payload: { widgetId: result.data.widget_id, dbId: result.data.id, version: result.data.version ?? 1 } });
          toast({ title: "Widget saved", description: "Your changes have been saved." });
        } else {
          toast({ title: "Save failed", description: result.error, variant: "destructive" });
        }
      } else {
        const result = await createWidget({
          name: state.name,
          widget_type: state.widgetType,
          entity_type: state.entityType,
          entity_id: state.entityId ?? undefined,
          config: state.config,
          allowed_domains: state.allowedDomains,
          enable_structured_data: state.enableStructuredData,
          structured_data_type: state.structuredDataType,
          status: state.status,
        });

        if (result.success) {
          dispatch({ type: "SAVED", payload: { widgetId: result.data.widget_id, dbId: result.data.id, version: result.data.version ?? 1 } });
          toast({ title: "Widget created", description: "Your widget has been created." });
          router.replace(`/dashboard/widgets/${result.data.id}`);
        } else {
          toast({ title: "Creation failed", description: result.error, variant: "destructive" });
        }
      }
    });
  }, [state, router, toast]);

  const handleRollbackComplete = useCallback(() => {
    router.refresh();
  }, [router]);

  const sidebarProps = {
    config: state.config,
    widgetType: state.widgetType,
    entityType: state.entityType,
    entityId: state.entityId,
    status: state.status,
    name: state.name,
    enableStructuredData: state.enableStructuredData,
    structuredDataType: state.structuredDataType,
    allowedDomains: state.allowedDomains,
    widgetConfigId: state.dbId ?? undefined,
    currentVersion: state.currentVersion,
    onConfigChange: handleConfigChange,
    onDomainsChange: (domains: string[]) => dispatch({ type: "SET_DOMAINS", payload: domains }),
    onNameChange: (name: string) => dispatch({ type: "SET_NAME", payload: name }),
    onStatusChange: (status: WidgetStatus) => dispatch({ type: "SET_STATUS", payload: status }),
    onEntityTypeChange: (entityType: WidgetEntityType) => dispatch({ type: "SET_ENTITY_TYPE", payload: entityType }),
    onEntityIdChange: (entityId: string | null) => dispatch({ type: "SET_ENTITY_ID", payload: entityId }),
    onStructuredDataChange: (enabled: boolean) => dispatch({ type: "SET_STRUCTURED_DATA", payload: enabled }),
    onStructuredDataTypeChange: (type: string) => dispatch({ type: "SET_STRUCTURED_DATA_TYPE", payload: type }),
    onRollbackComplete: handleRollbackComplete,
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/widgets")}
            className="gap-1 text-muted-foreground"
          >
            <ArrowLeft size={16} />
            Widgets
          </Button>
          <div className="w-px h-6 bg-border" />
          <Input
            value={state.name}
            onChange={(e) => dispatch({ type: "SET_NAME", payload: e.target.value })}
            placeholder="Widget name"
            className="h-8 w-48 text-sm font-medium border-transparent hover:border-border focus:border-border"
          />
        </div>

        <div className="flex items-center gap-2">
          {state.isDirty && (
            <span className="text-xs text-amber-500 font-medium">Unsaved changes</span>
          )}
          {hasActiveTest && state.dbId && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              asChild
            >
              <Link href={`/dashboard/widgets/${state.dbId}/ab-test`}>
                <FlaskConical size={14} />
                View A/B Test
              </Link>
            </Button>
          )}
          {hasAnyTest && !hasActiveTest && state.dbId && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              asChild
            >
              <Link href={`/dashboard/widgets/${state.dbId}/ab-test`}>
                <FlaskConical size={14} />
                Past Tests
              </Link>
            </Button>
          )}
          {canCreateTest && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowCreateTest(true)}
            >
              <FlaskConical size={14} />
              A/B Test
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="gap-1.5 bg-repwell-teal-300 hover:bg-repwell-teal-400"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save
          </Button>
        </div>
      </div>

      {/* Mobile tab navigation */}
      <div className="lg:hidden border-b border-border bg-white">
        <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as "settings" | "preview" | "embed")}>
          <TabsList className="w-full grid grid-cols-3 h-10 rounded-none">
            <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
            <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
            <TabsTrigger value="embed" className="text-xs">Embed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Three-panel layout (desktop) / tabbed (mobile) */}
      <div className="flex-1 overflow-hidden">
        {/* Desktop layout */}
        <div className="hidden lg:grid lg:grid-cols-[320px_1fr_280px] h-full">
          <div className="overflow-hidden">
            <WidgetBuilderSidebar {...sidebarProps} />
          </div>
          <div className="overflow-hidden border-x border-border">
            <WidgetPreview config={state.config} widgetType={state.widgetType} entityType={state.entityType} entityId={state.entityId} />
          </div>
          <div className="overflow-hidden">
            <EmbedCodePanel widgetId={state.widgetId} />
          </div>
        </div>

        {/* Mobile layout */}
        <div className="lg:hidden h-full">
          {mobileTab === "settings" && <WidgetBuilderSidebar {...sidebarProps} />}
          {mobileTab === "preview" && (
            <WidgetPreview config={state.config} widgetType={state.widgetType} entityType={state.entityType} entityId={state.entityId} />
          )}
          {mobileTab === "embed" && <EmbedCodePanel widgetId={state.widgetId} />}
        </div>
      </div>

      {/* A/B Test creation dialog */}
      {widget && canCreateTest && (
        <CreateTestDialog
          widget={widget}
          open={showCreateTest}
          onOpenChange={setShowCreateTest}
          onCreated={() => router.refresh()}
        />
      )}
    </div>
  );
}
