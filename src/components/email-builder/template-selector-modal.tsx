"use client";

import { useState, useCallback, useRef } from "react";
import { Envelope, Check } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listTemplates } from "@/lib/email-builder/actions";
import type { CustomEmailTemplate } from "@/lib/email-builder/types";
import { cn } from "@/lib/utils";

export function TemplateSelectorModal({
  open,
  onOpenChange,
  onSelect,
  selectedId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (templateId: string | null, templateName: string) => void;
  selectedId: string | null;
}) {
  const [templates, setTemplates] = useState<CustomEmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef(false);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listTemplates();
      setTemplates(data);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleOpenChange(isOpen: boolean) {
    if (isOpen && !loadedRef.current) {
      loadedRef.current = true;
      loadTemplates();
    }
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose Email Template</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading templates...</p>
          </div>
        ) : (
          <div className="space-y-2 pt-2">
            {/* Default option */}
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                selectedId === null
                  ? "border-repwell-teal-300 bg-repwell-teal-300/5"
                  : "border-border hover:border-repwell-teal-300/50"
              )}
              onClick={() => {
                onSelect(null, "Default Template");
                onOpenChange(false);
              }}
            >
              <Envelope size={20} className="text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Default Template</p>
                <p className="text-sm text-muted-foreground">
                  System default email design
                </p>
              </div>
              {selectedId === null && (
                <Check size={16} className="text-repwell-teal-300" />
              )}
            </button>

            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                  selectedId === t.id
                    ? "border-repwell-teal-300 bg-repwell-teal-300/5"
                    : "border-border hover:border-repwell-teal-300/50"
                )}
                onClick={() => {
                  onSelect(t.id, t.name);
                  onOpenChange(false);
                }}
              >
                <Envelope size={20} className="text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{t.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {t.subject}
                  </p>
                </div>
                {selectedId === t.id && (
                  <Check size={16} className="text-repwell-teal-300" />
                )}
              </button>
            ))}

            {templates.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No custom templates yet. Create one in Emails.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
