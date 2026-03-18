"use client";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { useEditorStore } from "./store";
import { CanvasBlock } from "./canvas-block";

export function EditorCanvas() {
  const blocks = useEditorStore((s) => s.document.blocks);
  const settings = useEditorStore((s) => s.document.settings);
  const selectBlock = useEditorStore((s) => s.selectBlock);

  const { setNodeRef } = useDroppable({ id: "canvas-drop-area" });

  const blockIds = blocks.map((b) => b.id);

  return (
    <div
      className="flex flex-1 items-start justify-center overflow-y-auto bg-muted/30 p-8"
      onClick={(e) => { if (e.target === e.currentTarget) selectBlock(null); }}
    >
      <div
        ref={setNodeRef}
        className="min-h-[600px] w-[600px] rounded-xl shadow-lg"
        style={{
          backgroundColor: settings.canvasColor,
          color: settings.textColor,
        }}
      >
        <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
          {blocks.length === 0 ? (
            <div className="flex h-[400px] items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-medium text-muted-foreground">
                  Drag blocks here to start building
                </p>
                <p className="mt-1 text-sm text-muted-foreground/60">
                  Or click a block in the left panel to add it
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-1 p-4">
              {blocks.map((block) => (
                <CanvasBlock key={block.id} block={block} />
              ))}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
