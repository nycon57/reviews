"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  CopySimple,
  ArrowSquareOut,
  Archive,
  LinkSimple,
  Check,
} from "@phosphor-icons/react";

interface SmartLink {
  id: string;
  slug: string;
  title: string | null;
  published: boolean;
  created_at: string;
  updated_at: string | null;
  destination_url: string | null;
  view_count?: number;
  click_count?: number;
}

interface SmartLinksTableProps {
  links: SmartLink[];
  className?: string;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function useClipboardFeedback() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return { copiedId, copy };
}

function useToast() {
  const [message, setMessage] = useState<string | null>(null);

  function show(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  }

  return { message, show };
}

export function SmartLinksTable({ links, className }: SmartLinksTableProps) {
  const { copiedId, copy } = useClipboardFeedback();
  const { message: toastMessage, show: showToast } = useToast();

  function getFullUrl(slug: string): string {
    return `${typeof window !== "undefined" ? window.location.origin : ""}/s/${slug}`;
  }

  function handleCopy(link: SmartLink) {
    copy(link.id, getFullUrl(link.slug));
  }

  function handlePreview(link: SmartLink) {
    window.open(`/s/${link.slug}`, "_blank", "noopener,noreferrer");
  }

  function handleArchive() {
    showToast("Archive coming soon");
  }

  // Empty state
  if (links.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-20 text-center", className)}>
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <LinkSimple className="h-8 w-8 text-primary" weight="duotone" />
        </div>
        <h3 className="text-base font-semibold text-foreground">No Smart Links yet</h3>
        <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
          Share an approved review to create your first Smart Link.
        </p>
        <Button variant="outline" className="mt-6 gap-2" asChild>
          <a href="/dashboard/reviews">Go to Reviews</a>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {links.length} smart link{links.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                    Views
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                    Clicks
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {links.map((link) => (
                  <tr
                    key={link.id}
                    className="group transition-colors hover:bg-muted/20"
                  >
                    {/* Title + slug */}
                    <td className="px-4 py-3">
                      <div className="max-w-[200px]">
                        <p className="truncate font-medium text-foreground">
                          {link.title ?? (
                            <span className="italic text-muted-foreground">Untitled</span>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">/s/{link.slug}</p>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {link.published ? (
                        <Badge
                          variant="outline"
                          className="border-green-200 bg-green-50 text-green-700"
                        >
                          Published
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-yellow-200 bg-yellow-50 text-yellow-700"
                        >
                          Draft
                        </Badge>
                      )}
                    </td>

                    {/* Views */}
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {link.view_count != null ? link.view_count.toLocaleString() : "—"}
                    </td>

                    {/* Clicks */}
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {link.click_count != null ? link.click_count.toLocaleString() : "—"}
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(link.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Copy */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-7 w-7 p-0",
                            copiedId === link.id && "text-green-600"
                          )}
                          onClick={() => handleCopy(link)}
                          aria-label={copiedId === link.id ? "Copied" : "Copy URL"}
                        >
                          {copiedId === link.id ? (
                            <Check className="h-3.5 w-3.5" weight="bold" />
                          ) : (
                            <CopySimple className="h-3.5 w-3.5" />
                          )}
                        </Button>

                        {/* Preview */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handlePreview(link)}
                          aria-label="Preview link"
                        >
                          <ArrowSquareOut className="h-3.5 w-3.5" />
                        </Button>

                        {/* Archive */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={handleArchive}
                          aria-label="Archive link"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md bg-foreground px-4 py-2.5 text-sm text-background shadow-lg">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
