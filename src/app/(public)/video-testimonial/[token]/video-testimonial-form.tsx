"use client";

import { useState, useTransition, useRef, useMemo, useEffect, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  submitCustomerInfoAndConsent,
  createVideoUploadUrls,
  submitVideoTestimonial,
} from "@/lib/video-testimonials/public-actions";
import {
  VIDEO_TESTIMONIAL_CONSENT_VERSION,
  type PublicVideoTestimonialRequest,
  type RelationshipType,
} from "@/lib/video-testimonials/types";
import {
  SpinnerGap as Loader2,
  VideoCamera as Video,
  Shield,
  FileText,
  Sparkle as Sparkles,
  CheckCircle as CheckCircle2,
  XCircle,
  UploadSimple as Upload,
  WarningCircle as AlertCircle,
} from "@phosphor-icons/react";
import { VideoRecorder } from "@/components/video-testimonials/video-recorder";

interface VideoTestimonialFormProps {
  request: PublicVideoTestimonialRequest;
}

type FormState =
  | "preflight"
  | "form"
  | "submitting"
  | "deviceCheck"
  | "success"
  | "error"
  | "uploading"
  | "processing"
  | "completed"
  | "uploadError"
  | "processError";


interface DeviceCheckState {
  browserSupported: boolean;
  mediaDevicesSupported: boolean;
  cameraLikelyAvailable: boolean;
  microphoneLikelyAvailable: boolean;
}

// XHR upload helper with progress tracking
function uploadWithProgress(
  url: string,
  blob: Blob,
  options: {
    onProgress: (percent: number) => void;
    signal?: globalThis.AbortSignal;
  }
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new globalThis.XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        options.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.ontimeout = () => reject(new Error("Upload timed out"));

    if (options.signal) {
      options.signal.addEventListener("abort", () => {
        xhr.abort();
        reject(new globalThis.DOMException("Upload cancelled", "AbortError"));
      });
    }

    xhr.open("PUT", url);
    // Use simple MIME type without codec params - some servers don't handle codec info
    const contentType = (blob.type || "video/webm").split(";")[0];
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.timeout = 300000; // 5 minute timeout
    xhr.send(blob);
  });
}

async function uploadWithRetry(params: {
  uploadUrl: string;
  blob: Blob;
  signal?: globalThis.AbortSignal;
  onProgress: (percent: number) => void;
  attempts?: number;
}): Promise<void> {
  const maxAttempts = params.attempts ?? 3;
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      await uploadWithProgress(params.uploadUrl, params.blob, {
        onProgress: params.onProgress,
        signal: params.signal,
      });
      return;
    } catch (error) {
      attempt += 1;
      if (params.signal?.aborted) throw error;
      if (attempt >= maxAttempts) throw error;
      const backoffMs = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
}

async function uploadThumbnailWithRetry(params: {
  uploadUrl: string;
  blob: Blob;
  signal?: globalThis.AbortSignal;
  attempts?: number;
}): Promise<void> {
  const maxAttempts = params.attempts ?? 3;
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      const res = await fetch(params.uploadUrl, {
        method: "PUT",
        body: params.blob,
        headers: { "Content-Type": "image/jpeg" },
        signal: params.signal,
      });
      if (!res.ok) throw new Error(`Thumbnail upload failed (${res.status})`);
      return;
    } catch (error) {
      attempt += 1;
      if (params.signal?.aborted) throw error;
      if (attempt >= maxAttempts) throw error;
      const backoffMs = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
}

async function getVideoDurationSeconds(file: Blob): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    const cleanup = () => URL.revokeObjectURL(url);

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? Math.max(0, Math.round(video.duration)) : 0;
      cleanup();
      resolve(duration);
    };
    video.onerror = () => {
      cleanup();
      resolve(0);
    };
    video.src = url;
  });
}

// Generate a thumbnail from a video blob by capturing a frame
async function generateThumbnailFromVideo(videoBlob: Blob): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      resolve(null);
      return;
    }

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      URL.revokeObjectURL(video.src);
    };

    video.onloadeddata = async () => {
      // Seek to 0.5 seconds or 10% into the video for a good frame
      const seekTime = Math.min(0.5, video.duration * 0.1);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      // Set canvas size to match video dimensions
      const maxWidth = 640;
      const maxHeight = 360;
      let width = video.videoWidth;
      let height = video.videoHeight;

      // Scale down if needed while maintaining aspect ratio
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw the video frame to canvas
      ctx.drawImage(video, 0, 0, width, height);

      // Convert to JPEG blob
      canvas.toBlob(
        (blob) => {
          cleanup();
          resolve(blob);
        },
        "image/jpeg",
        0.85
      );
    };

    video.onerror = () => {
      cleanup();
      resolve(null);
    };

    // Set a timeout in case video loading fails
    setTimeout(() => {
      cleanup();
      resolve(null);
    }, 10000);

    video.src = URL.createObjectURL(videoBlob);
    video.load();
  });
}

