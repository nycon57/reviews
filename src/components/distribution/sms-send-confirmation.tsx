"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { maskPhone } from "@/lib/sms/phone-utils";
import {
  PaperPlaneRight,
  SpinnerGap,
  Clock,
  ChatText,
  Phone,
} from "@phosphor-icons/react";

interface SmsSendConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  recipientPhone: string;
  templatePreview: string;
  segmentCount: number;
  creditCost: number;
  scheduledTime: string | null;
  quietHoursWarning: boolean;
  quietHoursNextValid: string | null;
}

export function SmsSendConfirmation({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  recipientPhone,
  templatePreview,
  segmentCount,
  creditCost,
  scheduledTime,
  quietHoursWarning,
  quietHoursNextValid,
}: SmsSendConfirmationProps) {
  const maskedPhone = maskPhone(recipientPhone);
  const isScheduled = !!scheduledTime;

  const formatScheduledTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Confirm SMS</DialogTitle>
          <DialogDescription>
            Review the details before sending.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              Recipient
            </div>
            <span className="text-sm font-medium font-mono">{maskedPhone}</span>
          </div>

          <Separator />

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ChatText className="h-4 w-4" />
              Message preview
            </div>
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {templatePreview}
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-xs text-muted-foreground">Segments</span>
              <Badge variant="secondary" className="text-xs">
                {segmentCount}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-xs text-muted-foreground">Credits</span>
              <Badge variant="secondary" className="text-xs">
                {creditCost}
              </Badge>
            </div>
          </div>

          {isScheduled && (
            <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-800 dark:bg-blue-950/30">
              <Clock weight="fill" className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="text-xs text-blue-700 dark:text-blue-300">
                Scheduled: {formatScheduledTime(scheduledTime!)}
              </span>
            </div>
          )}

          {quietHoursWarning && quietHoursNextValid && (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/30">
              <Clock weight="fill" className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-xs text-amber-700 dark:text-amber-300">
                Quiet hours active. Will be sent at {formatScheduledTime(quietHoursNextValid)}.
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? (
              <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PaperPlaneRight className="mr-2 h-4 w-4" />
            )}
            {isScheduled ? "Schedule" : "Send SMS"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
