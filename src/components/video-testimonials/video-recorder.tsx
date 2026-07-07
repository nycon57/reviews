"use client";

import { useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  VideoCamera as Video,
  Microphone as Mic,
  Circle,
  Square,
  Pause,
  Play,
  ArrowCounterClockwise as RotateCcw,
  Check,
  WarningCircle as AlertCircle,
  Camera,
  SpinnerGap as Loader2,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useMediaRecorder, type RecorderStatus } from "@/hooks/use-media-recorder";
import { useIsDesktop } from "@/hooks/use-is-desktop";

// Width fraction of the centered 9:16 strip inside a 16:9 frame:
// (9/16) / (16/9) = 81/256
const PORTRAIT_STRIP_FRACTION = 81 / 256;
const GUIDE_LEFT_PERCENT = ((1 - PORTRAIT_STRIP_FRACTION) / 2) * 100;
const GUIDE_RIGHT_PERCENT = 100 - GUIDE_LEFT_PERCENT;

export interface VideoRecorderProps {
  /** Maximum recording duration in milliseconds (default: 120000 = 2 minutes) */
  maxDuration?: number;
  /** Callback when recording is complete and user confirms - includes duration in ms */
  onRecordingComplete?: (blob: Blob, durationMs: number) => void;
  /** Custom class name */
  className?: string;
  /** Whether to auto-request permissions on mount */
  autoRequestPermissions?: boolean;
  /** Organization primary color for theming */
  primaryColor?: string;
}

