"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateGraphic, duplicateGraphic } from "@/lib/social-graphics/actions";
import {
  parseElements,
  parseCanvasSize,
  type SocialProofGraphic,
} from "@/lib/social-graphics/types";
import {
  SocialGraphicsEditorCanvas as EditorCanvas,
  SocialGraphicsEditorToolbar as EditorToolbar,
  SocialGraphicsElementPalette as ElementPalette,
  SocialGraphicsLayerPanel as LayerPanel,
  SocialGraphicsPropertyPanel as PropertyPanel,
  useSocialGraphicsEditorState as useEditorState,
} from "@/components/shared/design-editor";
import { ExportDialog } from "./export-dialog";
import { PublishDialog } from "./publish-dialog";
import { PostHistory } from "./post-history";
import {
  ArrowLeft,
  Download,
  Share2,
  Copy,
  History,
} from "lucide-react";

interface GraphicEditorProps {
  graphic: SocialProofGraphic;
  orgName: string;
  reviewText?: string | null;
  customerName?: string | null;
  rating?: number;
}

/**
 * Full drag-and-drop Social Proof Editor (S157).
 * Includes canvas workspace, element palette, property panel, layer management,
 * undo/redo, zoom, and save/load/duplicate.
 */
export function GraphicEditor({
  graphic,
  orgName,
  reviewText,
  customerName,
  rating,
}: GraphicEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(graphic.name);
  const [saved, setSaved] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [renderUrl, setRenderUrl] = useState<string | null>(
    graphic.render_url ?? null
  );

  const initialElements = parseElements(graphic.elements);
  const initialCanvasSize = parseCanvasSize(graphic.canvas_size);

  const editor = useEditorState(initialElements, initialCanvasSize);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await updateGraphic(graphic.id, {
        name,
        canvasSize: editor.state.canvasSize,
        elements: editor.state.elements,
      });
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }, [graphic.id, name, editor.state.canvasSize, editor.state.elements]);

  const handleDuplicate = useCallback(() => {
    startTransition(async () => {
      const result = await duplicateGraphic(graphic.id);
      if (result.success) {
        router.push(`/dashboard/social-graphics/${result.data.id}`);
      }
    });
  }, [graphic.id, router]);

  const [rightTab, setRightTab] = useState<string>("properties");

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-background px-3 py-1.5">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => router.push("/dashboard/social-graphics")}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
          {graphic.template_id && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {graphic.template_id}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {renderUrl && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-800">
              Rendered
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={handleDuplicate}
            disabled={isPending}
          >
            <Copy className="h-3.5 w-3.5" />
            Duplicate
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => setExportOpen(true)}
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => setPublishOpen(true)}
          >
            <Share2 className="h-3.5 w-3.5" />
            Publish
          </Button>
        </div>
      </div>

      {/* Editor Toolbar */}
      <EditorToolbar
        editor={editor}
        graphicName={name}
        onNameChange={setName}
        onSave={handleSave}
        isSaving={isPending}
        saved={saved}
      />

      {/* Main Layout: Left Palette | Canvas | Right Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Element Palette */}
        <div className="hidden w-52 shrink-0 border-r border-border bg-background lg:block">
          <ElementPalette editor={editor} />
        </div>

        {/* Canvas Area */}
        <EditorCanvas editor={editor} />

        {/* Right Sidebar - Properties / Layers / History */}
        <div className="hidden w-64 shrink-0 border-l border-border bg-background lg:block">
          <Tabs value={rightTab} onValueChange={setRightTab} className="flex h-full flex-col">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-2">
              <TabsTrigger value="properties" className="text-xs">
                Properties
              </TabsTrigger>
              <TabsTrigger value="layers" className="text-xs">
                Layers
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs">
                <History className="mr-1 h-3 w-3" />
                Posts
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="properties"
              className="mt-0 flex-1 overflow-hidden"
            >
              <PropertyPanel editor={editor} />
            </TabsContent>
            <TabsContent
              value="layers"
              className="mt-0 flex-1 overflow-hidden"
            >
              <LayerPanel editor={editor} />
            </TabsContent>
            <TabsContent
              value="history"
              className="mt-0 flex-1 overflow-auto p-3"
            >
              <PostHistory graphicId={graphic.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialogs */}
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        graphicId={graphic.id}
        elements={editor.state.elements}
        canvasSize={editor.state.canvasSize}
        onRenderComplete={(url) => setRenderUrl(url)}
      />

      <PublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        graphicId={graphic.id}
        renderUrl={renderUrl}
        orgName={orgName}
        reviewText={reviewText}
        customerName={customerName}
        rating={rating}
      />
    </div>
  );
}
