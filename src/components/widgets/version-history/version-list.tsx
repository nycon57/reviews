"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, RotateCcw, GitCompare, Loader2 } from "lucide-react";
import type { WidgetVersion } from "@/lib/widgets/version-actions";
import { listWidgetVersions } from "@/lib/widgets/version-actions";
import { RollbackDialog } from "./rollback-dialog";
import { VersionDiff } from "./version-diff";

interface VersionListProps {
  widgetConfigId: string;
  currentVersion?: number;
  onRollbackComplete?: () => void;
}

export function VersionList({
  widgetConfigId,
  currentVersion,
  onRollbackComplete,
}: VersionListProps) {
  const [versions, setVersions] = useState<WidgetVersion[]>([]);
  const [isLoading, startTransition] = useTransition();
  const [selectedForRollback, setSelectedForRollback] =
    useState<WidgetVersion | null>(null);
  const [compareVersions, setCompareVersions] = useState<{
    from: WidgetVersion;
    to: WidgetVersion;
  } | null>(null);
  const [compareSelection, setCompareSelection] = useState<WidgetVersion | null>(null);

  const fetchVersions = useCallback(() => {
    startTransition(async () => {
      const result = await listWidgetVersions(widgetConfigId);
      if (result.success) {
        setVersions(result.data.versions);
      }
    });
  }, [widgetConfigId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions, currentVersion]);

  const handleCompareClick = (version: WidgetVersion) => {
    if (!compareSelection) {
      setCompareSelection(version);
    } else {
      // Order: older version first
      const [from, to] =
        compareSelection.version < version.version
          ? [compareSelection, version]
          : [version, compareSelection];
      setCompareVersions({ from, to });
      setCompareSelection(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  if (isLoading && versions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <History className="h-8 w-8 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">No version history yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Versions are created each time you save changes.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1">
        {compareSelection && (
          <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-md bg-blue-50 border border-blue-200">
            <GitCompare className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-xs text-blue-700">
              Select another version to compare with v{compareSelection.version}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-6 px-2 text-xs text-blue-600"
              onClick={() => setCompareSelection(null)}
            >
              Cancel
            </Button>
          </div>
        )}

        <ScrollArea className="h-[400px]">
          <div className="space-y-1 pr-3">
            {versions.map((version) => {
              const isCurrent = version.version === currentVersion;
              const isCompareSelected =
                compareSelection?.version === version.version;

              return (
                <div
                  key={version.id}
                  className={`group relative rounded-lg border p-3 transition-all ${
                    isCurrent
                      ? "border-repwell-teal-200 bg-repwell-sage-100/20"
                      : isCompareSelected
                        ? "border-blue-300 bg-blue-50/50"
                        : "border-border hover:border-repwell-sage-200 hover:bg-gray-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-repwell-teal-500 tabular-nums">
                          v{version.version}
                        </span>
                        {isCurrent && (
                          <Badge
                            variant="secondary"
                            className="h-4 px-1.5 text-[9px] font-medium bg-repwell-teal-300/10 text-repwell-teal-400 border-0"
                          >
                            Current
                          </Badge>
                        )}
                        {version.change_note?.startsWith("Rolled back") && (
                          <Badge
                            variant="secondary"
                            className="h-4 px-1.5 text-[9px] font-medium bg-amber-100 text-amber-700 border-0"
                          >
                            Rollback
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {version.change_summary ?? "No changes recorded"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground/60">
                          {formatDate(version.created_at)}
                        </span>
                        {version.changed_by_name && (
                          <>
                            <span className="text-[10px] text-muted-foreground/40">
                              ·
                            </span>
                            <span className="text-[10px] text-muted-foreground/60">
                              {version.changed_by_name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleCompareClick(version)}
                        title="Compare versions"
                      >
                        <GitCompare className="h-3.5 w-3.5" />
                      </Button>
                      {!isCurrent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          onClick={() => setSelectedForRollback(version)}
                          title="Rollback to this version"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {selectedForRollback && (
        <RollbackDialog
          widgetConfigId={widgetConfigId}
          version={selectedForRollback}
          open={!!selectedForRollback}
          onOpenChange={(open) => {
            if (!open) setSelectedForRollback(null);
          }}
          onRollbackComplete={() => {
            setSelectedForRollback(null);
            fetchVersions();
            onRollbackComplete?.();
          }}
        />
      )}

      {compareVersions && (
        <VersionDiff
          fromVersion={compareVersions.from}
          toVersion={compareVersions.to}
          open={!!compareVersions}
          onOpenChange={(open) => {
            if (!open) setCompareVersions(null);
          }}
        />
      )}
    </>
  );
}
