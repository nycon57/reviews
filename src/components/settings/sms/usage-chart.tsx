'use client';

import { useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBar,
  DownloadSimple,
} from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  Line,
  ComposedChart,
  Legend,
} from 'recharts';
import { fadeInUp } from '@/lib/motion/variants';
import type { DailyUsageStat } from '@/lib/sms/credits/types';

interface UsageChartProps {
  dailyStats: DailyUsageStat[];
  periodStart: string;
  periodEnd: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function UsageChart({ dailyStats, periodStart, periodEnd }: UsageChartProps) {
  const chartData = useMemo(() => {
    const result: Array<{
      date: string;
      rawDate: string;
      sent: number;
      delivered: number;
      failed: number;
      segments: number;
      cumulative: number;
      costCents: number;
    }> = [];
    dailyStats.reduce((acc, d) => {
      const cum = acc + d.segments;
      result.push({
        date: formatDate(d.date),
        rawDate: d.date,
        sent: d.sent,
        delivered: d.delivered,
        failed: d.failed,
        segments: d.segments,
        cumulative: cum,
        costCents: d.costCents,
      });
      return cum;
    }, 0);
    return result;
  }, [dailyStats]);

  const handleExportCsv = useCallback(() => {
    const headers = ['Date', 'Sent', 'Delivered', 'Failed', 'Segments', 'Cost'];
    const rows = dailyStats.map((d) => [
      d.date,
      d.sent,
      d.delivered,
      d.failed,
      d.segments,
      formatCents(d.costCents),
    ]);

    // Add totals row
    const totals = dailyStats.reduce(
      (acc, d) => ({
        sent: acc.sent + d.sent,
        delivered: acc.delivered + d.delivered,
        failed: acc.failed + d.failed,
        segments: acc.segments + d.segments,
        costCents: acc.costCents + d.costCents,
      }),
      { sent: 0, delivered: 0, failed: 0, segments: 0, costCents: 0 }
    );

    rows.push(['TOTAL', totals.sent, totals.delivered, totals.failed, totals.segments, formatCents(totals.costCents)] as unknown as string[]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sms-usage-${periodStart}-to-${periodEnd}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [dailyStats, periodStart, periodEnd]);

  if (chartData.length === 0) {
    return (
      <motion.div variants={fadeInUp}>
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="text-center py-12 space-y-3">
              <ChartBar weight="duotone" className="h-10 w-10 text-repwell-teal-300/40 mx-auto" />
              <p className="text-sm text-repwell-teal-300">No usage data for this period</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div variants={fadeInUp}>
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-repwell-teal-500 flex items-center gap-2">
              <ChartBar weight="duotone" className="h-5 w-5" />
              Usage History
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="text-xs border-repwell-teal-300/30 text-repwell-teal-400 hover:bg-repwell-sage-100/30"
            >
              <DownloadSimple weight="bold" className="h-3.5 w-3.5 mr-1.5" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cad2c5" opacity={0.4} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#52796f' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cad2c5', opacity: 0.4 }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#52796f' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#52796f' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #cad2c5',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                  labelStyle={{ fontWeight: 600, color: '#2f3e46' }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', color: '#354f52' }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="delivered"
                  name="Delivered"
                  fill="#84a98c"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={24}
                />
                <Bar
                  yAxisId="left"
                  dataKey="failed"
                  name="Failed"
                  fill="#ef4444"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={24}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulative"
                  name="Cumulative credits"
                  stroke="#52796f"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Monthly usage table
export function UsageTable({ dailyStats }: { dailyStats: DailyUsageStat[] }) {
  const [showAll, setShowAll] = useState(false);

  const totals = useMemo(
    () =>
      dailyStats.reduce(
        (acc, d) => ({
          sent: acc.sent + d.sent,
          delivered: acc.delivered + d.delivered,
          failed: acc.failed + d.failed,
          segments: acc.segments + d.segments,
          costCents: acc.costCents + d.costCents,
        }),
        { sent: 0, delivered: 0, failed: 0, segments: 0, costCents: 0 }
      ),
    [dailyStats]
  );

  const displayData = showAll ? dailyStats : dailyStats.slice(-10);

  if (dailyStats.length === 0) return null;

  return (
    <motion.div variants={fadeInUp}>
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-repwell-teal-500">Daily Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-repwell-teal-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-repwell-teal-300 uppercase tracking-wider">
                    Sent
                  </th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-repwell-teal-300 uppercase tracking-wider">
                    Delivered
                  </th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-repwell-teal-300 uppercase tracking-wider">
                    Failed
                  </th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-repwell-teal-300 uppercase tracking-wider">
                    Segments
                  </th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-repwell-teal-300 uppercase tracking-wider">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayData.map((d) => (
                  <tr key={d.date} className="border-b border-border/30 hover:bg-repwell-sage-100/20 transition-colors">
                    <td className="py-2 px-3 text-repwell-teal-500 font-medium tabular-nums">
                      {formatDate(d.date)}
                    </td>
                    <td className="py-2 px-3 text-right text-repwell-teal-400 tabular-nums">{d.sent}</td>
                    <td className="py-2 px-3 text-right text-repwell-sage-200 tabular-nums">{d.delivered}</td>
                    <td className="py-2 px-3 text-right text-red-500 tabular-nums">{d.failed}</td>
                    <td className="py-2 px-3 text-right text-repwell-teal-400 tabular-nums">{d.segments}</td>
                    <td className="py-2 px-3 text-right text-repwell-teal-400 tabular-nums">{formatCents(d.costCents)}</td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="bg-repwell-sage-100/20 font-semibold">
                  <td className="py-2.5 px-3 text-repwell-teal-500">Total</td>
                  <td className="py-2.5 px-3 text-right text-repwell-teal-500 tabular-nums">{totals.sent}</td>
                  <td className="py-2.5 px-3 text-right text-repwell-teal-500 tabular-nums">{totals.delivered}</td>
                  <td className="py-2.5 px-3 text-right text-repwell-teal-500 tabular-nums">{totals.failed}</td>
                  <td className="py-2.5 px-3 text-right text-repwell-teal-500 tabular-nums">{totals.segments}</td>
                  <td className="py-2.5 px-3 text-right text-repwell-teal-500 tabular-nums">{formatCents(totals.costCents)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          {dailyStats.length > 10 && (
            <div className="mt-3 text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-xs text-repwell-teal-300 hover:text-repwell-teal-400 font-medium transition-colors"
              >
                {showAll ? 'Show less' : `Show all ${dailyStats.length} days`}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
