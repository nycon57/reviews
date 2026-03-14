"use client";

import { useState, useCallback } from "react";
import { Copy, Check, Code2, Globe } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { WidgetEntityType } from "@/lib/widgets/types";

interface EmbedCodePanelProps {
  widgetId: string | null;
  entityType: WidgetEntityType;
  entityId: string | null;
  organizationId: string;
}

type CopyButtonSurface = "default" | "code";


function CopyButton({
  text,
  surface = "default",
}: {
  text: string;
  surface?: CopyButtonSurface;
}) {
  const [copied, setCopied] = useState(false);
  const isCodeSurface = surface === "code";
  const idleLabel = isCodeSurface ? "Copy code" : "Copy";
  const visibleLabel = copied ? "Copied" : idleLabel;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <Button
      type="button"
      variant={isCodeSurface ? "secondary" : "outline"}
      size="sm"
      onClick={handleCopy}
      aria-label={idleLabel}
      className={[
        "gap-1.5 text-xs",
        isCodeSurface
          ? [
              "h-8 min-w-[104px] justify-center rounded-md border px-3 shadow-lg backdrop-blur-sm",
              copied
                ? "border-emerald-300/25 bg-emerald-500/20 text-emerald-50 hover:bg-emerald-500/25"
                : "border-white/15 bg-slate-950/80 text-white hover:bg-slate-950/95 hover:text-white",
            ].join(" ")
          : "",
      ].join(" ")}
    >
      {copied ? (
        <>
          <Check size={14} className={isCodeSurface ? "text-inherit" : "text-green-500"} />
          {visibleLabel}
        </>
      ) : (
        <>
          <Copy size={14} />
          {visibleLabel}
        </>
      )}
    </Button>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative">
      <pre className="bg-repwell-teal-500 text-gray-200 rounded-lg p-4 pr-32 text-xs leading-relaxed overflow-x-auto font-mono">
        <code>{code}</code>
      </pre>
      <div className="absolute top-3 right-3">
        <CopyButton text={code} surface="code" />
      </div>
    </div>
  );
}

function resolveEntityId(
  entityType: WidgetEntityType,
  entityId: string | null,
  organizationId: string,
): { id: string; isPlaceholder: boolean } {
  if (entityType === "organization") {
    return { id: organizationId, isPlaceholder: false };
  }
  return entityId
    ? { id: entityId, isPlaceholder: false }
    : { id: "YOUR_ENTITY_ID", isPlaceholder: true };
}

type EmbedMode = "script" | "iframe";

export function EmbedCodePanel({ widgetId, entityType, entityId, organizationId }: EmbedCodePanelProps) {
  const [mode, setMode] = useState<EmbedMode>("script");

  if (!widgetId) {
    return (
      <div className="text-center py-6">
        <Code2 size={28} className="mx-auto mb-2 text-muted-foreground/30" />
        <p className="text-xs text-muted-foreground">Save your widget to generate embed code.</p>
      </div>
    );
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const resolved = resolveEntityId(entityType, entityId, organizationId);

  const scriptCode = `<!-- RepWell Widget -->
<script src="${baseUrl}/embed.js" async></script>
<div
  data-repwell-widget="${widgetId}"
  data-repwell-entity-type="${entityType}"
  data-repwell-entity-id="${resolved.id}"
></div>`;

  const iframeCode = `<!-- RepWell Widget (iframe) -->
<iframe
  src="${baseUrl}/api/v1/widgets/${widgetId}/embed?entityType=${entityType}&entityId=${resolved.id}"
  width="100%"
  height="auto"
  style="border: none; overflow: hidden;"
  title="RepWell Reviews Widget"
  loading="lazy"
></iframe>`;

  const isScript = mode === "script";

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <div className="flex rounded-lg bg-muted/60 p-0.5">
        <button
          type="button"
          onClick={() => setMode("script")}
          className={[
            "flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
            isScript
              ? "bg-background text-heading shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          <Code2 size={12} />
          Script
        </button>
        <button
          type="button"
          onClick={() => setMode("iframe")}
          className={[
            "flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
            !isScript
              ? "bg-background text-heading shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          <Globe size={12} />
          Iframe
        </button>
      </div>

      {/* Code block */}
      <div>
        <CodeBlock code={isScript ? scriptCode : iframeCode} />
        {isScript && resolved.isPlaceholder && (
          <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed">
            Select an entity in the General section above to replace the placeholder ID.
          </p>
        )}
        {!isScript && (
          <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
            Use this if your platform restricts script tags.
          </p>
        )}
      </div>

      {/* Support link */}
      <p className="text-[11px] text-muted-foreground">
        Need help?{" "}
        <Link
          href="/support"
          className="text-repwell-teal-500 dark:text-repwell-teal-200 hover:text-repwell-teal-400 dark:hover:text-foreground transition-colors underline underline-offset-2"
        >
          Contact support
        </Link>
      </p>
    </div>
  );
}
