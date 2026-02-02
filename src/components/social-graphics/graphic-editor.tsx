"use client";

import { useState, useRef, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateGraphic } from "@/lib/social-graphics/actions";
import {
  parseElements,
  parseCanvasSize,
  type SocialProofGraphic,
  type CanvasElement,
} from "@/lib/social-graphics/types";
import { ExportDialog } from "./export-dialog";
import { PublishDialog } from "./publish-dialog";
import { PostHistory } from "./post-history";

interface GraphicEditorProps {
  graphic: SocialProofGraphic;
  orgName: string;
  reviewText?: string | null;
  customerName?: string | null;
  rating?: number;
}

/**
 * Graphic viewer/editor with S159 export & publish capabilities.
 * Full drag-and-drop canvas editing is S157 scope.
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
  const [elements] = useState<CanvasElement[]>(
    parseElements(graphic.elements)
  );
  const canvasSize = parseCanvasSize(graphic.canvas_size);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [saved, setSaved] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [renderUrl, setRenderUrl] = useState<string | null>(
    graphic.render_url ?? null
  );

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await updateGraphic(graphic.id, { name });
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }, [graphic.id, name]);

  const renderElement = (el: CanvasElement) => {
    const style: React.CSSProperties = {
      position: "absolute",
      left: `${el.x * 100}%`,
      top: `${el.y * 100}%`,
      width: `${el.width * 100}%`,
      height: `${el.height * 100}%`,
      opacity: el.opacity,
      transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
      zIndex: el.zIndex,
      overflow: "hidden",
    };

    if (el.type === "shape") {
      return (
        <div
          key={el.id}
          style={{
            ...style,
            backgroundColor: el.backgroundColor ?? "transparent",
            borderRadius:
              el.shape === "circle"
                ? "50%"
                : el.shape === "rounded-rect"
                  ? `${el.borderRadius ?? 8}px`
                  : undefined,
            border: el.borderWidth
              ? `${el.borderWidth}px solid ${el.borderColor ?? "transparent"}`
              : undefined,
          }}
        />
      );
    }

    if (el.type === "text") {
      return (
        <div
          key={el.id}
          style={{
            ...style,
            color: el.color ?? "#000",
            fontSize: el.fontSize ? `${el.fontSize * 0.6}px` : "12px",
            fontFamily: el.fontFamily ?? "Inter, sans-serif",
            fontWeight: el.fontWeight ?? "400",
            textAlign:
              (el.textAlign as React.CSSProperties["textAlign"]) ?? "left",
            lineHeight: el.lineHeight ?? 1.4,
            letterSpacing: el.letterSpacing
              ? `${el.letterSpacing}px`
              : undefined,
            display: "flex",
            alignItems: "flex-start",
          }}
        >
          <span className="whitespace-pre-wrap break-words">
            {el.text ?? ""}
          </span>
        </div>
      );
    }

    if (el.type === "rating") {
      const stars = el.rating ?? 5;
      return (
        <div
          key={el.id}
          style={{
            ...style,
            color: el.starColor ?? "#f5c518",
            fontSize: `${(el.starSize ?? 16) * 0.6}px`,
            display: "flex",
            alignItems: "center",
            gap: "2px",
          }}
        >
          {"\u2605".repeat(stars)}
          {"\u2606".repeat(5 - stars)}
        </div>
      );
    }

    if (el.type === "stats") {
      return (
        <div
          key={el.id}
          style={{
            ...style,
            color: el.color ?? "#333",
            fontSize: `${(el.fontSize ?? 12) * 0.6}px`,
            fontFamily: el.fontFamily ?? "Inter, sans-serif",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontWeight: "700", fontSize: "1.2em" }}>
            {el.statValue ?? "0"}
          </span>
          <span style={{ opacity: 0.7, fontSize: "0.85em" }}>
            {el.statLabel ?? ""}
          </span>
        </div>
      );
    }

    return <div key={el.id} style={style} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/social-graphics")}
          >
            &larr; Back
          </Button>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="max-w-xs text-lg font-semibold"
          />
        </div>
        <div className="flex items-center gap-2">
          {renderUrl && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-800">
              Rendered
            </span>
          )}
          {saved && (
            <span className="text-xs text-repwell-sage-200">Saved</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(true)}
          >
            Export
          </Button>
          <Button size="sm" onClick={() => setPublishOpen(true)}>
            Publish
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          {canvasSize.name ?? "Custom"} ({canvasSize.width}x{canvasSize.height})
        </span>
        {graphic.template_id && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
            {graphic.template_id}
          </span>
        )}
        <span>{elements.length} elements</span>
      </div>

      <div className="flex justify-center">
        <div
          ref={canvasRef}
          className="relative overflow-hidden rounded-lg border bg-white shadow-sm"
          style={{
            width: Math.min(canvasSize.width * 0.5, 600),
            height:
              Math.min(canvasSize.width * 0.5, 600) *
              (canvasSize.height / canvasSize.width),
          }}
        >
          {elements
            .filter((el) => el.visible)
            .sort((a, b) => a.zIndex - b.zIndex)
            .map(renderElement)}
        </div>
      </div>

      <div className="rounded-xl border">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            Elements ({elements.length})
          </h3>
        </div>
        <div className="divide-y">
          {elements.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No elements. Use the full editor (coming soon) to add elements.
            </div>
          ) : (
            elements
              .sort((a, b) => b.zIndex - a.zIndex)
              .map((el) => (
                <div
                  key={el.id}
                  className="flex items-center gap-3 px-4 py-2"
                >
                  <span className="w-16 rounded bg-muted px-1.5 py-0.5 text-center text-[10px] font-medium text-muted-foreground">
                    {el.type}
                  </span>
                  <span className="flex-1 truncate text-xs text-foreground">
                    {el.text ?? el.statLabel ?? el.shape ?? el.type}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    z:{el.zIndex}
                  </span>
                </div>
              ))
          )}
        </div>
      </div>

      <PostHistory graphicId={graphic.id} />

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        graphicId={graphic.id}
        elements={elements}
        canvasSize={canvasSize}
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
