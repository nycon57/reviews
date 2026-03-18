"use client";

import { useRef, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash, CaretUp, CaretDown } from "@phosphor-icons/react";

let nextItemId = 0;
function genId() {
  return `item_${++nextItemId}`;
}

function singularize(word: string): string {
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.endsWith("ses") || word.endsWith("xes") || word.endsWith("zes") || word.endsWith("ches") || word.endsWith("shes")) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

interface ArrayItemsInputProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  maxItems?: number;
  singularLabel?: string;
}

export function ArrayItemsInput({
  label,
  items,
  onChange,
  placeholder = "Item",
  maxItems = 10,
  singularLabel,
}: ArrayItemsInputProps) {
  // Maintain stable IDs for each item — sync before render so idsRef.current[index] is always safe
  const idsRef = useRef<string[]>(items.map(() => genId()));

  if (idsRef.current.length < items.length) {
    const next = [...idsRef.current];
    while (next.length < items.length) next.push(genId());
    idsRef.current = next;
  } else if (idsRef.current.length > items.length) {
    idsRef.current = idsRef.current.slice(0, items.length);
  }

  const addItem = useCallback(() => {
    if (items.length < maxItems) {
      idsRef.current = [...idsRef.current, genId()];
      onChange([...items, ""]);
    }
  }, [items, maxItems, onChange]);

  function removeItem(index: number) {
    idsRef.current = idsRef.current.filter((_, i) => i !== index);
    onChange(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, value: string) {
    const next = [...items];
    next[index] = value;
    onChange(next);
  }

  function moveItem(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);

    const nextIds = [...idsRef.current];
    const [movedId] = nextIds.splice(from, 1);
    nextIds.splice(to, 0, movedId);
    idsRef.current = nextIds;

    onChange(next);
  }

  const addLabel = singularLabel ?? singularize(label);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="space-y-1.5">
        {items.map((item, index) => (
          <div key={idsRef.current[index]} className="flex items-center gap-1">
            <div className="flex flex-col">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                onClick={() => moveItem(index, index - 1)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp") { e.preventDefault(); moveItem(index, index - 1); }
                }}
                disabled={index === 0}
                aria-label="Move up"
              >
                <CaretUp size={12} />
              </button>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                onClick={() => moveItem(index, index + 1)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); moveItem(index, index + 1); }
                }}
                disabled={index === items.length - 1}
                aria-label="Move down"
              >
                <CaretDown size={12} />
              </button>
            </div>
            <Input
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              placeholder={`${placeholder} ${index + 1}`}
              className="h-8 flex-1 text-sm"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeItem(index)}
              aria-label="Remove item"
            >
              <Trash size={14} />
            </Button>
          </div>
        ))}
      </div>
      {items.length < maxItems && (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={addItem}
        >
          <Plus size={12} className="mr-1" />
          Add {addLabel}
        </Button>
      )}
    </div>
  );
}
