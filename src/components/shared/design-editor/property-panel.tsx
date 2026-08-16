"use client";

import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowUpToLine,
  ArrowDownToLine,
  Copy,
  Trash2,
} from "lucide-react";
import type { CanvasElement, EditorActions, ShapeType, TextAlignment } from "./types";

interface PropertyPanelProps {
  editor: EditorActions;
}

const FONT_FAMILIES = [
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
];

export function PropertyPanel({ editor }: PropertyPanelProps) {
  const {
    selectedElement,
    selectedId,
    updateElement,
    bringForward,
    sendBackward,
    duplicateElement,
    deleteElement,
  } = editor;

  const update = useCallback(
    (updates: Partial<CanvasElement>) => {
      if (selectedId) updateElement(selectedId, updates);
    },
    [selectedId, updateElement]
  );

  if (!selectedElement) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-center text-xs text-muted-foreground">
          Select an element to edit its properties
        </p>
      </div>
    );
  }

  const el = selectedElement;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-foreground">Properties</h3>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {el.type}
          </span>
        </div>

        {/* Position & Size */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-repwell-teal-300">
            Transform
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">X</Label>
              <Input
                type="number"
                step={0.01}
                value={Math.round(el.x * 1000) / 1000}
                onChange={(e) => update({ x: parseFloat(e.target.value) || 0 })}
                className="h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Y</Label>
              <Input
                type="number"
                step={0.01}
                value={Math.round(el.y * 1000) / 1000}
                onChange={(e) => update({ y: parseFloat(e.target.value) || 0 })}
                className="h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Width</Label>
              <Input
                type="number"
                step={0.01}
                min={0.01}
                value={Math.round(el.width * 1000) / 1000}
                onChange={(e) =>
                  update({ width: Math.max(0.01, parseFloat(e.target.value) || 0.01) })
                }
                className="h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Height</Label>
              <Input
                type="number"
                step={0.01}
                min={0.01}
                value={Math.round(el.height * 1000) / 1000}
                onChange={(e) =>
                  update({ height: Math.max(0.01, parseFloat(e.target.value) || 0.01) })
                }
                className="h-7 text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">Rotation</Label>
              <Input
                type="number"
                step={1}
                value={el.rotation}
                onChange={(e) => update({ rotation: parseFloat(e.target.value) || 0 })}
                className="h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Opacity</Label>
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={[el.opacity]}
                onValueChange={([v]) => update({ opacity: v })}
                className="mt-2"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Layer */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-repwell-teal-300">
            Layer
          </h4>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 flex-1 text-[10px]"
              onClick={() => bringForward(el.id)}
            >
              <ArrowUpToLine className="mr-1 h-3 w-3" />
              Forward
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 flex-1 text-[10px]"
              onClick={() => sendBackward(el.id)}
            >
              <ArrowDownToLine className="mr-1 h-3 w-3" />
              Back
            </Button>
          </div>
        </div>

        <Separator />

        {/* Text Properties */}
        {(el.type === "text" || el.type === "stats") && (
          <>
            <div className="space-y-2">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-repwell-teal-300">
                Typography
              </h4>
              {el.type === "text" && (
                <div>
                  <Label className="text-[10px] text-muted-foreground">Text</Label>
                  <textarea
                    value={el.text ?? ""}
                    onChange={(e) => update({ text: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-repwell-teal-300/20"
                    rows={3}
                  />
                </div>
              )}
              {el.type === "stats" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Value</Label>
                    <Input
                      value={el.statValue ?? ""}
                      onChange={(e) => update({ statValue: e.target.value })}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Label</Label>
                    <Input
                      value={el.statLabel ?? ""}
                      onChange={(e) => update({ statLabel: e.target.value })}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              )}
              <div>
                <Label className="text-[10px] text-muted-foreground">Font</Label>
                <Select
                  value={el.fontFamily ?? "Inter, sans-serif"}
                  onValueChange={(v) => update({ fontFamily: v })}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Size</Label>
                  <Input
                    type="number"
                    min={8}
                    max={200}
                    value={el.fontSize ?? 16}
                    onChange={(e) => update({ fontSize: parseInt(e.target.value) || 16 })}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Weight</Label>
                  <Select
                    value={el.fontWeight ?? "400"}
                    onValueChange={(v) => update({ fontWeight: v })}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="300">Light</SelectItem>
                      <SelectItem value="400">Regular</SelectItem>
                      <SelectItem value="500">Medium</SelectItem>
                      <SelectItem value="600">Semibold</SelectItem>
                      <SelectItem value="700">Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Color</Label>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={el.color ?? "#000000"}
                      onChange={(e) => update({ color: e.target.value })}
                      className="h-7 w-7 cursor-pointer rounded border border-border"
                    />
                    <Input
                      value={el.color ?? "#000000"}
                      onChange={(e) => update({ color: e.target.value })}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Line Height</Label>
                  <Input
                    type="number"
                    step={0.1}
                    min={0.5}
                    max={3}
                    value={el.lineHeight ?? 1.4}
                    onChange={(e) => update({ lineHeight: parseFloat(e.target.value) || 1.4 })}
                    className="h-7 text-xs"
                  />
                </div>
              </div>
              {el.type === "text" && (
                <div>
                  <Label className="text-[10px] text-muted-foreground">Alignment</Label>
                  <div className="flex gap-1">
                    {(["left", "center", "right"] as TextAlignment[]).map((align) => (
                      <Button
                        key={align}
                        variant={el.textAlign === align ? "default" : "ghost"}
                        size="sm"
                        className="h-7 flex-1"
                        onClick={() => update({ textAlign: align })}
                      >
                        {align === "left" && <AlignLeft className="h-3 w-3" />}
                        {align === "center" && <AlignCenter className="h-3 w-3" />}
                        {align === "right" && <AlignRight className="h-3 w-3" />}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Separator />
          </>
        )}

        {/* Shape Properties */}
        {el.type === "shape" && (
          <>
            <div className="space-y-2">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-repwell-teal-300">
                Shape
              </h4>
              <div>
                <Label className="text-[10px] text-muted-foreground">Type</Label>
                <Select
                  value={el.shape ?? "rectangle"}
                  onValueChange={(v) => update({ shape: v as ShapeType })}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rectangle">Rectangle</SelectItem>
                    <SelectItem value="circle">Circle</SelectItem>
                    <SelectItem value="rounded-rect">Rounded Rect</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Fill Color</Label>
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={el.backgroundColor ?? "#cad2c5"}
                    onChange={(e) => update({ backgroundColor: e.target.value })}
                    className="h-7 w-7 cursor-pointer rounded border border-border"
                  />
                  <Input
                    value={el.backgroundColor ?? "#cad2c5"}
                    onChange={(e) => update({ backgroundColor: e.target.value })}
                    className="h-7 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Border Width</Label>
                  <Input
                    type="number"
                    min={0}
                    value={el.borderWidth ?? 0}
                    onChange={(e) => update({ borderWidth: parseInt(e.target.value) || 0 })}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Border Color</Label>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={el.borderColor ?? "#000000"}
                      onChange={(e) => update({ borderColor: e.target.value })}
                      className="h-7 w-7 cursor-pointer rounded border border-border"
                    />
                  </div>
                </div>
              </div>
              {el.shape === "rounded-rect" && (
                <div>
                  <Label className="text-[10px] text-muted-foreground">Border Radius</Label>
                  <Input
                    type="number"
                    min={0}
                    value={el.borderRadius ?? 8}
                    onChange={(e) => update({ borderRadius: parseInt(e.target.value) || 0 })}
                    className="h-7 text-xs"
                  />
                </div>
              )}
            </div>
            <Separator />
          </>
        )}

        {/* Image Properties */}
        {el.type === "image" && (
          <>
            <div className="space-y-2">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-repwell-teal-300">
                Image
              </h4>
              <div>
                <Label className="text-[10px] text-muted-foreground">Image URL</Label>
                <Input
                  value={el.imageUrl ?? ""}
                  onChange={(e) => update({ imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Fit</Label>
                <Select
                  value={el.objectFit ?? "cover"}
                  onValueChange={(v) => update({ objectFit: v as "cover" | "contain" | "fill" })}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cover">Cover</SelectItem>
                    <SelectItem value="contain">Contain</SelectItem>
                    <SelectItem value="fill">Fill</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Rating Properties */}
        {el.type === "rating" && (
          <>
            <div className="space-y-2">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-repwell-teal-300">
                Rating
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Stars</Label>
                  <Input
                    type="number"
                    min={0}
                    max={5}
                    value={el.rating ?? 5}
                    onChange={(e) =>
                      update({
                        rating: Math.min(5, Math.max(0, parseInt(e.target.value) || 0)),
                      })
                    }
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Size</Label>
                  <Input
                    type="number"
                    min={12}
                    max={72}
                    value={el.starSize ?? 24}
                    onChange={(e) => update({ starSize: parseInt(e.target.value) || 24 })}
                    className="h-7 text-xs"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Color</Label>
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={el.starColor ?? "#f5c518"}
                    onChange={(e) => update({ starColor: e.target.value })}
                    className="h-7 w-7 cursor-pointer rounded border border-border"
                  />
                  <Input
                    value={el.starColor ?? "#f5c518"}
                    onChange={(e) => update({ starColor: e.target.value })}
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-repwell-teal-300">
            Actions
          </h4>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 flex-1 text-[10px]"
              onClick={() => duplicateElement(el.id)}
            >
              <Copy className="mr-1 h-3 w-3" />
              Duplicate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 flex-1 text-[10px] text-destructive hover:text-destructive"
              onClick={() => deleteElement(el.id)}
              disabled={el.locked}
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

export function ShareStudioPropertyPanel({ editor }: PropertyPanelProps) {
  return <PropertyPanel editor={editor} />;
}

export function SocialGraphicsPropertyPanel({ editor }: PropertyPanelProps) {
  return <PropertyPanel editor={editor} />;
}
