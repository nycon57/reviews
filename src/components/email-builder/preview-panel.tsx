"use client";

import { useState, useCallback } from "react";
import { Desktop, DeviceMobile } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useEditorStore } from "./store";
import { previewTemplate } from "@/lib/email-builder/actions";
import { MERGE_FIELD_EXAMPLES } from "@/lib/email-builder/merge-fields";

export function PreviewPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const document = useEditorStore((s) => s.document);
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");

  const loadPreview = useCallback(async () => {
    setLoading(true);
    try {
      const result = await previewTemplate(document, MERGE_FIELD_EXAMPLES);
      setHtml(result.html);
    } catch {
      setHtml("<p>Failed to render preview</p>");
    } finally {
      setLoading(false);
    }
  }, [document]);

  // Load preview when panel opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      loadPreview();
    } else {
      onClose();
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full max-w-3xl sm:max-w-3xl">
        <SheetHeader className="flex flex-row items-center justify-between">
          <SheetTitle>Email Preview</SheetTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={viewport === "desktop" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewport("desktop")}
            >
              <Desktop size={16} className="mr-1.5" />
              Desktop
            </Button>
            <Button
              variant={viewport === "mobile" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewport("mobile")}
            >
              <DeviceMobile size={16} className="mr-1.5" />
              Mobile
            </Button>
            <Button variant="ghost" size="sm" onClick={() => loadPreview()}>
              Refresh
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-4 flex justify-center overflow-auto">
          {loading ? (
            <div className="flex h-96 items-center justify-center">
              <p className="text-sm text-muted-foreground">Rendering...</p>
            </div>
          ) : html ? (
            <div
              className="rounded-lg border border-border bg-white shadow-sm"
              style={{
                width: viewport === "mobile" ? 375 : 650,
                transition: "width 0.3s ease",
              }}
            >
              <iframe
                srcDoc={html}
                title="Email preview"
                className="h-[700px] w-full border-0"
                sandbox="allow-same-origin"
              />
            </div>
          ) : (
            <div className="flex h-96 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Click Refresh to render preview
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
