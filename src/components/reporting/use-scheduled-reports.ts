"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { deleteScheduledReport, getScheduledReports, updateScheduledReport } from "@/lib/reporting";
import type { ScheduledReport } from "@/lib/reporting/types";
import { runReportAction, type ScheduleDialogMode } from "@/lib/reporting/utils";

export function useScheduledReports() {
  const { toast } = useToast();
  const [scheduledReports, setScheduledReports] = React.useState<ScheduledReport[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = React.useState(false);
  const [hasLoadedSchedules, setHasLoadedSchedules] = React.useState(false);
  const [updatingScheduleId, setUpdatingScheduleId] = React.useState<string | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = React.useState<ScheduledReport | null>(null);

  const loadSchedules = React.useCallback(
    async (silent = false) => {
      if (!silent) {
        setIsLoadingSchedules(true);
      }

      const reports = await runReportAction(() => getScheduledReports(), {
        toast,
        errorTitle: "Could not load schedules",
        errorDescription: "Scheduled reports are unavailable.",
        showErrorToast: !silent,
        requireData: true,
        onSuccess: (data) => {
          setScheduledReports(data);
          setHasLoadedSchedules(true);
        },
      });

      if (!silent) {
        setIsLoadingSchedules(false);
      }

      return reports;
    },
    [toast]
  );

  const ensureSchedulesLoaded = React.useCallback(() => {
    if (!hasLoadedSchedules && !isLoadingSchedules) {
      void loadSchedules();
    }
  }, [hasLoadedSchedules, isLoadingSchedules, loadSchedules]);

  const handleScheduleSaved = React.useCallback(
    (report: ScheduledReport, mode: ScheduleDialogMode["type"]) => {
      setScheduledReports((current) => {
        if (mode === "edit") {
          return current.map((item) => (item.id === report.id ? report : item));
        }
        return [report, ...current];
      });
      setHasLoadedSchedules(true);
    },
    []
  );

  const handleToggleSchedule = React.useCallback(
    async (report: ScheduledReport, isActive: boolean) => {
      setUpdatingScheduleId(report.id);

      await runReportAction(() => updateScheduledReport(report.id, { isActive }), {
        toast,
        successTitle: isActive ? "Schedule activated" : "Schedule paused",
        successDescription: report.name,
        errorTitle: "Schedule update failed",
        errorDescription: "Could not update the scheduled report.",
        requireData: true,
        logLabel: "Error updating scheduled report:",
        onSuccess: (updatedReport) => {
          setScheduledReports((current) =>
            current.map((item) => (item.id === report.id ? updatedReport : item))
          );
        },
      });

      setUpdatingScheduleId(null);
    },
    [toast]
  );

  const handleDeleteSchedule = React.useCallback(async () => {
    if (!scheduleToDelete) return;

    setUpdatingScheduleId(scheduleToDelete.id);

    await runReportAction(() => deleteScheduledReport(scheduleToDelete.id), {
      toast,
      successTitle: "Schedule deleted",
      successDescription: scheduleToDelete.name,
      errorTitle: "Delete failed",
      errorDescription: "Could not delete the scheduled report.",
      logLabel: "Error deleting scheduled report:",
      onSuccess: () => {
        setScheduledReports((current) => current.filter((item) => item.id !== scheduleToDelete.id));
        setScheduleToDelete(null);
      },
    });

    setUpdatingScheduleId(null);
  }, [scheduleToDelete, toast]);

  return {
    scheduledReports,
    isLoadingSchedules,
    updatingScheduleId,
    scheduleToDelete,
    setScheduleToDelete,
    loadSchedules,
    ensureSchedulesLoaded,
    handleScheduleSaved,
    handleToggleSchedule,
    handleDeleteSchedule,
  };
}
