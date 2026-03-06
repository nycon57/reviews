"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Browsers,
  Star,
} from "@phosphor-icons/react";
import type { ChannelMetrics } from "@/lib/ai";
import { ChartSkeleton } from "@/components/shared/skeletons";

interface ChannelEffectivenessCardProps {
  data: ChannelMetrics[];
  isLoading?: boolean;
  periodLabel?: string;
}

// Friendly channel names
const channelLabels: Record<string, string> = {
  google: "Google",
  zillow: "Zillow",
  facebook: "Facebook",
  yelp: "Yelp",
  internal: "Internal",
  email: "Email",
  sms: "SMS",
  manual: "Manual",
  import: "Import",
  unknown: "Other",
};

function ChannelBar({ channel, maxCount }: { channel: ChannelMetrics; maxCount: number }) {
  const total =
    channel.sentimentDistribution.positive +
    channel.sentimentDistribution.neutral +
    channel.sentimentDistribution.negative;
  const positivePercent = total > 0 ? (channel.sentimentDistribution.positive / total) * 100 : 0;
  const neutralPercent = total > 0 ? (channel.sentimentDistribution.neutral / total) * 100 : 0;
  const negativePercent = total > 0 ? (channel.sentimentDistribution.negative / total) * 100 : 0;
  const widthPercent = maxCount > 0 ? (channel.reviewCount / maxCount) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {channelLabels[channel.channel] || channel.channel}
          </span>
          <span className="text-xs text-muted-foreground">
            {channel.reviewCount} review{channel.reviewCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Star className="h-3 w-3 text-amber-500" weight="fill" />
          <span className="text-sm font-medium tabular-nums">
            {channel.avgRating > 0 ? channel.avgRating : "N/A"}
          </span>
        </div>
      </div>

      {/* Stacked bar */}
      <div
        className="flex h-3 overflow-hidden rounded-full bg-muted"
        style={{ width: `${Math.max(widthPercent, 15)}%` }}
        role="img"
        aria-label={`${channelLabels[channel.channel] || channel.channel} sentiment: ${Math.round(positivePercent)}% positive, ${Math.round(neutralPercent)}% neutral, ${Math.round(negativePercent)}% negative`}
      >
        {positivePercent > 0 && (
          <div
            className="bg-green-500 transition-all"
            style={{ width: `${positivePercent}%` }}
            role="progressbar"
            aria-valuenow={Math.round(positivePercent)}
            aria-valuemax={100}
            aria-label={`Positive sentiment: ${Math.round(positivePercent)}%`}
          />
        )}
        {neutralPercent > 0 && (
          <div
            className="bg-blue-400 transition-all"
            style={{ width: `${neutralPercent}%` }}
            role="progressbar"
            aria-valuenow={Math.round(neutralPercent)}
            aria-valuemax={100}
            aria-label={`Neutral sentiment: ${Math.round(neutralPercent)}%`}
          />
        )}
        {negativePercent > 0 && (
          <div
            className="bg-red-400 transition-all"
            style={{ width: `${negativePercent}%` }}
            role="progressbar"
            aria-valuenow={Math.round(negativePercent)}
            aria-valuemax={100}
            aria-label={`Negative sentiment: ${Math.round(negativePercent)}%`}
          />
        )}
      </div>

      {/* Sentiment labels */}
      <div className="flex gap-3 text-xs text-muted-foreground">
        {channel.sentimentDistribution.positive > 0 && (
          <span className="flex items-center gap-0.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
            {channel.sentimentDistribution.positive} positive
          </span>
        )}
        {channel.sentimentDistribution.neutral > 0 && (
          <span className="flex items-center gap-0.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400" />
            {channel.sentimentDistribution.neutral} neutral
          </span>
        )}
        {channel.sentimentDistribution.negative > 0 && (
          <span className="flex items-center gap-0.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400" />
            {channel.sentimentDistribution.negative} negative
          </span>
        )}
      </div>
    </div>
  );
}

export function ChannelEffectivenessCard({ data, isLoading, periodLabel = "6 months" }: ChannelEffectivenessCardProps) {
  if (isLoading) return <ChartSkeleton />;

  if (data.length === 0) {
    return (
      <Card className="border border-border shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
              <Browsers className="h-5 w-5 text-repwell-teal-300" />
            </div>
            <div>
              <CardTitle className="text-lg">Channel Effectiveness</CardTitle>
              <CardDescription>No channel data available yet</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  const maxCount = Math.max(...data.map((c) => c.reviewCount));

  return (
    <Card className="border border-border shadow-soft">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
              <Browsers className="h-5 w-5 text-repwell-teal-300" />
            </div>
            <div>
              <CardTitle className="text-lg">Channel Effectiveness</CardTitle>
              <CardDescription>
                Review performance by source channel ({periodLabel})
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {data.length} channel{data.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((channel) => (
          <ChannelBar
            key={channel.channel}
            channel={channel}
            maxCount={maxCount}
          />
        ))}

        {/* Legend */}
        <div className="flex items-center gap-4 border-t pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            Positive
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
            Neutral
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
            Negative
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
