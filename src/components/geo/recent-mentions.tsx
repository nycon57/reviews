"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Chats as MessageSquare,
  ArrowSquareOut as ExternalLink,
  ThumbsUp,
  Minus,
  ThumbsDown,
  Clock,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { AISearchMention } from "@/lib/geo/types";
import { AI_PLATFORM_INFO } from "@/lib/geo/types";

interface RecentMentionsProps {
  mentions: AISearchMention[];
  isLoading?: boolean;
  onViewAll?: () => void;
}

export function RecentMentions({ mentions, isLoading, onViewAll }: RecentMentionsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">Recent AI Mentions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!mentions || mentions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">Recent AI Mentions</CardTitle>
          </div>
          <CardDescription>Track when AI search engines mention your business</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No mentions detected yet</p>
              <p className="text-xs">Mentions are tracked automatically</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <ThumbsUp className="h-3 w-3 text-green-500" />;
      case 'negative':
        return <ThumbsDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const getSentimentClass = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-700 bg-green-50';
      case 'negative':
        return 'text-red-700 bg-red-50';
      default:
        return 'text-gray-700 bg-gray-50';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">Recent AI Mentions</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            {mentions.length} mentions
          </Badge>
        </div>
        <CardDescription>Track when AI search engines mention your business</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {mentions.slice(0, 5).map((mention) => {
            const platformInfo = AI_PLATFORM_INFO[mention.platform];

            return (
              <div
                key={mention.id}
                className="rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    {/* Platform and time */}
                    <div className="flex items-center gap-2">
                      <div className={cn("h-3 w-3 rounded-full", platformInfo.color)} />
                      <span className="text-sm font-medium">{platformInfo.name}</span>
                      <span className="text-xs text-muted-foreground flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {formatTimeAgo(mention.detectedAt)}
                      </span>
                    </div>

                    {/* Query */}
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Query:</span>{' '}
                      &ldquo;{mention.query}&rdquo;
                    </p>

                    {/* Context */}
                    <p className="text-xs text-muted-foreground">{mention.context}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px]", getSentimentClass(mention.sentiment))}
                      >
                        {getSentimentIcon(mention.sentiment)}
                        <span className="ml-1 capitalize">{mention.sentiment}</span>
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {mention.mentionType}
                      </Badge>
                    </div>
                  </div>

                  {mention.sourceUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="flex-shrink-0"
                    >
                      <a
                        href={mention.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {mentions.length > 5 && onViewAll && (
          <Button variant="outline" className="w-full" onClick={onViewAll}>
            View All Mentions
          </Button>
        )}

        {/* Info */}
        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <p>
            Mentions are detected through monitoring queries related to your business.
            Improve your visibility score to increase mention frequency.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
