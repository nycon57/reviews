"use client";

import { useState, useCallback, useEffect } from "react";
import {
  ArrowLeft,
  ArrowCounterClockwise,
  ArrowClockwise,
  FloppyDisk,
  Monitor,
  DeviceMobile,
} from "@phosphor-icons/react";
import Link from "next/link";
import type { TReaderDocument } from "@usewaypoint/email-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { createTemplate, updateTemplate } from "@/lib/email-builder/actions";
import type { EmailDocument } from "@/lib/email-builder/types";
import {
  emailDocumentToEditorDocument,
  editorDocumentToEmailDocument,
  isEditorFormat,
  isEmailDocumentFormat,
} from "@/lib/email-builder/document-converter";

import {
  useEditorDocumentStore,
  resetDocument,
  useSelectedMainTab,
  setSelectedMainTab,
  useSelectedScreenSize,
  setSelectedScreenSize,
  useSelectedBlockId,
  useCanUndo,
  useCanRedo,
  undo,
  redo,
} from "./editor/editor-context";
import { EditorBlock } from "./editor/editor-block";
import { InspectorDrawer } from "./inspector/inspector-drawer";
import { BlockPaletteDrawer } from "./palette/block-palette-drawer";
import { EditorDndContext } from "./dnd/editor-dnd-context";
import { MainTabsGroup } from "./app/main-tabs-group";
import { HtmlPanel } from "./app/html-panel";
import { JsonPanel } from "./app/json-panel";
import { cn } from "@/lib/utils";
import { SendTestEmailDialog } from "./send-test-email-dialog";
import { EmailBrandingProvider } from "./email-branding-context";
import type { EmailBrandingConfig } from "@/lib/organization/types";

