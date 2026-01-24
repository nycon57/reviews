"use client";

import * as React from "react";
import {
  CalendarBlank as CalendarIcon,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DateRangePreset, ReportDateRange } from "@/lib/reporting/types";
import { getDateRangeFromPreset } from "@/lib/reporting/utils";

interface DateRangeSelectorProps {
  value: ReportDateRange;
  onChange: (range: ReportDateRange) => void;
  className?: string;
}

const presetOptions: { value: DateRangePreset; label: string }[] = [
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "last_90_days", label: "Last 90 days" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "this_quarter", label: "This quarter" },
  { value: "last_quarter", label: "Last quarter" },
  { value: "this_year", label: "This year" },
  { value: "custom", label: "Custom range" },
];

export function DateRangeSelector({
  value,
  onChange,
  className,
}: DateRangeSelectorProps) {
  const [showCustom, setShowCustom] = React.useState(value.preset === "custom");

  const handlePresetChange = async (preset: DateRangePreset) => {
    if (preset === "custom") {
      setShowCustom(true);
      onChange({ ...value, preset: "custom" });
    } else {
      setShowCustom(false);
      const range = getDateRangeFromPreset(preset);
      onChange(range);
    }
  };

  const handleDateChange = (type: "start" | "end", date: Date | undefined) => {
    if (!date) return;

    if (type === "start") {
      onChange({ ...value, start: date, preset: "custom" });
    } else {
      onChange({ ...value, end: date, preset: "custom" });
    }
    setShowCustom(true);
  };

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", className)}>
      <Select
        value={value.preset || "custom"}
        onValueChange={(v) => handlePresetChange(v as DateRangePreset)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          {presetOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showCustom && (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[140px] justify-start text-left font-normal",
                  !value.start && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value.start ? format(value.start, "MMM d, yyyy") : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value.start}
                onSelect={(date) => handleDateChange("start", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground">to</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[140px] justify-start text-left font-normal",
                  !value.end && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value.end ? format(value.end, "MMM d, yyyy") : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value.end}
                onSelect={(date) => handleDateChange("end", date)}
                disabled={(date) => date < value.start}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {!showCustom && (
        <span className="text-sm text-muted-foreground">
          {format(value.start, "MMM d, yyyy")} - {format(value.end, "MMM d, yyyy")}
        </span>
      )}
    </div>
  );
}
