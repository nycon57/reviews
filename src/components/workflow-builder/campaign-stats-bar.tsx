"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  Pulse,
  SignOut,
  Users,
  Pause,
} from "@phosphor-icons/react";
import type { CampaignExecutionStats } from "@/lib/campaigns/queries";

interface CampaignStatsBarProps {
  campaignId: string;
  status: string;
  fetchStats: (campaignId: string) => Promise<CampaignExecutionStats>;
}

const REFRESH_INTERVAL_MS = 30_000;

export function CampaignStatsBar({ campaignId, status, fetchStats }: CampaignStatsBarProps) {
  const [stats, setStats] = useState<CampaignExecutionStats | null>(null);

  useEffect(() => {
    if (status !== "active" && status !== "completed") return;

    let mounted = true;

    const load = async () => {
      try {
        const data = await fetchStats(campaignId);
        if (mounted) setStats(data);
      } catch {
        // silently fail — stats are non-critical
      }
    };

    void load();

    const interval = setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [campaignId, status, fetchStats]);

  if (!stats || stats.total === 0) return null;

  const completionRate = Math.round((stats.completed / stats.total) * 100);

  return (
    <div className="flex items-center gap-4 rounded-lg border bg-muted/30 px-4 py-2.5 text-sm">
      <StatChip icon={<Users className="h-4 w-4 text-muted-foreground" />} label="Enrolled" value={stats.total} />
      <StatChip icon={<Pulse className="h-4 w-4 text-emerald-500" />} label="Active" value={stats.active} />
      <StatChip icon={<CheckCircle className="h-4 w-4 text-sky-500" />} label="Completed" value={stats.completed} />
      <StatChip icon={<SignOut className="h-4 w-4 text-rose-500" />} label="Exited" value={stats.exited} />
      <StatChip icon={<Pause className="h-4 w-4 text-amber-500" />} label="Paused" value={stats.paused} />

      <div className="ml-auto flex items-center gap-2 text-muted-foreground">
        <span className="text-xs">Completion</span>
        <div className="h-1.5 w-20 rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <span className="min-w-[2.5rem] text-right text-xs font-medium tabular-nums">
          {completionRate}%
        </span>
      </div>
    </div>
  );
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
