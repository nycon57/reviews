"use client";

import { useState } from "react";
import { Envelope, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TemplateSelectorModal } from "./template-selector-modal";

interface EmailTemplatePickerProps {
  value: { id: string; name: string } | null;
  onChange: (value: { id: string; name: string } | null) => void;
  label?: string;
  disabled?: boolean;
}

export function EmailTemplatePicker({
  value,
  onChange,
  label = "Email Template",
  disabled = false,
}: EmailTemplatePickerProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 justify-start gap-2 font-normal"
          onClick={() => setModalOpen(true)}
          disabled={disabled}
        >
          <Envelope size={16} className="shrink-0 text-muted-foreground" />
          <span className="truncate">
            {value?.name ?? "Default Template"}
          </span>
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => onChange(null)}
            disabled={disabled}
          >
            <X size={14} />
          </Button>
        )}
      </div>
      <TemplateSelectorModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        selectedId={value?.id ?? null}
        onSelect={(id, name) => {
          onChange(id ? { id, name } : null);
        }}
      />
    </div>
  );
}
