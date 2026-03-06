"use client";

import { useReducer, useCallback, useTransition, useRef, useEffect, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Loader2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { WidgetBuilderSidebar } from "./widget-builder-sidebar";
import { WidgetPreview } from "./widget-preview";
import { updateWidget } from "@/lib/widgets/actions";
import type { WidgetConfigJson } from "@/lib/widgets/schemas";
import type { WidgetConfig, WidgetType, WidgetEntityType } from "@/lib/widgets/types";
import { WIDGET_TYPE_LABELS } from "@/lib/widgets/constants";
import { THEME_PRESETS } from "./theme-preset-selector";

// ── State management ──────────────────────────────────────────────────

interface BuilderState {
  widgetType: WidgetType;
  entityType: WidgetEntityType;
  entityId: string | null;
  config: WidgetConfigJson;
  allowedDomains: string[];
  enableStructuredData: boolean;
  structuredDataType: string;
  widgetId: string | null;
  dbId: string | null;
  currentVersion: number;
  isDirty: boolean;
}

type BuilderAction =
  | { type: "SET_CONFIG"; payload: Partial<WidgetConfigJson> }
  | { type: "SET_DOMAINS"; payload: string[] }
  | { type: "SET_ENTITY_TYPE"; payload: WidgetEntityType }
  | { type: "SET_ENTITY_ID"; payload: string | null }
  | { type: "SET_STRUCTURED_DATA"; payload: boolean }
  | { type: "SET_STRUCTURED_DATA_TYPE"; payload: string }
  | { type: "SAVED"; payload: { widgetId: string; dbId: string; version: number } };

function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
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

function getInitialState(widget: WidgetConfig): BuilderState {
  const config = (widget.config ?? {}) as WidgetConfigJson;
  return {
    widgetType: widget.widget_type as WidgetType,
    entityType: widget.entity_type as WidgetEntityType,
    entityId: widget.entity_id,
    config: Object.keys(config).length > 0
      ? config
      : {
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
    allowedDomains: widget.allowed_domains ?? [],
    enableStructuredData: widget.enable_structured_data ?? true,
    structuredDataType: widget.structured_data_type ?? "LocalBusiness",
    widgetId: widget.widget_id,
    dbId: widget.id,
    currentVersion: widget.version ?? 1,
    isDirty: false,
  };
}

// ── Resizable layout ──────────────────────────────────────────────────

const SIDEBAR_DEFAULT = 380;
const SIDEBAR_MIN = 280;
const SIDEBAR_MAX = 560;

function ResizableLayout({
  className,
  sidebar,
  main,
}: {
  className?: string;
  sidebar: React.ReactNode;
  main: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onPointerDown = useCallback((e: ReactPointerEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    function onPointerMove(e: globalThis.PointerEvent) {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setSidebarWidth(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, x)));
    }
    function onPointerUp() {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  return (
    <div ref={containerRef} className={className}>
      <div className="overflow-y-auto overflow-x-hidden" style={{ width: sidebarWidth, flexShrink: 0 }}>
        {sidebar}
      </div>
      {/* Drag handle */}
      <div
        onPointerDown={onPointerDown}
        className="relative flex w-px items-center justify-center bg-border cursor-col-resize select-none shrink-0 hover:bg-repwell-teal-200 active:bg-repwell-teal-300 transition-colors"
      >
        <div className="z-10 flex h-5 w-3.5 items-center justify-center rounded-sm border bg-muted">
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">
        {main}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────

interface WidgetBuilderProps {
  widget: WidgetConfig;
}

export function WidgetBuilder({ widget }: WidgetBuilderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [state, dispatch] = useReducer(builderReducer, widget, getInitialState);
  const [mobileTab, setMobileTab] = useState<"settings" | "preview">("settings");

  const templateName = WIDGET_TYPE_LABELS[state.widgetType] ?? state.widgetType;

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

  const handleSave = () => {
    if (!state.dbId) return;

    startTransition(async () => {
      const result = await updateWidget({
        id: state.dbId!,
        config: state.config,
        allowed_domains: state.allowedDomains,
        enable_structured_data: state.enableStructuredData,
        structured_data_type: state.structuredDataType,
        entity_id: state.entityId ?? undefined,
      });

      if (result.success) {
        dispatch({ type: "SAVED", payload: { widgetId: result.data.widget_id, dbId: result.data.id, version: result.data.version ?? 1 } });
        toast({ title: "Widget saved", description: "Your changes have been saved." });
      } else {
        toast({ title: "Save failed", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleRollbackComplete = useCallback(() => {
    router.refresh();
  }, [router]);

  const sidebarProps = {
    config: state.config,
    widgetType: state.widgetType,
    entityType: state.entityType,
    entityId: state.entityId,
    enableStructuredData: state.enableStructuredData,
    structuredDataType: state.structuredDataType,
    allowedDomains: state.allowedDomains,
    widgetConfigId: state.dbId ?? undefined,
    currentVersion: state.currentVersion,
    templateName,
    widgetId: state.widgetId,
    onConfigChange: handleConfigChange,
    onDomainsChange: (domains: string[]) => dispatch({ type: "SET_DOMAINS", payload: domains }),
    onEntityTypeChange: (entityType: WidgetEntityType) => dispatch({ type: "SET_ENTITY_TYPE", payload: entityType }),
    onEntityIdChange: (entityId: string | null) => dispatch({ type: "SET_ENTITY_ID", payload: entityId }),
    onStructuredDataChange: (enabled: boolean) => dispatch({ type: "SET_STRUCTURED_DATA", payload: enabled }),
    onStructuredDataTypeChange: (type: string) => dispatch({ type: "SET_STRUCTURED_DATA_TYPE", payload: type }),
    onRollbackComplete: handleRollbackComplete,
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border flex-wrap gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/widgets")}
            className="gap-1 text-muted-foreground flex-shrink-0"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Widgets</span>
          </Button>
          <div className="w-px h-6 bg-border flex-shrink-0" />
          <h2 className="text-sm font-medium text-heading truncate">
            {templateName}
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {state.isDirty && (
            <span className="text-xs text-amber-500 font-medium">Unsaved changes</span>
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
      <div className="lg:hidden border-b border-border bg-card">
        <div className="grid grid-cols-2 h-10">
          <button
            onClick={() => setMobileTab("settings")}
            className={`text-xs font-medium transition-colors ${mobileTab === "settings" ? "text-heading border-b-2 border-repwell-teal-300" : "text-muted-foreground"}`}
          >
            Settings
          </button>
          <button
            onClick={() => setMobileTab("preview")}
            className={`text-xs font-medium transition-colors ${mobileTab === "preview" ? "text-heading border-b-2 border-repwell-teal-300" : "text-muted-foreground"}`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Two-panel layout (desktop) / tabbed (mobile) */}
      <div className="flex-1 overflow-hidden">
        {/* Desktop layout — drag-resizable sidebar */}
        <ResizableLayout
          className="hidden lg:flex h-full"
          sidebar={<WidgetBuilderSidebar {...sidebarProps} />}
          main={<WidgetPreview config={state.config} widgetType={state.widgetType} entityType={state.entityType} entityId={state.entityId} />}
        />

        {/* Mobile layout */}
        <div className="lg:hidden h-full overflow-y-auto">
          {mobileTab === "settings" && <WidgetBuilderSidebar {...sidebarProps} />}
          {mobileTab === "preview" && (
            <WidgetPreview config={state.config} widgetType={state.widgetType} entityType={state.entityType} entityId={state.entityId} />
          )}
        </div>
      </div>
    </div>
  );
}
