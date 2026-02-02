"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { uploadRenderedGraphic } from "@/lib/social-graphics/render-actions";
import type { ExportFormat, CanvasElement, CanvasSize } from "@/lib/social-graphics/types";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  graphicId: string;
  elements: CanvasElement[];
  canvasSize: CanvasSize;
  onRenderComplete: (url: string) => void;
}

type ExportState = "idle" | "rendering" | "uploading" | "done" | "error";

export function ExportDialog({
  open,
  onOpenChange,
  graphicId,
  elements,
  canvasSize,
  onRenderComplete,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("png");
  const [retina, setRetina] = useState(false);
  const [state, setState] = useState<ExportState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const scale = retina ? 2 : 1;
  const outputWidth = canvasSize.width * scale;
  const outputHeight = canvasSize.height * scale;

  const renderToCanvas = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = outputWidth;
        canvas.height = outputHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }

        // White background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, outputWidth, outputHeight);

        const visible = elements
          .filter((el) => el.visible)
          .sort((a, b) => a.zIndex - b.zIndex);

        for (const el of visible) {
          const x = el.x * outputWidth;
          const y = el.y * outputHeight;
          const w = el.width * outputWidth;
          const h = el.height * outputHeight;

          ctx.save();
          ctx.globalAlpha = el.opacity;
          if (el.rotation) {
            ctx.translate(x + w / 2, y + h / 2);
            ctx.rotate((el.rotation * Math.PI) / 180);
            ctx.translate(-(x + w / 2), -(y + h / 2));
          }

          if (el.type === "shape") {
            ctx.fillStyle = el.backgroundColor ?? "transparent";
            if (el.shape === "circle") {
              ctx.beginPath();
              ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
              ctx.fill();
            } else {
              const r = el.shape === "rounded-rect" ? (el.borderRadius ?? 8) * scale : 0;
              ctx.beginPath();
              ctx.roundRect(x, y, w, h, r);
              ctx.fill();
            }
            if (el.borderWidth) {
              ctx.strokeStyle = el.borderColor ?? "transparent";
              ctx.lineWidth = el.borderWidth * scale;
              ctx.stroke();
            }
          }

          if (el.type === "text") {
            const fontSize = (el.fontSize ?? 16) * scale;
            ctx.fillStyle = el.color ?? "#000";
            ctx.font = `${el.fontWeight ?? "400"} ${fontSize}px ${el.fontFamily ?? "Inter, sans-serif"}`;
            // eslint-disable-next-line no-undef -- CanvasRenderingContext2D is a global DOM type
            ctx.textAlign = (el.textAlign ?? "left") as CanvasRenderingContext2D["textAlign"];
            ctx.textBaseline = "top";
            const textX = el.textAlign === "center" ? x + w / 2 : el.textAlign === "right" ? x + w : x;
            ctx.fillText(el.text ?? "", textX, y, w);
          }

          if (el.type === "rating") {
            const stars = el.rating ?? 5;
            const starSize = (el.starSize ?? 16) * scale;
            ctx.fillStyle = el.starColor ?? "#f5c518";
            ctx.font = `${starSize}px sans-serif`;
            ctx.textBaseline = "top";
            ctx.fillText("\u2605".repeat(stars) + "\u2606".repeat(5 - stars), x, y);
          }

          if (el.type === "stats") {
            const fontSize = (el.fontSize ?? 12) * scale;
            ctx.fillStyle = el.color ?? "#333";
            ctx.font = `700 ${fontSize * 1.2}px ${el.fontFamily ?? "Inter, sans-serif"}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText(el.statValue ?? "0", x + w / 2, y + h * 0.3);
            ctx.font = `400 ${fontSize * 0.85}px ${el.fontFamily ?? "Inter, sans-serif"}`;
            ctx.globalAlpha = el.opacity * 0.7;
            ctx.fillText(el.statLabel ?? "", x + w / 2, y + h * 0.55);
          }

          ctx.restore();
        }

        const mimeType = format === "jpg" ? "image/jpeg" : `image/${format}`;
        const quality = format === "jpg" ? 0.92 : undefined;
        resolve(canvas.toDataURL(mimeType, quality));
      } catch (err) {
        reject(err);
      }
    });
  }, [elements, outputWidth, outputHeight, format, scale]);

  const handleExport = useCallback(async () => {
    setError(null);
    setState("rendering");

    try {
      const base64 = await renderToCanvas();
      setState("uploading");

      const result = await uploadRenderedGraphic({
        graphicId,
        imageBase64: base64,
        format,
        width: outputWidth,
        height: outputHeight,
      });

      if (!result.success) {
        setError(result.error);
        setState("error");
        return;
      }

      setDownloadUrl(base64);
      onRenderComplete(result.data.url);
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
      setState("error");
    }
  }, [renderToCanvas, graphicId, format, outputWidth, outputHeight, onRenderComplete]);

  const handleDownload = useCallback(() => {
    if (!downloadUrl) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `graphic.${format}`;
    a.click();
  }, [downloadUrl, format]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Graphic</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium">Format</label>
            <div className="mt-1.5 flex gap-2">
              {(["png", "jpg", "webp"] as ExportFormat[]).map((f) => (
                <Button
                  key={f}
                  variant={format === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormat(f)}
                >
                  {f.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="retina"
              checked={retina}
              onChange={(e) => setRetina(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="retina" className="text-sm">
              2x Retina ({outputWidth}x{outputHeight})
            </label>
          </div>

          <div className="text-xs text-muted-foreground">
            Output: {outputWidth} x {outputHeight}px
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {state === "done" && (
            <Button variant="outline" size="sm" onClick={handleDownload}>
              Download
            </Button>
          )}
          <Button
            onClick={handleExport}
            disabled={state === "rendering" || state === "uploading"}
          >
            {state === "rendering"
              ? "Rendering..."
              : state === "uploading"
                ? "Uploading..."
                : state === "done"
                  ? "Re-export"
                  : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
