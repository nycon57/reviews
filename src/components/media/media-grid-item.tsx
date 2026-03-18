"use client";

import { Trash } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface MediaGridItemProps {
  url: string;
  label: string;
  sublabel?: string;
  isSelected?: boolean;
  onSelect: () => void;
  onDelete?: () => void;
}

export function MediaGridItem({
  url,
  label,
  sublabel,
  isSelected,
  onSelect,
  onDelete,
}: MediaGridItemProps) {
  return (
    <div
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-lg border transition-colors hover:border-repwell-teal-300",
        isSelected && "border-repwell-teal-400 ring-1 ring-repwell-teal-400/30"
      )}
    >
      <button
        type="button"
        className="block aspect-square w-full"
        onClick={onSelect}
      >
        <img
          src={url}
          alt={label}
          className="h-full w-full object-cover"
        />
      </button>
      {onDelete && (
        <button
          type="button"
          className={cn(
            "absolute right-1 top-1 rounded-md bg-background/80 p-1 opacity-0 transition-opacity",
            "group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash size={14} />
        </button>
      )}
      <div className="px-1.5 py-1">
        <p className="truncate text-xs font-medium">{label}</p>
        {sublabel && (
          <p className="truncate text-[10px] text-muted-foreground">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}
