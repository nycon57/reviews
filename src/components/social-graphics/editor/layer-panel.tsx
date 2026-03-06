"use client";

import { useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  GripVertical,
} from "lucide-react";
import type { EditorActions } from "./use-editor-state";

interface LayerPanelProps {
  editor: EditorActions;
}

export function LayerPanel({ editor }: LayerPanelProps) {
  const { state, selectedId, select, toggleVisibility, toggleLock, deleteElement, reorderLayers } =
    editor;
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const sortedElements = useMemo(
    () => [...state.elements].sort((a, b) => b.zIndex - a.zIndex),
    [state.elements]
  );

  const handleDragStart = useCallback((index: number) => {
    dragItem.current = index;
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      dragOverItem.current = index;
    },
    []
  );

  const handleDrop = useCallback(() => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      reorderLayers(dragItem.current, dragOverItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  }, [reorderLayers]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-3 py-2">
        <h3 className="text-xs font-semibold text-foreground">
          Layers ({state.elements.length})
        </h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border">
          {sortedElements.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              No elements yet. Add elements from the palette.
            </div>
          ) : (
            sortedElements.map((el, index) => (
              <div
                key={el.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={handleDrop}
                onClick={() => select(el.id)}
                className={`flex cursor-pointer items-center gap-1.5 px-2 py-1.5 transition-colors ${
                  selectedId === el.id
                    ? "bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15"
                    : "hover:bg-muted/50"
                }`}
              >
                <GripVertical className="h-3 w-3 shrink-0 cursor-grab text-muted-foreground/50" />
                <span className="w-10 shrink-0 rounded bg-muted px-1 py-0.5 text-center text-[9px] font-medium text-muted-foreground">
                  {el.type}
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] text-foreground">
                  {el.text?.slice(0, 20) ||
                    el.statLabel ||
                    el.shape ||
                    el.type}
                </span>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVisibility(el.id);
                    }}
                    aria-label={el.visible ? "Hide element" : "Show element"}
                  >
                    {el.visible ? (
                      <Eye className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <EyeOff className="h-3 w-3 text-muted-foreground/40" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLock(el.id);
                    }}
                    aria-label={el.locked ? "Unlock element" : "Lock element"}
                  >
                    {el.locked ? (
                      <Lock className="h-3 w-3 text-amber-500" />
                    ) : (
                      <Unlock className="h-3 w-3 text-muted-foreground/40" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteElement(el.id);
                    }}
                    disabled={el.locked}
                    aria-label="Delete element"
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground/40 hover:text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
