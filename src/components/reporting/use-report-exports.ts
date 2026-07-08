"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { getReportExports } from "@/lib/reporting";
import type { ReportExport } from "@/lib/reporting/types";
import { runReportAction } from "@/lib/reporting/utils";

export function useReportExports() {
  const { toast } = useToast();
  const [exportHistory, setExportHistory] = React.useState<ReportExport[]>([]);
  const [isLoadingExports, setIsLoadingExports] = React.useState(false);
  const [hasLoadedExports, setHasLoadedExports] = React.useState(false);

  const loadExports = React.useCallback(
    async (silent = false) => {
      if (!silent) {
        setIsLoadingExports(true);
      }

      const exports = await runReportAction(() => getReportExports(), {
        toast,
        errorTitle: "Could not load export history",
        errorDescription: "Export history is unavailable.",
        showErrorToast: !silent,
        requireData: true,
        onSuccess: (data) => {
          setExportHistory(data);
          setHasLoadedExports(true);
        },
      });

      if (!silent) {
        setIsLoadingExports(false);
      }

      return exports;
    },
    [toast]
  );

  const ensureExportsLoaded = React.useCallback(() => {
    if (!hasLoadedExports && !isLoadingExports) {
      void loadExports();
    }
  }, [hasLoadedExports, isLoadingExports, loadExports]);

  const prependExport = React.useCallback((reportExport: ReportExport) => {
    setExportHistory((current) => [
      reportExport,
      ...current.filter((item) => item.id !== reportExport.id),
    ]);
  }, []);

  return {
    exportHistory,
    isLoadingExports,
    loadExports,
    ensureExportsLoaded,
    prependExport,
  };
}
