"use client";

import * as React from "react";
import { Copy, SpinnerGap as Loader2 } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createReportShare } from "@/lib/reporting";
import type { GeneratedReport, ReportShare } from "@/lib/reporting/types";
import {
  buildShareUrl,
  copyReportShareUrl,
  formatReportDateRange,
  runReportAction,
} from "@/lib/reporting/utils";

const expiryOptions = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
];

export function ShareReportDialog({
  open,
  onOpenChange,
  report,
  onShareCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: GeneratedReport | null;
  onShareCreated: (share: ReportShare) => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = React.useState("");
  const [expiresInDays, setExpiresInDays] = React.useState("30");
  const [createdShare, setCreatedShare] = React.useState<ReportShare | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);

  React.useEffect(() => {
    if (!open || !report) return;
    setTitle(
      `${report.templateName} - ${formatReportDateRange(report.dateRange.start, report.dateRange.end)}`
    );
    setExpiresInDays("30");
    setCreatedShare(null);
  }, [open, report]);

  const shareUrl = createdShare ? buildShareUrl(createdShare.shareToken) : "";

  const handleCreateShare = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!report) return;

    if (!title.trim()) {
      toast({
        title: "Share not created",
        description: "Enter a title for the shared report.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    await runReportAction(
      () =>
        createReportShare(
          report.templateId,
          title.trim(),
          report.dateRange,
          report.filters,
          Number(expiresInDays)
        ),
      {
        toast,
        successTitle: "Shared link created",
        successDescription: "The report URL is ready to copy.",
        errorTitle: "Share not created",
        errorDescription: "Could not create the shared report link.",
        requireData: true,
        logLabel: "Error creating share link:",
        onSuccess: (share) => {
          setCreatedShare(share);
          onShareCreated(share);
        },
      }
    );

    setIsCreating(false);
  };

  const handleCopy = () => {
    if (!createdShare) return;
    void copyReportShareUrl(createdShare.shareToken, toast);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Report</DialogTitle>
          <DialogDescription>Create a public URL for the generated report.</DialogDescription>
        </DialogHeader>

        {createdShare ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border/60 bg-muted px-3 py-2 font-mono text-xs">
              {shareUrl}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Done
              </Button>
              <Button type="button" onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Copy URL
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleCreateShare}>
            <div className="space-y-2">
              <Label htmlFor="share-title">Title</Label>
              <Input
                id="share-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-expiry">Expiry</Label>
              <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                <SelectTrigger id="share-expiry">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {expiryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || !report}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Link
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
