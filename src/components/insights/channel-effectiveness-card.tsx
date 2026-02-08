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

interface ChannelEffectivenessCardProps {
  data: ChannelMetrics[];
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
      <div className="flex h-3 overflow-hidden rounded-full bg-muted" style={{ width: `${Math.max(widthPercent, 15)}%` }}>
        {positivePercent > 0 && (
          <div
            className="bg-green-500 transition-all"
            style={{ width: `${positivePercent}%` }}
          />
        )}
        {neutralPercent > 0 && (
          <div
            className="bg-blue-400 transition-all"
            style={{ width: `${neutralPercent}%` }}
          />
        )}
        {negativePercent > 0 && (
          <div
            className="bg-red-400 transition-all"
            style={{ width: `${negativePercent}%` }}
          />
        )}
      </div>

      {/* Sentiment labels */}
      <div className="flex gap-3 text-[10px] text-muted-foreground">
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

export function ChannelEffectivenessCard({ data }: ChannelEffectivenessCardProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Browsers className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">
              Channel Effectiveness
            </CardTitle>
          </div>
          <CardDescription>No channel data available yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const maxCount = Math.max(...data.map((c) => c.reviewCount));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Browsers className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">
              Channel Effectiveness
            </CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            {data.length} channel{data.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <CardDescription>
          Review performance by source channel (6 months)
        </CardDescription>
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
