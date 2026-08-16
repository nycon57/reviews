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
  | "pausing"    // NEW: Transition state
  | "paused"
  | "resuming"   // NEW: Transition state
  | "stopping"   // NEW: Transition state
  | "stopped"
  | "error";

export type RecorderOrientation = "portrait" | "landscape";

export interface UseMediaRecorderOptions {
  /** Maximum recording duration in milliseconds (default: 120000 = 2 minutes) */
  maxDuration?: number;
  /** Capture orientation: portrait for mobile, landscape for desktop (default: landscape) */
  orientation?: RecorderOrientation;
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
  finalDuration: number | null;
  stream: MediaStream | null;

  // Device selection
  audioDevices: MediaDeviceInfo[];
  videoDevices: MediaDeviceInfo[];
  selectedAudioDeviceId: string | null;
  selectedVideoDeviceId: string | null;

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
  setAudioDevice: (deviceId: string) => Promise<void>;
  setVideoDevice: (deviceId: string) => Promise<void>;
}

// Preferred video quality settings with fallbacks, per capture orientation
const VIDEO_QUALITY_PRESETS: Record<RecorderOrientation, MediaTrackConstraints[]> = {
  landscape: [
    // 720p preferred
    { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
    // 480p fallback
    { width: { ideal: 854 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
    // 360p fallback
    { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 30 } },
    // Minimum quality
    { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 24 } },
  ],
  portrait: [
    // 720p vertical preferred
    { width: { ideal: 720 }, height: { ideal: 1280 }, frameRate: { ideal: 30 } },
    // 480p vertical fallback
    { width: { ideal: 480 }, height: { ideal: 854 }, frameRate: { ideal: 30 } },
    // 360p vertical fallback
    { width: { ideal: 360 }, height: { ideal: 640 }, frameRate: { ideal: 30 } },
  ],
};

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
    orientation = "landscape",
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
  const [finalDuration, setFinalDuration] = useState<number | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Device selection state
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string | null>(null);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string | null>(null);

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

  // Sync refs with state for cleanup access (combined into single effect)
  useEffect(() => {
    streamRef.current = stream;
    previewUrlRef.current = previewUrl;
  }, [stream, previewUrl]);

  // Phase 2 fix: Bind stream to video element via useEffect to handle race condition
  // The video element only renders when status !== "idle", so we need to wait for React
  // to process the state update before binding the stream
  // Also re-bind when status changes (e.g., after resetRecording, video element remounts)
  useEffect(() => {
    const liveVideoStates: RecorderStatus[] = ["ready", "recording", "paused", "pausing", "resuming", "stopping"];
    if (stream && liveVideoRef.current && liveVideoStates.includes(status)) {
      console.log("[VideoRecorder] Binding stream to video element via useEffect, status:", status);
      liveVideoRef.current.srcObject = stream;
    }
  }, [stream, status]);

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
  // Note: Reset unmountedRef on mount to handle React 18 Strict Mode double-mounting
  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      cleanup();
    };
  }, [cleanup]);

  // Enumerate available devices
  const enumerateDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioDevices(devices.filter((d) => d.kind === "audioinput"));
      setVideoDevices(devices.filter((d) => d.kind === "videoinput"));
    } catch {
      // Silently fail - device enumeration is optional enhancement
    }
  }, []);

  // Request camera/mic permissions and get stream
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    console.log("[VideoRecorder] requestPermissions: Starting");
    setStatus("requesting");
    setError(null);

    // Check if MediaRecorder is supported
    if (!window.MediaRecorder) {
      console.log("[VideoRecorder] requestPermissions: MediaRecorder not supported");
      setError("Video recording is not supported in this browser. Please try Chrome, Firefox, Safari, or Edge.");
      setStatus("error");
      return false;
    }

    // Check if getUserMedia is supported
    if (!navigator.mediaDevices?.getUserMedia) {
      console.log("[VideoRecorder] requestPermissions: getUserMedia not supported");
      setError("Camera access is not supported in this browser.");
      setStatus("error");
      return false;
    }

    // Try to get media stream with quality fallbacks
    const qualityPresets = VIDEO_QUALITY_PRESETS[orientation];
    for (let i = 0; i < qualityPresets.length; i++) {
      const videoQuality = qualityPresets[i];
      try {
        console.log(`[VideoRecorder] requestPermissions: Trying quality preset ${i}`, videoQuality);
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints || {
            facingMode: "user",
            ...videoQuality,
            // Use selected device if available
            ...(selectedVideoDeviceId && { deviceId: { exact: selectedVideoDeviceId } }),
          },
          audio: audioConstraints || {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            // Use selected device if available
            ...(selectedAudioDeviceId && { deviceId: { exact: selectedAudioDeviceId } }),
          },
        });

        const videoTrack = mediaStream.getVideoTracks()[0];
        const audioTrack = mediaStream.getAudioTracks()[0];
        console.log("[VideoRecorder] requestPermissions: Got stream", {
          videoTrack: videoTrack ? {
            label: videoTrack.label,
            readyState: videoTrack.readyState,
            enabled: videoTrack.enabled,
            settings: videoTrack.getSettings(),
          } : null,
          audioTrack: audioTrack ? {
            label: audioTrack.label,
            readyState: audioTrack.readyState,
            enabled: audioTrack.enabled,
          } : null,
        });

        setStream(mediaStream);
        setStatus("ready");
        console.log("[VideoRecorder] requestPermissions: Status set to 'ready', stream set");

        // Note: srcObject binding now handled by useEffect to fix race condition

        // Enumerate devices after permission granted (labels available now)
        console.log("[VideoRecorder] requestPermissions: Enumerating devices");
        await enumerateDevices();

        // Set selected device IDs from active tracks
        if (videoTrack) {
          const settings = videoTrack.getSettings();
          if (settings.deviceId) setSelectedVideoDeviceId(settings.deviceId);
        }
        if (audioTrack) {
          const settings = audioTrack.getSettings();
          if (settings.deviceId) setSelectedAudioDeviceId(settings.deviceId);
        }

        console.log("[VideoRecorder] requestPermissions: Success, returning true");
        return true;
      } catch (err) {
        // If it's a constraints error, try next quality level
        if (err instanceof OverconstrainedError) {
          console.log(`[VideoRecorder] requestPermissions: OverconstrainedError at preset ${i}, trying next`);
          continue;
        }

        console.log("[VideoRecorder] requestPermissions: Error", err);

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
    console.log("[VideoRecorder] requestPermissions: All quality levels failed");
    setError("Could not initialize camera with any quality setting.");
    setStatus("error");
    return false;
  }, [orientation, videoConstraints, audioConstraints, selectedVideoDeviceId, selectedAudioDeviceId, enumerateDevices]);

  // Ref for track ended listeners cleanup
  const trackListenersRef = useRef<{ track: MediaStreamTrack; handler: () => void }[]>([]);

  // Start recording
  const startRecording = useCallback(() => {
    console.log("[VideoRecorder] startRecording: Called, status:", status);
    if (!stream || status !== "ready") {
      console.log("[VideoRecorder] startRecording: Bailing - no stream or status not ready");
      return;
    }

    // Validate video/audio tracks before recording
    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];

    console.log("[VideoRecorder] startRecording: Track validation", {
      videoTrack: videoTrack ? { enabled: videoTrack.enabled, readyState: videoTrack.readyState } : null,
      audioTrack: audioTrack ? { enabled: audioTrack.enabled, readyState: audioTrack.readyState } : null,
    });

    if (!videoTrack?.enabled || videoTrack.readyState !== "live") {
      console.log("[VideoRecorder] startRecording: Video track not active");
      setError("Video track not active. Check camera permissions.");
      setStatus("error");
      return;
    }

    if (!audioTrack?.enabled || audioTrack.readyState !== "live") {
      console.log("[VideoRecorder] startRecording: Audio track not active");
      setError("Audio track not active. Check microphone permissions.");
      setStatus("error");
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
      console.log("[VideoRecorder] startRecording: Creating MediaRecorder with mimeType:", mimeType);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps for reasonable quality
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log("[VideoRecorder] ondataavailable: Chunk received, size:", event.data.size);
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log("[VideoRecorder] onstop: Fired, chunks count:", chunksRef.current.length);
        // Cleanup track listeners
        trackListenersRef.current.forEach(({ track, handler }) => {
          track.removeEventListener("ended", handler);
        });
        trackListenersRef.current = [];

        // Capture final duration from timer before any state updates
        const capturedDuration = Date.now() - startTimeRef.current;

        // Prevent state updates after unmount to avoid React warnings
        if (unmountedRef.current) {
          console.log("[VideoRecorder] onstop: Component unmounted, skipping state updates");
          return;
        }

        const blob = new Blob(chunksRef.current, { type: mimeType });
        console.log("[VideoRecorder] onstop: Blob created, size:", blob.size, "duration:", capturedDuration);

        // Validate blob - ensure we captured actual data
        if (blob.size < 1000) {
          console.log("[VideoRecorder] onstop: Blob too small, failing");
          setError("Recording failed - no video captured. Please try again.");
          setStatus("error");
          return;
        }

        setRecordedBlob(blob);
        setFinalDuration(capturedDuration);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        console.log("[VideoRecorder] onstop: Setting status to 'stopped'");
        setStatus("stopped");
        onRecordingComplete?.(blob);
      };

      // Listen for track disconnection during recording
      const handleTrackEnded = () => {
        console.log("[VideoRecorder] handleTrackEnded: Track ended, mediaRecorder state:", mediaRecorderRef.current?.state);
        if (mediaRecorderRef.current?.state !== "inactive") {
          // Auto-save partial recording
          console.log("[VideoRecorder] handleTrackEnded: Auto-saving partial recording");
          mediaRecorderRef.current?.stop();
          if (!unmountedRef.current) {
            setError("Camera/microphone disconnected. Partial recording saved.");
          }
        }
      };

      // Add listeners to both tracks
      videoTrack.addEventListener("ended", handleTrackEnded);
      audioTrack.addEventListener("ended", handleTrackEnded);
      trackListenersRef.current = [
        { track: videoTrack, handler: handleTrackEnded },
        { track: audioTrack, handler: handleTrackEnded },
      ];

      mediaRecorder.onerror = (event) => {
        console.log("[VideoRecorder] onerror: MediaRecorder error", event);
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
      console.log("[VideoRecorder] startRecording: Calling mediaRecorder.start(1000)");
      mediaRecorder.start(1000); // Collect data every second
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      setElapsedTime(0);
      setStatus("recording");
      console.log("[VideoRecorder] startRecording: Status set to 'recording', timer started");

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
    console.log("[VideoRecorder] stopRecording: Called, mediaRecorder state:", mediaRecorderRef.current?.state);

    if (!mediaRecorderRef.current) {
      console.log("[VideoRecorder] stopRecording: No mediaRecorder ref, bailing");
      return;
    }

    if (mediaRecorderRef.current.state === "inactive") {
      console.log("[VideoRecorder] stopRecording: Already inactive, bailing");
      return;
    }

    console.log("[VideoRecorder] stopRecording: Setting status to 'stopping'");
    setStatus("stopping");

    // Clear timer
    if (timerRef.current) {
      console.log("[VideoRecorder] stopRecording: Clearing timer");
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    console.log("[VideoRecorder] stopRecording: Calling mediaRecorder.stop()");
    mediaRecorderRef.current.stop();

    // Timeout fallback in case onstop doesn't fire
    console.log("[VideoRecorder] stopRecording: Setting 3s timeout fallback");
    setTimeout(() => {
      console.log("[VideoRecorder] stopRecording timeout: Checking state, mediaRecorder state:", mediaRecorderRef.current?.state);
      if (!unmountedRef.current && mediaRecorderRef.current?.state !== "inactive") {
        console.log("[VideoRecorder] stopRecording timeout: onstop didn't fire, setting error");
        setError("Recording stop timed out. Please try again.");
        setStatus("error");
      }
    }, 3000);
  }, []);

  // Pause recording
  const pauseRecording = useCallback(() => {
    console.log("[VideoRecorder] pauseRecording: Called, state:", mediaRecorderRef.current?.state);
    if (mediaRecorderRef.current?.state === "recording") {
      setStatus("pausing");
      console.log("[VideoRecorder] pauseRecording: Calling mediaRecorder.pause()");
      mediaRecorderRef.current.pause();
      pausedTimeRef.current = Date.now();

      // Verify pause worked
      setTimeout(() => {
        console.log("[VideoRecorder] pauseRecording verify: state:", mediaRecorderRef.current?.state);
        if (!unmountedRef.current && mediaRecorderRef.current?.state === "paused") {
          console.log("[VideoRecorder] pauseRecording verify: Setting status to 'paused'");
          setStatus("paused");
        }
      }, 50);
    }
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    console.log("[VideoRecorder] resumeRecording: Called, state:", mediaRecorderRef.current?.state);
    if (mediaRecorderRef.current?.state === "paused") {
      setStatus("resuming");

      // Shift start time forward by pause duration to keep elapsed time correct
      const pauseDuration = Date.now() - pausedTimeRef.current;
      startTimeRef.current += pauseDuration;
      pausedTimeRef.current = 0; // Reset pause timestamp
      console.log("[VideoRecorder] resumeRecording: Calling mediaRecorder.resume()");
      mediaRecorderRef.current.resume();

      // Verify resume worked
      setTimeout(() => {
        console.log("[VideoRecorder] resumeRecording verify: state:", mediaRecorderRef.current?.state);
        if (!unmountedRef.current && mediaRecorderRef.current?.state === "recording") {
          console.log("[VideoRecorder] resumeRecording verify: Setting status to 'recording'");
          setStatus("recording");
        }
      }, 50);
    }
  }, []);

  // Reset to record again
  const resetRecording = useCallback(() => {
    console.log("[VideoRecorder] resetRecording: Called");
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop MediaRecorder to prevent onstop from firing with stale state
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      console.log("[VideoRecorder] resetRecording: Stopping mediaRecorder");
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    // Clear recorded data
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setRecordedBlob(null);
    setFinalDuration(null);
    chunksRef.current = [];
    setElapsedTime(0);
    setError(null);

    // If we still have a stream, go back to ready state
    if (stream && stream.active) {
      console.log("[VideoRecorder] resetRecording: Stream still active, setting status to 'ready'");
      setStatus("ready");
      // Note: srcObject binding now handled by useEffect
    } else {
      console.log("[VideoRecorder] resetRecording: No active stream, setting status to 'idle'");
      setStatus("idle");
    }
  }, [previewUrl, stream]);

  // Switch audio device (seamlessly restarts stream)
  const setAudioDevice = useCallback(async (deviceId: string): Promise<void> => {
    console.log("[VideoRecorder] setAudioDevice: Called, deviceId:", deviceId);
    // Can't switch devices while recording/paused
    if (status === "recording" || status === "paused" || status === "pausing" ||
        status === "resuming" || status === "stopping") {
      console.log("[VideoRecorder] setAudioDevice: Can't switch while recording/paused");
      return;
    }

    setSelectedAudioDeviceId(deviceId);

    // If we have an active stream, restart it with new device
    if (stream && status === "ready") {
      console.log("[VideoRecorder] setAudioDevice: Restarting stream with new device");
      // Stop current stream
      stream.getTracks().forEach((track) => track.stop());

      // Request new stream with updated device
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            ...VIDEO_QUALITY_PRESETS[orientation][0],
            ...(selectedVideoDeviceId && { deviceId: { exact: selectedVideoDeviceId } }),
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            deviceId: { exact: deviceId },
          },
        });

        console.log("[VideoRecorder] setAudioDevice: Got new stream");
        setStream(mediaStream);
        // Note: srcObject binding now handled by useEffect
      } catch (err) {
        console.log("[VideoRecorder] setAudioDevice: Error", err);
        setError("Failed to switch microphone. Please try again.");
      }
    }
  }, [status, stream, orientation, selectedVideoDeviceId]);

  // Switch video device (seamlessly restarts stream)
  const setVideoDevice = useCallback(async (deviceId: string): Promise<void> => {
    console.log("[VideoRecorder] setVideoDevice: Called, deviceId:", deviceId);
    // Can't switch devices while recording/paused
    if (status === "recording" || status === "paused" || status === "pausing" ||
        status === "resuming" || status === "stopping") {
      console.log("[VideoRecorder] setVideoDevice: Can't switch while recording/paused");
      return;
    }

    setSelectedVideoDeviceId(deviceId);

    // If we have an active stream, restart it with new device
    if (stream && status === "ready") {
      console.log("[VideoRecorder] setVideoDevice: Restarting stream with new device");
      // Stop current stream
      stream.getTracks().forEach((track) => track.stop());

      // Request new stream with updated device
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            ...VIDEO_QUALITY_PRESETS[orientation][0],
            deviceId: { exact: deviceId },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            ...(selectedAudioDeviceId && { deviceId: { exact: selectedAudioDeviceId } }),
          },
        });

        console.log("[VideoRecorder] setVideoDevice: Got new stream");
        setStream(mediaStream);
        // Note: srcObject binding now handled by useEffect
      } catch (err) {
        console.log("[VideoRecorder] setVideoDevice: Error", err);
        setError("Failed to switch camera. Please try again.");
      }
    }
  }, [status, stream, orientation, selectedAudioDeviceId]);

  return {
    status,
    recordedBlob,
    previewUrl,
    error,
    elapsedTime,
    finalDuration,
    stream,
    // Device selection
    audioDevices,
    videoDevices,
    selectedAudioDeviceId,
    selectedVideoDeviceId,
    // Refs
    liveVideoRef,
    // Actions
    requestPermissions,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    cleanup,
    setAudioDevice,
    setVideoDevice,
  };
}
