"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { validateJsonStringValue } from "./validate-json";
import type { TReaderDocument } from "@usewaypoint/email-builder";

interface ImportJsonDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (document: TReaderDocument) => void;
}

export function ImportJsonDialog({
  open,
  onClose,
  onImport,
}: ImportJsonDialogProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleImport() {
    const result = validateJsonStringValue(value);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onImport(result.data);
    setValue("");
    setError(null);
    onClose();
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setValue("");
      setError(null);
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import JSON</DialogTitle>
          <DialogDescription>
            Paste a valid email template JSON document below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Textarea
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            placeholder='{"root": {"type": "EmailLayout", ...}}'
            rows={12}
            className="font-mono text-xs"
          />

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!value.trim()}>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
