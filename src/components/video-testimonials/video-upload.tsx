"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Upload,
  FileVideo,
  AlertCircle,
  Check,
  X,
  RotateCcw,
  Play,
  Pause,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Accepted video MIME types */
const ACCEPTED_VIDEO_TYPES = {
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
  "video/quicktime": [".mov"],
  "video/x-msvideo": [".avi"],
  "video/x-matroska": [".mkv"],
};

/** Default max file size: 500MB */
const DEFAULT_MAX_FILE_SIZE = 500 * 1024 * 1024;

/** Default max duration: 2 minutes (120 seconds) */
const DEFAULT_MAX_DURATION = 120;

export type VideoUploadStatus = "idle" | "selected" | "uploading" | "success" | "error";

export interface VideoUploadProps {
  /** Callback when user selects a valid video file and confirms */
  onVideoSelect?: (file: File) => void;
  /** Callback when upload is complete (used when upload is handled externally) */
  onUploadComplete?: (blob: Blob) => void;
  /** Callback when user discards the selected video */
  onDiscard?: () => void;
  /** Maximum file size in bytes (default: 500MB) */
  maxFileSize?: number;
  /** Maximum video duration in seconds (default: 120s = 2 minutes) */
  maxDuration?: number;
  /** Upload progress (0-100) when controlled externally */
  uploadProgress?: number;
  /** Whether the component is currently uploading (controlled externally) */
  isUploading?: boolean;
  /** Custom class name */
  className?: string;
  /** Organization primary color for theming */
  primaryColor?: string;
}