export function EmailBuilderPage({
  initialTemplate,
  orgBranding,
  orgLogoUrl,
}: {
  initialTemplate?: {
    id: string;
    name: string;
    subject: string;
    preview_text: string | null;
    document: EmailDocument;
  } | null;
  orgBranding?: EmailBrandingConfig | null;
  orgLogoUrl?: string | null;
}) {
  const [templateId, setTemplateId] = useState<string | null>(
    initialTemplate?.id ?? null
  );
  const [templateName, setTemplateName] = useState(
    initialTemplate?.name ?? "Untitled"
  );
  const [subject, setSubject] = useState(
    initialTemplate?.subject ?? ""
  );
  const [saving, setSaving] = useState(false);

  // Zustand store state
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const selectedMainTab = useSelectedMainTab();
  const selectedScreenSize = useSelectedScreenSize();
  const selectedBlockId = useSelectedBlockId();
  const isEditorTab = selectedMainTab === "editor";

  // Initialize Zustand store with initial template
  useEffect(() => {
    const doc = initialTemplate?.document;
    if (!doc) {
      resetDocument();
      return;
    }
    // Already in Waypoint editor format
    if (isEditorFormat(doc)) {
      resetDocument(doc as unknown as TReaderDocument);
    }
    // System B (EmailDocument) format → convert to editor format
    else if (isEmailDocumentFormat(doc)) {
      const converted = emailDocumentToEditorDocument(doc);
      resetDocument(converted as unknown as TReaderDocument);
    }
    // Unknown format
    else {
      resetDocument();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save handler — reads document imperatively to avoid re-creating on every keystroke
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const editorDoc = useEditorDocumentStore.getState().document;
      // Convert Waypoint format → System B for rendering/storage
      const docToSave = isEditorFormat(editorDoc)
        ? editorDocumentToEmailDocument(editorDoc as Record<string, { type: string; data: Record<string, unknown> }>)
        : (editorDoc as unknown as EmailDocument);

      if (templateId) {
        await updateTemplate(templateId, {
          name: templateName,
          subject,
          document: docToSave,
        });
        toast({ title: "Template saved" });
      } else {
        const created = await createTemplate({
          name: templateName,
          subject,
          document: docToSave,
        });
        setTemplateId(created.id);
        toast({ title: "Template created" });
        window.history.replaceState(null, "", `/dashboard/campaigns/templates/${created.id}`);
      }
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [templateId, templateName, subject]);

  // Keyboard shortcuts: Cmd+S, Cmd+Z, Cmd+Shift+Z / Cmd+Y
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "s") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (e.key === "z" && e.shiftKey || e.key === "y") {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  // Subscribe to document only for preview/html/json tabs (editor tab reads via EditorBlock)
  const document = useEditorDocumentStore((s) => s.document);

  // Render the canvas content based on selected tab
  const renderMainContent = () => {
    const readerDoc = document as TReaderDocument;

    switch (selectedMainTab) {
      case "editor":
        return (
          <div
            className={cn(
              "h-full",
              selectedScreenSize === "mobile" &&
                "mx-auto my-8 w-[370px] min-h-[800px] shadow-lg rounded-lg overflow-hidden"
            )}
          >
            <EditorBlock id="root" />
          </div>
        );
      case "preview":
        return (
          <div className="flex justify-center p-6">
            <div
              className={cn(
                "bg-white transition-all duration-300",
                selectedScreenSize === "mobile"
                  ? "w-[370px] min-h-[800px] shadow-lg rounded-lg"
                  : "w-full max-w-[600px]"
              )}
              style={{ pointerEvents: "none" }}
            >
              <EditorBlock id="root" />
            </div>
          </div>
        );
      case "html":
        return <HtmlPanel document={readerDoc} />;
      case "json":
        return <JsonPanel document={readerDoc} />;
      default:
        return null;
    }
  };

  return (
    <EmailBrandingProvider branding={orgBranding ?? null} orgLogoUrl={orgLogoUrl ?? null}>
    <TooltipProvider delayDuration={200}>
      <div className="flex h-full flex-col">
        {/* Top bar */}
        <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-background px-3">
          {/* Back button */}
          <Link href="/dashboard/campaigns?tab=templates">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} className="mr-1" />
              Back
            </Button>
          </Link>

          {/* Template name */}
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="max-w-[200px] text-sm font-medium"
            placeholder="Template name..."
          />

          {/* Subject */}
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="max-w-[240px] text-sm"
            placeholder="Subject line..."
          />

          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={undo}
                  disabled={!canUndo}
                  aria-label="Undo"
                >
                  <ArrowCounterClockwise size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo (Cmd+Z)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={redo}
                  disabled={!canRedo}
                  aria-label="Redo"
                >
                  <ArrowClockwise size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo (Cmd+Shift+Z)</TooltipContent>
            </Tooltip>
          </div>

          {/* Center: Main tabs */}
          <div className="ml-auto flex items-center gap-2">
            <MainTabsGroup
              activeTab={selectedMainTab}
              onTabChange={setSelectedMainTab}
            />
          </div>

          {/* Right: viewport + inspector toggle + save */}
          <div className="ml-auto flex items-center gap-1">
            <ToggleGroup
              type="single"
              value={selectedScreenSize}
              onValueChange={(v) => {
                if (v) setSelectedScreenSize(v as "desktop" | "mobile");
              }}
              size="sm"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="desktop" aria-label="Desktop">
                    <Monitor size={16} />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>Desktop view</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value="mobile" aria-label="Mobile">
                    <DeviceMobile size={16} />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>Mobile view</TooltipContent>
              </Tooltip>
            </ToggleGroup>

            {/* Send Test */}
            <SendTestEmailDialog
              getDocument={() => {
                const editorDoc = useEditorDocumentStore.getState().document;
                return isEditorFormat(editorDoc)
                  ? editorDocumentToEmailDocument(editorDoc as Record<string, { type: string; data: Record<string, unknown> }>)
                  : (editorDoc as unknown as EmailDocument);
              }}
              subject={subject}
              onSaveFirst={handleSave}
            />

            {/* Save */}
            <Button size="sm" onClick={handleSave} disabled={saving} className="ml-1">
              <FloppyDisk size={16} className="mr-1.5" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {/* Main body: palette + canvas + inspector */}
        <EditorDndContext>
          <div className="flex flex-1 overflow-hidden">
            {/* Palette drawer */}
            <BlockPaletteDrawer isOpen={isEditorTab} />

            {/* Canvas */}
            <div className="flex-1 overflow-auto bg-muted/30">
              {renderMainContent()}
            </div>

            {/* Inspector drawer */}
            <InspectorDrawer isOpen={isEditorTab} />
          </div>
        </EditorDndContext>

        {/* Bottom status bar */}
        <div className="flex h-8 shrink-0 items-center border-t border-border bg-background px-4">
          <p className="text-xs text-muted-foreground">
            {selectedBlockId
              ? `Selected: ${document[selectedBlockId]?.type ?? "block"}`
              : "Click a block to edit"}
          </p>
        </div>
      </div>
    </TooltipProvider>
    </EmailBrandingProvider>
  );
}
