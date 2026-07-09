"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SHARE_STUDIO_DESIGN_EDITOR_CONFIG, SOCIAL_GRAPHICS_DESIGN_EDITOR_CONFIG } from "./config";
import type { CanvasElement, DesignEditorConfig } from "./types";

export interface CanvasElementProps {
  config: DesignEditorConfig;
  element: CanvasElement;
  isSelected: boolean;
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, w: number, h: number) => void;
}

type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

const HANDLE_SIZE = 8;

function getHandleStyle(handle: ResizeHandle): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "absolute",
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    backgroundColor: "hsl(var(--primary))",
    border: "1px solid hsl(var(--background))",
    borderRadius: 2,
    zIndex: 999,
  };
  const half = -HANDLE_SIZE / 2;
  switch (handle) {
    case "nw":
      return { ...base, top: half, left: half, cursor: "nwse-resize" };
    case "n":
      return { ...base, top: half, left: "50%", marginLeft: half, cursor: "ns-resize" };
    case "ne":
      return { ...base, top: half, right: half, cursor: "nesw-resize" };
    case "e":
      return { ...base, top: "50%", right: half, marginTop: half, cursor: "ew-resize" };
    case "se":
      return { ...base, bottom: half, right: half, cursor: "nwse-resize" };
    case "s":
      return { ...base, bottom: half, left: "50%", marginLeft: half, cursor: "ns-resize" };
    case "sw":
      return { ...base, bottom: half, left: half, cursor: "nesw-resize" };
    case "w":
      return { ...base, top: "50%", left: half, marginTop: half, cursor: "ew-resize" };
  }
}

function ElementContent({ element }: { element: CanvasElement }) {
  if (element.type === "shape") {
    return (
      <div
        className="h-full w-full"
        style={{
          backgroundColor: element.backgroundColor ?? "transparent",
          borderRadius:
            element.shape === "circle"
              ? "50%"
              : element.shape === "rounded-rect"
                ? `${element.borderRadius ?? 8}px`
                : undefined,
          border: element.borderWidth
            ? `${element.borderWidth}px solid ${element.borderColor ?? "transparent"}`
            : undefined,
        }}
      />
    );
  }

  if (element.type === "text") {
    return (
      <div
        className="flex h-full w-full items-start whitespace-pre-wrap break-words"
        style={{
          color: element.color ?? "#000",
          fontSize: element.fontSize ? `${element.fontSize}px` : "16px",
          fontFamily: element.fontFamily ?? "Inter, sans-serif",
          fontWeight: element.fontWeight ?? "400",
          textAlign: (element.textAlign as React.CSSProperties["textAlign"]) ?? "left",
          lineHeight: element.lineHeight ?? 1.4,
          letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : undefined,
        }}
      >
        {element.text ?? ""}
      </div>
    );
  }

  if (element.type === "image") {
    return element.imageUrl ? (
      <img
        src={element.imageUrl}
        alt=""
        className="h-full w-full"
        style={{ objectFit: element.objectFit ?? "cover" }}
        draggable={false}
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
        Image
      </div>
    );
  }

  if (element.type === "rating") {
    const stars = element.rating ?? 5;
    return (
      <div
        className="flex h-full items-center gap-0.5"
        style={{
          color: element.starColor ?? "#f5c518",
          fontSize: `${element.starSize ?? 24}px`,
        }}
      >
        {"\u2605".repeat(stars)}
        {"\u2606".repeat(Math.max(0, 5 - stars))}
      </div>
    );
  }

  if (element.type === "stats") {
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center"
        style={{
          color: element.color ?? "#333",
          fontSize: `${element.fontSize ?? 14}px`,
          fontFamily: element.fontFamily ?? "Inter, sans-serif",
        }}
      >
        <span style={{ fontWeight: "700", fontSize: "1.4em" }}>{element.statValue ?? "0"}</span>
        <span style={{ opacity: 0.7, fontSize: "0.85em" }}>{element.statLabel ?? ""}</span>
      </div>
    );
  }

  if (element.type === "icon") {
    return (
      <div
        className="flex h-full w-full items-center justify-center"
        style={{
          color: element.iconColor ?? element.color ?? "#333",
          fontSize: `${element.fontSize ?? 24}px`,
        }}
      >
        {element.iconName ?? "\u2B50"}
      </div>
    );
  }

  return null;
}

const RESIZE_HANDLES: ResizeHandle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

