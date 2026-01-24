"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Play,
  Pause,
  SpeakerHigh as Volume2,
  SpeakerSlash as VolumeX,
  ArrowsOut as Maximize,
  ArrowSquareOut as ExternalLink,
  BuildingOffice as Building2,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useVideoPlayer } from "@/hooks/use-video-player";
import { formatDuration } from "@/lib/video-testimonials/types";

interface EmbedVideoPlayerProps {
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  customerName: string;
  organizationName: string;
  organizationLogoUrl: string | null;
  pageUrl: string;
}

export function EmbedVideoPlayer({
  videoUrl,
  thumbnailUrl,
  durationSeconds,
  customerName,
  organizationName,
  organizationLogoUrl,
  pageUrl,
}: EmbedVideoPlayerProps) {
  const [showControls, setShowControls] = useState(true);

  const {
    videoRef,
    isPlaying,
    isMuted,
    currentTime,
    progress,
    togglePlay,
    toggleMute,
    enterFullscreen,
    handleTimeUpdate,
    handleSeek,
    handleSliderKeyDown,
    setIsPlaying,
  } = useVideoPlayer({ durationSeconds });

  const controlsVisible = showControls || !isPlaying;

  return (
    <div
      className="relative w-full h-screen bg-black overflow-hidden"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl || undefined}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        playsInline
      />

      {/* Play Overlay */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer transition-colors hover:bg-black/50"
          aria-label="Play video"
        >
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white transition-transform hover:scale-105">
            <Play className="w-8 h-8 text-gray-900 ml-1" />
          </div>
        </button>
      )}

      {/* Top Bar - Organization Info */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/70 to-transparent transition-opacity duration-300",
          controlsVisible ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="flex items-center gap-2">
          {organizationLogoUrl ? (
            <Image
              src={organizationLogoUrl}
              alt={organizationName}
              width={24}
              height={24}
              className="rounded"
            />
          ) : (
            <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-white" />
            </div>
          )}
          <span className="text-white text-sm font-medium truncate">
            {customerName} &middot; {organizationName}
          </span>
        </div>
      </div>

      {/* Bottom Controls */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300",
          controlsVisible ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Progress Bar */}
        <div
          className="w-full h-1 bg-white/30 rounded-full mb-2 cursor-pointer"
          onClick={handleSeek}
          onKeyDown={handleSliderKeyDown}
          role="slider"
          aria-label="Video progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          tabIndex={0}
        >
          <div
            className="h-full bg-white rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="text-white hover:text-white/80 transition-colors p-1"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleMute}
              className="text-white hover:text-white/80 transition-colors p-1"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <span className="text-white text-xs font-mono">
              {formatDuration(Math.floor(currentTime))} / {formatDuration(durationSeconds)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <a
              href={pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-white/80 transition-colors p-1"
              aria-label="View full testimonial"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={enterFullscreen}
              className="text-white hover:text-white/80 transition-colors p-1"
              aria-label="Enter fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
