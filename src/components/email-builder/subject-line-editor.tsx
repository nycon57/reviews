"use client";

import { useEditorStore } from "./store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MergeFieldToolbar } from "./merge-field-toolbar";
import { useRef } from "react";

export function SubjectLineEditor() {
  const subject = useEditorStore((s) => s.subject);
  const previewText = useEditorStore((s) => s.previewText);
  const setSubject = useEditorStore((s) => s.setSubject);
  const setPreviewText = useEditorStore((s) => s.setPreviewText);
  const subjectRef = useRef<HTMLInputElement>(null);

  function insertAtCursor(field: string) {
    const el = subjectRef.current;
    if (!el) {
      setSubject(subject + field);
      return;
    }
    const start = el.selectionStart ?? subject.length;
    const end = el.selectionEnd ?? subject.length;
    const newVal = subject.slice(0, start) + field + subject.slice(end);
    setSubject(newVal);
    // Restore cursor position after the inserted text
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + field.length, start + field.length);
    });
  }

  return (
    <div className="flex items-end gap-3 border-b border-border bg-background px-4 py-3">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="subject" className="text-xs">
          Subject Line
        </Label>
        <Input
          ref={subjectRef}
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject..."
          className="text-sm"
        />
      </div>
      <div className="w-56 space-y-1.5">
        <Label htmlFor="preview" className="text-xs">
          Preview Text
        </Label>
        <Input
          id="preview"
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          placeholder="Preview text..."
          className="text-sm"
        />
      </div>
      <MergeFieldToolbar onInsert={insertAtCursor} />
    </div>
  );
}
