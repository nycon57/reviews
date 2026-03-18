"use client";

import { useMemo } from "react";
import type { TReaderDocument } from "@usewaypoint/email-builder";

interface JsonPanelProps {
  document: TReaderDocument;
}

export function JsonPanel({ document }: JsonPanelProps) {
  const json = useMemo(() => {
    try {
      return JSON.stringify(document, null, 2);
    } catch {
      return "// Error serializing document";
    }
  }, [document]);

  return (
    <div className="h-full overflow-auto bg-muted/30 p-4">
      <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-foreground">
        {json}
      </pre>
    </div>
  );
}
