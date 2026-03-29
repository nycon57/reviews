"use client";

import { Envelope, DotsThree, Copy, Trash, PencilSimple, Eye } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CustomEmailTemplate } from "@/lib/email-builder/types";
import { formatDate } from "@/lib/utils";

export function TemplateCard({
  template,
  onEdit,
  onDelete,
  onDuplicate,
  onPreview,
}: {
  template: CustomEmailTemplate;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onPreview?: () => void;
}) {
  return (
    <div className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-repwell-teal-300/50">
      {/* Preview thumbnail */}
      <div
        className="relative mb-3 flex h-32 items-center justify-center rounded-lg bg-muted/40 cursor-pointer"
        onClick={onEdit}
      >
        <Envelope size={32} className="text-muted-foreground/40" />
        {onPreview && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="absolute top-2 right-2 rounded-md p-1.5 bg-background/80 backdrop-blur-sm border border-border/60 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-repwell-teal-300 hover:border-repwell-teal-300/40"
            aria-label={`Preview ${template.name}`}
          >
            <Eye size={14} />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1 cursor-pointer" onClick={onEdit}>
          <p className="truncate font-medium text-foreground">
            {template.name}
          </p>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {template.subject}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-0.5">
              {template.category}
            </span>
            <span>v{template.version}</span>
            <span>{formatDate(template.updated_at)}</span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
            >
              <DotsThree size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onPreview && (
              <DropdownMenuItem onClick={onPreview}>
                <Eye size={14} className="mr-2" />
                Preview
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onEdit}>
              <PencilSimple size={14} className="mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy size={14} className="mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash size={14} className="mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
