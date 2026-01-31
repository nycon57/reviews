'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  PaperPlaneTilt,
  CheckCircle,
  CursorClick,
  TrendUp,
  ArrowsLeftRight,
  X,
} from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { fadeInUp } from '@/lib/motion/variants';
import {
  getTemplatePerformance,
  getTemplateTrend,
  type TemplatePerformanceMetrics,
  type DailyTrend,
} from '@/lib/sms/templates/performance-actions';
import type { SmsTemplate } from '@/lib/sms/types';
import { cn } from '@/lib/utils';

// ── Sparkline SVG ─────────────────────────────────────────────────────

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const width = 120;
  const height = 32;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - (v / max) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className={className} aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Metric Card ───────────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle?: string;
  trend?: number[];
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-background-subtle p-1.5">
            <Icon weight="duotone" className="h-4 w-4 text-repwell-teal-300" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </div>
        {trend && <Sparkline data={trend} className="text-repwell-teal-300" />}
      </div>
      <div>
        <p className="text-xl font-semibold text-repwell-teal-500 tabular-nums">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// ── Performance Panel ─────────────────────────────────────────────────

interface TemplatePerformancePanelProps {
  template: SmsTemplate;
  templates: SmsTemplate[];
  onClose: () => void;
}

export function TemplatePerformancePanel({
  template,
  templates,
  onClose,
}: TemplatePerformancePanelProps) {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<TemplatePerformanceMetrics | null>(null);
  const [trend, setTrend] = useState<DailyTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // A/B comparison state
  const [compareId, setCompareId] = useState<string | null>(null);
  const [compareMetrics, setCompareMetrics] = useState<TemplatePerformanceMetrics | null>(null);

  const loadMetrics = useCallback(async () => {
    setIsLoading(true);
    const [perfResult, trendResult] = await Promise.all([
      getTemplatePerformance(template.id),
      getTemplateTrend(template.id),
    ]);

    if (perfResult.success && perfResult.data) setMetrics(perfResult.data);
    if (trendResult.success && trendResult.data) setTrend(trendResult.data);

    if (!perfResult.success) {
      toast({ title: 'Error', description: perfResult.error, variant: 'destructive' });
    }
    setIsLoading(false);
  }, [template.id, toast]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  // Load comparison metrics
  const loadComparison = useCallback(async (id: string) => {
    const result = await getTemplatePerformance(id);
    if (result.success && result.data) setCompareMetrics(result.data);
  }, []);

  useEffect(() => {
    if (!compareId) {
      setCompareMetrics(null);
      return;
    }
    loadComparison(compareId);
  }, [compareId, loadComparison]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const trendSends = useMemo(() => trend.map((d) => d.sends), [trend]);

  const comparableTemplates = useMemo(
    () => templates.filter((t) => t.id !== template.id && t.status === 'active'),
    [templates, template.id]
  );

  const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;
  const fmtNum = (v: number) => v.toLocaleString();

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-6 w-48 bg-muted rounded mb-4" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="show">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base font-semibold text-repwell-teal-500">
            Performance: {template.name}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Metrics grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={PaperPlaneTilt}
              label="Total Sends"
              value={fmtNum(metrics.total_sends)}
              trend={trendSends}
            />
            <MetricCard
              icon={CheckCircle}
              label="Delivery Rate"
              value={fmtPct(metrics.delivery_rate)}
              subtitle={`${fmtNum(metrics.delivered_count)} delivered`}
            />
            <MetricCard
              icon={CursorClick}
              label="Click Rate"
              value={fmtPct(metrics.click_rate)}
              subtitle={`${fmtNum(metrics.click_count)} clicks`}
            />
            <MetricCard
              icon={TrendUp}
              label="Conversion Rate"
              value={fmtPct(metrics.conversion_rate)}
              subtitle={`${fmtNum(metrics.conversion_count)} conversions`}
            />
          </div>

          {/* A/B Comparison */}
          {comparableTemplates.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <ArrowsLeftRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-repwell-teal-400">
                  Compare with:
                </span>
                <Select
                  value={compareId ?? ''}
                  onValueChange={(v) => setCompareId(v || null)}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {comparableTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {compareId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCompareId(null)}
                  >
                    Clear
                  </Button>
                )}
              </div>

              {compareMetrics && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Sends', a: metrics.total_sends, b: compareMetrics.total_sends, fmt: fmtNum },
                    { label: 'Delivery', a: metrics.delivery_rate, b: compareMetrics.delivery_rate, fmt: fmtPct },
                    { label: 'Clicks', a: metrics.click_rate, b: compareMetrics.click_rate, fmt: fmtPct },
                    { label: 'Conversion', a: metrics.conversion_rate, b: compareMetrics.conversion_rate, fmt: fmtPct },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="rounded-xl border border-border bg-white p-3 text-center space-y-1"
                    >
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                      <div className="flex items-center justify-center gap-3">
                        <span className={cn(
                          'text-sm font-semibold tabular-nums',
                          m.a >= m.b ? 'text-repwell-teal-300' : 'text-muted-foreground'
                        )}>
                          {m.fmt(m.a)}
                        </span>
                        <span className="text-xs text-muted-foreground">vs</span>
                        <span className={cn(
                          'text-sm font-semibold tabular-nums',
                          m.b >= m.a ? 'text-repwell-teal-300' : 'text-muted-foreground'
                        )}>
                          {m.fmt(m.b)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
