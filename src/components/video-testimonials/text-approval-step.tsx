"use client";

import { useState, useTransition, useMemo, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  submitApprovedText,
  regenerateReviewText,
  type TextApprovalData,
} from "@/lib/video-testimonials/approval-actions";
import {
  Loader2,
  Star,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Edit3,
  Eye,
  Shield,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface TextApprovalStepProps {
  token: string;
  data: TextApprovalData;
}

type StepState = "editing" | "preview" | "submitting" | "success" | "error";

// Recommended character limits for reviews
const CHAR_LIMITS = {
  min: 50,
  recommended: 200,
  ideal: 400,
  max: 2000,
};

export function TextApprovalStep({ token, data }: TextApprovalStepProps) {
  // Form state
  const [reviewText, setReviewText] = useState(data.aiGeneratedText);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [finalConsent, setFinalConsent] = useState(false);
  const [googleReviewClicked, setGoogleReviewClicked] = useState(false);

  // UI state
  const [stepState, setStepState] = useState<StepState>("editing");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editCount, setEditCount] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Computed values
  const charCount = reviewText.length;
  const isTextValid = charCount >= CHAR_LIMITS.min && charCount <= CHAR_LIMITS.max;
  const isRatingValid = rating >= 1 && rating <= 5;
  const isFormValid = isTextValid && isRatingValid && finalConsent;
  const showGoogleRedirect = rating >= 4 && data.googleBusinessProfileUrl;
  const hasEdited = reviewText !== data.aiGeneratedText;

  // Memoized button style
  const buttonStyle = useMemo(
    () => (data.organizationPrimaryColor ? { backgroundColor: data.organizationPrimaryColor } : undefined),
    [data.organizationPrimaryColor]
  );

  // Character count color
  const charCountColor = useMemo(() => {
    if (charCount < CHAR_LIMITS.min) return "text-destructive";
    if (charCount <= CHAR_LIMITS.recommended) return "text-amber-500";
    if (charCount <= CHAR_LIMITS.ideal) return "text-emerald-500";
    if (charCount <= CHAR_LIMITS.max) return "text-amber-500";
    return "text-destructive";
  }, [charCount]);

  // Focus textarea when returning to editing state
  useEffect(() => {
    if (stepState === "editing" && textareaRef.current) {
      const timer = setTimeout(() => textareaRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [stepState]);

  // Handle text changes
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      if (newText !== reviewText && !hasEdited) {
        setEditCount((prev) => prev + 1);
      }
      setReviewText(newText);
    },
    [reviewText, hasEdited]
  );

  // Handle regenerate
  const handleRegenerate = useCallback(() => {
    setIsRegenerating(true);
    setRegenerateError(null);

    startTransition(async () => {
      const result = await regenerateReviewText(token, data.responseId);

      if (result.success && result.data) {
        setReviewText(result.data.generatedText);
        setEditCount(0);
      } else {
        setRegenerateError(result.error || "Failed to regenerate review");
      }

      setIsRegenerating(false);
    });
  }, [token, data.responseId]);

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (!isFormValid) return;

    setStepState("submitting");
    setSubmitError(null);

    startTransition(async () => {
      const result = await submitApprovedText({
        token,
        responseId: data.responseId,
        approvedText: reviewText,
        rating,
        editCount,
        googleReviewRedirectClicked: googleReviewClicked,
        finalConsent,
      });

      if (result.success) {
        setStepState("success");
      } else {
        setSubmitError(result.error || "Failed to submit your review");
        setStepState("error");
      }
    });
  }, [
    isFormValid,
    token,
    data.responseId,
    reviewText,
    rating,
    editCount,
    googleReviewClicked,
    finalConsent,
  ]);

  // Handle Google review click
  const handleGoogleReviewClick = useCallback(() => {
    setGoogleReviewClicked(true);
    if (data.googleBusinessProfileUrl) {
      window.open(data.googleBusinessProfileUrl, "_blank", "noopener,noreferrer");
    }
  }, [data.googleBusinessProfileUrl]);

  // Status message for ARIA
  const statusMessage = useMemo(() => {
    switch (stepState) {
      case "submitting":
        return "Submitting your review. Please wait.";
      case "success":
        return "Your review has been submitted successfully. Thank you!";
      case "error":
        return `Error: ${submitError}`;
      default:
        return "";
    }
  }, [stepState, submitError]);

  // Submitting state
  if (stepState === "submitting") {
    return (
      <StepContainer statusMessage={statusMessage}>
        <Card className="mx-auto max-w-2xl shadow-lg">
          <CardContent className="flex min-h-[300px] flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-repwell-teal-300" />
            <p className="mt-4 font-sans text-lg font-medium text-repwell-teal-500">
              Submitting your review...
            </p>
            <p className="mt-2 font-sans text-sm text-muted-foreground">
              Please wait a moment
            </p>
          </CardContent>
        </Card>
      </StepContainer>
    );
  }

  // Error state
  if (stepState === "error") {
    return (
      <StepContainer statusMessage={statusMessage}>
        <Card className="mx-auto max-w-2xl shadow-lg">
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
                setStepState("editing");
                setSubmitError(null);
              }}
              style={buttonStyle}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </StepContainer>
    );
  }

  // Success state
  if (stepState === "success") {
    return (
      <StepContainer statusMessage={statusMessage}>
        <Card className="mx-auto max-w-2xl shadow-lg">
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-repwell-sage-200/20 text-repwell-sage-200">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="font-sans text-2xl font-semibold text-repwell-teal-500">
              Thank you for your review!
            </h2>
            <p className="mt-2 font-sans text-muted-foreground">
              Your testimonial has been submitted successfully.
            </p>

            {rating >= 4 && data.googleBusinessProfileUrl && !googleReviewClicked && (
              <div className="mt-8 rounded-lg border border-repwell-sage-200/30 bg-repwell-sage-100/20 p-6">
                <p className="font-sans text-sm text-repwell-teal-400">
                  Would you also like to share your experience on Google?
                </p>
                <Button
                  variant="outline"
                  className="mt-4 gap-2"
                  onClick={handleGoogleReviewClick}
                >
                  <ExternalLink className="h-4 w-4" />
                  Leave a Google Review
                </Button>
              </div>
            )}

            <div className="mt-8 rounded-lg bg-muted/50 p-6">
              <p className="font-sans text-sm text-muted-foreground">
                Your feedback helps {data.loanOfficerName} and {data.organizationName} continue to
                provide excellent service.
              </p>
            </div>

            {data.organizationLogoUrl && (
              <div className="mt-8 flex justify-center opacity-60">
                <img
                  src={data.organizationLogoUrl}
                  alt={data.organizationName}
                  className="h-8 max-w-[150px] object-contain"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </StepContainer>
    );
  }

  // Main editing/preview state
  return (
    <StepContainer statusMessage={statusMessage}>
      <Card className="mx-auto max-w-2xl shadow-lg">
        <CardHeader className="space-y-4 pb-4">
          {data.organizationLogoUrl && (
            <div className="flex justify-center">
              <img
                src={data.organizationLogoUrl}
                alt={data.organizationName}
                className="h-12 max-w-[200px] object-contain"
              />
            </div>
          )}

          <div className="text-center">
            <CardTitle className="font-sans text-xl text-repwell-teal-500">
              Review Your Testimonial
            </CardTitle>
            <CardDescription className="mt-1.5 font-sans">
              We&apos;ve created a written review based on your video. Feel free to edit it before
              submitting.
            </CardDescription>
          </div>

          {/* AI indicator */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-repwell-teal-300" />
            <span className="font-sans">AI-generated from your video</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* View toggle */}
          <div className="flex items-center justify-end gap-2">
            <Button
              variant={stepState === "editing" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStepState("editing")}
              className="gap-1.5"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              variant={stepState === "preview" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStepState("preview")}
              className="gap-1.5"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </Button>
          </div>

          {/* Review text editor / preview */}
          {stepState === "editing" ? (
            <div className="space-y-2">
              <Textarea
                ref={textareaRef}
                value={reviewText}
                onChange={handleTextChange}
                className="min-h-[200px] resize-none font-sans text-sm leading-relaxed"
                placeholder="Your review text..."
                maxLength={CHAR_LIMITS.max}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRegenerate}
                    disabled={isRegenerating || isPending}
                    className="gap-1.5 text-muted-foreground hover:text-repwell-teal-500"
                  >
                    {isRegenerating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    Regenerate
                  </Button>
                  {regenerateError && (
                    <span className="text-xs text-destructive">{regenerateError}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${charCountColor}`}>
                    {charCount}/{CHAR_LIMITS.max}
                  </span>
                  {charCount < CHAR_LIMITS.min && (
                    <span className="text-xs text-destructive">
                      (min {CHAR_LIMITS.min})
                    </span>
                  )}
                </div>
              </div>
              {hasEdited && (
                <p className="text-xs text-muted-foreground">
                  Your changes will be saved when you submit
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/30 p-6">
              <blockquote className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-repwell-teal-500">
                &ldquo;{reviewText}&rdquo;
              </blockquote>
              <p className="mt-4 text-right font-sans text-sm text-muted-foreground">
                — {data.customerName}
              </p>
            </div>
          )}

          {/* Rating selection */}
          <div className="space-y-3">
            <Label className="font-sans text-sm font-medium">
              Rate Your Experience <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-repwell-teal-300 focus:ring-offset-2"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-none text-muted-foreground/40"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {rating === 5 && "Excellent!"}
                {rating === 4 && "Great!"}
                {rating === 3 && "Good"}
                {rating === 2 && "Fair"}
                {rating === 1 && "Poor"}
              </p>
            )}
          </div>

          {/* Google review redirect (for 4-5 stars) */}
          {showGoogleRedirect && (
            <div className="rounded-lg border border-repwell-sage-200/30 bg-repwell-sage-100/20 p-4">
              <div className="flex items-start gap-3">
                <ExternalLink className="mt-0.5 h-5 w-5 text-repwell-teal-300" />
                <div>
                  <p className="font-sans text-sm font-medium text-repwell-teal-500">
                    Share on Google Reviews
                  </p>
                  <p className="mt-1 font-sans text-xs text-muted-foreground">
                    We&apos;d love it if you also shared your experience on Google. It helps others
                    find great service!
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-1.5"
                    onClick={handleGoogleReviewClick}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open Google Reviews
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Final consent */}
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-repwell-teal-500">
              <Shield className="h-4 w-4" />
              <span className="font-sans">Final Consent</span>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="finalConsent"
                checked={finalConsent}
                onCheckedChange={(checked) => setFinalConsent(checked === true)}
                className="mt-0.5"
                aria-required="true"
              />
              <div className="flex-1">
                <Label
                  htmlFor="finalConsent"
                  className="cursor-pointer font-sans text-sm font-medium"
                >
                  I approve this review <span className="text-destructive">*</span>
                </Label>
                <p className="font-sans text-xs text-muted-foreground">
                  I confirm that this review accurately reflects my experience and I consent to its
                  publication on {data.organizationName}&apos;s website and marketing materials.
                </p>
              </div>
            </div>
          </div>

          {/* Validation warnings */}
          {(!isTextValid || !isRatingValid) && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="font-sans text-sm">
                {!isTextValid && (
                  <p>
                    Review must be between {CHAR_LIMITS.min} and {CHAR_LIMITS.max} characters
                  </p>
                )}
                {!isRatingValid && <p>Please select a star rating</p>}
              </div>
            </div>
          )}

          {/* Submit button */}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid || isPending}
            className="w-full gap-2"
            style={buttonStyle}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Submit My Review
              </>
            )}
          </Button>

          {/* Help text */}
          {!isFormValid && (
            <p className="text-center font-sans text-xs text-muted-foreground">
              Please complete all required fields to submit your review
            </p>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="mt-4 text-center font-sans text-xs text-muted-foreground">
        Your review helps others make informed decisions and supports {data.loanOfficerName}.
      </p>
    </StepContainer>
  );
}

// Container component with consistent styling and ARIA live region
function StepContainer({
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
      <div className="mx-auto max-w-2xl">{children}</div>
    </div>
  );
}
