"use client";

import { useState, useTransition, useEffect } from "react";
import { Desktop, DeviceMobile } from "@phosphor-icons/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomEmailTemplate } from "@/lib/email-builder/types";
import { previewTemplate } from "@/lib/email-builder/actions";
import { MERGE_FIELD_EXAMPLES } from "@/lib/email-builder/merge-fields";

interface TemplatePreviewSheetProps {
  template: CustomEmailTemplate | null;
  open: boolean;
  onClose: () => void;
}

export function TemplatePreviewSheet({
  template,
  open,
  onClose,
}: TemplatePreviewSheetProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [isPending, startTransition] = useTransition();

  // Fetch preview when sheet opens or template changes
  useEffect(() => {
    if (open && template && !isPending) {
      setHtml(null);
      startTransition(async () => {
        try {
          const result = await previewTemplate(template.document, MERGE_FIELD_EXAMPLES);
          setHtml(result.html);
        } catch {
          setHtml(
            "<p style='padding:2rem;color:#666;font-family:sans-serif'>Failed to render preview</p>"
          );
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template?.id]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full max-w-3xl flex-col gap-0 p-0 sm:max-w-3xl"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header — pr-12 reserves space for the built-in close button */}
        <SheetHeader className="flex-none border-b border-border px-6 py-4 pr-12">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate text-base">
                {template?.name ?? "Preview"}
              </SheetTitle>
              {template?.subject && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  Subject: {template.subject}
                </p>
              )}
            </div>

            {/* Viewport toggles */}
            <div className="flex rounded-lg border border-border p-0.5">
              <button
                type="button"
                onClick={() => setViewport("desktop")}
                className={`rounded-md p-1.5 transition-colors ${
                  viewport === "desktop"
                    ? "bg-repwell-teal-300/10 text-repwell-teal-300"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Desktop preview"
              >
                <Desktop size={16} weight={viewport === "desktop" ? "fill" : "regular"} />
              </button>
              <button
                type="button"
                onClick={() => setViewport("mobile")}
                className={`rounded-md p-1.5 transition-colors ${
                  viewport === "mobile"
                    ? "bg-repwell-teal-300/10 text-repwell-teal-300"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Mobile preview"
              >
                <DeviceMobile size={16} weight={viewport === "mobile" ? "fill" : "regular"} />
              </button>
            </div>
          </div>
        </SheetHeader>

        {/* Preview area */}
        <div className="flex-1 overflow-auto bg-muted/30 p-6">
          <div className="flex justify-center">
            {isPending || !html ? (
              <PreviewSkeleton viewport={viewport} />
            ) : (
              <div
                className="overflow-hidden rounded-lg border border-border bg-white shadow-sm"
                style={{
                  width: viewport === "mobile" ? 375 : 650,
                  transition: "width 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)",
                }}
              >
                <iframe
                  srcDoc={html}
                  title="Email preview"
                  className="h-[700px] w-full border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            )}
          </div>

          {/* Merge field notice */}
          {!isPending && html && (
            <p className="mt-4 text-center text-[11px] text-muted-foreground/60">
              Showing with sample data — actual values vary per recipient
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function PreviewSkeleton({ viewport }: { viewport: "desktop" | "mobile" }) {
  const width = viewport === "mobile" ? 375 : 650;
  return (
    <div
      className="overflow-hidden rounded-lg border border-border bg-white p-6"
      style={{ width }}
    >
      <Skeleton className="mx-auto mb-6 h-10 w-32" />
      <Skeleton className="mb-4 h-6 w-3/4" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="mb-6 h-4 w-2/3" />
      <Skeleton className="mx-auto mb-6 h-10 w-40 rounded-lg" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
