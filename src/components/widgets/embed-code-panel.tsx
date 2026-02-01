"use client";

import { useState, useCallback } from "react";
import { Copy, Check, Code2, Globe } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface EmbedCodePanelProps {
  widgetId: string | null;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
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
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="gap-1.5 text-xs"
    >
      {copied ? (
        <>
          <Check size={14} className="text-green-500" />
          Copied
        </>
      ) : (
        <>
          <Copy size={14} />
          Copy
        </>
      )}
    </Button>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative">
      <pre className="bg-repwell-teal-500 text-gray-200 rounded-lg p-4 text-xs leading-relaxed overflow-x-auto font-mono">
        <code>{code}</code>
      </pre>
      <div className="absolute top-2 right-2">
        <CopyButton text={code} />
      </div>
    </div>
  );
}

export function EmbedCodePanel({ widgetId }: EmbedCodePanelProps) {
  if (!widgetId) {
    return (
      <div className="h-full flex flex-col bg-white border-l border-border">
        <div className="px-4 py-3 border-b border-border">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Embed Code
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-muted-foreground">
            <Code2 size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Save your widget to generate embed code.</p>
          </div>
        </div>
      </div>
    );
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const embedUrl = `${baseUrl}/api/v1/widgets/${widgetId}/embed`;

  const scriptCode = `<!-- RepWell Widget -->
<script src="${baseUrl}/embed.js" async></script>
<div data-repwell-widget="${widgetId}"></div>`;

  const iframeCode = `<!-- RepWell Widget (iframe) -->
<iframe
  src="${embedUrl}"
  width="100%"
  height="auto"
  style="border: none; overflow: hidden;"
  title="RepWell Reviews Widget"
  loading="lazy"
></iframe>`;

  return (
    <div className="h-full flex flex-col bg-white border-l border-border">
      <div className="px-4 py-3 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Embed Code
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Tabs defaultValue="script" className="space-y-4">
          <TabsList className="w-full grid grid-cols-2 h-9">
            <TabsTrigger value="script" className="text-xs gap-1">
              <Code2 size={12} />
              Script Tag
            </TabsTrigger>
            <TabsTrigger value="iframe" className="text-xs gap-1">
              <Globe size={12} />
              Iframe
            </TabsTrigger>
          </TabsList>

          <TabsContent value="script" className="space-y-3 mt-0">
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Add this code to your website where you want the widget to appear.
                The script loads asynchronously and won&apos;t block page rendering.
              </p>
              <CodeBlock code={scriptCode} />
            </div>
          </TabsContent>

          <TabsContent value="iframe" className="space-y-3 mt-0">
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Use this method if your platform restricts script tags. The iframe
                method provides the same widget in a sandboxed frame.
              </p>
              <CodeBlock code={iframeCode} />
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-3 bg-repwell-sage-100/30 rounded-lg border border-repwell-sage-200/50">
          <h4 className="text-xs font-semibold text-repwell-teal-500 mb-1">
            Widget ID
          </h4>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono text-repwell-teal-400 flex-1 truncate">
              {widgetId}
            </code>
            <CopyButton text={widgetId} />
          </div>
        </div>
      </div>
    </div>
  );
}
