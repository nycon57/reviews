"use client";

import { useState, useCallback, useRef } from "react";
import {
  UploadSimple,
  SpinnerGap,
  CheckCircle,
  WarningCircle,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  bulkImportContacts,
  type ContactImportSummary,
} from "@/lib/contacts/import";

interface TeamMember {
  id: string;
  fullName: string;
  email?: string;
}

interface ContactImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canAssignOwner: boolean;
  teamMembers: TeamMember[];
  onImported: () => void;
}

const SELF_OWNER = "__self__";
const SAMPLE = "name,email,phone\nJane Doe,jane@example.com,(415) 555-0123";

export function ContactImportDialog({
  open,
  onOpenChange,
  canAssignOwner,
  teamMembers,
  onImported,
}: ContactImportDialogProps) {
  const [csvText, setCsvText] = useState("");
  const [owner, setOwner] = useState<string>(SELF_OWNER);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<ContactImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setCsvText("");
    setOwner(SELF_OWNER);
    setSummary(null);
    setError(null);
  }, []);

  const handleClose = useCallback(
    (next: boolean) => {
      if (!next) reset();
      onOpenChange(next);
    },
    [onOpenChange, reset]
  );

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        setCsvText(text);
        setError(null);
      } catch {
        setError("Couldn't read that file. Paste the CSV instead.");
      }
    },
    []
  );

  const handleImport = useCallback(async () => {
    if (!csvText.trim()) {
      setError("Add some CSV rows or upload a file first.");
      return;
    }
    setImporting(true);
    setError(null);
    try {
      const result = await bulkImportContacts(
        csvText,
        canAssignOwner && owner !== SELF_OWNER ? owner : null
      );
      setSummary(result);
      if (result.created > 0 || result.merged > 0) {
        onImported();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed. Please try again.");
      toast({
        title: "Import failed",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  }, [csvText, owner, canAssignOwner, onImported]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import contacts</DialogTitle>
          <DialogDescription>
            Paste or upload a CSV with <code className="text-xs">name,email,phone</code>{" "}
            columns. We&apos;ll skip anyone who has unsubscribed.
          </DialogDescription>
        </DialogHeader>

        {summary ? (
          <ImportSummaryView summary={summary} />
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="csv-text">CSV data</Label>
              <Textarea
                id="csv-text"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={SAMPLE}
                rows={6}
                className="font-mono text-xs"
              />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="text-xs text-repwell-teal-300 hover:underline"
                  onClick={() => setCsvText(SAMPLE)}
                >
                  Use sample
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFile}
                />
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadSimple className="h-3.5 w-3.5" />
                  Upload .csv
                </button>
              </div>
            </div>

            {canAssignOwner && (
              <div className="space-y-1.5">
                <Label>Assign owner</Label>
                <Select value={owner} onValueChange={setOwner}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SELF_OWNER}>Me</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              >
                <WarningCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {summary ? (
            <Button onClick={() => handleClose(false)}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? (
                  <>
                    <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <UploadSimple className="mr-2 h-4 w-4" />
                    Import
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportSummaryView({ summary }: { summary: ContactImportSummary }) {
  const stats = [
    { label: "Created", value: summary.created },
    { label: "Merged", value: summary.merged },
    { label: "Skipped (do-not-contact)", value: summary.suppressedSkipped },
    { label: "Invalid rows", value: summary.invalid },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border border-repwell-teal-300/20 bg-repwell-teal-300/5 p-3 text-sm text-heading">
        <CheckCircle className="h-5 w-5 text-repwell-teal-300" weight="fill" />
        Imported {summary.total} {summary.total === 1 ? "row" : "rows"}.
      </div>
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-border/50 bg-card px-3 py-2.5"
          >
            <p className="text-xl font-semibold tabular-nums text-heading-accent">
              {s.value}
            </p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      {summary.errors.length > 0 && (
        <div className="space-y-1 rounded-lg border border-border/50 bg-muted/20 p-3">
          <p className="text-xs font-medium text-muted-foreground">
            {summary.errors.length} issue
            {summary.errors.length === 1 ? "" : "s"}
          </p>
          <ul className="max-h-32 space-y-0.5 overflow-y-auto text-xs text-muted-foreground">
            {summary.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
