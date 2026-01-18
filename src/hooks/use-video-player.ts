"use client";

import { useState, useRef, useCallback } from "react";

interface UseVideoPlayerOptions {
  durationSeconds: number | null;
}

interface UseVideoPlayerReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  progress: number;
  togglePlay: () => void;
  toggleMute: () => void;
  enterFullscreen: () => void;
  handleTimeUpdate: () => void;
  handleSeek: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleSliderKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  setIsPlaying: (playing: boolean) => void;
}

/**
 * Shared hook for video player state and controls
 * Used by VideoTestimonialPlayer and EmbedVideoPlayer
 */
export function useVideoPlayer({
  durationSeconds,
}: UseVideoPlayerOptions): UseVideoPlayerReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play()
        .then(() => setIsPlaying(true))
        .catch((error) => {
          console.error("Video play failed:", error);
          setIsPlaying(false);
        });
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const enterFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (video?.requestFullscreen) {
      video.requestFullscreen();
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !durationSeconds) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * durationSeconds;
  }, [durationSeconds]);

  const handleSliderKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !durationSeconds) return;

    const seekAmount = 5;
    let newTime = video.currentTime;

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
    video.currentTime = newTime;
  }, [durationSeconds]);

  const progress = durationSeconds && durationSeconds > 0
    ? (currentTime / durationSeconds) * 100
    : 0;

  return {
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
  };
}
