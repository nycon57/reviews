"use client";

import { useMemo, useState, useTransition, type FormEvent, type KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  ArrowSquareOut,
  Check,
  Copy,
  CursorClick,
  Eye,
  LinkSimple,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { bulkUpdateSmartLinks } from "@/lib/share-studio/actions";
import type {
  SmartLinkBulkAction,
  SmartLinkRow,
  SmartLinksListResult,
  SmartLinkStatusFilter,
} from "@/lib/share-studio/hub-types";
import { absoluteUrl } from "@/lib/share-studio/url";
import { formatDate } from "@/lib/utils";
import { SmartLinkAnalyticsSheet } from "@/components/share-studio/smart-link-analytics-sheet";

interface SmartLinksTableProps {
  initialData: SmartLinksListResult;
  basePath: string;
}

const STATUS_LABELS: Record<SmartLinkStatusFilter, string> = {
  all: "All active",
  live: "Live",
  unpublished: "Unpublished",
  archived: "Archived",
};

function sourceLabel(link: SmartLinkRow): string {
  const sourceType = link.source?.sourceType;
  if (sourceType === "video_testimonial") return "Video";
  if (sourceType === "review") return "Review";
  return "Manual";
}

function statusBadge(link: SmartLinkRow) {
  if (link.archivedAt) {
    return <Badge variant="secondary">Archived</Badge>;
  }
  if (link.published) {
    return <Badge className="bg-emerald-600">Live</Badge>;
  }
  return <Badge variant="secondary">Unpublished</Badge>;
}

export function SmartLinksTable({ initialData, basePath }: SmartLinksTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [analyticsLink, setAnalyticsLink] = useState<SmartLinkRow | null>(null);

  const visibleIds = useMemo(
    () => initialData.items.map((item) => item.id),
    [initialData.items]
  );
  const selectedCount = selectedIds.size;
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected =
    visibleIds.some((id) => selectedIds.has(id)) && !allVisibleSelected;

  const pushParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value.length === 0) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath, { scroll: false });
    setSelectedIds(new Set());
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath, { scroll: false });
    setSelectedIds(new Set());
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    pushParams({ search: String(formData.get("search") || "").trim() });
  };

  const toggleAllVisible = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const runBulkAction = (action: SmartLinkBulkAction) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    startTransition(async () => {
      const result = await bulkUpdateSmartLinks({ ids, action });
      if (!result.success) {
        toast({
          title: "Update failed",
          description: result.error || "Could not update Smart Links.",
          variant: "destructive",
        });
        return;
      }

      const updated = result.data?.updated ?? ids.length;
      const actionLabel =
        action === "archive"
          ? "Archived"
          : action === "unpublish"
            ? "Unpublished"
            : "Republished";

      toast({
        title: `${actionLabel} ${updated} Smart Link${updated === 1 ? "" : "s"}`,
      });
      setSelectedIds(new Set());
      setConfirmArchiveOpen(false);
      router.refresh();
    });
  };

  const copyUrl = async (path: string) => {
    try {
      await navigator.clipboard.writeText(absoluteUrl(path));
      toast({ title: "Smart Link copied" });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy the Smart Link.",
        variant: "destructive",
      });
    }
  };

  const handleRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    link: SmartLinkRow
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setAnalyticsLink(link);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-soft lg:flex-row lg:items-center lg:justify-between">
        <form className="flex flex-1 flex-col gap-2 sm:flex-row" onSubmit={handleSearch}>
          <Input
            name="search"
            defaultValue={initialData.search}
            placeholder="Search title or slug"
            className="sm:max-w-sm"
          />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <Select
            value={initialData.status}
            onValueChange={(value) =>
              pushParams({
                status: value === "all" ? null : value,
              })
            }
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-11">
                <Checkbox
                  checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                  onCheckedChange={toggleAllVisible}
                  aria-label="Select all visible Smart Links"
                />
              </TableHead>
              <TableHead>Smart Link</TableHead>
              <TableHead className="hidden lg:table-cell">Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="text-right">7d views/clicks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="mx-auto max-w-sm">
                    <LinkSimple className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="font-medium text-heading">No Smart Links found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Try a different search or status filter.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              initialData.items.map((link) => (
                <TableRow
                  key={link.id}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer"
                  data-state={selectedIds.has(link.id) ? "selected" : undefined}
                  onClick={() => setAnalyticsLink(link)}
                  onKeyDown={(event) => handleRowKeyDown(event, link)}
                >
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(link.id)}
                      onCheckedChange={() => toggleOne(link.id)}
                      aria-label={`Select ${link.title}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-medium text-heading">{link.title}</p>
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <code className="max-w-[220px] truncate rounded bg-muted px-2 py-1 text-xs">
                          {link.urlPath}
                        </code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          aria-label="Copy Smart Link"
                          onClick={(event) => {
                            event.stopPropagation();
                            void copyUrl(link.urlPath);
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          aria-label="Open Smart Link"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <a href={link.urlPath} target="_blank" rel="noreferrer">
                            <ArrowSquareOut className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="space-y-1">
                      <Badge variant="outline">{sourceLabel(link)}</Badge>
                      <p className="max-w-[180px] truncate text-sm text-muted-foreground">
                        {link.source?.customerName || link.source?.title || "Unknown source"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{statusBadge(link)}</TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {formatDate(link.createdAt, "Unknown")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-3 text-sm tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        {link.stats7d.views.toLocaleString()}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CursorClick className="h-3.5 w-3.5 text-muted-foreground" />
                        {link.stats7d.clicks.toLocaleString()}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing page {initialData.page} of {initialData.totalPages} ·{" "}
          {initialData.total.toLocaleString()} Smart Link
          {initialData.total === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={initialData.page <= 1}
            onClick={() => goToPage(initialData.page - 1)}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={initialData.page >= initialData.totalPages}
            onClick={() => goToPage(initialData.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {selectedCount > 0 ? (
        <div className="sticky bottom-4 z-20 mx-auto flex max-w-3xl flex-col gap-3 rounded-xl border border-border bg-background p-3 shadow-large sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Check className="h-4 w-4 text-repwell-teal-300" />
            {selectedCount} selected
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={isPending}
              onClick={() => runBulkAction("unpublish")}
            >
              <Archive className="h-3.5 w-3.5" />
              Unpublish
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={isPending}
              onClick={() => runBulkAction("republish")}
            >
              <LinkSimple className="h-3.5 w-3.5" />
              Republish
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="gap-1.5"
              disabled={isPending}
              onClick={() => setConfirmArchiveOpen(true)}
            >
              <Archive className="h-3.5 w-3.5" />
              Archive
            </Button>
          </div>
        </div>
      ) : null}

      <AlertDialog open={confirmArchiveOpen} onOpenChange={setConfirmArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive selected Smart Links?</AlertDialogTitle>
            <AlertDialogDescription>
              This will unpublish and archive {selectedCount} Smart Link
              {selectedCount === 1 ? "" : "s"}. Archived links are hidden from the
              default table but can be restored from the Archived filter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault();
                runBulkAction("archive");
              }}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SmartLinkAnalyticsSheet
        link={analyticsLink}
        open={!!analyticsLink}
        onOpenChange={(open) => {
          if (!open) setAnalyticsLink(null);
        }}
      />
    </div>
  );
}
