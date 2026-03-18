"use client";

import { useEditorStore } from "./store";
import { BLOCK_REGISTRY } from "@/lib/email-builder/block-definitions";
import { FONT_FAMILY_OPTIONS } from "@/lib/email-builder/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BlockNode } from "@/lib/email-builder/types";

function findBlock(blocks: BlockNode[], id: string): BlockNode | null {
  for (const b of blocks) {
    if (b.id === id) return b;
    if (b.children) {
      const found = findBlock(b.children, id);
      if (found) return found;
    }
  }
  return null;
}

function PropField({
  label,
  type,
  value,
  options,
  onChange,
}: {
  label: string;
  type: "text" | "textarea" | "number" | "color" | "select" | "boolean" | "url";
  value: unknown;
  options?: string[];
  onChange: (val: unknown) => void;
}) {
  const id = `prop-${label.toLowerCase().replace(/\s+/g, "-")}`;

  switch (type) {
    case "textarea":
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id} className="text-xs">{label}</Label>
          <Textarea
            id={id}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="text-sm"
          />
        </div>
      );

    case "number":
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id} className="text-xs">{label}</Label>
          <Input
            id={id}
            type="number"
            value={(value as number) ?? 0}
            onChange={(e) => onChange(Number(e.target.value))}
            className="text-sm"
          />
        </div>
      );

    case "color":
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id} className="text-xs">{label}</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              id={id}
              value={(value as string) ?? "#000000"}
              onChange={(e) => onChange(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border border-border"
            />
            <Input
              value={(value as string) ?? ""}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 text-sm"
              placeholder="#000000"
            />
          </div>
        </div>
      );

    case "select":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{label}</Label>
          <Select value={(value as string) ?? ""} onValueChange={onChange}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(options ?? []).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case "boolean":
      return (
        <div className="flex items-center justify-between">
          <Label className="text-xs">{label}</Label>
          <Switch
            checked={!!value}
            onCheckedChange={(checked) => onChange(checked)}
          />
        </div>
      );

    case "url":
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id} className="text-xs">{label}</Label>
          <Input
            id={id}
            type="url"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="text-sm"
            placeholder="https://..."
          />
        </div>
      );

    default:
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id} className="text-xs">{label}</Label>
          <Input
            id={id}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="text-sm"
          />
        </div>
      );
  }
}

/** Map block type + prop key → field config */
function getFieldConfig(
  blockType: string,
  propKey: string,
  propValue: unknown
): { type: "text" | "textarea" | "number" | "color" | "select" | "boolean" | "url"; label: string; options?: string[] } | null {
  const label = propKey
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();

  // Known patterns
  if (propKey === "text" && (blockType === "text" || blockType === "heading" || blockType === "cta"))
    return { type: "textarea", label: "Content" };
  if (propKey === "description") return { type: "textarea", label };
  if (propKey === "heading" && blockType === "cta") return { type: "text", label };
  if (propKey === "buttonText") return { type: "text", label: "Button Text" };

  if (propKey.includes("color") || propKey.includes("Color"))
    return { type: "color", label };

  if (propKey.includes("href") || propKey.includes("src") || propKey.includes("url") || propKey.includes("Url") || propKey.includes("Href"))
    return { type: "url", label };

  if (propKey === "fontSize" || propKey === "width" || propKey === "borderRadius")
    return { type: "number", label };

  if (propKey === "align")
    return { type: "select", label, options: ["left", "center", "right"] };
  if (propKey === "variant" && blockType === "button")
    return { type: "select", label, options: ["primary", "secondary", "ghost", "success", "warning", "danger"] };
  if (propKey === "variant" && blockType === "divider")
    return { type: "select", label, options: ["solid", "dashed", "dotted", "gradient"] };
  if (propKey === "variant" && blockType === "cta")
    return { type: "select", label, options: ["default", "brand", "dark", "gradient"] };
  if (propKey === "level")
    return { type: "select", label: "Heading Level", options: ["h1", "h2", "h3", "h4"] };
  if (propKey === "size" && (blockType === "button" || blockType === "spacer"))
    return {
      type: "select",
      label,
      options: blockType === "spacer" ? ["xs", "sm", "md", "lg", "xl", "2xl"] : ["sm", "md", "lg"],
    };
  if (propKey === "spacing")
    return { type: "select", label, options: ["sm", "md", "lg"] };
  if (propKey === "padding")
    return { type: "select", label, options: blockType === "section" ? ["none", "sm", "md", "lg"] : ["sm", "md", "lg"] };
  if (propKey === "layout")
    return { type: "select", label, options: ["50-50", "33-67", "67-33", "25-75", "75-25", "33-33-33"] };
  if (propKey === "gap")
    return { type: "select", label, options: ["sm", "md", "lg"] };
  if (propKey === "fontWeight")
    return { type: "select", label: "Font Weight", options: ["normal", "bold"] };

  if (typeof propValue === "boolean" || propKey === "fullWidth" || propKey === "shadow" || propKey === "center" || propKey === "stackOnMobile")
    return { type: "boolean", label };

  return { type: "text", label };
}

export function PropertyInspector() {
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const blocks = useEditorStore((s) => s.document.blocks);
  const updateBlockProps = useEditorStore((s) => s.updateBlockProps);
  const settings = useEditorStore((s) => s.document.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  if (!selectedBlockId) {
    return (
      <div className="flex h-full w-[300px] flex-col border-l border-border bg-background">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Properties</h3>
        </div>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <p className="text-sm text-muted-foreground">
            Select a block to edit its properties
          </p>

          {/* Global settings */}
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Email Settings
            </p>
            <PropField
              label="Backdrop Color"
              type="color"
              value={settings.backdropColor}
              onChange={(v) => updateSettings({ backdropColor: v as string })}
            />
            <PropField
              label="Canvas Color"
              type="color"
              value={settings.canvasColor}
              onChange={(v) => updateSettings({ canvasColor: v as string })}
            />
            <PropField
              label="Text Color"
              type="color"
              value={settings.textColor}
              onChange={(v) => updateSettings({ textColor: v as string })}
            />
            <PropField
              label="Font Family"
              type="select"
              value={settings.fontFamily}
              options={[...FONT_FAMILY_OPTIONS]}
              onChange={(v) => updateSettings({ fontFamily: v as EmailDocumentSettings["fontFamily"] })}
            />
          </div>
        </div>
      </div>
    );
  }

  const block = findBlock(blocks, selectedBlockId);
  if (!block) return null;

  const def = BLOCK_REGISTRY[block.type];
  const propKeys = Object.keys(block.props);

  return (
    <div className="flex h-full w-[300px] flex-col border-l border-border bg-background">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">
          {def?.label ?? block.type}
        </h3>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {propKeys.map((key) => {
          const config = getFieldConfig(block.type, key, block.props[key] as Record<string, unknown>);
          if (!config) return null;
          return (
            <PropField
              key={key}
              label={config.label}
              type={config.type}
              value={block.props[key]}
              options={config.options}
              onChange={(val) => updateBlockProps(block.id, { [key]: val })}
            />
          );
        })}
      </div>
    </div>
  );
}

type EmailDocumentSettings = import("@/lib/email-builder/types").EmailDocumentSettings;
