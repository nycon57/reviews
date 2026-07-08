"use client";

import { ArrowSquareOut, Copy, LinkSimple, Trash } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReportShare, ReportTemplate } from "@/lib/reporting/types";
import { buildShareUrl, formatRelativeDate, formatReportDate } from "@/lib/reporting/utils";

export function ShareLinksSheet({
  open,
  onOpenChange,
  shares,
  templates,
  isLoading,
  onCopy,
  onRevoke,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shares: ReportShare[];
  templates: Map<string, ReportTemplate>;
  isLoading: boolean;
  onCopy: (share: ReportShare) => void;
  onRevoke: (share: ReportShare) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Shared Links</SheetTitle>
          <SheetDescription>Review public report links and revoke access.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {isLoading && (
            <>
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </>
          )}

          {!isLoading && shares.length === 0 && (
            <div className="rounded-xl border border-dashed border-border/50 bg-repwell-sage-100/10 p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <LinkSimple weight="duotone" className="h-6 w-6 text-repwell-teal-300" />
              </div>
              <h3 className="mb-2 font-medium">No Shared Links</h3>
              <p className="text-sm text-muted-foreground">Shared report URLs will appear here.</p>
            </div>
          )}

          {!isLoading &&
            shares.map((share) => {
              const template = templates.get(share.templateId);
              const shareUrl = buildShareUrl(share.shareToken);

              return (
                <div
                  key={share.id}
                  className="rounded-xl border border-border/60 bg-background p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="truncate font-medium text-heading">{share.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {template?.name || "Unknown template"} - Created{" "}
                        {formatReportDate(share.createdAt)}
                      </div>
                    </div>
                    <Badge variant="secondary">{share.accessCount} views</Badge>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                    <div>
                      Expires {share.expiresAt ? formatRelativeDate(share.expiresAt) : "Never"}
                      {share.expiresAt ? ` (${formatReportDate(share.expiresAt)})` : ""}
                    </div>
                    <div className="truncate rounded-lg bg-muted px-3 py-2 font-mono text-xs">
                      {shareUrl}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => onCopy(share)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={shareUrl} target="_blank" rel="noreferrer">
                        <ArrowSquareOut className="mr-2 h-4 w-4" />
                        Open
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onRevoke(share)}>
                      <Trash className="mr-2 h-4 w-4" />
                      Revoke
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
