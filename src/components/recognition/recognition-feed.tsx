"use client";

import { useState, useEffect, useCallback, useRef, startTransition } from "react";
import { RecognitionCard } from "./recognition-card";
import { GiveRecognitionDialog } from "./give-recognition-dialog";
import { Recognition } from "@/types/recognition.types";
import { getRecognitions } from "@/lib/recognition/actions";
import {
  SpinnerGap as Loader2,
  Tray as Inbox,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface RecognitionFeedProps {
  initialRecognitions?: Recognition[];
  showGiveButton?: boolean;
  userId?: string;
  limit?: number;
}

export function RecognitionFeed({
  initialRecognitions,
  showGiveButton = true,
  userId,
  limit = 20,
}: RecognitionFeedProps) {
  const [recognitions, setRecognitions] = useState<Recognition[]>(
    initialRecognitions || []
  );
  const [isLoading, setIsLoading] = useState(!initialRecognitions);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const hasMountedRef = useRef(false);

  const loadRecognitions = useCallback(
    async (pageNum: number, append = false) => {
      setIsLoading(true);
      const result = await getRecognitions({
        offset: (pageNum - 1) * limit,
        limit,
        userId,
      });

      if (result.success && result.data) {
        const recognitionsData = result.data;
        startTransition(() => {
          if (append) {
            setRecognitions((prev) => [...prev, ...recognitionsData]);
          } else {
            setRecognitions(recognitionsData);
          }
          setHasMore(recognitionsData.length === limit);
        });
      }
      setIsLoading(false);
    },
    [limit, userId]
  );

  useEffect(() => {
    if (!hasMountedRef.current && !initialRecognitions) {
      hasMountedRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial data fetch on mount
      loadRecognitions(1);
    }
  }, [initialRecognitions, loadRecognitions]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadRecognitions(nextPage, true);
  };

  const handleRefresh = () => {
    setPage(1);
    loadRecognitions(1);
  };

  const handleDelete = (id: string) => {
    setRecognitions((prev) => prev.filter((r) => r.id !== id));
  };

  if (isLoading && recognitions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showGiveButton && (
        <div className="flex justify-end">
          <GiveRecognitionDialog onSuccess={handleRefresh} />
        </div>
      )}

      {recognitions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No recognitions yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Be the first to recognize a colleague&apos;s great work!
          </p>
          {showGiveButton && (
            <GiveRecognitionDialog
              trigger={
                <Button className="mt-4">Give Your First Recognition</Button>
              }
              onSuccess={handleRefresh}
            />
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {recognitions.map((recognition) => (
              <RecognitionCard
                key={recognition.id}
                recognition={recognition}
                onDelete={() => handleDelete(recognition.id)}
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
