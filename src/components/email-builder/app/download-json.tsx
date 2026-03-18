"use client";

import { useCallback } from "react";
import { DownloadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TReaderDocument } from "@usewaypoint/email-builder";

interface DownloadJsonProps {
  document: TReaderDocument;
}

export function DownloadJson({ document }: DownloadJsonProps) {
  const handleDownload = useCallback(() => {
    const blob = new Blob([JSON.stringify(document, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = "email-template.json";
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [document]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={handleDownload} aria-label="Download JSON">
          <DownloadSimple size={18} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Download JSON</TooltipContent>
    </Tooltip>
  );
}
