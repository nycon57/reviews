"use client";

import { useState, useCallback } from "react";
import { Copy, Check, Code2, Globe, ExternalLink } from "lucide-react";
import Link from "next/link";
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
      <div className="text-center py-6">
        <Code2 size={28} className="mx-auto mb-2 text-muted-foreground/30" />
        <p className="text-xs text-muted-foreground">Save your widget to generate embed code.</p>
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
    <div className="space-y-4">
      <Tabs defaultValue="script" className="space-y-3">
        <TabsList className="w-full grid grid-cols-2 h-8">
          <TabsTrigger value="script" className="text-xs gap-1">
            <Code2 size={12} />
            Script Tag
          </TabsTrigger>
          <TabsTrigger value="iframe" className="text-xs gap-1">
            <Globe size={12} />
            Iframe
          </TabsTrigger>
        </TabsList>

        <TabsContent value="script" className="mt-0">
          <p className="text-xs text-muted-foreground mb-2">
            Add this code where you want the widget to appear.
          </p>
          <CodeBlock code={scriptCode} />
        </TabsContent>

        <TabsContent value="iframe" className="mt-0">
          <p className="text-xs text-muted-foreground mb-2">
            Use this if your platform restricts script tags.
          </p>
          <CodeBlock code={iframeCode} />
        </TabsContent>
      </Tabs>

      <div className="p-3 bg-repwell-sage-100/30 dark:bg-repwell-teal-300/10 rounded-lg border border-repwell-sage-200/50">
        <h4 className="text-xs font-semibold text-heading mb-1">
          Widget ID
        </h4>
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono text-label flex-1 truncate">
            {widgetId}
          </code>
          <CopyButton text={widgetId} />
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-muted-foreground mb-2">
          Platform Guides
        </h4>
        <div className="space-y-1">
          {[
            { label: "Google Tag Manager", hash: "gtm" },
            { label: "Webflow", hash: "webflow" },
            { label: "Squarespace", hash: "squarespace" },
            { label: "Shopify", hash: "shopify" },
            { label: "Iframe Embed", hash: "iframe" },
          ].map((guide) => (
            <Link
              key={guide.hash}
              href={`/dashboard/widgets/integrations#${guide.hash}`}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-repwell-teal-500 dark:hover:text-foreground transition-colors py-0.5"
            >
              <ExternalLink size={10} />
              {guide.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
