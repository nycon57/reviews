"use client";

import { useMemo } from "react";
import { Monitor, DeviceMobile } from "@phosphor-icons/react";
import { Reader } from "@usewaypoint/email-builder";
import type { TReaderDocument } from "@usewaypoint/email-builder";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MERGE_FIELD_EXAMPLES } from "@/lib/email-builder/merge-fields";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ToggleSamplesPanelButton } from "./toggle-samples-button";
import { MainTabsGroup, type EditorTab } from "./main-tabs-group";
import { DownloadJson } from "./download-json";
import { ImportJson } from "./import-json";
import { HtmlPanel } from "./html-panel";
import { JsonPanel } from "./json-panel";
import { cn } from "@/lib/utils";

interface TemplatePanelProps {
  document: TReaderDocument;
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
  viewport: "desktop" | "mobile";
  onViewportChange: (viewport: "desktop" | "mobile") => void;
  samplesOpen: boolean;
  onToggleSamples: () => void;
  inspectorOpen: boolean;
  onToggleInspector: () => void;
  onImport: (document: TReaderDocument) => void;
  /** Renders the Waypoint EditorBlock for the editor tab */
  editorContent?: React.ReactNode;
}

/** Replace {{field}} patterns in all string values of a document. */
function applyMergeFields(
  doc: TReaderDocument,
  values: Record<string, string>
): TReaderDocument {
  const pattern = /\{\{(\w+)\}\}/g;
  const result: TReaderDocument = {};

  for (const [blockId, block] of Object.entries(doc)) {
    if (!block || typeof block !== "object") {
      result[blockId] = block;
      continue;
    }

    result[blockId] = {
      ...block,
      data: replaceInValue(block.data, pattern, values) as Record<string, unknown>,
    };
  }

  return result;
}

function replaceInValue(
  value: unknown,
  pattern: RegExp,
  values: Record<string, string>
): unknown {
  if (typeof value === "string") {
    return value.replace(pattern, (match, key: string) => values[key] ?? match);
  }
  if (Array.isArray(value)) {
    return value.map((v) => replaceInValue(v, pattern, values));
  }
  if (value && typeof value === "object") {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      obj[k] = replaceInValue(v, pattern, values);
    }
    return obj;
  }
  return value;
}

export function TemplatePanel({
  document,
  activeTab,
  onTabChange,
  viewport,
  onViewportChange,
  samplesOpen,
  onToggleSamples,
  inspectorOpen,
  onToggleInspector,
  onImport,
  editorContent,
}: TemplatePanelProps) {
  const previewDocument = useMemo(
    () => applyMergeFields(document, MERGE_FIELD_EXAMPLES),
    [document]
  );

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Top toolbar */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-2 sticky top-0 z-10">
        {/* Left: Toggle samples panel */}
        <div className="flex items-center">
          <ToggleSamplesPanelButton
            open={samplesOpen}
            onClick={onToggleSamples}
          />
        </div>

        {/* Center: Main tabs */}
        <div className="flex items-center">
          <MainTabsGroup activeTab={activeTab} onTabChange={onTabChange} />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-0.5">
          <DownloadJson document={document} />
          <ImportJson onImport={onImport} />

          {/* Desktop/Mobile toggle */}
          <ToggleGroup
            type="single"
            value={viewport}
            onValueChange={(v) => {
              if (v) onViewportChange(v as "desktop" | "mobile");
            }}
            size="sm"
            className="ml-1"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem value="desktop" aria-label="Desktop view">
                  <Monitor size={16} />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Desktop view</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem value="mobile" aria-label="Mobile view">
                  <DeviceMobile size={16} />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Mobile view</TooltipContent>
            </Tooltip>
          </ToggleGroup>

          {/* Toggle inspector */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleInspector}
                className={cn(
                  "ml-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  inspectorOpen && "bg-accent text-accent-foreground"
                )}
                aria-label="Toggle inspector"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="1"
                    y="1"
                    width="14"
                    height="14"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <line
                    x1="10.5"
                    y1="1"
                    x2="10.5"
                    y2="15"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {inspectorOpen ? "Close inspector" : "Open inspector"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Content area */}
      <div className="h-[calc(100vh-49px)] overflow-auto min-w-[370px]">
        {activeTab === "editor" && (
          <div className="p-4">
            {editorContent ?? (
              <p className="text-sm text-muted-foreground">
                Editor content will appear here.
              </p>
            )}
          </div>
        )}

        {activeTab === "preview" && (
          <div className="flex justify-center p-4">
            <div
              className={cn(
                "rounded-lg border border-border bg-white shadow-sm transition-all duration-300",
                viewport === "mobile"
                  ? "w-[370px] min-h-[800px]"
                  : "w-full max-w-[600px]"
              )}
            >
              {viewport === "mobile" ? (
                <div className="mx-auto w-[370px] min-h-[800px] overflow-hidden rounded-lg shadow-lg">
                  <Reader document={previewDocument} rootBlockId="root" />
                </div>
              ) : (
                <Reader document={previewDocument} rootBlockId="root" />
              )}
            </div>
          </div>
        )}

        {activeTab === "html" && <HtmlPanel document={document} />}
        {activeTab === "json" && <JsonPanel document={document} />}
      </div>
    </div>
  );
}
