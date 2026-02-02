"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Save,
  Grid3X3,
  Palette,
} from "lucide-react";
import { CANVAS_PRESETS } from "@/lib/social-graphics/types";
import type { EditorActions, CanvasBackground } from "./use-editor-state";
import { ZOOM_LEVELS } from "./canvas";

interface ToolbarProps {
  editor: EditorActions;
  graphicName: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  isSaving: boolean;
  saved: boolean;
}

export function EditorToolbar({
  editor,
  graphicName,
  onNameChange,
  onSave,
  isSaving,
  saved,
}: ToolbarProps) {
  const { state, zoom, setZoom, canUndo, canRedo, undo, redo, setCanvasSize, setBackground, setGridSize } =
    editor;

  const [customWidth, setCustomWidth] = useState(state.canvasSize.width);
  const [customHeight, setCustomHeight] = useState(state.canvasSize.height);

  const handleZoomIn = useCallback(() => {
    const idx = ZOOM_LEVELS.indexOf(zoom);
    if (idx < ZOOM_LEVELS.length - 1) setZoom(ZOOM_LEVELS[idx + 1]);
  }, [zoom, setZoom]);

  const handleZoomOut = useCallback(() => {
    const idx = ZOOM_LEVELS.indexOf(zoom);
    if (idx > 0) setZoom(ZOOM_LEVELS[idx - 1]);
  }, [zoom, setZoom]);

  const handleFitToScreen = useCallback(() => {
    setZoom(1);
  }, [setZoom]);

  const handlePresetChange = useCallback(
    (value: string) => {
      if (value === "custom") return;
      const preset = CANVAS_PRESETS.find((p) => p.name === value);
      if (preset) setCanvasSize(preset);
    },
    [setCanvasSize]
  );

  const handleCustomSize = useCallback(() => {
    setCanvasSize({ width: customWidth, height: customHeight, name: "Custom" });
  }, [customWidth, customHeight, setCanvasSize]);

  const bg = state.background;

  return (
    <div className="flex items-center gap-2 border-b border-border bg-background-subtle px-4 py-2">
      {/* Name */}
      <Input
        value={graphicName}
        onChange={(e) => onNameChange(e.target.value)}
        className="h-8 max-w-[200px] text-sm font-semibold"
      />

      <Separator orientation="vertical" className="h-6" />

      {/* Canvas Size */}
      <Select
        value={state.canvasSize.name ?? "Custom"}
        onValueChange={handlePresetChange}
      >
        <SelectTrigger className="h-8 w-[160px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CANVAS_PRESETS.map((p) => (
            <SelectItem key={p.name} value={p.name!}>
              {p.name} ({p.width}x{p.height})
            </SelectItem>
          ))}
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>

      {/* Custom Size Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 text-xs">
            {state.canvasSize.width}x{state.canvasSize.height}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 space-y-3 p-3" align="start">
          <h4 className="text-xs font-semibold">Custom Size</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px]">Width</Label>
              <Input
                type="number"
                min={100}
                max={4000}
                value={customWidth}
                onChange={(e) => setCustomWidth(parseInt(e.target.value) || 100)}
                className="h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px]">Height</Label>
              <Input
                type="number"
                min={100}
                max={4000}
                value={customHeight}
                onChange={(e) =>
                  setCustomHeight(parseInt(e.target.value) || 100)
                }
                className="h-7 text-xs"
              />
            </div>
          </div>
          <Button size="sm" className="h-7 w-full text-xs" onClick={handleCustomSize}>
            Apply
          </Button>
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="h-6" />

      {/* Background */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
            <Palette className="h-3.5 w-3.5" />
            Background
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 space-y-3 p-3" align="start">
          <h4 className="text-xs font-semibold">Canvas Background</h4>
          <div>
            <Label className="text-[10px]">Type</Label>
            <Select
              value={bg.type}
              onValueChange={(v) =>
                setBackground({
                  ...bg,
                  type: v as CanvasBackground["type"],
                })
              }
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid Color</SelectItem>
                <SelectItem value="gradient">Gradient</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {bg.type === "solid" && (
            <div>
              <Label className="text-[10px]">Color</Label>
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={bg.color ?? "#ffffff"}
                  onChange={(e) =>
                    setBackground({ ...bg, color: e.target.value })
                  }
                  className="h-7 w-7 cursor-pointer rounded border border-border"
                />
                <Input
                  value={bg.color ?? "#ffffff"}
                  onChange={(e) =>
                    setBackground({ ...bg, color: e.target.value })
                  }
                  className="h-7 text-xs"
                />
              </div>
            </div>
          )}
          {bg.type === "gradient" && (
            <>
              <div>
                <Label className="text-[10px]">Gradient Type</Label>
                <Select
                  value={bg.gradientType ?? "linear"}
                  onValueChange={(v) =>
                    setBackground({
                      ...bg,
                      gradientType: v as "linear" | "radial",
                    })
                  }
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="radial">Radial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px]">From</Label>
                  <input
                    type="color"
                    value={bg.gradientFrom ?? "#ffffff"}
                    onChange={(e) =>
                      setBackground({ ...bg, gradientFrom: e.target.value })
                    }
                    className="h-7 w-full cursor-pointer rounded border border-border"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">To</Label>
                  <input
                    type="color"
                    value={bg.gradientTo ?? "#e2e8e4"}
                    onChange={(e) =>
                      setBackground({ ...bg, gradientTo: e.target.value })
                    }
                    className="h-7 w-full cursor-pointer rounded border border-border"
                  />
                </div>
              </div>
              {bg.gradientType !== "radial" && (
                <div>
                  <Label className="text-[10px]">Angle</Label>
                  <Input
                    type="number"
                    min={0}
                    max={360}
                    value={bg.gradientAngle ?? 180}
                    onChange={(e) =>
                      setBackground({
                        ...bg,
                        gradientAngle: parseInt(e.target.value) || 0,
                      })
                    }
                    className="h-7 text-xs"
                  />
                </div>
              )}
            </>
          )}
          {bg.type === "image" && (
            <div>
              <Label className="text-[10px]">Image URL</Label>
              <Input
                value={bg.imageUrl ?? ""}
                onChange={(e) =>
                  setBackground({ ...bg, imageUrl: e.target.value })
                }
                placeholder="https://..."
                className="h-7 text-xs"
              />
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Grid */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
            <Grid3X3 className="h-3.5 w-3.5" />
            Grid: {state.gridSize}px
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 space-y-2 p-3" align="start">
          <h4 className="text-xs font-semibold">Grid Size</h4>
          <div className="grid grid-cols-3 gap-1">
            {[0, 4, 8, 16, 24, 32].map((size) => (
              <Button
                key={size}
                variant={state.gridSize === size ? "default" : "ghost"}
                size="sm"
                className="h-7 text-[10px]"
                onClick={() => setGridSize(size)}
              >
                {size === 0 ? "Off" : `${size}px`}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex-1" />

      {/* Undo / Redo */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={undo}
        disabled={!canUndo}
        aria-label="Undo"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={redo}
        disabled={!canRedo}
        aria-label="Redo"
      >
        <Redo2 className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Zoom */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={handleZoomOut}
        disabled={zoom <= ZOOM_LEVELS[0]}
        aria-label="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <span className="w-12 text-center text-xs font-medium text-muted-foreground">
        {Math.round(zoom * 100)}%
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={handleZoomIn}
        disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
        aria-label="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1 text-xs"
        onClick={handleFitToScreen}
        aria-label="Fit to screen"
      >
        <Maximize className="h-3.5 w-3.5" />
        Fit
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Save */}
      {saved && (
        <span className="text-xs text-repwell-sage-200">Saved</span>
      )}
      <Button
        size="sm"
        className="h-8 gap-1"
        onClick={onSave}
        disabled={isSaving}
      >
        <Save className="h-3.5 w-3.5" />
        {isSaving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
