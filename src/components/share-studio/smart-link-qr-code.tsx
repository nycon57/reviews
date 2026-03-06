"use client";

import { useRef, useState } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DownloadSimple, Check, Copy } from "@phosphor-icons/react";

interface SmartLinkQRCodeProps {
  url: string;
  title?: string;
  className?: string;
}

export function SmartLinkQRCode({ url, title, className }: SmartLinkQRCodeProps) {
  const [copied, setCopied] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qrSvgRef = useRef<any>(null);

  function downloadQR() {
    const svg = qrSvgRef.current;
    if (!svg) return;
    const svgData = new window.XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new window.Image();
    img.onload = () => {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, 300, 300);
      ctx.drawImage(img, 50, 50, 200, 200);
      const a = document.createElement("a");
      a.download = `${title || "smart-link"}-qr.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src =
      "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className={cn("flex flex-col items-center gap-4 rounded-lg bg-card p-6", className)}>
      {title && (
        <p className="text-sm font-medium text-foreground">{title}</p>
      )}

      <div className="rounded-lg border border-border bg-white dark:bg-white p-3">
        <QRCode ref={qrSvgRef} value={url} size={200} />
      </div>

      {/* Copyable URL */}
      <div className="flex w-full items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
        <span className="flex-1 truncate text-xs text-muted-foreground">{url}</span>
        <button
          type="button"
          onClick={copyUrl}
          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Copy URL"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={downloadQR}
      >
        <DownloadSimple className="h-4 w-4" />
        Download QR Code
      </Button>
    </div>
  );
}
