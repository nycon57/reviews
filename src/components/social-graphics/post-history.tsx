"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getPostHistory, retryPost } from "@/lib/social-graphics/publish-actions";
import { PLATFORM_LABELS, type SocialPost, type SocialPlatform } from "@/lib/social-graphics/types";

interface PostHistoryProps {
  graphicId: string;
}

const STATUS_STYLES: Record<string, string> = {
  published: "bg-green-100 text-green-800",
  scheduled: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  failed: "bg-red-100 text-red-800",
};

export function PostHistory({ graphicId }: PostHistoryProps) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    const result = await getPostHistory({ graphicId });
    if (result.success) setPosts(result.data);
    setLoading(false);
  }, [graphicId]);

  /* eslint-disable react-hooks/set-state-in-effect -- initial data fetch on mount */
  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleRetry = async (postId: string) => {
    setRetrying(postId);
    const result = await retryPost(postId);
    if (result.success) {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? result.data : p))
      );
    }
    setRetrying(null);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border px-4 py-6 text-center text-sm text-muted-foreground">
        No posts yet. Export and publish to get started.
      </div>
    );
  }

  return (
    <div className="rounded-xl border">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">
          Post History ({posts.length})
        </h3>
      </div>
      <div className="divide-y">
        {posts.map((post) => (
          <div
            key={post.id}
            className="flex items-center gap-3 px-4 py-2.5"
          >
            <span className="w-20 rounded bg-muted px-1.5 py-0.5 text-center text-[10px] font-medium text-muted-foreground">
              {PLATFORM_LABELS[post.platform as SocialPlatform] ?? post.platform}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[post.status] ?? "bg-muted text-foreground"}`}
            >
              {post.status}
            </span>
            <span className="flex-1 truncate text-xs text-muted-foreground">
              {post.caption
                ? post.caption.slice(0, 60) + (post.caption.length > 60 ? "..." : "")
                : "No caption"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {post.published_at
                ? new Date(post.published_at).toLocaleDateString()
                : post.scheduled_for
                  ? `Scheduled: ${new Date(post.scheduled_for).toLocaleDateString()}`
                  : new Date(post.created_at).toLocaleDateString()}
            </span>
            {post.status === "failed" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => handleRetry(post.id)}
                disabled={retrying === post.id}
              >
                {retrying === post.id ? "..." : "Retry"}
              </Button>
            )}
            {post.status === "published" && post.platform_post_url && (
              <a
                href={post.platform_post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                View
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
