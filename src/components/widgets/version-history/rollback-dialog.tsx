"use client";

import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Loader2, RotateCcw } from "lucide-react";
import { rollbackToVersion } from "@/lib/widgets/version-actions";
import type { WidgetVersion } from "@/lib/widgets/version-actions";

interface RollbackDialogProps {
  widgetConfigId: string;
  version: WidgetVersion;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRollbackComplete: () => void;
}

export function RollbackDialog({
  widgetConfigId,
  version,
  open,
  onOpenChange,
  onRollbackComplete,
}: RollbackDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleRollback = () => {
    setError(null);
    startTransition(async () => {
      const result = await rollbackToVersion(widgetConfigId, version.version);
      if (result.success) {
        onRollbackComplete();
      } else {
        setError(result.error);
      }
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-sm">
            <RotateCcw className="h-4 w-4 text-amber-600" />
            Rollback to version {version.version}?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs space-y-2">
            <span className="block">
              This will restore the widget configuration from{" "}
              <strong>{formatDate(version.created_at)}</strong>
              {version.changed_by_name && (
                <> by {version.changed_by_name}</>
              )}
              .
            </span>
            <span className="block">
              A new version will be created with the restored settings. Analytics
              data and the widget embed code remain unchanged.
            </span>
            {error && (
              <span className="block text-red-600 font-medium">{error}</span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="text-xs h-8"
            disabled={isPending}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="text-xs h-8 bg-amber-600 hover:bg-amber-700"
            onClick={(e) => {
              e.preventDefault();
              handleRollback();
            }}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Restore this version"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
