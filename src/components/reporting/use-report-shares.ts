"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { getReportShares, revokeReportShare } from "@/lib/reporting";
import type { ReportShare } from "@/lib/reporting/types";
import { copyReportShareUrl, runReportAction } from "@/lib/reporting/utils";

export function useReportShares() {
  const { toast } = useToast();
  const [shares, setShares] = React.useState<ReportShare[]>([]);
  const [isLoadingShares, setIsLoadingShares] = React.useState(false);
  const [shareToRevoke, setShareToRevoke] = React.useState<ReportShare | null>(null);
  const [revokingShareId, setRevokingShareId] = React.useState<string | null>(null);

  const loadShares = React.useCallback(async () => {
    setIsLoadingShares(true);

    await runReportAction(() => getReportShares(), {
      toast,
      errorTitle: "Could not load shared links",
      errorDescription: "Shared links are unavailable.",
      requireData: true,
      onSuccess: setShares,
    });

    setIsLoadingShares(false);
  }, [toast]);

  const handleShareCreated = React.useCallback((share: ReportShare) => {
    setShares((current) => [share, ...current.filter((item) => item.id !== share.id)]);
  }, []);

  const handleCopyShare = React.useCallback(
    (share: ReportShare) => {
      void copyReportShareUrl(share.shareToken, toast);
    },
    [toast]
  );

  const handleRevokeShare = React.useCallback(async () => {
    if (!shareToRevoke) return;

    setRevokingShareId(shareToRevoke.id);

    await runReportAction(() => revokeReportShare(shareToRevoke.id), {
      toast,
      successTitle: "Shared link revoked",
      successDescription: shareToRevoke.title,
      errorTitle: "Revoke failed",
      errorDescription: "Could not revoke the shared link.",
      logLabel: "Error revoking shared link:",
      onSuccess: () => {
        setShares((current) => current.filter((item) => item.id !== shareToRevoke.id));
        setShareToRevoke(null);
      },
    });

    setRevokingShareId(null);
  }, [shareToRevoke, toast]);

  return {
    shares,
    isLoadingShares,
    shareToRevoke,
    revokingShareId,
    setShareToRevoke,
    loadShares,
    handleShareCreated,
    handleCopyShare,
    handleRevokeShare,
  };
}
