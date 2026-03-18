"use client";

import { useState } from "react";
import { Hash } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MERGE_FIELDS } from "@/lib/email-builder/merge-fields";

const CATEGORIES = [
  { key: "customer" as const, label: "Customer" },
  { key: "professional" as const, label: "Professional" },
  { key: "organization" as const, label: "Organization" },
  { key: "links" as const, label: "Links" },
];

export function MergeFieldToolbar({
  onInsert,
  compact = false,
}: {
  onInsert: (field: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {compact ? (
          <button
            type="button"
            className="rounded px-1 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Insert variable"
          >
            <Hash size={12} className="inline mr-0.5 -mt-px" />
            Variable
          </button>
        ) : (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Hash size={14} />
            Merge Fields
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        {CATEGORIES.map((cat) => {
          const fields = MERGE_FIELDS.filter((f) => f.category === cat.key);
          return (
            <div key={cat.key} className="mb-2">
              <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {cat.label}
              </p>
              {fields.map((field) => (
                <button
                  key={field.key}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                  onClick={() => {
                    onInsert(`{{${field.key}}}`);
                    setOpen(false);
                  }}
                >
                  <code className="text-xs text-muted-foreground">
                    {`{{${field.key}}}`}
                  </code>
                </button>
              ))}
            </div>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
