"use client";

import { useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash, CaretUp, CaretDown } from "@phosphor-icons/react";

interface KeyValueItem {
  key: string;
  value: string;
}

interface KeyValueArrayInputProps {
  label: string;
  items: KeyValueItem[];
  onChange: (items: KeyValueItem[]) => void;
  keyLabel?: string;
  valueLabel?: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  maxItems?: number;
}

export function KeyValueArrayInput({
  label,
  items,
  onChange,
  keyLabel = "Key",
  valueLabel = "Value",
  keyPlaceholder,
  valuePlaceholder,
  maxItems = 10,
}: KeyValueArrayInputProps) {
  const counterRef = useRef(0);
  function genId() {
    return `kv_${++counterRef.current}`;
  }

  const idsRef = useRef<string[]>(items.map(() => genId()));

  useEffect(() => {
    if (idsRef.current.length < items.length) {
      const next = [...idsRef.current];
      while (next.length < items.length) next.push(genId());
      idsRef.current = next;
    } else if (idsRef.current.length > items.length) {
      idsRef.current = idsRef.current.slice(0, items.length);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  function addItem() {
    if (items.length < maxItems) {
      idsRef.current = [...idsRef.current, genId()];
      onChange([...items, { key: "", value: "" }]);
    }
  }

  function removeItem(index: number) {
    idsRef.current = idsRef.current.filter((_, i) => i !== index);
    onChange(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: "key" | "value", val: string) {
    const next = [...items];
    next[index] = { ...next[index], [field]: val };
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

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {items.length > 0 && (
        <div className="grid grid-cols-[24px_1fr_1fr_32px] gap-1 text-xs text-muted-foreground px-0.5">
          <span />
          <span>{keyLabel}</span>
          <span>{valueLabel}</span>
          <span />
        </div>
      )}
      <div className="space-y-1.5">
        {items.map((item, index) => (
          <div
            key={idsRef.current[index]}
            className="grid grid-cols-[24px_1fr_1fr_32px] items-center gap-1"
          >
            <div className="flex flex-col">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                onClick={() => moveItem(index, index - 1)}
                disabled={index === 0}
                aria-label="Move up"
              >
                <CaretUp size={10} />
              </button>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                onClick={() => moveItem(index, index + 1)}
                disabled={index === items.length - 1}
                aria-label="Move down"
              >
                <CaretDown size={10} />
              </button>
            </div>
            <Input
              value={item.key}
              onChange={(e) => updateItem(index, "key", e.target.value)}
              placeholder={keyPlaceholder ?? `${keyLabel} ${index + 1}`}
              className="h-8 text-sm"
            />
            <Input
              value={item.value}
              onChange={(e) => updateItem(index, "value", e.target.value)}
              placeholder={valuePlaceholder ?? `${valueLabel} ${index + 1}`}
              className="h-8 text-sm"
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
          Add Item
        </Button>
      )}
    </div>
  );
}
