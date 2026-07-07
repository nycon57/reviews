"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DotsSixVertical, Trash } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { BlockNode } from "@/lib/email-builder/types";
import { BLOCK_REGISTRY } from "@/lib/email-builder/block-definitions";
import { useEditorStore } from "./store";

/** Simplified visual preview of a block (not actual React Email rendering). */
function BlockPreview({ block }: { block: BlockNode }) {
  const p = block.props as Record<string, string | number | boolean | undefined>;

  switch (block.type) {
    case "text":
      return (
        <p
          className="whitespace-pre-wrap"
          style={{
            fontSize: `${p.fontSize ?? 16}px`,
            color: (p.color as string) ?? "#2f3e46",
            textAlign: (p.align as "left" | "center" | "right") ?? "left",
            fontWeight: (p.fontWeight as string) ?? "normal",
          }}
        >
          {(p.text as string) || "Enter text..."}
        </p>
      );

    case "heading": {
      const Tag = (p.level as "h1" | "h2" | "h3" | "h4") || "h2";
      const sizeMap = { h1: "text-3xl", h2: "text-2xl", h3: "text-xl", h4: "text-lg" };
      return (
        <Tag
          className={cn("font-bold", sizeMap[Tag])}
          style={{
            color: (p.color as string) ?? "#354f52",
            textAlign: (p.align as "left" | "center" | "right") ?? "left",
          }}
        >
          {(p.text as string) || "Heading"}
        </Tag>
      );
    }

    case "button":
      return (
        <div style={{ textAlign: (p.align as "left" | "center" | "right") ?? "center" }}>
          <span
            className={cn(
              "inline-block rounded-lg px-6 py-3 text-sm font-semibold",
              p.variant === "secondary"
                ? "border-2 border-repwell-teal-300 text-repwell-teal-400"
                : p.variant === "ghost"
                  ? "text-repwell-teal-300"
                  : "bg-repwell-teal-300 text-white"
            )}
          >
            {(p.text as string) || "Button"}
          </span>
        </div>
      );

    case "image":
      return p.src ? (
        <div style={{ textAlign: (p.align as "left" | "center" | "right") ?? "center" }}>
          <img
            src={p.src as string}
            alt={(p.alt as string) ?? ""}
            style={{
              maxWidth: `${p.width ?? 600}px`,
              width: "100%",
              borderRadius: `${p.borderRadius ?? 0}px`,
            }}
          />
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
          Drop or upload an image
        </div>
      );

    case "divider":
      return (
        <hr
          className="my-2"
          style={{
            borderStyle: (p.variant as string) === "dashed" ? "dashed" : (p.variant as string) === "dotted" ? "dotted" : "solid",
            borderColor: (p.color as string) ?? "#e2e8e4",
            borderWidth: "1px 0 0 0",
          }}
        />
      );

    case "spacer": {
      const sizeMap = { xs: 8, sm: 16, md: 24, lg: 32, xl: 48, "2xl": 64 };
      const h = sizeMap[(p.size as keyof typeof sizeMap) ?? "md"] ?? 24;
      return (
        <div
          className="flex items-center justify-center text-[10px] text-muted-foreground"
          style={{ height: `${h}px` }}
        >
          Spacer ({p.size as string})
        </div>
      );
    }

    case "card":
      return (
        <div
          className="rounded-lg border border-border"
          style={{
            backgroundColor: (p.backgroundColor as string) ?? "#fff",
            boxShadow: p.shadow ? "0 2px 8px -2px rgba(47,62,70,.1)" : "none",
            padding: p.padding === "sm" ? "12px" : p.padding === "lg" ? "32px" : "20px",
          }}
        >
          {block.children && block.children.length > 0 ? (
            block.children.map((child) => (
              <BlockPreview key={child.id} block={child} />
            ))
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Drop blocks here
            </p>
          )}
        </div>
      );

    case "section":
      return (
        <div
          style={{
            backgroundColor: (p.backgroundColor as string) ?? undefined,
            textAlign: p.center ? "center" : "left",
            padding: p.padding === "none" ? "0" : p.padding === "sm" ? "12px" : p.padding === "lg" ? "32px" : "20px",
          }}
        >
          {block.children && block.children.length > 0 ? (
            block.children.map((child) => (
              <BlockPreview key={child.id} block={child} />
            ))
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Drop blocks here
            </p>
          )}
        </div>
      );

    case "columns":
      return (
        <div className="flex gap-4">
          <div className="flex-1 rounded border border-dashed border-border p-3">
            <p className="text-center text-xs text-muted-foreground">Column 1</p>
          </div>
          <div className="flex-1 rounded border border-dashed border-border p-3">
            <p className="text-center text-xs text-muted-foreground">Column 2</p>
          </div>
          {((p.layout as string) === "33-33-33") && (
            <div className="flex-1 rounded border border-dashed border-border p-3">
              <p className="text-center text-xs text-muted-foreground">Column 3</p>
            </div>
          )}
        </div>
      );

    case "cta":
      return (
        <div className="rounded-lg bg-muted/40 p-6 text-center">
          <h3 className="mb-2 text-lg font-bold text-heading">
            {(p.heading as string) || "Call to Action"}
          </h3>
          {p.description && (
            <p className="mb-3 text-sm text-muted-foreground">{p.description as string}</p>
          )}
          <span className="inline-block rounded-lg bg-repwell-teal-300 px-6 py-2.5 text-sm font-semibold text-white">
            {(p.buttonText as string) || "Get Started"}
          </span>
        </div>
      );

    case "logo":
      return p.src ? (
        <div style={{ textAlign: (p.align as "left" | "center" | "right") ?? "center" }}>
          <img
            src={p.src as string}
            alt={(p.alt as string) ?? "Logo"}
            style={{ width: `${p.width ?? 150}px`, display: "inline-block" }}
          />
        </div>
      ) : (
        <div
          className="flex h-12 items-center justify-center text-sm text-muted-foreground"
          style={{ textAlign: (p.align as "left" | "center" | "right") ?? "center" }}
        >
          [Logo]
        </div>
      );

    case "social-links":
      return (
        <div
          className="flex gap-3"
          style={{ justifyContent: p.align === "right" ? "flex-end" : p.align === "center" ? "center" : "flex-start" }}
        >
          {[
            { key: "linkedin", label: "LinkedIn" },
            { key: "twitter", label: "Twitter" },
            { key: "facebook", label: "Facebook" },
            { key: "instagram", label: "Instagram" },
          ]
            .filter((item) => p[item.key])
            .map((item) => (
              <span key={item.key} className="text-sm text-repwell-teal-300 underline">
                {item.label}
              </span>
            ))}
          {!p.linkedin && !p.twitter && !p.facebook && !p.instagram && (
            <span className="text-sm text-muted-foreground">[Social links]</span>
          )}
        </div>
      );

    default:
      return (
        <div className="rounded bg-muted/30 p-3 text-center text-sm text-muted-foreground">
          {block.type} block
        </div>
      );
  }
}

