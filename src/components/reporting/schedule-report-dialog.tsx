"use client";

import * as React from "react";
import { SpinnerGap as Loader2, X } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
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
import { ReportFiltersPanel } from "@/components/reporting/report-filters";
import { createScheduledReport, updateScheduledReport } from "@/lib/reporting";
import { DAYS_OF_WEEK } from "@/lib/constants/days";
import type {
  ReportFilters as ReportFiltersType,
  ReportTemplate,
  ScheduleFrequency,
  ScheduledReport,
} from "@/lib/reporting/types";
import {
  buildDefaultScheduleForm,
  isValidEmail,
  runReportAction,
  type ScheduleDialogMode,
  type ScheduleFormState,
} from "@/lib/reporting/utils";

const weekDays = [...DAYS_OF_WEEK.slice(1), DAYS_OF_WEEK[0]];

export function ScheduleReportDialog({
  mode,
  templates,
  selectedTemplate,
  teamMembers,
  branches,
  onOpenChange,
  onSaved,
}: {
  mode: ScheduleDialogMode | null;
  templates: ReportTemplate[];
  selectedTemplate: ReportTemplate | null;
  teamMembers: Array<{ id: string; full_name: string; branch: string | null }>;
  branches: string[];
  onOpenChange: (open: boolean) => void;
  onSaved: (report: ScheduledReport, mode: ScheduleDialogMode["type"]) => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = React.useState<ScheduleFormState>(() =>
    buildDefaultScheduleForm(templates, selectedTemplate)
  );
  const [emailInput, setEmailInput] = React.useState("");
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const isOpen = !!mode;
  const isEdit = mode?.type === "edit";

  React.useEffect(() => {
    if (!mode) return;
    setForm(
      buildDefaultScheduleForm(
        templates,
        selectedTemplate,
        mode.type === "edit" ? mode.report : undefined
      )
    );
    setEmailInput("");
    setEmailError(null);
  }, [mode, selectedTemplate, templates]);

  const selectedTemplateName =
    templates.find((template) => template.id === form.templateId)?.name || "Select template";

  const addEmails = (value: string) => {
    const candidates = value
      .split(/[\s,;]+/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    if (candidates.length === 0) return;

    const invalid = candidates.find((email) => !isValidEmail(email));
    if (invalid) {
      setEmailError(`${invalid} is not a valid email address.`);
      return;
    }

    setForm((current) => ({
      ...current,
      recipients: Array.from(new Set([...current.recipients, ...candidates])),
    }));
    setEmailInput("");
    setEmailError(null);
  };

  const removeEmail = (email: string) => {
    setForm((current) => ({
      ...current,
      recipients: current.recipients.filter((item) => item !== email),
    }));
  };

  const handleEmailKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === "Tab" || event.key === ",") {
      if (event.key === "Tab" && !emailInput.trim()) {
        return;
      }
      event.preventDefault();
      addEmails(emailInput);
    }
  };

  const validateForm = () => {
    if (!form.templateId) return "Select a report template.";
    if (!form.name.trim()) return "Enter a schedule name.";
    if (emailInput.trim()) {
      const invalidInput = emailInput.trim();
      if (!isValidEmail(invalidInput)) {
        return `${invalidInput} is not a valid email address.`;
      }
    }
    if (form.recipients.length === 0 && !emailInput.trim()) {
      return "Add at least one recipient.";
    }
    if (form.schedule === "monthly") {
      const day = Number(form.dayOfMonth);
      if (!Number.isInteger(day) || day < 1 || day > 28) {
        return "Choose a day of month from 1 to 28.";
      }
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setEmailError(validationError);
      toast({
        title: "Schedule not saved",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    const recipients = emailInput.trim()
      ? Array.from(new Set([...form.recipients, emailInput.trim().toLowerCase()]))
      : form.recipients;
    const dayOfWeek = form.schedule === "weekly" ? Number(form.dayOfWeek) : undefined;
    const dayOfMonth = form.schedule === "monthly" ? Number(form.dayOfMonth) : undefined;
    const saveMode = mode?.type || "create";

    setIsSaving(true);

    await runReportAction(
      () =>
        mode?.type === "edit"
          ? updateScheduledReport(mode.report.id, {
              name: form.name.trim(),
              recipients,
              schedule: form.schedule,
              dayOfWeek,
              dayOfMonth,
              scheduleTime: form.scheduleTime,
              filters: form.filters,
            })
          : createScheduledReport({
              templateId: form.templateId,
              name: form.name.trim(),
              recipients,
              schedule: form.schedule,
              dayOfWeek,
              dayOfMonth,
              scheduleTime: form.scheduleTime,
              filters: form.filters,
            }),
      {
        toast,
        successTitle: saveMode === "edit" ? "Schedule updated" : "Schedule created",
        successDescription: (report) => report.name,
        errorTitle: "Schedule not saved",
        errorDescription: "Could not save the scheduled report.",
        requireData: true,
        logLabel: "Error saving scheduled report:",
        onSuccess: (report) => onSaved(report, saveMode),
      }
    );

    setIsSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Schedule" : "Create Schedule"}</DialogTitle>
          <DialogDescription>Configure automated report delivery.</DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="schedule-template">Template</Label>
              <Select
                value={form.templateId}
                disabled={isEdit}
                onValueChange={(templateId) =>
                  setForm((current) => {
                    const template = templates.find((item) => item.id === templateId);
                    return {
                      ...current,
                      templateId,
                      name:
                        current.name.trim().length > 0
                          ? current.name
                          : template
                            ? `${template.name} schedule`
                            : current.name,
                    };
                  })
                }
              >
                <SelectTrigger id="schedule-template">
                  <SelectValue placeholder={selectedTemplateName} />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-name">Name</Label>
              <Input
                id="schedule-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Monthly performance summary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule-recipients">Recipients</Label>
            <Input
              id="schedule-recipients"
              value={emailInput}
              onChange={(event) => {
                setEmailInput(event.target.value);
                setEmailError(null);
              }}
              onKeyDown={handleEmailKeyDown}
              onBlur={() => addEmails(emailInput)}
              onPaste={(event) => {
                const pasted = event.clipboardData.getData("text");
                if (/[\s,;]/.test(pasted)) {
                  event.preventDefault();
                  addEmails(pasted);
                }
              }}
              placeholder="name@example.com"
              type="email"
            />
            {form.recipients.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {form.recipients.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1">
                    {email}
                    <button
                      type="button"
                      onClick={() => removeEmail(email)}
                      className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring"
                      aria-label={`Remove ${email}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {emailError && <p className="text-sm text-destructive">{emailError}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="schedule-cadence">Cadence</Label>
              <Select
                value={form.schedule}
                onValueChange={(schedule: ScheduleFrequency) =>
                  setForm((current) => ({ ...current, schedule }))
                }
              >
                <SelectTrigger id="schedule-cadence">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.schedule === "weekly" && (
              <div className="space-y-2">
                <Label htmlFor="schedule-weekday">Day</Label>
                <Select
                  value={form.dayOfWeek}
                  onValueChange={(dayOfWeek) => setForm((current) => ({ ...current, dayOfWeek }))}
                >
                  <SelectTrigger id="schedule-weekday">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {weekDays.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {form.schedule === "monthly" && (
              <div className="space-y-2">
                <Label htmlFor="schedule-month-day">Day of Month</Label>
                <Input
                  id="schedule-month-day"
                  type="number"
                  min={1}
                  max={28}
                  value={form.dayOfMonth}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, dayOfMonth: event.target.value }))
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="schedule-time">Time</Label>
              <Input
                id="schedule-time"
                type="time"
                value={form.scheduleTime}
                onChange={(event) =>
                  setForm((current) => ({ ...current, scheduleTime: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Filters</Label>
            <ReportFiltersPanel
              filters={form.filters as ReportFiltersType}
              onFiltersChange={(newFilters) =>
                setForm((current) => ({ ...current, filters: newFilters }))
              }
              teamMembers={teamMembers}
              branches={branches}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
