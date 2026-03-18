"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MergeFieldToolbar } from "../../merge-field-toolbar";

interface TextInputProps {
  label: string;
  value: string | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  showMergeFields?: boolean;
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 3,
  showMergeFields = false,
}: TextInputProps) {
  const id = `text-input-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  function insertAtCursor(text: string) {
    const el = inputRef.current;
    if (!el) {
      onChange((value ?? "") + text);
      return;
    }
    const start = el.selectionStart ?? (value ?? "").length;
    const end = el.selectionEnd ?? start;
    const current = value ?? "";
    const next = current.slice(0, start) + text + current.slice(end);
    onChange(next);
    // Restore cursor after the inserted text
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
    });
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs">
          {label}
        </Label>
        {showMergeFields && (
          <MergeFieldToolbar onInsert={insertAtCursor} compact />
        )}
      </div>
      {multiline ? (
        <Textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          id={id}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="text-sm"
        />
      ) : (
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          id={id}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="text-sm"
        />
      )}
    </div>
  );
}
