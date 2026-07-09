"use client";

import { useRef, useCallback, useMemo } from "react";
import type { CanvasBackground, DesignEditorConfig, EditorActions } from "./types";
import { SHARE_STUDIO_DESIGN_EDITOR_CONFIG, SOCIAL_GRAPHICS_DESIGN_EDITOR_CONFIG } from "./config";
import { CanvasElementRenderer } from "./canvas-element";

export interface CanvasProps {
  editor: EditorActions;
  config?: DesignEditorConfig;
}

function getBackgroundStyle(bg: CanvasBackground): React.CSSProperties {
  if (bg.type === "gradient") {
    const angle = bg.gradientAngle ?? 180;
    const from = bg.gradientFrom ?? "#ffffff";
    const to = bg.gradientTo ?? "#e2e8e4";
    if (bg.gradientType === "radial") {
      return { background: `radial-gradient(circle, ${from}, ${to})` };
    }
    return { background: `linear-gradient(${angle}deg, ${from}, ${to})` };
  }
  if (bg.type === "image" && bg.imageUrl) {
    return {
      backgroundImage: `url(${bg.imageUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return { backgroundColor: bg.color ?? "#ffffff" };
}

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.5, 2];

export function EditorCanvas({ editor, config = SHARE_STUDIO_DESIGN_EDITOR_CONFIG }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { state, zoom, selectedId, select, moveElement, resizeElement } = editor;
  const { canvasSize, elements, background } = state;

  // Calculate display size based on zoom, capped by container
  const displayWidth = canvasSize.width * zoom;
  const displayHeight = canvasSize.height * zoom;

  // Scale factor from display pixels to element fraction
  const scaledCanvasWidth = canvasSize.width * zoom;
  const scaledCanvasHeight = canvasSize.height * zoom;

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        select(null);
      }
    },
    [select]
  );

  const sortedElements = useMemo(
    () => [...elements].sort((a, b) => a.zIndex - b.zIndex),
    [elements]
  );

  return (
    <div
      ref={containerRef}
      className="flex flex-1 items-center justify-center overflow-auto bg-background-muted p-8"
      onClick={handleCanvasClick}
    >
      <div
        className="relative shrink-0 shadow-lg"
        style={{
          width: displayWidth,
          height: displayHeight,
          ...getBackgroundStyle(background),
        }}
        onClick={handleCanvasClick}
      >
        {/* Grid overlay */}
        {state.gridSize > 0 && zoom >= 0.75 && (
          <svg
            className="pointer-events-none absolute inset-0"
            width="100%"
            height="100%"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="editor-grid"
                width={state.gridSize * zoom}
                height={state.gridSize * zoom}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M ${state.gridSize * zoom} 0 L 0 0 0 ${state.gridSize * zoom}`}
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeOpacity="0.7"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#editor-grid)" />
          </svg>
        )}

        {/* Elements */}
        {sortedElements.map((el) => (
          <CanvasElementRenderer
            key={el.id}
            config={config}
            element={el}
            isSelected={selectedId === el.id}
            zoom={zoom}
            canvasWidth={scaledCanvasWidth}
            canvasHeight={scaledCanvasHeight}
            onSelect={select}
            onMove={moveElement}
            onResize={resizeElement}
          />
        ))}
      </div>
    </div>
  );
}

export { ZOOM_LEVELS };

export function ShareStudioEditorCanvas({ editor }: Omit<CanvasProps, "config">) {
  return <EditorCanvas editor={editor} config={SHARE_STUDIO_DESIGN_EDITOR_CONFIG} />;
}

export function SocialGraphicsEditorCanvas({ editor }: Omit<CanvasProps, "config">) {
  return <EditorCanvas editor={editor} config={SOCIAL_GRAPHICS_DESIGN_EDITOR_CONFIG} />;
}