const RELATIONSHIP_OPTIONS = [
  { value: "home_buyer", label: "Home Buyer" },
  { value: "refinancer", label: "Refinancer" },
  { value: "first_time_buyer", label: "First-Time Home Buyer" },
  { value: "investor", label: "Real Estate Investor" },
  { value: "business_owner", label: "Business Owner" },
  { value: "other", label: "Other" },
];

export function VideoTestimonialForm({ request }: VideoTestimonialFormProps) {
  const { professional, organization, promptText } = request;


  // Form state
  const [displayName, setDisplayName] = useState(request.customerName || "");
  const [relationship, setRelationship] = useState<RelationshipType | "">("");
  const [nilConsent, setNilConsent] = useState(false);
  const [usageRightsConsent, setUsageRightsConsent] = useState(false);
  const [aiTextGenerationConsent, setAiTextGenerationConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  // UI state
  const [formState, setFormState] = useState<FormState>("preflight");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [preflightCopied, setPreflightCopied] = useState(false);
  const [deviceCheck, setDeviceCheck] = useState<DeviceCheckState>({
    browserSupported: true,
    mediaDevicesSupported: true,
    cameraLikelyAvailable: true,
    microphoneLikelyAvailable: true,
  });

  // Upload/processing state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStartedAt, setUploadStartedAt] = useState<number | null>(null);


  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<globalThis.AbortController | null>(null);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [pendingDuration, setPendingDuration] = useState<number>(0);
  const [uploadedStoragePath, setUploadedStoragePath] = useState<string | null>(null);
  const [uploadedThumbnailPath, setUploadedThumbnailPath] = useState<string | null>(null);
  const [uploadSessionId, setUploadSessionId] = useState<string | null>(null);
  const [submissionIdempotencyKey, setSubmissionIdempotencyKey] = useState<string | null>(null);
  const [isFallbackFilePending, setIsFallbackFilePending] = useState(false);

  // Refs for focus management
  const nameInputRef = useRef<HTMLInputElement>(null);
  const fallbackFileRef = useRef<HTMLInputElement>(null);

  const buttonStyle = useMemo(
    () => (organization.primaryColor ? { backgroundColor: organization.primaryColor } : undefined),
    [organization.primaryColor]
  );
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@repwell.com";
  const requestNewLinkHref = useMemo(() => {
    const subject = encodeURIComponent("Request new video testimonial link");
    const body = encodeURIComponent(
      `Please send me a new video testimonial link for ${organization.name}. Current customer email: ${request.customerEmail}.`
    );
    return `mailto:${supportEmail}?subject=${subject}&body=${body}`;
  }, [organization.name, request.customerEmail, supportEmail]);

  // Focus first input when returning from error state
  useEffect(() => {
    if (formState === "form" && nameInputRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => nameInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [formState]);

  // Validation
  const isFormValid =
    displayName.trim().length > 0 &&
    relationship.length > 0 &&
    nilConsent &&
    usageRightsConsent &&
    aiTextGenerationConsent;

  const runDeviceCheck = useCallback(async () => {
    const browserSupported =
      typeof window !== "undefined" &&
      typeof navigator !== "undefined" &&
      typeof globalThis.MediaRecorder !== "undefined";
    const mediaDevicesSupported = !!navigator.mediaDevices?.getUserMedia;

    let cameraLikelyAvailable = false;
    let microphoneLikelyAvailable = false;
    try {
      const devices = await navigator.mediaDevices?.enumerateDevices?.();
      cameraLikelyAvailable = !!devices?.some((device) => device.kind === "videoinput");
      microphoneLikelyAvailable = !!devices?.some((device) => device.kind === "audioinput");
    } catch {
      // If enumeration fails before permissions, treat as likely available and let recorder handle runtime errors.
      cameraLikelyAvailable = true;
      microphoneLikelyAvailable = true;
    }

    setDeviceCheck({
      browserSupported,
      mediaDevicesSupported,
      cameraLikelyAvailable,
      microphoneLikelyAvailable,
    });
  }, []);

  const handleCopyCurrentLink = useCallback(async () => {
    try {
      if (!navigator.clipboard) return;
      await navigator.clipboard.writeText(window.location.href);
      setPreflightCopied(true);
      setTimeout(() => setPreflightCopied(false), 2000);
    } catch {
      // Ignore clipboard errors; user can still copy manually from browser address bar.
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setFormState("submitting");
    setSubmitError(null);

    startTransition(async () => {
      // Safe to cast since isFormValid ensures relationship is not empty
      const result = await submitCustomerInfoAndConsent({
        token: request.token,
        customerInfo: {
          displayName: displayName.trim(),
          relationship: relationship as RelationshipType,
        },
        consents: {
          nilConsent,
          videoRecordingConsent: nilConsent,
          usageRightsConsent,
          aiTextGenerationConsent,
          marketingConsent,
        },
        consentVersion: VIDEO_TESTIMONIAL_CONSENT_VERSION,
        clientInfo: {
          userAgent: navigator.userAgent,
          locale: navigator.language,
        },
      });

      if (result.success) {
        await runDeviceCheck();
        setFormState("deviceCheck");
      } else {
        setSubmitError(result.error || "Failed to submit your information");
        setFormState("error");
      }
    });
  };

  // Compute status message for ARIA live region
  const statusMessage = useMemo(() => {
    switch (formState) {
      case "preflight":
        return "Video testimonial preflight instructions loaded.";
      case "deviceCheck":
        return "Device compatibility check complete.";
      case "submitting":
        return "Saving your information. Please wait.";
      case "success":
        return "Your information has been saved successfully. You are now ready to record your video testimonial.";
      case "error":
        return `Error: ${submitError}`;
      case "uploading":
        return "Uploading your video. Please wait.";
      case "processing":
        return "Submitting your video. Please wait.";
      case "completed":
        return "Your video has been submitted successfully.";
      case "uploadError":
        return `Upload error: ${errorMessage}`;
      case "processError":
        return `Processing error: ${errorMessage}`;
      default:
        return "";
    }
  }, [formState, submitError, errorMessage]);

  const estimatedUploadRemainingSeconds = useMemo(() => {
    if (!uploadStartedAt || uploadProgress <= 5 || uploadProgress >= 100) return null;
    const elapsedSeconds = (Date.now() - uploadStartedAt) / 1000;
    const estimatedTotal = elapsedSeconds / (uploadProgress / 100);
    return Math.max(0, Math.round(estimatedTotal - elapsedSeconds));
  }, [uploadProgress, uploadStartedAt]);

  // Handle recording complete - upload and process video
  const handleRecordingComplete = useCallback(
    async (blob: Blob, durationMs?: number) => {
      const derivedDurationSeconds = durationMs
        ? Math.round(durationMs / 1000)
        : await getVideoDurationSeconds(blob);
      const durationSeconds = Math.max(1, derivedDurationSeconds);
      const mediaMimeType = blob.type || "video/webm";
      const codec = mediaMimeType.includes("codecs=")
        ? mediaMimeType.split("codecs=")[1]?.split(",")[0]?.trim() || undefined
        : undefined;
      const nextIdempotencyKey =
        submissionIdempotencyKey ||
        (globalThis.crypto?.randomUUID?.() ||
          `vt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

      console.log("[VideoTestimonial] Recording complete", {
        size: blob.size,
        type: blob.type,
        durationSeconds,
      });

      // Store blob for potential retry
      setPendingBlob(blob);
      setPendingDuration(durationSeconds);
      setSubmissionIdempotencyKey(nextIdempotencyKey);

      try {
        setFormState("uploading");
        setUploadProgress(0);
        setUploadStartedAt(Date.now());
        setErrorMessage(null);
        // Clear stale thumbnail state from previous attempts
        setUploadedThumbnailPath(null);
        setUploadSessionId(null);

        // 1. Generate thumbnail from video (don't block on failure)
        console.log("[VideoTestimonial] Generating thumbnail...");
        const thumbnailBlob = await generateThumbnailFromVideo(blob);
        if (thumbnailBlob) {
          console.log("[VideoTestimonial] Thumbnail generated", { size: thumbnailBlob.size });
        } else {
          console.log("[VideoTestimonial] Thumbnail generation failed, proceeding without thumbnail");
        }

        // 2. Get signed upload URLs for video and thumbnail
        const uploadUrlResult = await createVideoUploadUrls({
          token: request.token,
          mimeType: mediaMimeType,
          durationMs: durationSeconds * 1000,
          fileSizeBytes: blob.size,
        });
        if (!uploadUrlResult.success || !uploadUrlResult.data) {
          throw new Error(uploadUrlResult.error || "Failed to get upload URLs");
        }

        const {
          videoUploadUrl,
          videoStoragePath,
          thumbnailUploadUrl,
          thumbnailStoragePath,
          uploadSessionId: nextUploadSessionId,
        } = uploadUrlResult.data;
        setUploadedStoragePath(videoStoragePath);
        setUploadSessionId(nextUploadSessionId);

        // 3. Upload video and thumbnail in parallel
        const controller = new globalThis.AbortController();
        setAbortController(controller);

        const uploadPromises: Promise<void>[] = [
          uploadWithRetry({
            uploadUrl: videoUploadUrl,
            blob,
            signal: controller.signal,
            onProgress: setUploadProgress,
          }),
        ];

        // Only upload thumbnail if we have one
        let thumbnailPath: string | undefined;
        if (thumbnailBlob) {
          uploadPromises.push(
            uploadThumbnailWithRetry({
              uploadUrl: thumbnailUploadUrl,
              blob: thumbnailBlob,
              signal: controller.signal,
            })
          );
          thumbnailPath = thumbnailStoragePath;
          setUploadedThumbnailPath(thumbnailStoragePath);
        }

        await Promise.all(uploadPromises);
        setAbortController(null);
        setUploadStartedAt(null);

        // 4. Submit for AI processing
        setFormState("processing");

        const result = await submitVideoTestimonial({
          token: request.token,
          storagePath: videoStoragePath,
          durationSeconds,
          thumbnailPath,
          uploadSessionId: nextUploadSessionId,
          idempotencyKey: nextIdempotencyKey,
          mediaMetadata: {
            mimeType: mediaMimeType,
            codec,
            fileSizeBytes: blob.size,
          },
        });

        if (result.success) {
          setFormState("completed");
        } else {
          setErrorMessage(result.error || "Processing failed");
          setFormState("processError");
        }
      } catch (error) {
        // Handle abort
        if (error instanceof globalThis.DOMException && error.name === "AbortError") {
          // User cancelled, return to recording state
          setFormState("success");
          setAbortController(null);
          setUploadStartedAt(null);
          return;
        }

        console.error("[VideoTestimonial] Upload/processing error:", error);
        setErrorMessage(error instanceof Error ? error.message : "Upload failed");
        setFormState("uploadError");
        setAbortController(null);
        setUploadStartedAt(null);
      }
    },
    [request.token, submissionIdempotencyKey]
  );

  // Retry upload handler
  const handleRetryUpload = useCallback(() => {
    if (pendingBlob) {
      handleRecordingComplete(pendingBlob, pendingDuration * 1000);
    }
  }, [pendingBlob, pendingDuration, handleRecordingComplete]);

  // Retry processing handler (skip upload, just re-process)
  const handleRetryProcessing = useCallback(async () => {
    if (!uploadedStoragePath) {
      // Fall back to full retry if no storage path
      handleRetryUpload();
      return;
    }

    try {
      setFormState("processing");
      setErrorMessage(null);

      const result = await submitVideoTestimonial({
        token: request.token,
        storagePath: uploadedStoragePath,
        durationSeconds: pendingDuration,
        thumbnailPath: uploadedThumbnailPath || undefined,
        uploadSessionId: uploadSessionId || undefined,
        idempotencyKey: submissionIdempotencyKey || undefined,
        mediaMetadata: {
          mimeType: pendingBlob?.type || undefined,
          codec:
            pendingBlob?.type && pendingBlob.type.includes("codecs=")
              ? pendingBlob.type.split("codecs=")[1]?.split(",")[0]?.trim()
              : undefined,
          fileSizeBytes: pendingBlob?.size,
        },
      });

      if (result.success) {
        setFormState("completed");
      } else {
        setErrorMessage(result.error || "Processing failed");
        setFormState("processError");
      }
    } catch (error) {
      console.error("[VideoTestimonial] Retry processing error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Processing failed");
      setFormState("processError");
    }
  }, [
    uploadedStoragePath,
    uploadedThumbnailPath,
    uploadSessionId,
    submissionIdempotencyKey,
    pendingDuration,
    pendingBlob,
    request.token,
    handleRetryUpload,
  ]);

  // Return to recording state
  const handleReRecord = useCallback(() => {
    setPendingBlob(null);
    setPendingDuration(0);
    setUploadedStoragePath(null);
    setUploadedThumbnailPath(null);
    setUploadSessionId(null);
    setSubmissionIdempotencyKey(null);
    setErrorMessage(null);
    setFormState("success");
  }, []);

  // Cancel upload
  const handleCancelUpload = useCallback(() => {
    if (abortController) {
      abortController.abort();
    }
  }, [abortController]);

  const handleFallbackFileSelected = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("video/")) {
        setErrorMessage("Please choose a valid video file.");
        setFormState("uploadError");
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        setErrorMessage("Video file must be smaller than 100MB.");
        setFormState("uploadError");
        return;
      }

      setIsFallbackFilePending(true);
      try {
        const durationSeconds = await getVideoDurationSeconds(file);
        if (durationSeconds <= 0) {
          setErrorMessage("Could not determine video duration. The file may be corrupted or unplayable.");
          setFormState("uploadError");
          return;
        }
        if (durationSeconds > request.maxDurationSeconds) {
          setErrorMessage(
            `Video is too long. Please keep it under ${Math.round(request.maxDurationSeconds / 60)} minutes.`
          );
          setFormState("uploadError");
          return;
        }

        await handleRecordingComplete(file, durationSeconds * 1000);
      } finally {
        setIsFallbackFilePending(false);
        if (event.target) {
          event.target.value = "";
        }
      }
    },
    [handleRecordingComplete, request.maxDurationSeconds]
  );

  // ===========================================================================
  // Conditional Renders - all hooks must be above this line
  // ===========================================================================

  if (formState === "preflight") {
    return (
      <FormContainer statusMessage={statusMessage}>
        <Card className="mx-auto max-w-lg shadow-lg">
          <CardHeader>
            <CardTitle className="font-sans text-xl text-repwell-teal-500">
              You Have a New Video Review Request
            </CardTitle>
            <CardDescription className="font-sans">
              This usually takes 2-3 minutes. A stable internet connection works best.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              <p className="font-sans font-medium text-repwell-teal-500">Before you start:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 font-sans text-muted-foreground">
                <li>Use a quiet room with good lighting.</li>
                <li>Have camera + microphone enabled.</li>
                <li>Keep your testimonial under {Math.round(request.maxDurationSeconds / 60)} minutes.</li>
              </ul>
            </div>

            <div className="rounded-lg border border-repwell-sage-200/40 bg-repwell-sage-100/20 p-4 text-sm">
              <p className="font-sans font-medium text-repwell-teal-500">Need to switch devices?</p>
              <p className="mt-1 font-sans text-muted-foreground">
                Open the original email on the other device, or copy this link now.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-3 w-full"
                onClick={handleCopyCurrentLink}
              >
                {preflightCopied ? "Link Copied" : "Copy Current Link"}
              </Button>
            </div>

            <Button
              type="button"
              className="w-full"
              style={buttonStyle}
              onClick={() => setFormState("form")}
            >
              Continue on This Device
            </Button>
            <Button type="button" variant="outline" className="w-full" asChild>
              <a href={requestNewLinkHref}>Request New Link</a>
            </Button>
          </CardContent>
        </Card>
      </FormContainer>
    );
  }

  if (formState === "deviceCheck") {
    const allChecksPassed =
      deviceCheck.browserSupported &&
      deviceCheck.mediaDevicesSupported &&
      deviceCheck.cameraLikelyAvailable &&
      deviceCheck.microphoneLikelyAvailable;

    return (
      <FormContainer statusMessage={statusMessage}>
        <Card className="mx-auto max-w-lg shadow-lg">
          <CardHeader>
            <CardTitle className="font-sans text-xl text-repwell-teal-500">
              Quick Device Check
            </CardTitle>
            <CardDescription className="font-sans">
              Confirming camera, microphone, and browser support before recording.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 rounded-lg border p-4 text-sm">
              <p className="flex items-center justify-between font-sans">
                <span>Browser recording support</span>
                <span>{deviceCheck.browserSupported ? "Ready" : "Not supported"}</span>
              </p>
              <p className="flex items-center justify-between font-sans">
                <span>Media devices API</span>
                <span>{deviceCheck.mediaDevicesSupported ? "Ready" : "Not available"}</span>
              </p>
              <p className="flex items-center justify-between font-sans">
                <span>Camera detected</span>
                <span>{deviceCheck.cameraLikelyAvailable ? "Detected" : "Not detected"}</span>
              </p>
              <p className="flex items-center justify-between font-sans">
                <span>Microphone detected</span>
                <span>{deviceCheck.microphoneLikelyAvailable ? "Detected" : "Not detected"}</span>
              </p>
            </div>

            <Button
              type="button"
              className="w-full"
              style={buttonStyle}
              onClick={() => setFormState("success")}
            >
              {allChecksPassed ? "Start Recording" : "Continue to Recording Options"}
            </Button>

            {!allChecksPassed && (
              <p className="text-center font-sans text-xs text-muted-foreground">
                If checks fail, use the fallback file upload option in the next step.
              </p>
            )}
          </CardContent>
        </Card>
      </FormContainer>
    );
  }

  // Submitting state
  if (formState === "submitting") {
    return (
      <FormContainer statusMessage={statusMessage}>
        <Card className="mx-auto max-w-lg shadow-lg">
          <CardContent className="flex min-h-[300px] flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-repwell-teal-300" />
            <p className="mt-4 font-sans text-lg font-medium text-repwell-teal-500">
              Saving your information...
            </p>
            <p className="mt-2 font-sans text-sm text-muted-foreground">Please wait a moment</p>
          </CardContent>
        </Card>
      </FormContainer>
    );
  }

  // Error state
  if (formState === "error") {
    return (
      <FormContainer statusMessage={statusMessage}>
        <Card className="mx-auto max-w-lg shadow-lg">
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <XCircle className="h-10 w-10" aria-label="Error" />
            </div>
            <h2 className="font-sans text-2xl font-semibold text-repwell-teal-500">
              Something went wrong
            </h2>
            <p className="mt-2 font-sans text-muted-foreground">{submitError}</p>
            <Button
              className="mt-6"
              onClick={() => {
                setFormState("form");
                setSubmitError(null);
              }}
              style={buttonStyle}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </FormContainer>
    );
  }

  // Upload progress state
  if (formState === "uploading") {
    return (
      <FormContainer statusMessage="Uploading your video. Please wait.">
        <Card className="mx-auto max-w-lg shadow-lg">
          <CardContent className="flex min-h-[300px] flex-col items-center justify-center py-12">
            <Upload className="h-12 w-12 text-repwell-teal-300 animate-pulse" />
            <h2 className="mt-4 font-sans text-xl font-semibold text-repwell-teal-500">
              Uploading Video
            </h2>
            <p className="mt-2 font-sans text-sm text-muted-foreground">
              Please keep this page open
            </p>
            <div className="mt-6 w-full max-w-xs">
              <Progress value={uploadProgress} className="h-2" />
              <p className="mt-2 text-center font-sans text-sm font-medium text-repwell-teal-400">
                {uploadProgress}%
              </p>
              {estimatedUploadRemainingSeconds !== null && (
                <p className="mt-1 text-center font-sans text-xs text-muted-foreground">
                  Est. {estimatedUploadRemainingSeconds}s remaining
                </p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleCancelUpload}
              className="mt-6"
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      </FormContainer>
    );
  }

  // Processing state
  if (formState === "processing") {
    return (
      <FormContainer statusMessage="Submitting your video. Please wait.">
        <Card className="mx-auto max-w-lg shadow-lg">
          <CardContent className="flex min-h-[300px] flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-repwell-teal-300 animate-spin" />
            <h2 className="mt-4 font-sans text-xl font-semibold text-repwell-teal-500">
              Submitting Your Video
            </h2>
            <p className="mt-2 font-sans text-sm text-muted-foreground">
              This may take a moment. Please don&apos;t close this page.
            </p>
          </CardContent>
        </Card>
      </FormContainer>
    );
  }

  // Completed state — final screen for the customer
  if (formState === "completed") {
    return (
      <FormContainer statusMessage="Your video has been submitted successfully.">
        <Card className="mx-auto max-w-lg shadow-lg">
          <CardContent className="flex min-h-[300px] flex-col items-center justify-center py-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-repwell-sage-200/20">
              <CheckCircle2 className="h-10 w-10 text-repwell-sage-200" />
            </div>
            <h2 className="mt-4 font-sans text-xl font-semibold text-repwell-teal-500">
              Thank You!
            </h2>
            <p className="mt-2 max-w-sm text-center font-sans text-sm text-muted-foreground">
              Your video testimonial has been submitted successfully. The team will be notified.
            </p>
          </CardContent>
        </Card>
      </FormContainer>
    );
  }

  // Upload error state
  if (formState === "uploadError") {
    return (
      <FormContainer statusMessage={`Upload error: ${errorMessage}`}>
        <Card className="mx-auto max-w-lg border-destructive/50 shadow-lg">
          <CardContent className="flex min-h-[300px] flex-col items-center justify-center py-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="mt-4 font-sans text-xl font-semibold text-repwell-teal-500">
              Upload Failed
            </h2>
            <p className="mt-2 max-w-sm text-center font-sans text-sm text-muted-foreground">
              {errorMessage || "There was a problem uploading your video."}
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={handleReRecord}>
                Re-record
              </Button>
              <Button onClick={handleRetryUpload} style={buttonStyle}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </FormContainer>
    );
  }

  // Processing error state
  if (formState === "processError") {
    return (
      <FormContainer statusMessage={`Processing error: ${errorMessage}`}>
        <Card className="mx-auto max-w-lg border-destructive/50 shadow-lg">
          <CardContent className="flex min-h-[300px] flex-col items-center justify-center py-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="mt-4 font-sans text-xl font-semibold text-repwell-teal-500">
              Processing Failed
            </h2>
            <p className="mt-2 max-w-sm text-center font-sans text-sm text-muted-foreground">
              {errorMessage || "There was a problem processing your video."}
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={handleReRecord}>
                Re-record
              </Button>
              <Button onClick={handleRetryProcessing} style={buttonStyle}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </FormContainer>
    );
  }

  // Success state - ready for video recording
  if (formState === "success") {
    return (
      <FormContainer statusMessage={statusMessage}>
        <div className="mx-auto max-w-lg space-y-6">
          {/* Header */}
          <Card className="shadow-lg">
            <CardContent className="py-6 text-center">
              <p className="mb-2 font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Step 4 of 4: Record and submit
              </p>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-repwell-sage-200/20 text-repwell-sage-200">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="font-sans text-xl font-semibold text-repwell-teal-500">
                You&apos;re all set, {displayName}!
              </h2>
              <p className="mt-2 font-sans text-sm text-muted-foreground">
                Record your video testimonial for {professional.fullName}
              </p>
              {promptText && (
                <div className="mt-4 rounded-lg bg-muted/50 p-4 text-left">
                  <p className="font-sans text-xs font-medium text-muted-foreground">
                    Prompt from {professional.fullName}:
                  </p>
                  <p className="mt-1 font-sans text-sm italic text-foreground">
                    &quot;{promptText}&quot;
                  </p>
                </div>
              )}

              <div className="mt-4 rounded-lg border border-repwell-sage-200/40 bg-repwell-sage-100/20 p-3 text-left">
                <p className="font-sans text-xs font-medium text-repwell-teal-500">Quality tips:</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 font-sans text-xs text-muted-foreground">
                  <li>Face a window or soft light source</li>
                  <li>Keep camera at eye level</li>
                  <li>Mention one specific outcome</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Video Recorder */}
          <VideoRecorder
            maxDuration={request.maxDurationSeconds * 1000}
            onRecordingComplete={handleRecordingComplete}
            primaryColor={organization.primaryColor || undefined}
            autoRequestPermissions={false}
          />

          {/* Fallback file upload */}
          <Card className="border-dashed">
            <CardContent className="space-y-3 py-4">
              <p className="font-sans text-sm font-medium text-repwell-teal-500">
                Camera not working? Upload a video file instead.
              </p>
              <p className="font-sans text-xs text-muted-foreground">
                MP4, MOV, or WebM up to 100MB. We&apos;ll process it the same way.
              </p>
              <input
                ref={fallbackFileRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm,video/*"
                className="hidden"
                onChange={handleFallbackFileSelected}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fallbackFileRef.current?.click()}
                disabled={isFallbackFilePending}
              >
                {isFallbackFilePending ? "Preparing upload..." : "Upload Existing Video"}
              </Button>
            </CardContent>
          </Card>

          {/* Organization branding */}
          {organization.logoUrl && (
            <div className="flex justify-center opacity-60">
              <img
                src={organization.logoUrl}
                alt={organization.name}
                className="h-8 max-w-[150px] object-contain"
              />
            </div>
          )}
        </div>
      </FormContainer>
    );
  }

  // Main form
  return (
    <FormContainer statusMessage={statusMessage}>
      <Card className="mx-auto max-w-lg shadow-lg">
        <CardHeader className="space-y-4 pb-4">
          {organization.logoUrl && (
            <div className="flex justify-center">
              <img
                src={organization.logoUrl}
                alt={organization.name}
                className="h-12 max-w-[200px] object-contain"
              />
            </div>
          )}

          {/* Header */}
          <div className="text-center">
            <p className="mb-1 font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Step 2 of 4: Identity and consent
            </p>
            <CardTitle className="font-sans text-xl text-repwell-teal-500">
              Share Your Experience
            </CardTitle>
            <CardDescription className="mt-1.5 font-sans">
              Record a short video testimonial about working with {professional.fullName}
            </CardDescription>
          </div>

          {/* Loan Officer Info */}
          <div className="flex items-center justify-center gap-3 rounded-lg bg-muted/50 p-4">
            {professional.photoUrl ? (
              <img
                src={professional.photoUrl}
                alt={professional.fullName}
                className="h-14 w-14 rounded-full object-cover ring-2 ring-background"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-repwell-teal-300/10 text-lg font-semibold text-repwell-teal-300">
                {professional.fullName.charAt(0)}
              </div>
            )}
            <div className="text-left">
              <p className="font-sans font-medium text-repwell-teal-500">{professional.fullName}</p>
              {professional.title && (
                <p className="font-sans text-sm text-muted-foreground">{professional.title}</p>
              )}
              <p className="font-sans text-xs text-muted-foreground">{organization.name}</p>
            </div>
          </div>

          {/* Prompt Text */}
          {promptText && (
            <div className="rounded-lg border border-repwell-sage-200/30 bg-repwell-sage-100/20 p-4">
              <p className="font-sans text-sm italic text-repwell-teal-400">&ldquo;{promptText}&rdquo;</p>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Info Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="font-sans text-sm font-medium">
                  Your Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  ref={nameInputRef}
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How would you like to be identified?"
                  className="font-sans"
                  required
                />
                <p className="font-sans text-xs text-muted-foreground">
                  This name will appear with your testimonial
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationship" className="font-sans text-sm font-medium">
                  Your Relationship <span className="text-destructive">*</span>
                </Label>
                <Select value={relationship} onValueChange={(v) => setRelationship(v as RelationshipType)} required>
                  <SelectTrigger id="relationship" className="font-sans">
                    <SelectValue placeholder="How did you work together?" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="font-sans">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Consent Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-repwell-teal-500">
                <Shield className="h-4 w-4" />
                <span className="font-sans">Required Consents</span>
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                {/* Video Recording Consent */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="nilConsent"
                    checked={nilConsent}
                    onCheckedChange={(checked) => setNilConsent(checked === true)}
                    className="mt-0.5"
                    aria-required="true"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="nilConsent"
                      className="flex cursor-pointer items-center gap-2 font-sans text-sm font-medium"
                    >
                      <Video className="h-4 w-4 text-repwell-teal-300" />
                      Name, Image, Likeness, and Voice Consent <span className="text-destructive">*</span>
                    </Label>
                    <p className="font-sans text-xs text-muted-foreground">
                      I consent to use of my name, image, likeness, and voice in testimonial
                      content and related marketing materials.
                    </p>
                  </div>
                </div>

                {/* Usage Rights Consent */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="usageRightsConsent"
                    checked={usageRightsConsent}
                    onCheckedChange={(checked) => setUsageRightsConsent(checked === true)}
                    className="mt-0.5"
                    aria-required="true"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="usageRightsConsent"
                      className="flex cursor-pointer items-center gap-2 font-sans text-sm font-medium"
                    >
                      <FileText className="h-4 w-4 text-repwell-teal-300" />
                      Usage Rights <span className="text-destructive">*</span>
                    </Label>
                    <p className="font-sans text-xs text-muted-foreground">
                      I grant permission to use my testimonial across website pages, social media,
                      email campaigns, and related marketing channels.
                    </p>
                  </div>
                </div>

                {/* AI Text Generation Consent */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="aiTextGenerationConsent"
                    checked={aiTextGenerationConsent}
                    onCheckedChange={(checked) => setAiTextGenerationConsent(checked === true)}
                    className="mt-0.5"
                    aria-required="true"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="aiTextGenerationConsent"
                      className="flex cursor-pointer items-center gap-2 font-sans text-sm font-medium"
                    >
                      <Sparkles className="h-4 w-4 text-repwell-teal-300" />
                      AI Text Generation <span className="text-destructive">*</span>
                    </Label>
                    <p className="font-sans text-xs text-muted-foreground">
                      I consent to transcription and AI-generated draft text from this video.
                    </p>
                  </div>
                </div>
              </div>

              <p className="font-sans text-xs text-muted-foreground">
                Consent version: {VIDEO_TESTIMONIAL_CONSENT_VERSION}
              </p>

              {/* Optional Marketing Consent */}
              <div className="flex items-start gap-3 px-1">
                <Checkbox
                  id="marketingConsent"
                  checked={marketingConsent}
                  onCheckedChange={(checked) => setMarketingConsent(checked === true)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="marketingConsent"
                    className="cursor-pointer font-sans text-sm font-medium"
                  >
                    Marketing Communications (Optional)
                  </Label>
                  <p className="font-sans text-xs text-muted-foreground">
                    I&apos;d like to receive occasional updates and promotional materials
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!isFormValid || isPending}
              className="w-full gap-2"
              style={buttonStyle}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Video className="h-4 w-4" />
                  Continue to Device Check
                </>
              )}
            </Button>

            {/* Form validation hint */}
            {!isFormValid && (
              <p className="text-center font-sans text-xs text-muted-foreground">
                Please complete all required fields and consent checkboxes to continue
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="mt-4 text-center font-sans text-xs text-muted-foreground">
        Your privacy is important to us. Your video will only be used as described above.
      </p>
    </FormContainer>
  );
}

// Container component with consistent styling and ARIA live region
function FormContainer({
  children,
  statusMessage,
}: {
  children: React.ReactNode;
  statusMessage?: string;
}) {
  return (
    <div className="min-h-screen bg-[#f8faf8] px-4 py-8 sm:py-12">
      {/* ARIA live region for screen reader announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </div>
      <div className="mx-auto max-w-lg">{children}</div>
    </div>
  );
}
