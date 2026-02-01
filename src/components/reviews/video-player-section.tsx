"use client";

import { SpinnerGap as Loader2 } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";

interface VideoPlayerSectionProps {
  signedUrl: string | null;
  isLoadingUrl: boolean;
  thumbnailUrl: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export function VideoPlayerSection({
  signedUrl,
  isLoadingUrl,
  thumbnailUrl,
  videoRef,
}: VideoPlayerSectionProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
          {isLoadingUrl ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-white/50" />
            </div>
          ) : signedUrl ? (
            <video
              ref={videoRef}
              src={signedUrl}
              controls
              className="h-full w-full"
              poster={thumbnailUrl || undefined}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="flex h-full items-center justify-center text-white/50">
              Video unavailable
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
