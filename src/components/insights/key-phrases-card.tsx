"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { KeyPhraseData } from "@/lib/ai";
import { cn } from "@/lib/utils";

interface KeyPhrasesCardProps {
  data: KeyPhraseData[];
}

const sentimentColors = {
  positive: "bg-green-100 text-green-800",
  neutral: "bg-gray-100 text-gray-800",
  negative: "bg-red-100 text-red-800",
};

export function KeyPhrasesCard({ data }: KeyPhrasesCardProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Key Phrases</CardTitle>
          <CardDescription>Most commonly mentioned phrases in reviews</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No key phrases extracted yet</p>
              <p className="text-xs">Phrases are identified from review analysis</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group phrases by sentiment
  const positiveData = data.filter((p) => p.sentiment === "positive").slice(0, 8);
  const negativeData = data.filter((p) => p.sentiment === "negative").slice(0, 5);
  // Note: neutralData available for future use if needed
  const _neutralData = data.filter((p) => p.sentiment === "neutral").slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Key Phrases</CardTitle>
        <CardDescription>Most commonly mentioned phrases in reviews</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Word cloud style display */}
        <div className="flex flex-wrap gap-2">
          {data.slice(0, 15).map((phrase, i) => (
            <Badge
              key={i}
              variant="secondary"
              className={cn(
                "cursor-default transition-colors",
                sentimentColors[phrase.sentiment]
              )}
            >
              &quot;{phrase.phrase}&quot;
              <span className="ml-1 opacity-60">×{phrase.count}</span>
            </Badge>
          ))}
        </div>

        {/* Sentiment-grouped list */}
        <div className="grid gap-4 pt-2 md:grid-cols-2">
          {/* Positive phrases */}
          {positiveData.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-green-700">
                Positive Mentions
              </h4>
              <ul className="space-y-1">
                {positiveData.map((phrase, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate text-muted-foreground">
                      &quot;{phrase.phrase}&quot;
                    </span>
                    <span className="ml-2 text-xs text-green-600">
                      {phrase.count}×
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Negative phrases */}
          {negativeData.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-red-700">
                Areas of Concern
              </h4>
              <ul className="space-y-1">
                {negativeData.map((phrase, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate text-muted-foreground">
                      &quot;{phrase.phrase}&quot;
                    </span>
                    <span className="ml-2 text-xs text-red-600">
                      {phrase.count}×
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Recent activity indicator */}
        {data.some((p) => p.recentOccurrences > 0) && (
          <div className="border-t pt-3">
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
              Trending This Month
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {data
                .filter((p) => p.recentOccurrences > 0)
                .slice(0, 8)
                .map((phrase, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-xs"
                  >
                    {phrase.phrase}
                    <span className="ml-1 text-primary">↑{phrase.recentOccurrences}</span>
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
