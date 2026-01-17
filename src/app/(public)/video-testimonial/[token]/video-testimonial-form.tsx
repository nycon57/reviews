"use client";

import { useState, useTransition, useRef, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitCustomerInfoAndConsent } from "@/lib/video-testimonials/public-actions";
import type { PublicVideoTestimonialRequest, RelationshipType } from "@/lib/video-testimonials/types";
import { Loader2, Video, Shield, FileText, Sparkles, CheckCircle2, XCircle } from "lucide-react";

interface VideoTestimonialFormProps {
  request: PublicVideoTestimonialRequest;
}

type FormState = "form" | "submitting" | "success" | "error";

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
      default:
        return "";
    }
  }, [formState, submitError]);

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

  // Success state - ready for video recording
  if (formState === "success") {
    return (
      <FormContainer statusMessage={statusMessage}>
        <Card className="mx-auto max-w-lg shadow-lg">
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-repwell-sage-200/20 text-repwell-sage-200">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="font-sans text-2xl font-semibold text-repwell-teal-500">
              You&apos;re all set!
            </h2>
            <p className="mt-2 font-sans text-muted-foreground">
              Your information has been saved. You&apos;re now ready to record your video
              testimonial.
            </p>

            <div className="mt-8 rounded-lg border bg-muted/50 p-6">
              <Video className="mx-auto h-8 w-8 text-repwell-teal-300" />
              <p className="mt-3 font-sans text-sm text-muted-foreground">
                The video recording feature will be available soon. Thank you for your patience!
              </p>
            </div>

            {organization.logoUrl && (
              <div className="mt-8 flex justify-center opacity-60">
                <img
                  src={organization.logoUrl}
                  alt={organization.name}
                  className="h-8 max-w-[150px] object-contain"
                />
              </div>
            )}
          </CardContent>
        </Card>
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
