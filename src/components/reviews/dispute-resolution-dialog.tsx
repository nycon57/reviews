"use client";

import type { ReactNode } from "react";
import {
  CheckCircle,
  SpinnerGap,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type DisputeResolutionMode = "uphold" | "dismiss";

interface DisputeResolutionDialogProps {
  primitive: "alert" | "dialog";
  open: boolean;
  mode: DisputeResolutionMode | null;
  title: string;
  description: string;
  note: string;
  onNoteChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  confirmDisabled?: boolean;
  confirmLabel: string;
  noteLabel: string;
  notePlaceholder: string;
  noteHelper?: string;
  summary?: {
    title: string;
    description: string;
  } | null;
  error?: string | null;
}

function ConfirmIcon({
  mode,
  isSubmitting,
}: {
  mode: DisputeResolutionMode | null;
  isSubmitting: boolean;
}) {
  if (isSubmitting) {
    return <SpinnerGap className="h-4 w-4 animate-spin" aria-hidden="true" />;
  }

  if (mode === "uphold") {
    return <XCircle className="h-4 w-4" aria-hidden="true" />;
  }

  return <CheckCircle className="h-4 w-4" aria-hidden="true" />;
}

function DisputeResolutionFields({
  note,
  onNoteChange,
  isSubmitting,
  noteLabel,
  notePlaceholder,
  noteHelper,
  summary,
  error,
}: Pick<
  DisputeResolutionDialogProps,
  | "note"
  | "onNoteChange"
  | "isSubmitting"
  | "noteLabel"
  | "notePlaceholder"
  | "noteHelper"
  | "summary"
  | "error"
>) {
  const noteId = "dispute-resolution-note";

  return (
    <>
      {summary ? (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-sm font-medium text-heading">{summary.title}</p>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {summary.description}
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={noteId}>{noteLabel}</Label>
        <Textarea
          id={noteId}
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder={notePlaceholder}
          className="min-h-28"
          rows={4}
          disabled={isSubmitting}
        />
        {noteHelper ? (
          <p className="text-xs text-muted-foreground">{noteHelper}</p>
        ) : null}
      </div>

      {error ? (
        <Alert variant="destructive">
          <WarningCircle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Could not resolve dispute</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </>
  );
}

function ConfirmButton({
  mode,
  isSubmitting,
  confirmDisabled,
  confirmLabel,
  onConfirm,
}: Pick<
  DisputeResolutionDialogProps,
  "mode" | "isSubmitting" | "confirmDisabled" | "confirmLabel" | "onConfirm"
>) {
  return (
    <Button
      type="button"
      variant={mode === "uphold" ? "destructive" : "default"}
      onClick={onConfirm}
      disabled={confirmDisabled || isSubmitting}
    >
      <ConfirmIcon mode={mode} isSubmitting={isSubmitting} />
      {confirmLabel}
    </Button>
  );
}

function ResolutionContent({
  children,
  fields,
  footer,
}: {
  children: ReactNode;
  fields: ReactNode;
  footer: ReactNode;
}) {
  return (
    <>
      {children}
      {fields}
      {footer}
    </>
  );
}

export function DisputeResolutionDialog(props: DisputeResolutionDialogProps) {
  const fields = <DisputeResolutionFields {...props} />;
  const confirmButton = <ConfirmButton {...props} />;

  if (props.primitive === "alert") {
    return (
      <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
        <AlertDialogContent>
          <ResolutionContent
            fields={fields}
            footer={
              <AlertDialogFooter>
                <AlertDialogCancel disabled={props.isSubmitting}>
                  Cancel
                </AlertDialogCancel>
                {confirmButton}
              </AlertDialogFooter>
            }
          >
            <AlertDialogHeader>
              <AlertDialogTitle>{props.title}</AlertDialogTitle>
              <AlertDialogDescription>{props.description}</AlertDialogDescription>
            </AlertDialogHeader>
          </ResolutionContent>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <ResolutionContent
          fields={fields}
          footer={
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => props.onOpenChange(false)}
                disabled={props.isSubmitting}
              >
                Cancel
              </Button>
              {confirmButton}
            </DialogFooter>
          }
        >
          <DialogHeader>
            <DialogTitle>{props.title}</DialogTitle>
            <DialogDescription>{props.description}</DialogDescription>
          </DialogHeader>
        </ResolutionContent>
      </DialogContent>
    </Dialog>
  );
}