// Format milliseconds to MM:SS
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function VideoRecorder({
  maxDuration = 120000,
  onRecordingComplete,
  className,
  autoRequestPermissions = false,
  primaryColor,
}: VideoRecorderProps) {
  // Mobile devices record portrait (9:16, social-native); desktops record
  // landscape with a framing guide showing the eventual 9:16 crop region.
  const isDesktop = useIsDesktop();
  const orientation = isDesktop ? "landscape" : "portrait";

  const {
    status,
    recordedBlob,
    previewUrl,
    error,
    elapsedTime,
    finalDuration,
    liveVideoRef,
    requestPermissions,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    // Device selection
    audioDevices,
    videoDevices,
    selectedAudioDeviceId,
    selectedVideoDeviceId,
    setAudioDevice,
    setVideoDevice,
  } = useMediaRecorder({
    maxDuration,
    orientation,
    onRecordingComplete: undefined, // We handle this in the confirm action
  });

  const playbackVideoRef = useRef<HTMLVideoElement>(null);

  // Auto-request permissions if enabled
  useEffect(() => {
    if (autoRequestPermissions && status === "idle") {
      requestPermissions();
    }
  }, [autoRequestPermissions, status, requestPermissions]);

  // Debug: Log video element events
  // Depend on status since video element is conditionally rendered based on status
  useEffect(() => {
    const video = liveVideoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      console.log("[VideoRecorder] Video element: loadedmetadata", {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
      });
    };
    const onPlay = () => console.log("[VideoRecorder] Video element: play");
    const onError = (e: Event) => console.log("[VideoRecorder] Video element: error", e);
    const onCanPlay = () => console.log("[VideoRecorder] Video element: canplay");

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("play", onPlay);
    video.addEventListener("error", onError);
    video.addEventListener("canplay", onCanPlay);

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("error", onError);
      video.removeEventListener("canplay", onCanPlay);
    };
  }, [liveVideoRef, status]);

  // Calculate progress and remaining time
  const progressPercent = Math.min((elapsedTime / maxDuration) * 100, 100);
  const remainingTime = Math.max(maxDuration - elapsedTime, 0);
  const isWarningTime = remainingTime <= 30000 && remainingTime > 0;

  // Custom button style based on organization color
  const buttonStyle = primaryColor ? { backgroundColor: primaryColor } : undefined;

  // Handle confirm recording
  function handleConfirm(): void {
    if (recordedBlob) {
      const duration = finalDuration ?? elapsedTime;
      onRecordingComplete?.(recordedBlob, duration);
    }
  }

  // Status message for ARIA
  const statusMessage = useMemo(() => {
    switch (status) {
      case "requesting":
        return "Requesting camera and microphone access. Please allow when prompted.";
      case "ready":
        return "Camera ready. Press the record button to start recording.";
      case "recording":
        return `Recording in progress. ${formatTime(remainingTime)} remaining.`;
      case "pausing":
        return "Pausing recording...";
      case "paused":
        return "Recording paused. Press resume to continue.";
      case "resuming":
        return "Resuming recording...";
      case "stopping":
        return "Stopping recording...";
      case "stopped":
        return "Recording complete. Preview your video and choose to use it or re-record.";
      case "error":
        return `Error: ${error}`;
      default:
        return "";
    }
  }, [status, remainingTime, error]);

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* ARIA live region for status announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </div>

      <CardContent className="p-0">
        {/* Video Display Area */}
        <div
          className={cn(
            "relative bg-black",
            orientation === "portrait"
              ? "mx-auto aspect-[9/16] w-full max-w-[calc(70vh*9/16)]"
              : "aspect-video"
          )}
        >
          {/* Idle State - Permission prompt */}
          {status === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-repwell-teal-500/10 p-6">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-repwell-teal-300/20">
                <Camera className="h-10 w-10 text-repwell-teal-300" />
              </div>
              <h3 className="mb-2 text-center font-sans text-lg font-semibold text-heading">
                Record Your Video Testimonial
              </h3>
              <p className="mb-6 max-w-sm text-center font-sans text-sm text-muted-foreground">
                We&apos;ll need access to your camera and microphone to record your video.
              </p>
              <Button
                onClick={requestPermissions}
                size="lg"
                className="min-h-[48px] min-w-[200px] gap-2"
                style={buttonStyle}
              >
                <Video className="h-5 w-5" />
                Enable Camera
              </Button>
            </div>
          )}

          {/* Requesting State - Loading */}
          {status === "requesting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-repwell-teal-500/10 p-6">
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-repwell-teal-300" />
              <p className="font-sans text-lg font-medium text-heading">
                Requesting camera access...
              </p>
              <p className="mt-2 font-sans text-sm text-muted-foreground">
                Please allow camera and microphone access when prompted
              </p>
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/5 p-6">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <Alert variant="destructive" className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Camera Access Error</AlertTitle>
                <AlertDescription className="mt-2">{error}</AlertDescription>
              </Alert>
              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  onClick={requestPermissions}
                  className="min-h-[48px] gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Try Again
                </Button>
              </div>
              <div className="mt-4 max-w-md">
                <p className="text-center font-sans text-xs text-muted-foreground">
                  <strong>Troubleshooting tips:</strong>
                  <br />
                  1. Check that your browser has permission to access the camera
                  <br />
                  2. Make sure no other app is using your camera
                  <br />
                  3. Try refreshing the page
                </p>
              </div>
            </div>
          )}

          {/* Live Preview - Ready/Recording/Paused/Transition states */}
          {(status === "ready" || status === "recording" || status === "paused" ||
            status === "pausing" || status === "resuming" || status === "stopping") && (
            <>
              <video
                ref={liveVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />

              {/* Desktop framing guide: marks the centered 9:16 region that
                  social crops keep. Live preview only, never on playback. */}
              {orientation === "landscape" && (
                <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                  <div
                    className="absolute inset-y-0 w-px bg-white/25"
                    style={{ left: `${GUIDE_LEFT_PERCENT}%` }}
                  />
                  <div
                    className="absolute inset-y-0 w-px bg-white/25"
                    style={{ left: `${GUIDE_RIGHT_PERCENT}%` }}
                  />
                  <p className="absolute bottom-3 left-1/2 w-max max-w-[90%] -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-center font-sans text-xs text-white/70 backdrop-blur-sm">
                    Stay between the lines so your video crops well for social.
                  </p>
                </div>
              )}

              {/* Recording indicator */}
              {(status === "recording" || status === "paused" ||
                status === "pausing" || status === "resuming" || status === "stopping") && (
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                  {(status === "pausing" || status === "resuming" || status === "stopping") ? (
                    <Loader2 className="h-3 w-3 animate-spin text-yellow-400" />
                  ) : (
                    <Circle
                      className={cn(
                        "h-3 w-3 fill-current",
                        status === "recording"
                          ? "animate-pulse text-red-500"
                          : "text-yellow-500"
                      )}
                    />
                  )}
                  <span className="font-mono text-sm font-medium text-white">
                    {status === "pausing" ? "PAUSING..." :
                     status === "resuming" ? "RESUMING..." :
                     status === "stopping" ? "STOPPING..." :
                     status === "paused" ? "PAUSED" : "REC"}
                  </span>
                </div>
              )}

              {/* Timer display */}
              {(status === "recording" || status === "paused" ||
                status === "pausing" || status === "resuming" || status === "stopping") && (
                <div className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                  <span
                    className={cn(
                      "font-mono text-sm font-medium",
                      isWarningTime ? "text-red-400" : "text-white"
                    )}
                  >
                    {formatTime(elapsedTime)} / {formatTime(maxDuration)}
                  </span>
                </div>
              )}

                          </>
          )}

          {/* Playback Preview - Stopped state */}
          {status === "stopped" && previewUrl && (
            <>
              <video
                ref={playbackVideoRef}
                src={previewUrl}
                controls
                playsInline
                className="h-full w-full object-cover"
              />
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                <Check className="h-4 w-4 text-green-400" />
                <span className="font-sans text-sm font-medium text-white">Preview</span>
              </div>
            </>
          )}
        </div>

        {/* Progress Bar */}
        {(status === "recording" || status === "paused" ||
          status === "pausing" || status === "resuming" || status === "stopping") && (
          <div className="px-4 pt-4">
            <Progress
              value={progressPercent}
              className={cn(
                "h-2",
                isWarningTime && "[&>div]:bg-red-500"
              )}
            />
            <div className="mt-1 flex justify-between">
              <span className="font-sans text-xs text-muted-foreground">
                {formatTime(elapsedTime)}
              </span>
              <span
                className={cn(
                  "font-sans text-xs",
                  isWarningTime ? "font-medium text-red-500" : "text-muted-foreground"
                )}
              >
                {formatTime(remainingTime)} remaining
              </span>
            </div>
          </div>
        )}

        {/* Controls (idle/requesting/error actions live inside the video area) */}
        {status !== "idle" && status !== "requesting" && status !== "error" && (
        <div className="p-4">
          {/* Ready State - Start Recording */}
          {status === "ready" && (
            <div className="flex flex-col items-center gap-4">
              <Button
                onClick={startRecording}
                size="lg"
                className="min-h-[56px] min-w-[200px] gap-2 text-base"
                style={buttonStyle}
              >
                <Circle className="h-5 w-5 fill-current" />
                Start Recording
              </Button>

              {/* Device selectors */}
              {(videoDevices.length > 1 || audioDevices.length > 1) && (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {videoDevices.length > 1 && (
                    <Select
                      value={selectedVideoDeviceId || undefined}
                      onValueChange={setVideoDevice}
                    >
                      <SelectTrigger className="w-[180px]">
                        <Camera className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Camera" />
                      </SelectTrigger>
                      <SelectContent>
                        {videoDevices.map((d) => (
                          <SelectItem key={d.deviceId} value={d.deviceId}>
                            {d.label || `Camera ${videoDevices.indexOf(d) + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {audioDevices.length > 1 && (
                    <Select
                      value={selectedAudioDeviceId || undefined}
                      onValueChange={setAudioDevice}
                    >
                      <SelectTrigger className="w-[180px]">
                        <Mic className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Microphone" />
                      </SelectTrigger>
                      <SelectContent>
                        {audioDevices.map((d) => (
                          <SelectItem key={d.deviceId} value={d.deviceId}>
                            {d.label || `Microphone ${audioDevices.indexOf(d) + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              <p className="font-sans text-sm text-muted-foreground">
                Maximum {Math.floor(maxDuration / 60000)} minutes
              </p>
            </div>
          )}

          {/* Recording State - Stop/Pause */}
          {status === "recording" && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={pauseRecording}
                className="min-h-[56px] min-w-[120px] gap-2"
                aria-label="Pause recording"
              >
                <Pause className="h-5 w-5" />
                Pause
              </Button>
              <Button
                variant="destructive"
                size="lg"
                onClick={stopRecording}
                className="min-h-[56px] min-w-[120px] gap-2"
                aria-label="Stop recording"
              >
                <Square className="h-4 w-4 fill-current" />
                Stop
              </Button>
            </div>
          )}

          {/* Paused State - Resume/Stop */}
          {status === "paused" && (
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={resumeRecording}
                className="min-h-[56px] min-w-[120px] gap-2"
                style={buttonStyle}
                aria-label="Resume recording"
              >
                <Play className="h-5 w-5" />
                Resume
              </Button>
              <Button
                variant="destructive"
                size="lg"
                onClick={stopRecording}
                className="min-h-[56px] min-w-[120px] gap-2"
                aria-label="Stop recording"
              >
                <Square className="h-4 w-4 fill-current" />
                Stop
              </Button>
            </div>
          )}

          {/* Transition States - Loading Indicators */}
          {status === "pausing" && (
            <div className="flex items-center justify-center">
              <Button disabled size="lg" className="min-h-[56px] min-w-[160px] gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Pausing...
              </Button>
            </div>
          )}

          {status === "resuming" && (
            <div className="flex items-center justify-center">
              <Button disabled size="lg" className="min-h-[56px] min-w-[160px] gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Resuming...
              </Button>
            </div>
          )}

          {status === "stopping" && (
            <div className="flex items-center justify-center">
              <Button disabled size="lg" className="min-h-[56px] min-w-[160px] gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Stopping...
              </Button>
            </div>
          )}

          {/* Stopped State - Preview Actions */}
          {status === "stopped" && recordedBlob && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={resetRecording}
                  className="min-h-[56px] min-w-[140px] gap-2"
                  aria-label="Record again"
                >
                  <RotateCcw className="h-5 w-5" />
                  Re-record
                </Button>
                <Button
                  size="lg"
                  onClick={handleConfirm}
                  className="min-h-[56px] min-w-[140px] gap-2"
                  style={buttonStyle}
                  aria-label="Use this recording"
                >
                  <Check className="h-5 w-5" />
                  Use Video
                </Button>
              </div>
              <p className="text-center font-sans text-sm text-muted-foreground">
                Preview your video above, then choose to use it or re-record
              </p>
            </div>
          )}
        </div>
        )}
      </CardContent>
    </Card>
  );
}

// Export the component and types
export type { RecorderStatus };
