"use client";

import { useState, useTransition, useRef, useMemo, useEffect, useCallback } from "react";

import { Button } from "@/components/ui/button";
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
  Clock,
  ArrowsClockwise,
  Eye,
  Sun,
  ChatCircleText,
  Quotes,
} from "@phosphor-icons/react";
import posthog from "posthog-js";
import { VideoRecorder } from "@/components/video-testimonials/video-recorder";
import { TestimonialShell, StepRail, ProBadge, Panel, firstName } from "./testimonial-shell";
import { RatingStars } from "./rating-stars";
import { HighPathThankYou } from "./high-path-thank-you";
import { LowPathThankYou } from "./low-path-thank-you";

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

const RECORDING_TIPS = [
  { icon: Sun, text: "Face a window" },
  { icon: Eye, text: "Camera at eye level" },
  { icon: ChatCircleText, text: "Mention one specific outcome" },
];

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
  const [rating, setRating] = useState(0);
  const [celebration, setCelebration] = useState<boolean | null>(null);
  const [nilConsent, setNilConsent] = useState(false);
  const [usageRightsConsent, setUsageRightsConsent] = useState(false);
  const [aiTextGenerationConsent, setAiTextGenerationConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  // UI state
  const [formState, setFormState] = useState<FormState>("preflight");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
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

  const customerFirst = firstName(displayName || request.customerName || "there");
  const proFirst = firstName(professional.fullName);
  const maxMinutes = Math.max(1, Math.round(request.maxDurationSeconds / 60));

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
    rating >= 1 &&
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
          rating,
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
        posthog.capture("video_testimonial_consent_submitted", {
          professional_id: professional.id,
          organization_id: organization.id,
          rating,
          relationship,
          marketing_consent: marketingConsent,
        });
        setCelebration(result.data?.celebration ?? null);
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
        return "Video testimonial invitation loaded.";
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
        const thumbnailBlob = await generateThumbnailFromVideo(blob);

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
          posthog.capture("video_testimonial_completed", {
            professional_id: professional.id,
            organization_id: organization.id,
            duration_seconds: durationSeconds,
            file_size_bytes: blob.size,
          });
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
    [request.token, submissionIdempotencyKey, organization.id, professional.id]
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

  const orgFooter = organization.logoUrl ? (
    <div className="mb-4 flex justify-center">
      <img
        src={organization.logoUrl}
        alt={organization.name}
        className="h-12 max-w-[220px] object-contain"
      />
    </div>
  ) : undefined;

  // ===========================================================================
  // Conditional Renders - all hooks must be above this line
  // ===========================================================================

  if (formState === "preflight") {
    return (
      <TestimonialShell statusMessage={statusMessage} footer={orgFooter}>
        <div className="flex flex-1 animate-fade-in-up flex-col justify-center text-center">
          {/* Professional portrait with decorative accent */}
          <div className="relative mx-auto mb-7 h-24 w-24">
            <div
              aria-hidden
              className="absolute -bottom-2 -right-2 h-9 w-9 rotate-12 rounded-xl bg-repwell-sage-200/70"
            />
            <div
              aria-hidden
              className="absolute -left-3 top-1 h-4 w-4 rounded-full bg-repwell-teal-300/50"
            />
            {professional.photoUrl ? (
              <img
                src={professional.photoUrl}
                alt={professional.fullName}
                className="relative z-10 h-24 w-24 rounded-full object-cover ring-4 ring-white shadow-medium"
              />
            ) : (
              <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-repwell-teal-400 font-display text-3xl text-white ring-4 ring-white shadow-medium">
                {professional.fullName.charAt(0)}
              </div>
            )}
          </div>

          <p className="font-sans text-xs font-semibold uppercase tracking-wider text-repwell-teal-300">
            A personal request from {professional.fullName}
          </p>

          <h1 className="mt-3 text-balance font-display text-4xl tracking-tight text-repwell-teal-500 sm:text-5xl">
            {customerFirst}, will you share your story?
          </h1>

          <p className="mx-auto mt-4 max-w-md font-sans text-base leading-relaxed text-repwell-teal-400">
            {proFirst} would love a short video about your experience working together.
            It takes a couple of minutes, and you can re-record as many times as you like.
          </p>

          {promptText && (
            <figure className="relative mx-auto mt-8 max-w-md text-left">
              <Quotes
                weight="fill"
                aria-hidden
                className="absolute -left-2 -top-3 h-8 w-8 text-repwell-sage-200/50"
              />
              <blockquote className="rounded-2xl bg-repwell-sage-100/30 px-6 py-5">
                <p className="font-display text-lg italic leading-relaxed text-repwell-teal-500">
                  {promptText}
                </p>
                <figcaption className="mt-2 font-sans text-xs font-medium text-repwell-teal-300">
                  {professional.fullName}
                  {professional.title ? `, ${professional.title}` : ""}
                </figcaption>
              </blockquote>
            </figure>
          )}

          {/* What to expect */}
          <ul className="mx-auto mt-9 flex max-w-md flex-col items-start gap-3 text-left sm:flex-row sm:items-stretch sm:gap-0 sm:divide-x sm:divide-repwell-sage-100">
            {[
              { icon: Clock, text: `About ${maxMinutes <= 2 ? "two" : maxMinutes} minutes` },
              { icon: ArrowsClockwise, text: "Re-record anytime" },
              { icon: Eye, text: "Preview before you send" },
            ].map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-2.5 sm:flex-1 sm:flex-col sm:gap-2 sm:px-4 sm:text-center"
              >
                <Icon weight="duotone" size={22} className="shrink-0 text-repwell-teal-300" />
                <span className="font-sans text-sm text-repwell-teal-400">{text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <Button
              type="button"
              size="lg"
              className="min-w-[240px] gap-2 text-base shadow-medium"
              style={buttonStyle}
              onClick={() => {
                posthog.capture("video_testimonial_started", {
                  professional_id: professional.id,
                  organization_id: organization.id,
                });
                setFormState("form");
              }}
            >
              <Video weight="fill" className="h-5 w-5" />
              Let&apos;s do it
            </Button>
            <p className="mt-4 font-sans text-xs text-repwell-teal-300">
              Works best in a quiet, well-lit spot. Phone or laptop, either is great.
            </p>
          </div>
        </div>
      </TestimonialShell>
    );
  }

  if (formState === "deviceCheck") {
    const checks = [
      { label: "Browser supports recording", ok: deviceCheck.browserSupported },
      { label: "Media access available", ok: deviceCheck.mediaDevicesSupported },
      { label: "Camera detected", ok: deviceCheck.cameraLikelyAvailable },
      { label: "Microphone detected", ok: deviceCheck.microphoneLikelyAvailable },
    ];
    const allChecksPassed = checks.every((c) => c.ok);

    return (
      <TestimonialShell statusMessage={statusMessage} footer={orgFooter}>
        <StepRail current={2} />
        <div className="flex flex-1 animate-fade-in-up flex-col justify-center text-center">
          <h1 className="font-display text-3xl tracking-tight text-repwell-teal-500">
            Checking your setup
          </h1>
          <p className="mt-2 font-sans text-sm text-repwell-teal-400">
            One quick look at your camera, microphone, and browser before you record.
          </p>

          <Panel className="mx-auto mt-8 max-w-sm p-2">
            <ul className="divide-y divide-[#eef2ee]">
              {checks.map(({ label, ok }) => (
                <li key={label} className="flex items-center justify-between gap-6 px-4 py-3.5">
                  <span className="font-sans text-sm text-repwell-teal-400">{label}</span>
                  {ok ? (
                    <span className="flex items-center gap-1.5 font-sans text-xs font-semibold text-repwell-sage-200">
                      <CheckCircle2 weight="fill" size={18} className="text-repwell-sage-200" />
                      Ready
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 font-sans text-xs font-semibold text-[#c47c7c]">
                      <XCircle weight="fill" size={18} />
                      Not found
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Panel>

          <Button
            type="button"
            size="lg"
            className="mt-8 min-w-[240px] gap-2 self-center text-base shadow-medium"
            style={buttonStyle}
            onClick={() => setFormState("success")}
          >
            {allChecksPassed ? "Start recording" : "Continue anyway"}
          </Button>

          {!allChecksPassed && (
            <p className="mx-auto mt-4 max-w-sm font-sans text-xs text-repwell-teal-300">
              No camera? No problem. On the next step you can upload a video recorded
              on another device instead.
            </p>
          )}
        </div>
      </TestimonialShell>
    );
  }

  // Submitting state
  if (formState === "submitting") {
    return (
      <TestimonialShell statusMessage={statusMessage} footer={orgFooter}>
        <StepRail current={1} />
        <CenteredState
          icon={<Loader2 className="h-10 w-10 animate-spin text-repwell-teal-300" />}
          title="Saving your details"
          body="Just a moment."
        />
      </TestimonialShell>
    );
  }

  // Error state
  if (formState === "error") {
    return (
      <TestimonialShell statusMessage={statusMessage} footer={orgFooter}>
        <StepRail current={1} />
        <CenteredState
          icon={<XCircle weight="duotone" className="h-10 w-10 text-[#c47c7c]" />}
          iconBg="bg-[#c47c7c]/10"
          title="Something went wrong"
          body={submitError || "We couldn't save your details."}
        >
          <Button
            className="mt-2"
            onClick={() => {
              setFormState("form");
              setSubmitError(null);
            }}
            style={buttonStyle}
          >
            Try again
          </Button>
        </CenteredState>
      </TestimonialShell>
    );
  }

  // Upload progress state
  if (formState === "uploading") {
    return (
      <TestimonialShell statusMessage="Uploading your video. Please wait." footer={orgFooter}>
        <StepRail current={2} />
        <CenteredState
          icon={<Upload weight="duotone" className="h-10 w-10 animate-pulse text-repwell-teal-300" />}
          title="Sending your video"
          body="Please keep this page open while it uploads."
        >
          <div className="mt-2 w-full max-w-xs">
            <Progress value={uploadProgress} className="h-2" />
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-sans text-sm font-semibold text-repwell-teal-400">
                {uploadProgress}%
              </span>
              {estimatedUploadRemainingSeconds !== null && (
                <span className="font-sans text-xs text-repwell-teal-300">
                  about {estimatedUploadRemainingSeconds}s left
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCancelUpload} className="mt-4">
            Cancel
          </Button>
        </CenteredState>
      </TestimonialShell>
    );
  }

  // Processing state
  if (formState === "processing") {
    return (
      <TestimonialShell statusMessage="Submitting your video. Please wait." footer={orgFooter}>
        <StepRail current={2} />
        <CenteredState
          icon={<Loader2 className="h-10 w-10 animate-spin text-repwell-teal-300" />}
          title="Almost there"
          body="Finishing up your submission. Please don't close this page."
        />
      </TestimonialShell>
    );
  }

  // Completed state — branches on the celebration threshold (ADR 0001)
  if (formState === "completed") {
    return (
      <TestimonialShell
        statusMessage="Your video has been submitted successfully."
        footer={orgFooter}
      >
        <StepRail current={3} />
        {celebration === true ? (
          <HighPathThankYou
            request={request}
            customerFirst={customerFirst}
            buttonStyle={buttonStyle}
          />
        ) : (
          <LowPathThankYou
            token={request.token}
            customerFirst={customerFirst}
            professionalName={professional.fullName}
            buttonStyle={buttonStyle}
          />
        )}
      </TestimonialShell>
    );
  }

  // Upload error state
  if (formState === "uploadError") {
    return (
      <TestimonialShell statusMessage={`Upload error: ${errorMessage}`} footer={orgFooter}>
        <StepRail current={2} />
        <CenteredState
          icon={<AlertCircle weight="duotone" className="h-10 w-10 text-[#c47c7c]" />}
          iconBg="bg-[#c47c7c]/10"
          title="The upload didn't go through"
          body={errorMessage || "There was a problem uploading your video. Your recording is safe, so just try again."}
        >
          <div className="mt-2 flex gap-3">
            <Button variant="outline" onClick={handleReRecord}>
              Re-record
            </Button>
            <Button onClick={handleRetryUpload} style={buttonStyle}>
              Try again
            </Button>
          </div>
        </CenteredState>
      </TestimonialShell>
    );
  }

  // Processing error state
  if (formState === "processError") {
    return (
      <TestimonialShell statusMessage={`Processing error: ${errorMessage}`} footer={orgFooter}>
        <StepRail current={2} />
        <CenteredState
          icon={<AlertCircle weight="duotone" className="h-10 w-10 text-[#c47c7c]" />}
          iconBg="bg-[#c47c7c]/10"
          title="We hit a snag"
          body={errorMessage || "There was a problem processing your video. Your upload is safe, so just try again."}
        >
          <div className="mt-2 flex gap-3">
            <Button variant="outline" onClick={handleReRecord}>
              Re-record
            </Button>
            <Button onClick={handleRetryProcessing} style={buttonStyle}>
              Try again
            </Button>
          </div>
        </CenteredState>
      </TestimonialShell>
    );
  }

  // Success state - ready for video recording
  if (formState === "success") {
    return (
      <TestimonialShell statusMessage={statusMessage} footer={orgFooter} wide>
        <StepRail current={2} />
        <div className="animate-fade-in-up space-y-6">
          <div className="text-center">
            <h1 className="font-display text-3xl tracking-tight text-repwell-teal-500 sm:text-4xl">
              You&apos;re on, {customerFirst}.
            </h1>
            <p className="mt-2 font-sans text-sm text-repwell-teal-400">
              Speak naturally, like you&apos;re telling a friend about working with {proFirst}.
            </p>
          </div>

          {/* Talking points */}
          <div className="mx-auto max-w-lg rounded-2xl bg-repwell-sage-100/30 px-6 py-5">
            <p className="font-sans text-xs font-semibold uppercase tracking-wider text-repwell-teal-300">
              If you&apos;re not sure where to start
            </p>
            {promptText ? (
              <p className="mt-2 font-display text-base italic leading-relaxed text-repwell-teal-500">
                &ldquo;{promptText}&rdquo;
              </p>
            ) : (
              <ol className="mt-3 space-y-2.5">
                {[
                  `How did you start working with ${proFirst}?`,
                  "What result made the biggest difference for you?",
                  "Who would you recommend them to, and why?",
                ].map((cue, i) => (
                  <li key={cue} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white font-sans text-[11px] font-bold text-repwell-teal-300">
                      {i + 1}
                    </span>
                    <span className="font-sans text-sm leading-relaxed text-repwell-teal-500">
                      {cue}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Video Recorder */}
          <VideoRecorder
            maxDuration={request.maxDurationSeconds * 1000}
            onRecordingComplete={handleRecordingComplete}
            primaryColor={organization.primaryColor || undefined}
            autoRequestPermissions={false}
          />

          {/* Quick tips */}
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {RECORDING_TIPS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-1.5">
                <Icon weight="duotone" size={16} className="text-repwell-teal-300" />
                <span className="font-sans text-xs text-repwell-teal-400">{text}</span>
              </li>
            ))}
          </ul>

          {/* Fallback file upload */}
          <div className="text-center">
            <input
              ref={fallbackFileRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/*"
              className="hidden"
              onChange={handleFallbackFileSelected}
            />
            <button
              type="button"
              onClick={() => fallbackFileRef.current?.click()}
              disabled={isFallbackFilePending}
              className="font-sans text-sm font-medium text-repwell-teal-300 underline-offset-4 transition-colors hover:text-repwell-teal-400 hover:underline disabled:opacity-50"
            >
              {isFallbackFilePending
                ? "Preparing upload..."
                : "Camera trouble? Upload a video file instead"}
            </button>
            <p className="mt-1 font-sans text-xs text-repwell-teal-300/80">
              MP4, MOV, or WebM up to 100MB
            </p>
          </div>
        </div>
      </TestimonialShell>
    );
  }

  // Main form
  return (
    <TestimonialShell statusMessage={statusMessage} footer={orgFooter}>
      <StepRail current={1} />
      <div className="animate-fade-in-up">
        <div className="text-center">
          <h1 className="font-display text-3xl tracking-tight text-repwell-teal-500 sm:text-4xl">
            First, a little about you
          </h1>
          <p className="mt-2 font-sans text-sm text-repwell-teal-400">
            So {proFirst} knows who this wonderful review is from.
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <ProBadge
            name={professional.fullName}
            title={professional.title}
            photoUrl={professional.photoUrl}
            orgName={organization.name}
          />
        </div>

        <Panel className="mt-6 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-7">
            {/* Customer Info Section */}
            <div className="space-y-5">
              <RatingStars
                value={rating}
                onChange={setRating}
                label={`How was your experience with ${proFirst}?`}
              />

              <div className="space-y-2">
                <Label htmlFor="displayName" className="font-sans text-sm font-medium text-repwell-teal-500">
                  Your name
                </Label>
                <Input
                  ref={nameInputRef}
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How you'd like to be credited"
                  className="font-sans"
                  required
                />
                <p className="font-sans text-xs text-repwell-teal-300">
                  Shown alongside your testimonial
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationship" className="font-sans text-sm font-medium text-repwell-teal-500">
                  How did you work together?
                </Label>
                <Select value={relationship} onValueChange={(v) => setRelationship(v as RelationshipType)} required>
                  <SelectTrigger id="relationship" className="font-sans">
                    <SelectValue placeholder="Choose the closest fit" />
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
              <div className="flex items-center gap-2">
                <Shield weight="duotone" size={18} className="text-repwell-teal-300" />
                <span className="font-sans text-sm font-semibold text-repwell-teal-500">
                  A few quick permissions
                </span>
              </div>

              <div className="space-y-5 rounded-xl bg-[#f7faf7] p-5">
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
                      className="flex cursor-pointer items-center gap-2 font-sans text-sm font-medium text-repwell-teal-500"
                    >
                      <Video weight="duotone" className="h-4 w-4 text-repwell-teal-300" />
                      Name, image, likeness, and voice
                    </Label>
                    <p className="mt-1 font-sans text-xs leading-relaxed text-repwell-teal-300">
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
                      className="flex cursor-pointer items-center gap-2 font-sans text-sm font-medium text-repwell-teal-500"
                    >
                      <FileText weight="duotone" className="h-4 w-4 text-repwell-teal-300" />
                      Where it can appear
                    </Label>
                    <p className="mt-1 font-sans text-xs leading-relaxed text-repwell-teal-300">
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
                      className="flex cursor-pointer items-center gap-2 font-sans text-sm font-medium text-repwell-teal-500"
                    >
                      <Sparkles weight="duotone" className="h-4 w-4 text-repwell-teal-300" />
                      A written version of your video
                    </Label>
                    <p className="mt-1 font-sans text-xs leading-relaxed text-repwell-teal-300">
                      I consent to transcription and AI-generated draft text from this video.
                    </p>
                  </div>
                </div>
              </div>

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
                    className="cursor-pointer font-sans text-sm font-medium text-repwell-teal-500"
                  >
                    Keep me posted <span className="font-normal text-repwell-teal-300">(optional)</span>
                  </Label>
                  <p className="mt-0.5 font-sans text-xs text-repwell-teal-300">
                    Occasional updates and promotional materials from {organization.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="space-y-3">
              <Button
                type="submit"
                disabled={!isFormValid || isPending}
                className="w-full gap-2"
                size="lg"
                style={buttonStyle}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>

              {/* Form validation hint */}
              {!isFormValid && (
                <p className="text-center font-sans text-xs text-repwell-teal-300">
                  Tap a star rating, fill in your details, and check the three permission boxes to continue
                </p>
              )}
            </div>
          </form>
        </Panel>

        <p className="mt-3 text-center font-sans text-[11px] text-repwell-teal-300/70">
          Consent version {VIDEO_TESTIMONIAL_CONSENT_VERSION}
        </p>
      </div>
    </TestimonialShell>
  );
}

// Shared centered status presentation for transient and terminal states
function CenteredState({
  icon,
  iconBg = "bg-repwell-sage-100/50",
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  iconBg?: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 animate-fade-in flex-col items-center justify-center text-center">
      <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-full ${iconBg}`}>
        {icon}
      </div>
      <h1 className="font-display text-2xl tracking-tight text-repwell-teal-500 sm:text-3xl">
        {title}
      </h1>
      <p className="mx-auto mt-3 max-w-sm font-sans text-sm leading-relaxed text-repwell-teal-400">
        {body}
      </p>
      <div className="mt-6 flex flex-col items-center">{children}</div>
    </div>
  );
}
