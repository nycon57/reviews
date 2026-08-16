"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  BLOCK_DEFINITIONS,
  BLOCK_CATEGORIES,
  type BlockDefinitionWithSchema,
} from "@/lib/email-builder/block-definitions";
import type { BlockType } from "@/lib/email-builder/types";
import { useEditorStore } from "./store";
import * as Icons from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

function PaletteItem({ definition }: { definition: BlockDefinitionWithSchema }) {
  const addBlock = useEditorStore((s) => s.addBlock);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `palette-${definition.type}`,
      data: { type: definition.type, fromPalette: true },
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1 }
    : undefined;

  // SAFETY: block definitions only ever name a Phosphor icon export; the Phosphor namespace also
  // exports non-component helpers, so a name outside the icon set reads back as an unrenderable
  // value and the guarded render below skips it.
  const IconComponent = Icons[definition.icon as keyof typeof Icons] as Icon | undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      className="flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left text-sm text-foreground/80 transition-colors hover:border-border hover:bg-muted/60"
      style={style}
      onClick={() => addBlock(definition.type as BlockType, selectedBlockId ?? undefined)}
      {...listeners}
      {...attributes}
    >
      {IconComponent ? (
        <IconComponent size={18} className="shrink-0 text-repwell-teal-300" />
      ) : (
        <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center text-xs text-muted-foreground">
          ?
        </span>
      )}
      <span className="truncate">{definition.label}</span>
      {definition.isContainer && (
        <span className="ml-auto text-[10px] text-muted-foreground">Container</span>
      )}
    </button>
  );
}

export function BlockPalette() {
  return (
    <div className="flex h-full w-60 flex-col border-r border-border bg-background">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Blocks</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {BLOCK_CATEGORIES.map((cat) => {
          const blocks = BLOCK_DEFINITIONS.filter((d) => d.category === cat.key);
          if (blocks.length === 0) return null;
          return (
            <div key={cat.key} className="mb-3">
              <p className="mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {cat.label}
              </p>
              {blocks.map((def) => (
                <PaletteItem key={def.type} definition={def} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
