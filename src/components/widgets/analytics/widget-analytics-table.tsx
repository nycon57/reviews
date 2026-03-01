"use client";

import { memo, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Building2,
  Columns3,
  Star,
  Video,
  LayoutGrid,
  TrendingUp,
  Megaphone,
  ArrowUpDown,
  Badge as BadgeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WidgetTableRow } from "@/lib/widgets/analytics-actions";
import { WIDGET_TYPE_LABELS } from "@/lib/widgets/constants";

const TYPE_ICONS: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  lo_review: User,
  branch_review: Building2,
  company_review: Building2,
  review_carousel: Columns3,
  star_rating_badge: Star,
  video_testimonial: Video,
  review_wall: LayoutGrid,
  nps_score_badge: TrendingUp,
  social_proof_banner: Megaphone,
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  active: "default",
  draft: "secondary",
  inactive: "outline",
};

type SortKey =
  | "name"
  | "widgetType"
  | "impressions"
  | "clicks"
  | "ctr"
  | "status";
type SortDir = "asc" | "desc";

function SortButton({
  field,
  children,
  onSort,
}: {
  field: SortKey;
  children: React.ReactNode;
  onSort: (key: SortKey) => void;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onSort(field)}
      className="h-auto p-0 font-medium text-xs hover:bg-transparent gap-1"
    >
      {children}
      <ArrowUpDown size={12} className="text-muted-foreground" />
    </Button>
  );
}

interface WidgetAnalyticsTableProps {
  data: WidgetTableRow[];
  isLoading: boolean;
  onSelectWidget: (widgetId: string) => void;
}

export const WidgetAnalyticsTable = memo(function WidgetAnalyticsTable({
  data,
  isLoading,
  onSelectWidget,
}: WidgetAnalyticsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("impressions");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = useMemo(() => {
    const copy = [...data];
    copy.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      const aNum = typeof aVal === "number" ? aVal : 0;
      const bNum = typeof bVal === "number" ? bVal : 0;
      return sortDir === "asc" ? aNum - bNum : bNum - aNum;
    });
    return copy;
  }, [data, sortKey, sortDir]);

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Per-Widget Breakdown</CardTitle>
          <CardDescription>
            Performance metrics for each widget
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <p className="text-sm">No widgets found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg">Per-Widget Breakdown</CardTitle>
        <CardDescription>
          Click a row to view detailed analytics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton onSort={toggleSort} field="name">Widget</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton onSort={toggleSort} field="widgetType">Type</SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <SortButton onSort={toggleSort} field="impressions">Impressions</SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <SortButton onSort={toggleSort} field="clicks">Clicks</SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <SortButton onSort={toggleSort} field="ctr">CTR</SortButton>
                </TableHead>
                <TableHead>Top Referrer</TableHead>
                <TableHead>
                  <SortButton onSort={toggleSort} field="status">Status</SortButton>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((row) => {
                const Icon =
                  TYPE_ICONS[row.widgetType] ?? BadgeIcon;
                const typeLabel =
                  WIDGET_TYPE_LABELS[row.widgetType as keyof typeof WIDGET_TYPE_LABELS] ?? row.widgetType;
                return (
                  <TableRow
                    key={row.widgetId}
                    className="cursor-pointer hover:bg-repwell-sage-100/20 transition-colors"
                    onClick={() => onSelectWidget(row.widgetId)}
                  >
                    <TableCell className="font-medium text-repwell-teal-500">
                      {row.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Icon size={14} />
                        <span className="text-xs">{typeLabel}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.impressions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.clicks.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.ctr.toFixed(2)}%
                    </TableCell>
                    <TableCell
                      className="max-w-[200px] truncate text-xs text-muted-foreground"
                      title={row.topReferrer ?? undefined}
                    >
                      {row.topReferrer ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          STATUS_VARIANTS[row.status] ?? "secondary"
                        }
                        className="text-[10px] capitalize"
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
});
