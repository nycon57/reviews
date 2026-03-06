"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Quotes } from "@phosphor-icons/react";
import type { KeyPhraseData } from "@/lib/ai";
import { cn } from "@/lib/utils";

interface KeyPhrasesCardProps {
  data: KeyPhraseData[];
}

const sentimentColors = {
  positive: "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400",
  neutral: "bg-muted text-foreground",
  negative: "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400",
};

export function KeyPhrasesCard({ data }: KeyPhrasesCardProps) {
  if (data.length === 0) {
    return (
      <Card className="border border-border shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
              <Quotes aria-hidden="true" className="h-5 w-5 text-repwell-teal-300" />
            </div>
            <div>
              <CardTitle className="text-lg">Key Phrases</CardTitle>
              <CardDescription>Most commonly mentioned phrases in reviews</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm font-medium text-heading">No key phrases extracted yet</p>
              <p className="mt-1 text-xs">Phrases are identified from review analysis</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group phrases by sentiment
  const positiveData = data.filter((p) => p.sentiment === "positive").slice(0, 8);
  const negativeData = data.filter((p) => p.sentiment === "negative").slice(0, 5);

  return (
    <Card className="border border-border shadow-soft">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
            <Quotes className="h-5 w-5 text-repwell-teal-300" />
          </div>
          <div>
            <CardTitle className="text-lg">Key Phrases</CardTitle>
            <CardDescription>Most commonly mentioned phrases in reviews</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Word cloud style display */}
        <div className="flex flex-wrap gap-2">
          {data.slice(0, 15).map((phrase) => (
            <Badge
              key={phrase.phrase}
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
              <h4 className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">
                Positive Mentions
              </h4>
              <ul className="space-y-1">
                {positiveData.map((phrase) => (
                  <li
                    key={phrase.phrase}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate text-muted-foreground">
                      &quot;{phrase.phrase}&quot;
                    </span>
                    <span className="ml-2 text-xs text-green-600 dark:text-green-400">
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
              <h4 className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-400">
                Areas of Concern
              </h4>
              <ul className="space-y-1">
                {negativeData.map((phrase) => (
                  <li
                    key={phrase.phrase}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate text-muted-foreground">
                      &quot;{phrase.phrase}&quot;
                    </span>
                    <span className="ml-2 text-xs text-red-600 dark:text-red-400">
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
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Trending This Month
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {data
                .filter((p) => p.recentOccurrences > 0)
                .slice(0, 8)
                .map((phrase) => (
                  <Badge
                    key={phrase.phrase}
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
