"use client";

import { useState, useEffect, useCallback, useRef, startTransition } from "react";
import { ManagerFeedbackCard } from "./manager-feedback-card";
import { GiveFeedbackDialog } from "./give-feedback-dialog";
import { ManagerFeedback, FeedbackType } from "@/types/recognition.types";
import { getManagerFeedback } from "@/lib/recognition/actions";
import {
  SpinnerGap as Loader2,
  Tray as Inbox,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ManagerFeedbackListProps {
  initialFeedback?: ManagerFeedback[];
  showGiveButton?: boolean;
  userId?: string;
  limit?: number;
  currentUserId?: string;
}

export function ManagerFeedbackList({
  initialFeedback,
  showGiveButton = true,
  userId,
  limit = 20,
  currentUserId,
}: ManagerFeedbackListProps) {
  const [feedback, setFeedback] = useState<ManagerFeedback[]>(
    initialFeedback || []
  );
  const [isLoading, setIsLoading] = useState(!initialFeedback);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<FeedbackType | "all">("all");
  const hasMountedRef = useRef(false);
  const lastTypeRef = useRef<FeedbackType | "all">(typeFilter);

  const loadFeedback = useCallback(
    async (pageNum: number, append = false, type?: FeedbackType | "all") => {
      setIsLoading(true);
      const result = await getManagerFeedback({
        page: pageNum,
        limit,
        userId,
        type: type === "all" ? undefined : type,
      });

      if (result.success && result.data) {
        const feedbackData = result.data;
        startTransition(() => {
          if (append) {
            setFeedback((prev) => [...prev, ...feedbackData]);
          } else {
            setFeedback(feedbackData);
          }
          setHasMore(feedbackData.length === limit);
        });
      }
      setIsLoading(false);
    },
    [limit, userId]
  );

  useEffect(() => {
    // Only load if we haven't mounted yet and no initial data, or if typeFilter changed
    if (!hasMountedRef.current && !initialFeedback) {
      hasMountedRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial data fetch on mount
      loadFeedback(1, false, typeFilter);
    } else if (lastTypeRef.current !== typeFilter) {
      lastTypeRef.current = typeFilter;
      loadFeedback(1, false, typeFilter);
    }
  }, [initialFeedback, loadFeedback, typeFilter]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadFeedback(nextPage, true, typeFilter);
  };

  const handleRefresh = () => {
    setPage(1);
    loadFeedback(1, false, typeFilter);
  };

  const handleDelete = (id: string) => {
    setFeedback((prev) => prev.filter((f) => f.id !== id));
  };

  const handleTypeChange = (value: string) => {
    const newType = value as FeedbackType | "all";
    setTypeFilter(newType);
    setPage(1);
    loadFeedback(1, false, newType);
  };

  if (isLoading && feedback.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={typeFilter} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="praise">Praise</SelectItem>
            <SelectItem value="constructive">Constructive</SelectItem>
            <SelectItem value="goal_progress">Goal Progress</SelectItem>
            <SelectItem value="check_in">Check-in</SelectItem>
            <SelectItem value="performance">Performance</SelectItem>
          </SelectContent>
        </Select>
        {showGiveButton && <GiveFeedbackDialog onSuccess={handleRefresh} />}
      </div>

      {feedback.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No feedback yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Start providing continuous feedback to help your team grow.
          </p>
          {showGiveButton && (
            <GiveFeedbackDialog
              trigger={
                <Button className="mt-4">Give Your First Feedback</Button>
              }
              onSuccess={handleRefresh}
            />
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {feedback.map((item) => (
              <ManagerFeedbackCard
                key={item.id}
                feedback={item}
                currentUserId={currentUserId}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
