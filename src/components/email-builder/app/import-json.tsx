"use client";

import { useState } from "react";
import { UploadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ImportJsonDialog } from "./import-json-dialog";
import type { TReaderDocument } from "@usewaypoint/email-builder";

interface ImportJsonProps {
  onImport: (document: TReaderDocument) => void;
}

export function ImportJson({ onImport }: ImportJsonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDialogOpen(true)}
            aria-label="Import JSON"
          >
            <UploadSimple size={18} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Import JSON</TooltipContent>
      </Tooltip>

      <ImportJsonDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onImport={onImport}
      />
    </>
  );
}
