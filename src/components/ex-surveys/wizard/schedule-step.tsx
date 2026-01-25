"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarBlank, Lightning, Clock } from "@phosphor-icons/react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { StepProps } from "./types";

export function ScheduleStep({ formData, setFormData }: StepProps) {
  return (
    <div className="space-y-8">
      {/* Section header */}
      <div>
        <h2 className="font-display text-2xl font-bold text-repwell-teal-500">
          Schedule Survey
        </h2>
        <p className="mt-1 text-repwell-teal-400">
          Choose when to launch the survey and set an optional end date
        </p>
      </div>

      {/* Launch Now Toggle Card */}
      <div
        className={cn(
          "rounded-xl border bg-white p-6 shadow-sm transition-all",
          formData.launchImmediately
            ? "border-repwell-teal-300 ring-2 ring-repwell-teal-300/20"
            : "border-border"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                formData.launchImmediately
                  ? "bg-repwell-teal-300 text-white"
                  : "bg-repwell-sage-100/50 text-repwell-teal-400"
              )}
            >
              <Lightning weight="fill" className="h-5 w-5" />
            </div>
            <div>
              <Label
                htmlFor="launch-now"
                className="text-base font-semibold text-repwell-teal-500 cursor-pointer"
              >
                Launch Immediately
              </Label>
              <p className="mt-1 text-sm text-repwell-teal-400">
                Survey will be sent to recipients as soon as you create it
              </p>
            </div>
          </div>
          <Switch
            id="launch-now"
            checked={formData.launchImmediately}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({
                ...prev,
                launchImmediately: checked,
                // Clear start date if launching immediately
                startDate: checked ? undefined : prev.startDate,
              }))
            }
          />
        </div>
      </div>

      {/* Scheduled Start Card - Only show if not launching immediately */}
      {!formData.launchImmediately && (
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-sage-100/50 text-repwell-teal-400">
              <Clock weight="duotone" className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-sans text-lg font-semibold text-repwell-teal-500">
                Start Date
              </h3>
              <p className="mt-1 text-sm text-repwell-teal-400">
                When should the survey be sent to recipients?
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Schedule Start</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarBlank className="mr-2 h-4 w-4" />
                  {formData.startDate ? format(formData.startDate, "PPP") : "Pick a start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.startDate}
                  onSelect={(date) =>
                    setFormData((prev) => ({ ...prev, startDate: date }))
                  }
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {/* End Date Card */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-sage-100/50 text-repwell-teal-400">
            <CalendarBlank weight="duotone" className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-sans text-lg font-semibold text-repwell-teal-500">
              End Date
            </h3>
            <p className="mt-1 text-sm text-repwell-teal-400">
              Optionally set a deadline for survey responses
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Response Deadline (optional)</Label>
          <div className="flex gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !formData.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarBlank className="mr-2 h-4 w-4" />
                  {formData.endDate ? format(formData.endDate, "PPP") : "Pick an end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.endDate}
                  onSelect={(date) =>
                    setFormData((prev) => ({ ...prev, endDate: date }))
                  }
                  disabled={(date) => {
                    const minDate = formData.startDate || new Date();
                    return date < minDate;
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {formData.endDate && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFormData((prev) => ({ ...prev, endDate: undefined }))}
              >
                Clear
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Leave empty for no deadline. Survey will stay open until manually closed.
          </p>
        </div>
      </div>
    </div>
  );
}
