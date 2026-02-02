"use client";

import { type ReactNode, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { WidgetSeoData } from "@/lib/widgets/seo-actions";

interface StructuredDataPreviewProps {
  data: WidgetSeoData;
}

/** Syntax-highlight JSON for the code preview. */
function highlightJson(json: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let i = 0;

  const regex =
    /("(?:[^"\\]|\\.)*")\s*:|("(?:[^"\\]|\\.)*")|(true|false|null)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(json)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`t${i++}`} className="text-gray-500">
          {json.slice(lastIndex, match.index)}
        </span>
      );
    }

    if (match[1]) {
      parts.push(
        <span key={`k${i++}`} className="text-indigo-400">
          {match[1]}
        </span>
      );
    } else if (match[2]) {
      parts.push(
        <span key={`s${i++}`} className="text-emerald-400">
          {match[2]}
        </span>
      );
    } else if (match[3]) {
      parts.push(
        <span key={`b${i++}`} className="text-amber-400">
          {match[3]}
        </span>
      );
    } else if (match[4]) {
      parts.push(
        <span key={`n${i++}`} className="text-blue-400">
          {match[4]}
        </span>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < json.length) {
    parts.push(
      <span key={`e${i++}`} className="text-gray-500">
        {json.slice(lastIndex)}
      </span>
    );
  }

  return parts;
}

export function StructuredDataPreview({ data }: StructuredDataPreviewProps) {
  const [copied, setCopied] = useState(false);

  const jsonStr = useMemo(
    () => JSON.stringify(data.jsonLd, null, 2),
    [data.jsonLd]
  );

  const highlighted = useMemo(() => highlightJson(jsonStr), [jsonStr]);

  const handleCopy = async () => {
    try {
      const wrapper = `<script type="application/ld+json">\n${jsonStr}\n</` + "script>";
      await navigator.clipboard.writeText(wrapper);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Check clipboard permissions or copy manually",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{data.schemaType}</Badge>
        <Badge variant="outline">{data.widgetType.replace(/_/g, " ")}</Badge>
        <Badge variant="outline">{data.entityType}</Badge>
        {!data.structuredDataEnabled && (
          <Badge variant="destructive">Structured data disabled</Badge>
        )}
      </div>

      {/* Code preview */}
      <Card className="border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-gray-800">
          <span className="text-xs font-medium text-gray-300">
            JSON-LD Structured Data
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 font-mono">
              application/ld+json
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-gray-400 hover:text-white hover:bg-gray-800"
              onClick={handleCopy}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span className="ml-1 text-xs">{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>
        </div>
        <CardContent className="p-0">
          <pre className="p-4 text-xs leading-relaxed font-mono overflow-x-auto max-h-[500px] overflow-y-auto whitespace-pre bg-gray-950 text-gray-300">
            {highlighted}
          </pre>
        </CardContent>
      </Card>

      {/* Embed note */}
      <Card className="border-border bg-white">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-2 font-medium">
            This structured data is automatically injected by the embed script
            when loaded on your website. No manual installation needed.
          </p>
          <code className="text-xs text-repwell-teal-400 bg-repwell-sage-100/30 px-2 py-1 rounded font-mono">
            {'<script type="application/ld+json">...</script>'}
          </code>
        </CardContent>
      </Card>
    </div>
  );
}