export function CanvasElementRenderer({
  config,
  element,
  isSelected,
  zoom,
  canvasWidth,
  canvasHeight,
  onSelect,
  onMove,
  onResize,
}: CanvasElementProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const activePointerRef = useRef<{ pointerId: number; target: HTMLElement } | null>(null);
  const dragStart = useRef({ x: 0, y: 0, elX: 0, elY: 0 });
  const resizeStart = useRef({
    x: 0,
    y: 0,
    elW: 0,
    elH: 0,
    elX: 0,
    elY: 0,
    handle: "" as ResizeHandle,
  });

  const pxLeft = element.x * canvasWidth;
  const pxTop = element.y * canvasHeight;
  const pxWidth = element.width * canvasWidth;
  const pxHeight = element.height * canvasHeight;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (element.locked) return;
      e.stopPropagation();
      onSelect(element.id);
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        elX: element.x,
        elY: element.y,
      };
      const target = e.target as HTMLElement;
      target.setPointerCapture(e.pointerId);
      if (config.releasePointerCapture) {
        activePointerRef.current = { pointerId: e.pointerId, target };
      }
    },
    [config.releasePointerCapture, element.id, element.x, element.y, element.locked, onSelect]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isDragging) {
        const dx = (e.clientX - dragStart.current.x) / (canvasWidth * zoom);
        const dy = (e.clientY - dragStart.current.y) / (canvasHeight * zoom);
        onMove(element.id, dragStart.current.elX + dx, dragStart.current.elY + dy);
      }
      if (isResizing) {
        const s = resizeStart.current;
        const dx = (e.clientX - s.x) / (canvasWidth * zoom);
        const dy = (e.clientY - s.y) / (canvasHeight * zoom);
        let newW = s.elW;
        let newH = s.elH;
        let newX = s.elX;
        let newY = s.elY;
        if (s.handle.includes("e")) newW = s.elW + dx;
        if (s.handle.includes("w")) {
          newW = s.elW - dx;
          newX = s.elX + dx;
        }
        if (s.handle.includes("s")) newH = s.elH + dy;
        if (s.handle.includes("n")) {
          newH = s.elH - dy;
          newY = s.elY + dy;
        }
        newW = Math.max(0.02, newW);
        newH = Math.max(0.02, newH);
        onResize(element.id, newW, newH);
        if (s.handle.includes("w") || s.handle.includes("n")) {
          onMove(element.id, newX, newY);
        }
      }
    },
    [isDragging, isResizing, element.id, canvasWidth, canvasHeight, zoom, onMove, onResize]
  );

  const releaseActivePointer = useCallback(() => {
    if (config.releasePointerCapture && activePointerRef.current) {
      try {
        activePointerRef.current.target.releasePointerCapture(activePointerRef.current.pointerId);
      } catch {
        // Pointer capture may already be released
      }
      activePointerRef.current = null;
    }
  }, [config.releasePointerCapture]);

  const handlePointerUp = useCallback(() => {
    releaseActivePointer();
    setIsDragging(false);
    setIsResizing(false);
  }, [releaseActivePointer]);

  const handleResizeStart = useCallback(
    (e: React.PointerEvent, handle: ResizeHandle) => {
      e.stopPropagation();
      e.preventDefault();
      setIsResizing(true);
      resizeStart.current = {
        x: e.clientX,
        y: e.clientY,
        elW: element.width,
        elH: element.height,
        elX: element.x,
        elY: element.y,
        handle,
      };
      const target = e.target as HTMLElement;
      target.setPointerCapture(e.pointerId);
      if (config.releasePointerCapture) {
        activePointerRef.current = { pointerId: e.pointerId, target };
      }
    },
    [config.releasePointerCapture, element.width, element.height, element.x, element.y]
  );

  useEffect(() => {
    return () => {
      if (config.releasePointerCapture) {
        releaseActivePointer();
      }
    };
  }, [config.releasePointerCapture, releaseActivePointer]);

  if (!element.visible) return null;

  return (
    <div
      data-element-id={element.id}
      className={`absolute touch-none ${isDragging ? "z-50" : ""}`}
      style={{
        left: pxLeft,
        top: pxTop,
        width: pxWidth,
        height: pxHeight,
        opacity: element.opacity,
        transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
        zIndex: element.zIndex,
        cursor: element.locked ? "default" : isDragging ? "grabbing" : "grab",
        outline: isSelected ? "2px solid hsl(var(--primary))" : undefined,
        outlineOffset: 1,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <ElementContent element={element} />

      {isSelected &&
        !element.locked &&
        RESIZE_HANDLES.map((handle) => (
          <div
            key={handle}
            style={getHandleStyle(handle)}
            onPointerDown={(e) => handleResizeStart(e, handle)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
        ))}
    </div>
  );
}

export function ShareStudioCanvasElementRenderer(props: Omit<CanvasElementProps, "config">) {
  return <CanvasElementRenderer {...props} config={SHARE_STUDIO_DESIGN_EDITOR_CONFIG} />;
}

export function SocialGraphicsCanvasElementRenderer(props: Omit<CanvasElementProps, "config">) {
  return <CanvasElementRenderer {...props} config={SOCIAL_GRAPHICS_DESIGN_EDITOR_CONFIG} />;
}
