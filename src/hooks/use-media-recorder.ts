"use client";

/* eslint-disable no-undef */
// MediaRecorder, MediaStream, DOMException, OverconstrainedError are browser globals
// available in client components

import { useState, useRef, useCallback, useEffect } from "react";

export type RecorderStatus =
  | "idle"
  | "requesting"
  | "ready"
  | "recording"
  | "paused"
  | "stopped"
  | "error";

export interface UseMediaRecorderOptions {
  /** Maximum recording duration in milliseconds (default: 120000 = 2 minutes) */
  maxDuration?: number;
  /** Video constraints for getUserMedia */
  videoConstraints?: MediaTrackConstraints;
  /** Audio constraints for getUserMedia */
  audioConstraints?: MediaTrackConstraints;
  /** Callback when recording completes */
  onRecordingComplete?: (blob: Blob) => void;
  /** Callback when time updates */
  onTimeUpdate?: (elapsedMs: number) => void;
}

export interface UseMediaRecorderReturn {
  // State
  status: RecorderStatus;
  recordedBlob: Blob | null;
  previewUrl: string | null;
  error: string | null;
  elapsedTime: number;
  stream: MediaStream | null;

  // Refs for video elements
  liveVideoRef: React.RefObject<HTMLVideoElement | null>;

  // Actions
  requestPermissions: () => Promise<boolean>;
  startRecording: () => void;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
  cleanup: () => void;
}

// Preferred video quality settings with fallbacks
const VIDEO_QUALITY_PRESETS = [
  // 720p preferred
  { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
  // 480p fallback
  { width: { ideal: 854 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
  // 360p fallback
  { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 30 } },
  // Minimum quality
  { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 24 } },
];

// Get supported MIME type for video recording
function getSupportedMimeType(): string {
  const mimeTypes = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=h264,opus",
    "video/webm",
    "video/mp4",
  ];

  for (const mimeType of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return "video/webm";
}

export function useMediaRecorder(
  options: UseMediaRecorderOptions = {}
): UseMediaRecorderReturn {
  const {
    maxDuration = 120000, // 2 minutes default
    videoConstraints,
    audioConstraints,
    onRecordingComplete,
    onTimeUpdate,
  } = options;

  // State
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Refs
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const unmountedRef = useRef<boolean>(false);
  // Refs to track resources for cleanup without triggering setState
  const streamRef = useRef<MediaStream | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  // Sync refs with state for cleanup access
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  // Cleanup function - uses refs to avoid setState during unmount
  const cleanup = useCallback(() => {
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    // Stop all tracks in stream (use ref to avoid setState during unmount)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Revoke object URL (use ref to avoid setState during unmount)
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    // Clear chunks
    chunksRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unmountedRef.current = true;
      cleanup();
    };
  }, [cleanup]);

  // Request camera/mic permissions and get stream
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    setStatus("requesting");
    setError(null);

    // Check if MediaRecorder is supported
    if (!window.MediaRecorder) {
      setError("Video recording is not supported in this browser. Please try Chrome, Firefox, Safari, or Edge.");
      setStatus("error");
      return false;
    }

    // Check if getUserMedia is supported
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is not supported in this browser.");
      setStatus("error");
      return false;
    }

    // Try to get media stream with quality fallbacks
    for (const videoQuality of VIDEO_QUALITY_PRESETS) {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints || {
            facingMode: "user",
            ...videoQuality,
          },
          audio: audioConstraints || {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        setStream(mediaStream);
        setStatus("ready");

        // Connect stream to live video element
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = mediaStream;
        }

        return true;
      } catch (err) {
        // If it's a constraints error, try next quality level
        if (err instanceof OverconstrainedError) {
          continue;
        }

        // Handle permission errors
        if (err instanceof DOMException) {
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            setError(
              "Camera and microphone access was denied. Please allow access in your browser settings and try again."
            );
          } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
            setError(
              "No camera or microphone found. Please connect a camera and microphone to record."
            );
          } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
            setError(
              "Your camera or microphone is already in use by another application. Please close other apps and try again."
            );
          } else {
            setError(`Failed to access camera: ${err.message}`);
          }
        } else {
          setError("An unexpected error occurred while accessing the camera.");
        }

        setStatus("error");
        return false;
      }
    }

    // All quality levels failed
    setError("Could not initialize camera with any quality setting.");
    setStatus("error");
    return false;
  }, [videoConstraints, audioConstraints]);

  // Start recording
  const startRecording = useCallback(() => {
    if (!stream || status !== "ready") {
      return;
    }

    chunksRef.current = [];
    setRecordedBlob(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    try {
      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps for reasonable quality
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Prevent state updates after unmount to avoid React warnings
        if (unmountedRef.current) return;

        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setStatus("stopped");
        onRecordingComplete?.(blob);
      };

      mediaRecorder.onerror = () => {
        // Clear timer to prevent resource leak
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        // Prevent state updates after unmount
        if (unmountedRef.current) return;

        setError("Recording error occurred. Please try again.");
        setStatus("error");
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      setElapsedTime(0);
      setStatus("recording");

      // Start timer
      timerRef.current = setInterval(() => {
        // Skip elapsed time updates while paused
        if (mediaRecorderRef.current?.state === "paused") {
          return;
        }

        const elapsed = Date.now() - startTimeRef.current;
        setElapsedTime(elapsed);
        onTimeUpdate?.(elapsed);

        // Auto-stop at max duration
        if (elapsed >= maxDuration) {
          if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
          }
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
      }, 100);
    } catch {
      setError("Failed to start recording. Please try again.");
      setStatus("error");
    }
  }, [stream, status, previewUrl, maxDuration, onRecordingComplete, onTimeUpdate]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setStatus("paused");
      pausedTimeRef.current = Date.now();
    }
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      // Shift start time forward by pause duration to keep elapsed time correct
      const pauseDuration = Date.now() - pausedTimeRef.current;
      startTimeRef.current += pauseDuration;
      pausedTimeRef.current = 0; // Reset pause timestamp
      mediaRecorderRef.current.resume();
      setStatus("recording");
    }
  }, []);

  // Reset to record again
  const resetRecording = useCallback(() => {
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop MediaRecorder to prevent onstop from firing with stale state
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    // Clear recorded data
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setRecordedBlob(null);
    chunksRef.current = [];
    setElapsedTime(0);
    setError(null);

    // If we still have a stream, go back to ready state
    if (stream && stream.active) {
      setStatus("ready");
      // Reconnect stream to live video
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
      }
    } else {
      setStatus("idle");
    }
  }, [previewUrl, stream]);

  return {
    status,
    recordedBlob,
    previewUrl,
    error,
    elapsedTime,
    stream,
    liveVideoRef,
    requestPermissions,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    cleanup,
  };
}