export function CanvasBlock({ block }: { block: BlockNode }) {
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const removeBlock = useEditorStore((s) => s.removeBlock);
  const addBlock = useEditorStore((s) => s.addBlock);
  const isSelected = selectedBlockId === block.id;

  const def = BLOCK_REGISTRY[block.type];

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg border-2 transition-colors",
        isSelected
          ? "border-repwell-teal-300 ring-2 ring-repwell-teal-300/20"
          : "border-transparent hover:border-border"
      )}
      onClick={(e) => {
        e.stopPropagation();
        selectBlock(block.id);
      }}
    >
      {/* Toolbar */}
      <div
        className={cn(
          "absolute -top-3 left-2 z-10 flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-0.5 text-xs shadow-sm transition-opacity",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      >
        <button
          type="button"
          className="cursor-grab p-0.5 text-muted-foreground hover:text-foreground active:cursor-grabbing"
          {...listeners}
          {...attributes}
        >
          <DotsSixVertical size={14} />
        </button>
        <span className="text-muted-foreground">{def?.label ?? block.type}</span>
        <button
          type="button"
          className="p-0.5 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            removeBlock(block.id);
          }}
        >
          <Trash size={14} />
        </button>
      </div>

      {/* Block content */}
      <div className="px-1 py-2">
        <BlockPreview block={block} />
      </div>
    </div>
  );
}
