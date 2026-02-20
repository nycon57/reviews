"use client";

import { useState, useRef, useEffect } from "react";
import { Link as LinkIcon, Check } from "@phosphor-icons/react";

interface CopyLinkButtonProps {
  url: string;
}

export function CopyLinkButton({ url }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copyTimeoutRef.current = null;
      }, 2000);
    } catch {
      // Fallback: no-op if clipboard unavailable
    }
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-repwell-teal-300 transition-colors hover:bg-repwell-sage-100/50 hover:text-repwell-teal-500"
      aria-label="Copy link"
      title={url}
      type="button"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" weight="bold" />
      ) : (
        <LinkIcon className="h-3.5 w-3.5" weight="bold" />
      )}
      <span className="text-xs font-medium">
        {copied ? "Copied!" : "Copy"}
      </span>
    </button>
  );
}
