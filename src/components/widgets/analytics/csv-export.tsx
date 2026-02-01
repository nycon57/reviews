"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getWidgetAnalyticsCsvData } from "@/lib/widgets/analytics-actions";

interface CsvExportProps {
  dateRange: string;
  customStart?: string;
  customEnd?: string;
}

export function CsvExport({ dateRange, customStart, customEnd }: CsvExportProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleExport = () => {
    startTransition(async () => {
      const result = await getWidgetAnalyticsCsvData(
        dateRange,
        customStart,
        customEnd
      );

      if (!result.success) {
        toast({
          title: "Export failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `widget-analytics-${dateRange}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export complete",
        description: "CSV file downloaded.",
      });
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isPending}
      className="gap-2"
    >
      <Download size={14} />
      {isPending ? "Exporting..." : "Export CSV"}
    </Button>
  );
}
