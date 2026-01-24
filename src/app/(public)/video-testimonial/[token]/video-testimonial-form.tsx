"use client";

import { useState, useTransition, useRef, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import type { PublicVideoTestimonialRequest, RelationshipType } from "@/lib/video-testimonials/types";
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
  | "form"
  | "submitting"
  | "success"
  | "error"
  | "uploading"
  | "processing"
  | "completed"
  | "uploadError"
  | "processError";

type ProcessingStep = "transcribing" | "generating";

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
  const { loanOfficer, organization, promptText } = request;
  const router = useRouter();

  // Form state
  const [displayName, setDisplayName] = useState(request.customerName || "");
  const [relationship, setRelationship] = useState<RelationshipType | "">("");
  const [videoRecordingConsent, setVideoRecordingConsent] = useState(false);
  const [usageRightsConsent, setUsageRightsConsent] = useState(false);
  const [aiTextGenerationConsent, setAiTextGenerationConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  // UI state
  const [formState, setFormState] = useState<FormState>("form");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Upload/processing state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>("transcribing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<globalThis.AbortController | null>(null);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [pendingDuration, setPendingDuration] = useState<number>(0);
  const [uploadedStoragePath, setUploadedStoragePath] = useState<string | null>(null);
  const [uploadedThumbnailPath, setUploadedThumbnailPath] = useState<string | null>(null);

  // Refs for focus management
  const nameInputRef = useRef<HTMLInputElement>(null);

  const buttonStyle = useMemo(
    () => (organization.primaryColor ? { backgroundColor: organization.primaryColor } : undefined),
    [organization.primaryColor]
  );

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
    videoRecordingConsent &&
    usageRightsConsent &&
    aiTextGenerationConsent;

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
          videoRecordingConsent,
          usageRightsConsent,
          aiTextGenerationConsent,
          marketingConsent,
        },
      });

      if (result.success) {
        setFormState("success");
      } else {
        setSubmitError(result.error || "Failed to submit your information");
        setFormState("error");
      }
    });
  };

  // Compute status message for ARIA live region
  const statusMessage = useMemo(() => {
    switch (formState) {
      case "submitting":
        return "Saving your information. Please wait.";
      case "success":
        return "Your information has been saved successfully. You are now ready to record your video testimonial.";
      case "error":
        return `Error: ${submitError}`;
      case "uploading":
        return "Uploading your video. Please wait.";
      case "processing":
        return `Processing your video: ${processingStep === "transcribing" ? "Transcribing audio" : "Generating review"}`;
      case "completed":
        return "Your video has been submitted successfully. Redirecting...";
      case "uploadError":
        return `Upload error: ${errorMessage}`;
      case "processError":
        return `Processing error: ${errorMessage}`;
      default:
        return "";
    }
  }, [formState, submitError, processingStep, errorMessage]);

  // Handle recording complete - upload and process video
  const handleRecordingComplete = useCallback(
    async (blob: Blob, durationMs?: number) => {
      const durationSeconds = durationMs ? Math.round(durationMs / 1000) : 0;

      console.log("[VideoTestimonial] Recording complete", {
        size: blob.size,
        type: blob.type,
        durationSeconds,
      });

      // Store blob for potential retry
      setPendingBlob(blob);
      setPendingDuration(durationSeconds);

      try {
        setFormState("uploading");
        setUploadProgress(0);
        setErrorMessage(null);
        // Clear stale thumbnail state from previous attempts
        setUploadedThumbnailPath(null);

        // 1. Generate thumbnail from video (don't block on failure)
        console.log("[VideoTestimonial] Generating thumbnail...");
        const thumbnailBlob = await generateThumbnailFromVideo(blob);
        if (thumbnailBlob) {
          console.log("[VideoTestimonial] Thumbnail generated", { size: thumbnailBlob.size });
        } else {
          console.log("[VideoTestimonial] Thumbnail generation failed, proceeding without thumbnail");
        }

        // 2. Get signed upload URLs for video and thumbnail
        const uploadUrlResult = await createVideoUploadUrls(request.token);
        if (!uploadUrlResult.success || !uploadUrlResult.data) {
          throw new Error(uploadUrlResult.error || "Failed to get upload URLs");
        }

        const { videoUploadUrl, videoStoragePath, thumbnailUploadUrl, thumbnailStoragePath } = uploadUrlResult.data;
        setUploadedStoragePath(videoStoragePath);

        // 3. Upload video and thumbnail in parallel
        const controller = new globalThis.AbortController();
        setAbortController(controller);

        const uploadPromises: Promise<void>[] = [
          uploadWithProgress(videoUploadUrl, blob, {
            onProgress: setUploadProgress,
            signal: controller.signal,
          }),
        ];

        // Only upload thumbnail if we have one
        let thumbnailPath: string | undefined;
        if (thumbnailBlob) {
          uploadPromises.push(
            fetch(thumbnailUploadUrl, {
              method: "PUT",
              body: thumbnailBlob,
              headers: { "Content-Type": "image/jpeg" },
              signal: controller.signal,
            }).then((res) => {
              if (!res.ok) throw new Error("Thumbnail upload failed");
            })
          );
          thumbnailPath = thumbnailStoragePath;
          setUploadedThumbnailPath(thumbnailStoragePath);
        }

        await Promise.all(uploadPromises);
        setAbortController(null);

        // 4. Submit for AI processing
        setFormState("processing");
        setProcessingStep("transcribing");

        const result = await submitVideoTestimonial({
          token: request.token,
          storagePath: videoStoragePath,
          durationSeconds,
          thumbnailPath,
        });

        if (result.success) {
          setFormState("completed");
          // Redirect to review page after brief delay
          setTimeout(() => {
            router.push(`/video-testimonial/${request.token}/review`);
          }, 1500);
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
          return;
        }

        console.error("[VideoTestimonial] Upload/processing error:", error);
        setErrorMessage(error instanceof Error ? error.message : "Upload failed");
        setFormState("uploadError");
        setAbortController(null);
      }
    },
    [request.token, router]
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
      setProcessingStep("transcribing");
      setErrorMessage(null);

      const result = await submitVideoTestimonial({
        token: request.token,
        storagePath: uploadedStoragePath,
        durationSeconds: pendingDuration,
        thumbnailPath: uploadedThumbnailPath || undefined,
      });

      if (result.success) {
        setFormState("completed");
        setTimeout(() => {
          router.push(`/video-testimonial/${request.token}/review`);
        }, 1500);
      } else {
        setErrorMessage(result.error || "Processing failed");
        setFormState("processError");
      }
    } catch (error) {
      console.error("[VideoTestimonial] Retry processing error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Processing failed");
      setFormState("processError");
    }
  }, [uploadedStoragePath, uploadedThumbnailPath, pendingDuration, request.token, router, handleRetryUpload]);

  // Return to recording state
  const handleReRecord = useCallback(() => {
    setPendingBlob(null);
    setPendingDuration(0);
    setUploadedStoragePath(null);
    setUploadedThumbnailPath(null);
    setErrorMessage(null);
    setFormState("success");
  }, []);

  // Cancel upload
  const handleCancelUpload = useCallback(() => {
    if (abortController) {
      abortController.abort();
    }
  }, [abortController]);

  // ===========================================================================
  // Conditional Renders - all hooks must be above this line
  // ===========================================================================

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
      <FormContainer statusMessage={`Processing your video: ${processingStep === "transcribing" ? "Transcribing audio" : "Generating review"}`}>
        <Card className="mx-auto max-w-lg shadow-lg">
          <CardContent className="flex min-h-[300px] flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-repwell-teal-300 animate-spin" />
            <h2 className="mt-4 font-sans text-xl font-semibold text-repwell-teal-500">
              Processing Your Video
            </h2>
            <p className="mt-2 font-sans text-sm text-muted-foreground">
              This may take a moment
            </p>
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${processingStep === "transcribing" ? "bg-repwell-teal-300 animate-pulse" : "bg-repwell-sage-200"}`} />
                <span className={`font-sans text-sm ${processingStep === "transcribing" ? "text-repwell-teal-500 font-medium" : "text-muted-foreground"}`}>
                  Transcribing
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${processingStep === "generating" ? "bg-repwell-teal-300 animate-pulse" : "bg-muted"}`} />
                <span className={`font-sans text-sm ${processingStep === "generating" ? "text-repwell-teal-500 font-medium" : "text-muted-foreground"}`}>
                  Generating Review
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </FormContainer>
    );
  }

  // Completed state (brief display before redirect)
  if (formState === "completed") {
    return (
      <FormContainer statusMessage="Your video has been submitted successfully. Redirecting...">
        <Card className="mx-auto max-w-lg shadow-lg">
          <CardContent className="flex min-h-[300px] flex-col items-center justify-center py-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-repwell-sage-200/20">
              <CheckCircle2 className="h-10 w-10 text-repwell-sage-200" />
            </div>
            <h2 className="mt-4 font-sans text-xl font-semibold text-repwell-teal-500">
              Video Submitted!
            </h2>
            <p className="mt-2 font-sans text-sm text-muted-foreground">
              Redirecting to your review...
            </p>
            <Loader2 className="mt-4 h-5 w-5 text-muted-foreground animate-spin" />
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
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-repwell-sage-200/20 text-repwell-sage-200">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="font-sans text-xl font-semibold text-repwell-teal-500">
                You&apos;re all set, {displayName}!
              </h2>
              <p className="mt-2 font-sans text-sm text-muted-foreground">
                Record your video testimonial for {loanOfficer.fullName}
              </p>
              {promptText && (
                <div className="mt-4 rounded-lg bg-muted/50 p-4 text-left">
                  <p className="font-sans text-xs font-medium text-muted-foreground">
                    Prompt from {loanOfficer.fullName}:
                  </p>
                  <p className="mt-1 font-sans text-sm italic text-foreground">
                    &quot;{promptText}&quot;
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Video Recorder */}
          <VideoRecorder
            maxDuration={request.maxDurationSeconds * 1000}
            onRecordingComplete={handleRecordingComplete}
            primaryColor={organization.primaryColor || undefined}
            autoRequestPermissions={false}
          />

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
            <CardTitle className="font-sans text-xl text-repwell-teal-500">
              Share Your Experience
            </CardTitle>
            <CardDescription className="mt-1.5 font-sans">
              Record a short video testimonial about working with {loanOfficer.fullName}
            </CardDescription>
          </div>

          {/* Loan Officer Info */}
          <div className="flex items-center justify-center gap-3 rounded-lg bg-muted/50 p-4">
            {loanOfficer.photoUrl ? (
              <img
                src={loanOfficer.photoUrl}
                alt={loanOfficer.fullName}
                className="h-14 w-14 rounded-full object-cover ring-2 ring-background"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-repwell-teal-300/10 text-lg font-semibold text-repwell-teal-300">
                {loanOfficer.fullName.charAt(0)}
              </div>
            )}
            <div className="text-left">
              <p className="font-sans font-medium text-repwell-teal-500">{loanOfficer.fullName}</p>
              {loanOfficer.title && (
                <p className="font-sans text-sm text-muted-foreground">{loanOfficer.title}</p>
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
                    id="videoRecordingConsent"
                    checked={videoRecordingConsent}
                    onCheckedChange={(checked) => setVideoRecordingConsent(checked === true)}
                    className="mt-0.5"
                    aria-required="true"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="videoRecordingConsent"
                      className="flex cursor-pointer items-center gap-2 font-sans text-sm font-medium"
                    >
                      <Video className="h-4 w-4 text-repwell-teal-300" />
                      Video Recording Consent <span className="text-destructive">*</span>
                    </Label>
                    <p className="font-sans text-xs text-muted-foreground">
                      I consent to being video recorded for testimonial purposes
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
                      I grant permission to use my video testimonial on the company website, social
                      media, and marketing materials
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
                      I consent to AI-generated written testimonials being created from my video for
                      additional marketing use
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
                  Continue to Video Recording
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
