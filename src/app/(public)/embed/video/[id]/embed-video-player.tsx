"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Play, Pause, Volume2, VolumeX, Maximize, ExternalLink, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmbedVideoPlayerProps {
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  customerName: string;
  organizationName: string;
  organizationLogoUrl: string | null;
  pageUrl: string;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error("Video play failed:", error);
            setIsPlaying(false);
          });
      }
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && durationSeconds) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = percent * durationSeconds;
    }
  };

  const handleSliderKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!videoRef.current || !durationSeconds) return;

    const seekAmount = 5; // seconds
    let newTime = videoRef.current.currentTime;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        newTime = Math.min(newTime + seekAmount, durationSeconds);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        newTime = Math.max(newTime - seekAmount, 0);
        break;
      case "Home":
        newTime = 0;
        break;
      case "End":
        newTime = durationSeconds;
        break;
      default:
        return;
    }

    e.preventDefault();
    videoRef.current.currentTime = newTime;
  };

  const progress =
    durationSeconds && durationSeconds > 0
      ? (currentTime / durationSeconds) * 100
      : 0;

  return (
    <div
      className="relative w-full h-screen bg-black overflow-hidden"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Element */}
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

      {/* Play Overlay (shown when paused) */}
      {!isPlaying && (
        <button
          onClick={handlePlayPause}
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
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
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
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
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
              onClick={handlePlayPause}
              className="text-white hover:text-white/80 transition-colors p-1"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={handleMuteToggle}
              className="text-white hover:text-white/80 transition-colors p-1"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
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
              onClick={handleFullscreen}
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
