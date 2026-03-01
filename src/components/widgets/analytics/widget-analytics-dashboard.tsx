"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";

import { AnalyticsSummary } from "./analytics-summary";
import { ImpressionsChart } from "./impressions-chart";
import { WidgetAnalyticsTable } from "./widget-analytics-table";
import { WidgetDetailAnalyticsPanel } from "./widget-detail-analytics";
import { CsvExport } from "./csv-export";

import {
  getWidgetAnalyticsSummary,
  getWidgetDailyMetrics,
  getWidgetTableData,
} from "@/lib/widgets/analytics-actions";
import type {
  WidgetAnalyticsSummary as SummaryData,
  DailyMetric,
  WidgetTableRow,
} from "@/lib/widgets/analytics-actions";

type DateRange = "7d" | "30d" | "90d" | "custom";

interface DateSelection {
  from: Date | undefined;
  to: Date | undefined;
}

export function WidgetAnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [customDate, setCustomDate] = useState<DateSelection>({
    from: undefined,
    to: undefined,
  });
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [daily, setDaily] = useState<DailyMetric[]>([]);
  const [tableData, setTableData] = useState<WidgetTableRow[]>([]);
  const [isLoading, startTransition] = useTransition();
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);

  const customStart =
    dateRange === "custom" && customDate.from
      ? format(customDate.from, "yyyy-MM-dd")
      : undefined;
  const customEnd =
    dateRange === "custom" && customDate.to
      ? format(customDate.to, "yyyy-MM-dd")
      : undefined;

  const loadData = useCallback(() => {
    startTransition(async () => {
      const [summaryRes, dailyRes, tableRes] = await Promise.all([
        getWidgetAnalyticsSummary(dateRange, customStart, customEnd),
        getWidgetDailyMetrics(dateRange, customStart, customEnd),
        getWidgetTableData(dateRange, customStart, customEnd),
      ]);

      if (summaryRes.success) setSummary(summaryRes.data);
      if (dailyRes.success) setDaily(dailyRes.data.data);
      if (tableRes.success) setTableData(tableRes.data.data);
    });
  }, [dateRange, customStart, customEnd]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDateRangeChange = (value: string) => {
    setDateRange(value as DateRange);
    setSelectedWidget(null);
  };

  const handleCustomDateSelect = (range: DateSelection | undefined) => {
    if (range) {
      setCustomDate(range);
      if (range.from && range.to) {
        setCalendarOpen(false);
      }
    }
  };

  const handleSelectWidget = (widgetId: string) => {
    setSelectedWidget(widgetId);
  };

  const selectedWidgetName = tableData.find(
    (w) => w.widgetId === selectedWidget
  )?.name;

  // Empty state: no widgets at all
  const hasNoWidgets = !isLoading && tableData.length === 0 && summary?.totalImpressions === 0;

  if (selectedWidget) {
    return (
      <WidgetDetailAnalyticsPanel
        widgetId={selectedWidget}
        widgetName={selectedWidgetName}
        dateRange={dateRange}
        customStart={customStart}
        customEnd={customEnd}
        onBack={() => setSelectedWidget(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-repwell-teal-500">
            Widget Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Track impressions, clicks, and conversions across your embedded
            widgets
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CsvExport
            dateRange={dateRange}
            customStart={customStart}
            customEnd={customEnd}
          />
          <Select value={dateRange} onValueChange={handleDateRangeChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>

          {dateRange === "custom" && (
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs"
                >
                  <CalendarDays size={14} />
                  {customDate.from && customDate.to
                    ? `${format(customDate.from, "MMM d")} – ${format(customDate.to, "MMM d")}`
                    : "Pick dates"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={customDate.from && customDate.to ? { from: customDate.from, to: customDate.to } : undefined}
                  onSelect={handleCustomDateSelect as (range: { from: Date | undefined; to?: Date | undefined } | undefined) => void}
                  numberOfMonths={2}
                  disabled={{ after: new Date() }}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Empty state */}
      {hasNoWidgets ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-repwell-sage-100/50 flex items-center justify-center text-repwell-teal-300 mb-4">
            <CalendarDays size={28} />
          </div>
          <h2 className="text-lg font-semibold text-repwell-teal-500 mb-2">
            No analytics data yet
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Embed a widget on your website to start tracking
            impressions, clicks, and conversions.
          </p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <AnalyticsSummary data={summary} isLoading={isLoading} />

          {/* Impressions & clicks chart */}
          <ImpressionsChart data={daily} isLoading={isLoading} />

          {/* Per-widget table */}
          <WidgetAnalyticsTable
            data={tableData}
            isLoading={isLoading}
            onSelectWidget={handleSelectWidget}
          />

        </>
      )}
    </div>
  );
}
