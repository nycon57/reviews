"use client";

import { useState, useEffect, useCallback } from "react";
import { SpinnerGap, Copy, Check } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { previewTemplate } from "@/lib/email-builder/actions";
import {
  editorDocumentToEmailDocument,
  isEditorFormat,
} from "@/lib/email-builder/document-converter";
import type { EmailDocument } from "@/lib/email-builder/types";

interface HtmlPanelProps {
  /** The editor document (Waypoint format from Zustand store) */
  document: Record<string, unknown>;
}

export function HtmlPanel({ document }: HtmlPanelProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const renderHtml = useCallback(async () => {
    setLoading(true);
    try {
      const emailDoc = isEditorFormat(document)
        ? editorDocumentToEmailDocument(
            document as Record<string, { type: string; data: Record<string, unknown> }>
          )
        : (document as unknown as EmailDocument);

      const result = await previewTemplate(emailDoc);
      setHtml(result.html);
    } catch {
      setHtml("<!-- Error rendering HTML -->");
    } finally {
      setLoading(false);
    }
  }, [document]);

  useEffect(() => {
    renderHtml();
  }, [renderHtml]);

  async function handleCopy() {
    if (!html) return;
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail in insecure contexts or without permission
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <SpinnerGap size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-muted/30 p-4">
      <div className="mb-2 flex justify-end">
        <Button variant="outline" size="sm" onClick={handleCopy} disabled={!html}>
          {copied ? (
            <>
              <Check size={14} className="mr-1.5" />
              Copied
            </>
          ) : (
            <>
              <Copy size={14} className="mr-1.5" />
              Copy HTML
            </>
          )}
        </Button>
      </div>
      <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-foreground">
        {html}
      </pre>
    </div>
  );
}