// Format bytes to human-readable string
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Format seconds to MM:SS
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function VideoUpload({
  onVideoSelect,
  onUploadComplete: _onUploadComplete, // Reserved for future use when upload handling is controlled externally
  onDiscard,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  maxDuration = DEFAULT_MAX_DURATION,
  uploadProgress: externalProgress,
  isUploading: externalIsUploading,
  className,
  primaryColor,
}: VideoUploadProps) {
  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<VideoUploadStatus>("idle");
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [validationInProgress, setValidationInProgress] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);

  // Use external progress/uploading state if provided, otherwise internal
  const isUploading = externalIsUploading ?? status === "uploading";
  const uploadProgress = externalProgress ?? 0;

  // Custom button style based on organization color
  const buttonStyle = useMemo(
    () => (primaryColor ? { backgroundColor: primaryColor } : undefined),
    [primaryColor]
  );

  // Validate video file
  const validateVideo = useCallback(
    async (file: File): Promise<{ valid: boolean; error?: string }> => {
      // Check file size
      if (file.size > maxFileSize) {
        return {
          valid: false,
          error: `File is too large. Maximum size is ${formatFileSize(maxFileSize)}.`,
        };
      }

      // Check file type
      const isValidType = Object.keys(ACCEPTED_VIDEO_TYPES).includes(file.type);
      if (!isValidType) {
        return {
          valid: false,
          error: "Invalid file type. Please upload MP4, WebM, MOV, AVI, or MKV files.",
        };
      }

      // Validate video duration by loading metadata
      return new Promise((resolve) => {
        const video = document.createElement("video");
        video.preload = "metadata";

        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          if (video.duration > maxDuration) {
            resolve({
              valid: false,
              error: `Video is too long. Maximum duration is ${formatDuration(maxDuration)}.`,
            });
          } else {
            resolve({ valid: true });
          }
        };

        video.onerror = () => {
          window.URL.revokeObjectURL(video.src);
          resolve({
            valid: false,
            error: "Unable to read video file. The file may be corrupted.",
          });
        };

        video.src = URL.createObjectURL(file);
      });
    },
    [maxFileSize, maxDuration]
  );

  // Handle file drop/selection
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setError(null);
      setValidationInProgress(true);

      // Validate the video
      const validation = await validateVideo(file);
      setValidationInProgress(false);

      if (!validation.valid) {
        setError(validation.error || "Invalid video file");
        setStatus("error");
        return;
      }

      // Clear previous preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      // Create preview URL and get duration
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setSelectedFile(file);
      setStatus("selected");

      // Get video duration for display
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        setVideoDuration(video.duration);
        URL.revokeObjectURL(video.src);
      };
      video.src = URL.createObjectURL(file);
    },
    [validateVideo, previewUrl]
  );

  // Handle file rejection from dropzone
  const onDropRejected = useCallback(
    (rejections: FileRejection[]) => {
      const rejection = rejections[0];
      if (!rejection) return;

      const errorCode = rejection.errors[0]?.code;
      let errorMessage = "Unable to upload this file.";

      if (errorCode === "file-too-large") {
        errorMessage = `File is too large. Maximum size is ${formatFileSize(maxFileSize)}.`;
      } else if (errorCode === "file-invalid-type") {
        errorMessage = "Invalid file type. Please upload MP4, WebM, MOV, AVI, or MKV files.";
      }

      setError(errorMessage);
      setStatus("error");
    },
    [maxFileSize]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    onDropRejected,
    accept: ACCEPTED_VIDEO_TYPES,
    maxSize: maxFileSize,
    multiple: false,
    disabled: isUploading || validationInProgress,
    noClick: status === "selected" || status === "uploading",
    noKeyboard: status === "selected" || status === "uploading",
  });

  // Handle confirm selection
  const handleConfirm = useCallback(() => {
    if (selectedFile) {
      onVideoSelect?.(selectedFile);
      // If external upload handling is provided, also call onUploadComplete
      // This allows the parent to decide how to handle the video
    }
  }, [selectedFile, onVideoSelect]);

  // Handle discard
  const handleDiscard = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setVideoDuration(null);
    setError(null);
    setStatus("idle");
    setIsVideoPlaying(false);
    onDiscard?.();
  }, [previewUrl, onDiscard]);

  // Toggle video playback
  const togglePlayback = useCallback(() => {
    if (!videoRef.current) return;

    if (isVideoPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsVideoPlaying(!isVideoPlaying);
  }, [isVideoPlaying]);

  // Handle video end
  const handleVideoEnd = useCallback(() => {
    setIsVideoPlaying(false);
  }, []);

  // Status message for ARIA
  const statusMessage = useMemo(() => {
    switch (status) {
      case "idle":
        return "Upload area ready. Drag and drop a video file or click to browse.";
      case "selected":
        return `Video selected: ${selectedFile?.name}. Preview your video and choose to use it or select a different file.`;
      case "uploading":
        return `Uploading video: ${uploadProgress}% complete.`;
      case "success":
        return "Video uploaded successfully.";
      case "error":
        return `Error: ${error}`;
      default:
        return "";
    }
  }, [status, selectedFile, uploadProgress, error]);

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* ARIA live region for status announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </div>

      <CardContent className="p-0">
        {/* Video Display Area */}
        <div className="relative aspect-video bg-black">
          {/* Idle State - Drop zone */}
          {(status === "idle" || status === "error") && !validationInProgress && (
            <div
              {...getRootProps()}
              className={cn(
                "absolute inset-0 flex flex-col items-center justify-center p-6 transition-colors cursor-pointer",
                isDragActive
                  ? "bg-repwell-teal-300/20 border-2 border-dashed border-repwell-teal-300"
                  : "bg-repwell-teal-500/10",
                status === "error" && "bg-destructive/5"
              )}
            >
              <input {...getInputProps()} />

              {status === "error" ? (
                <>
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                  </div>
                  <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Upload Error</AlertTitle>
                    <AlertDescription className="mt-2">{error}</AlertDescription>
                  </Alert>
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setError(null);
                      setStatus("idle");
                    }}
                    className="mt-4 min-h-[48px] gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Try Again
                  </Button>
                </>
              ) : (
                <>
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-repwell-teal-300/20">
                    {isDragActive ? (
                      <FileVideo className="h-10 w-10 text-repwell-teal-300" />
                    ) : (
                      <Upload className="h-10 w-10 text-repwell-teal-300" />
                    )}
                  </div>
                  <h3 className="mb-2 text-center font-sans text-lg font-semibold text-repwell-teal-500">
                    {isDragActive ? "Drop your video here" : "Upload Your Video"}
                  </h3>
                  <p className="mb-6 max-w-sm text-center font-sans text-sm text-muted-foreground">
                    {isDragActive
                      ? "Release to upload your video file"
                      : "Drag and drop your video file here, or click to browse"}
                  </p>
                  {!isDragActive && (
                    <>
                      <Button
                        type="button"
                        size="lg"
                        className="min-h-[48px] min-w-[200px] gap-2"
                        style={buttonStyle}
                        onClick={(e) => {
                          e.stopPropagation();
                          open();
                        }}
                      >
                        <FileVideo className="h-5 w-5" />
                        Choose Video
                      </Button>
                      <div className="mt-4 text-center">
                        <p className="font-sans text-xs text-muted-foreground">
                          MP4, WebM, MOV, AVI, MKV • Max {formatFileSize(maxFileSize)} • Max{" "}
                          {formatDuration(maxDuration)}
                        </p>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Validation in Progress */}
          {validationInProgress && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-repwell-teal-500/10 p-6">
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-repwell-teal-300" />
              <p className="font-sans text-lg font-medium text-repwell-teal-500">
                Validating video...
              </p>
              <p className="mt-2 font-sans text-sm text-muted-foreground">
                Checking file format and duration
              </p>
            </div>
          )}

          {/* Selected/Preview State */}
          {status === "selected" && previewUrl && !validationInProgress && (
            <>
              <video
                ref={videoRef}
                src={previewUrl}
                className="h-full w-full object-contain"
                playsInline
                onEnded={handleVideoEnd}
              />

              {/* Play/Pause overlay */}
              <button
                type="button"
                onClick={togglePlayback}
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity focus:opacity-100"
                aria-label={isVideoPlaying ? "Pause video" : "Play video"}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg">
                  {isVideoPlaying ? (
                    <Pause className="h-8 w-8 text-repwell-teal-500" />
                  ) : (
                    <Play className="h-8 w-8 text-repwell-teal-500 ml-1" />
                  )}
                </div>
              </button>

              {/* Preview badge */}
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                <FileVideo className="h-4 w-4 text-white" />
                <span className="font-sans text-sm font-medium text-white">Preview</span>
              </div>

              {/* File info badge */}
              <div className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                <span className="font-mono text-sm font-medium text-white">
                  {videoDuration !== null && formatDuration(videoDuration)}
                </span>
              </div>
            </>
          )}

          {/* Uploading State */}
          {isUploading && previewUrl && (
            <>
              <video
                src={previewUrl}
                className="h-full w-full object-contain opacity-50"
                playsInline
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                <Loader2 className="mb-4 h-12 w-12 animate-spin text-white" />
                <p className="font-sans text-lg font-medium text-white">Uploading video...</p>
                <p className="mt-2 font-sans text-sm text-white/80">{uploadProgress}% complete</p>
              </div>
            </>
          )}
        </div>

        {/* Progress Bar (when uploading) */}
        {isUploading && (
          <div className="px-4 pt-4">
            <Progress value={uploadProgress} className="h-2" />
            <div className="mt-1 flex justify-between">
              <span className="font-sans text-xs text-muted-foreground">Uploading...</span>
              <span className="font-sans text-xs text-muted-foreground">{uploadProgress}%</span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="p-4">
          {/* Idle State - Already shown in drop zone */}
          {status === "idle" && !validationInProgress && (
            <p className="text-center font-sans text-sm text-muted-foreground">
              Already have a video? Upload it above instead of recording.
            </p>
          )}

          {/* Selected State - Preview Actions */}
          {status === "selected" && selectedFile && !isUploading && (
            <div className="space-y-4">
              {/* File info */}
              <div className="rounded-lg border bg-muted/50 p-3">
                <div className="flex items-center gap-3">
                  <FileVideo className="h-5 w-5 flex-shrink-0 text-repwell-teal-300" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-sans text-sm font-medium text-repwell-teal-500">
                      {selectedFile.name}
                    </p>
                    <p className="font-sans text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                      {videoDuration !== null && ` • ${formatDuration(videoDuration)}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleDiscard}
                  className="min-h-[56px] min-w-[140px] gap-2"
                  aria-label="Select different video"
                >
                  <X className="h-5 w-5" />
                  Change Video
                </Button>
                <Button
                  size="lg"
                  onClick={handleConfirm}
                  className="min-h-[56px] min-w-[140px] gap-2"
                  style={buttonStyle}
                  aria-label="Use this video"
                >
                  <Check className="h-5 w-5" />
                  Use Video
                </Button>
              </div>
              <p className="text-center font-sans text-sm text-muted-foreground">
                Preview your video above, then choose to use it or select a different file
              </p>
            </div>
          )}

          {/* Uploading State */}
          {isUploading && (
            <p className="text-center font-sans text-sm text-muted-foreground">
              Please wait while your video is being uploaded...
            </p>
          )}

          {/* Error State - Already shown in main area */}
          {status === "error" && (
            <p className="text-center font-sans text-xs text-muted-foreground">
              <strong>Supported formats:</strong> MP4, WebM, MOV, AVI, MKV
              <br />
              <strong>Max size:</strong> {formatFileSize(maxFileSize)} • <strong>Max duration:</strong>{" "}
              {formatDuration(maxDuration)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
