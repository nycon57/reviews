"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { computeDiff, formatDiffValue } from "@/lib/widgets/config-diff";
import type { DiffEntry } from "@/lib/widgets/config-diff";
import type { WidgetVersion } from "@/lib/widgets/version-actions";

interface VersionDiffProps {
  fromVersion: WidgetVersion;
  toVersion: WidgetVersion;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DiffBadge({ type }: { type: DiffEntry["type"] }) {
  const styles = {
    added: "bg-green-100 text-green-700 border-green-200",
    removed: "bg-red-100 text-red-700 border-red-200",
    changed: "bg-amber-100 text-amber-700 border-amber-200",
  };

  return (
    <Badge
      variant="outline"
      className={`h-4 px-1.5 text-[9px] font-medium uppercase ${styles[type]}`}
    >
      {type}
    </Badge>
  );
}

function DiffRow({ entry }: { entry: DiffEntry }) {
  const pathParts = entry.path.split(".");
  const fieldName = pathParts[pathParts.length - 1];
  const section = pathParts.length > 1 ? pathParts.slice(0, -1).join(" > ") : null;

  return (
    <div className="flex items-start gap-3 py-2.5 px-3 rounded-md hover:bg-gray-50/50 transition-colors">
      <DiffBadge type={entry.type} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {section && (
            <span className="text-[10px] text-muted-foreground/60">
              {section} &rsaquo;
            </span>
          )}
          <span className="text-xs font-medium text-repwell-teal-500">
            {fieldName}
          </span>
        </div>
        <div className="mt-1 space-y-0.5">
          {entry.type === "changed" && (
            <>
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-red-500 font-medium shrink-0 w-6 mt-px">
                  &minus;
                </span>
                <code className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-mono break-all">
                  {formatDiffValue(entry.oldValue)}
                </code>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-green-500 font-medium shrink-0 w-6 mt-px">
                  +
                </span>
                <code className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-mono break-all">
                  {formatDiffValue(entry.newValue)}
                </code>
              </div>
            </>
          )}
          {entry.type === "added" && (
            <div className="flex items-start gap-2">
              <span className="text-[10px] text-green-500 font-medium shrink-0 w-6 mt-px">
                +
              </span>
              <code className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-mono break-all">
                {formatDiffValue(entry.newValue)}
              </code>
            </div>
          )}
          {entry.type === "removed" && (
            <div className="flex items-start gap-2">
              <span className="text-[10px] text-red-500 font-medium shrink-0 w-6 mt-px">
                &minus;
              </span>
              <code className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-mono break-all">
                {formatDiffValue(entry.oldValue)}
              </code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function VersionDiff({
  fromVersion,
  toVersion,
  open,
  onOpenChange,
}: VersionDiffProps) {
  const diffs = useMemo(() => {
    const oldConfig = (fromVersion.config ?? {}) as Record<string, unknown>;
    const newConfig = (toVersion.config ?? {}) as Record<string, unknown>;
    return computeDiff(oldConfig, newConfig);
  }, [fromVersion.config, toVersion.config]);

  // Group diffs by top-level section
  const grouped = useMemo(() => {
    const groups: Record<string, DiffEntry[]> = {};
    for (const diff of diffs) {
      const section = diff.path.split(".")[0];
      if (!groups[section]) groups[section] = [];
      groups[section].push(diff);
    }
    return groups;
  }, [diffs]);

  const stats = useMemo(() => {
    const s = { added: 0, removed: 0, changed: 0 };
    for (const d of diffs) s[d.type]++;
    return s;
  }, [diffs]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            Compare v{fromVersion.version} &rarr; v{toVersion.version}
          </DialogTitle>
        </DialogHeader>

        {/* Stats bar */}
        <div className="flex items-center gap-3 px-1">
          {stats.added > 0 && (
            <span className="text-[10px] font-medium text-green-600">
              +{stats.added} added
            </span>
          )}
          {stats.changed > 0 && (
            <span className="text-[10px] font-medium text-amber-600">
              ~{stats.changed} changed
            </span>
          )}
          {stats.removed > 0 && (
            <span className="text-[10px] font-medium text-red-600">
              -{stats.removed} removed
            </span>
          )}
          {diffs.length === 0 && (
            <span className="text-xs text-muted-foreground">
              No differences found
            </span>
          )}
        </div>

        <ScrollArea className="max-h-[500px]">
          <div className="space-y-4">
            {Object.entries(grouped).map(([section, entries]) => (
              <div key={section}>
                <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-3 py-1.5 border-b border-border">
                  <span className="text-[11px] font-semibold text-repwell-teal-400 uppercase tracking-wider">
                    {section}
                  </span>
                </div>
                <div className="divide-y divide-border/50">
                  {entries.map((entry) => (
                    <DiffRow key={entry.path} entry={entry} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
