"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TemplateLibrary } from "./template-library";
import { setSchedule } from "@/lib/social-graphics/schedule-actions";
import {
  CANVAS_PRESETS,
  type CanvasSize,
  type TemplateId,
} from "@/lib/social-graphics/types";

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduled?: () => void;
}

const SCHEDULE_OPTIONS = [
  { label: "Every Monday at 9 AM", value: "0 9 * * 1" },
  { label: "Every Wednesday at 9 AM", value: "0 9 * * 3" },
  { label: "Every Friday at 9 AM", value: "0 9 * * 5" },
  { label: "Every Sunday at 10 AM", value: "0 10 * * 0" },
] as const;

export function ScheduleDialog({
  open,
  onOpenChange,
  onScheduled,
}: ScheduleDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<TemplateId | null>(null);
  const [canvasPresetIndex, setCanvasPresetIndex] = useState<number>(0);
  const [cronExpression, setCronExpression] = useState<string>(
    SCHEDULE_OPTIONS[0].value
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canvasSize: CanvasSize = CANVAS_PRESETS[canvasPresetIndex];

  const handleSave = () => {
    if (!selectedTemplateId) return;
    setError(null);

    startTransition(async () => {
      const result = await setSchedule({
        templateId: selectedTemplateId,
        canvasSize,
        cronExpression,
      });

      if (result.success) {
        onOpenChange(false);
        onScheduled?.();
        setSelectedTemplateId(null);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review of the Week</DialogTitle>
          <DialogDescription>
            Automatically generate a graphic from the top review each week
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Schedule */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Schedule
            </label>
            <Select value={cronExpression} onValueChange={setCronExpression}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCHEDULE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The system will pick the highest-rated review not previously
              featured
            </p>
          </div>

          {/* Canvas size */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Canvas Size
            </label>
            <Select
              value={String(canvasPresetIndex)}
              onValueChange={(v) => setCanvasPresetIndex(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CANVAS_PRESETS.map((preset, i) => (
                  <SelectItem key={preset.name} value={String(i)}>
                    {preset.name} ({preset.width}x{preset.height})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template */}
          <TemplateLibrary
            onSelectTemplate={setSelectedTemplateId}
            selectedTemplateId={selectedTemplateId}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || !selectedTemplateId}
          >
            {isPending ? "Saving..." : "Save Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
