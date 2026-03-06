"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  PaperPlaneRight,
  SpinnerGap,
} from "@phosphor-icons/react";
import { toE164, formatForDisplay } from "@/lib/sms/phone-utils";
import { createSurveyAndQueue } from "@/lib/distribution/actions";
import { sendSmsReviewRequest } from "@/lib/sms/send/actions";
import { checkSmsSendReadiness } from "@/lib/sms/send/actions";
import type { SendReadiness } from "@/lib/sms/send/actions";
import { createVideoTestimonialRequest } from "@/lib/video-testimonials/actions";
import { SmsTemplateSelector } from "@/components/distribution/sms-template-selector";
import { SmsSendConfirmation } from "@/components/distribution/sms-send-confirmation";
import { SmsReadinessPanel } from "./sms-readiness-panel";
import type { SmsTemplate, SmsTemplateCategory } from "@/lib/sms/types";
import { smsPlaceholderEmail } from "@/lib/requests/bulk-request-types";
import type { RequestType, SendMethod, SurveyTemplateSummary } from "@/lib/requests/bulk-request-types";

interface SingleRequestFormProps {
  requestType: RequestType;
  sendMethod: SendMethod;
  currentUserId: string;
  surveyTemplates: SurveyTemplateSummary[];
  smsTemplates: SmsTemplate[];
  onSuccess: () => void;
  onClose: () => void;
}

export function SingleRequestForm({
  requestType,
  sendMethod,
  currentUserId,
  surveyTemplates,
  smsTemplates,
  onSuccess,
  onClose,
}: SingleRequestFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Form fields
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [smsCategoryOverride, setSmsCategoryOverride] = useState<SmsTemplateCategory | null>(null);
  const defaultSmsCategory: SmsTemplateCategory | null = useMemo(
    () => sendMethod === "sms" ? (requestType === "text" ? "review_request" : "video_request") : null,
    [sendMethod, requestType]
  );
  const smsCategory = smsCategoryOverride ?? defaultSmsCategory;

  // SMS readiness
  const [readiness, setReadiness] = useState<SendReadiness | null>(null);
  const [isCheckingReadiness, setIsCheckingReadiness] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Determine which fields are required/shown
  const isSms = sendMethod === "sms";
  const isEmail = sendMethod === "email";
  const isText = requestType === "text";
  const isVideo = requestType === "video";
  const showTemplateSelector = isText && isEmail;
  const needsTemplate = showTemplateSelector || isSms;

  // Phone validation
  const phoneE164 = toE164(customerPhone);
  const phoneValidation =
    customerPhone.length > 0
      ? {
          valid: phoneE164 !== null,
          display: phoneE164 ? formatForDisplay(phoneE164) : null,
        }
      : null;

  // Check SMS readiness when phone + template change
  useEffect(() => {
    if (!isSms || !phoneE164 || !templateId) return;

    let cancelled = false;
    const timeout = setTimeout(async () => {
      setIsCheckingReadiness(true);
      try {
        const result = await checkSmsSendReadiness({
          borrowerPhone: phoneE164,
          templateId,
        });
        if (!cancelled) {
          if (result.success && result.data) {
            setReadiness(result.data);
          } else {
            setReadiness(null);
          }
          setIsCheckingReadiness(false);
        }
      } catch {
        if (!cancelled) {
          setReadiness(null);
          setIsCheckingReadiness(false);
        }
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [phoneE164, templateId, isSms]);

  // Readiness is only meaningful when all SMS fields are present
  const effectiveReadiness = (isSms && phoneE164 && templateId) ? readiness : null;

  // Form validation
  const canSubmit = (() => {
    if (!customerName.trim()) return false;
    if (isEmail && !customerEmail.trim()) return false;
    if (isSms && !phoneValidation?.valid) return false;
    if (needsTemplate && !templateId) return false;

    // SMS readiness checks
    if (isSms && effectiveReadiness) {
      if (effectiveReadiness.consentRequired) return false;
      if (!effectiveReadiness.creditSufficient) return false;
      if (!effectiveReadiness.templateValid) return false;
    }

    // If SMS but no readiness yet (still checking), block submit
    if (isSms && !effectiveReadiness) return false;

    return true;
  })();

  function handleConsentRecorded() {
    if (phoneE164 && templateId) {
      startTransition(async () => {
        const result = await checkSmsSendReadiness({
          borrowerPhone: phoneE164,
          templateId,
        });
        if (result.success && result.data) {
          setReadiness(result.data);
        }
      });
    }
  }

  function handleSubmitClick() {
    if (!canSubmit) return;
    // For SMS, show confirmation dialog first
    if (isSms) {
      setShowConfirmation(true);
      return;
    }
    doSubmit();
  }

  function doSubmit() {
    startTransition(async () => {
      if (isText && isEmail) {
        // Text review via email
        const result = await createSurveyAndQueue({
          loanOfficerId: currentUserId,
          templateId,
          customerName,
          customerEmail,
          customerPhone: customerPhone || undefined,
          sendImmediately: true,
        });
        handleResult(result, "Review request sent");
      } else if (isText && isSms) {
        // Text review via SMS
        const result = await sendSmsReviewRequest({
          borrowerName: customerName,
          borrowerPhone: customerPhone,
          loanOfficerId: currentUserId,
          templateId,
        });
        handleResult(result, "SMS review request sent");
      } else if (isVideo && isEmail) {
        // Video request via email
        const result = await createVideoTestimonialRequest({
          loanOfficerId: currentUserId,
          customerName,
          customerEmail,
          customerPhone: customerPhone || undefined,
          sendImmediately: true,
          maxDurationSeconds: 120,
        });
        handleResult(result, "Video testimonial request sent");
      } else if (isVideo && isSms) {
        // Video request via SMS:
        // 1. Create video request without sending email
        const videoResult = await createVideoTestimonialRequest({
          loanOfficerId: currentUserId,
          customerName,
          customerEmail:
            customerEmail ||
            smsPlaceholderEmail(phoneE164!),
          customerPhone,
          sendImmediately: false,
          maxDurationSeconds: 120,
        });

        if (!videoResult.success) {
          toast({
            title: "Error",
            description:
              videoResult.error || "Failed to create video request",
            variant: "destructive",
          });
          return;
        }

        // 2. Send SMS with video request template
        const smsResult = await sendSmsReviewRequest({
          borrowerName: customerName,
          borrowerPhone: customerPhone,
          loanOfficerId: currentUserId,
          templateId,
        });
        handleResult(smsResult, "Video request sent via SMS");
      }
    });
  }

  function handleResult(
    result: { success: boolean; error?: string },
    successMsg: string
  ) {
    if (result.success) {
      toast({ title: "Success", description: successMsg });
      resetForm();
      onClose();
      onSuccess();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to send request",
        variant: "destructive",
      });
    }
  }

  function resetForm() {
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setTemplateId("");
    setReadiness(null);
  }

  return (
    <div className="space-y-4">
      {/* Customer Name */}
      <div className="space-y-2">
        <Label htmlFor="req-customer-name">Customer Name *</Label>
        <Input
          id="req-customer-name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="John Smith"
        />
      </div>

      {/* Customer Email */}
      <div className="space-y-2">
        <Label htmlFor="req-customer-email">
          Customer Email{isEmail ? " *" : ""}
          {!isEmail && (
            <span className="text-muted-foreground font-normal">
              {" "}
              (optional)
            </span>
          )}
        </Label>
        <Input
          id="req-customer-email"
          type="email"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          placeholder="john@example.com"
        />
      </div>

      {/* Customer Phone */}
      <div className="space-y-2">
        <Label htmlFor="req-customer-phone">
          Customer Phone{isSms ? " *" : ""}
          {!isSms && (
            <span className="text-muted-foreground font-normal">
              {" "}
              (optional)
            </span>
          )}
        </Label>
        <Input
          id="req-customer-phone"
          type="tel"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          placeholder="(555) 123-4567"
        />
        {phoneValidation && !phoneValidation.valid && (
          <p className="text-xs text-destructive">
            Enter a valid US phone number
          </p>
        )}
      </div>

      {/* Survey Template Selector (text + email) */}
      {showTemplateSelector && (
        <div className="space-y-2">
          <Label htmlFor="req-template">Survey Template *</Label>
          <Select value={templateId} onValueChange={setTemplateId}>
            <SelectTrigger id="req-template">
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              {surveyTemplates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {surveyTemplates.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No active templates. Create one in Surveys.
            </p>
          )}
        </div>
      )}

      {/* SMS Template Selector (any + sms) */}
      {isSms && (
        <SmsTemplateSelector
          templates={smsTemplates}
          selectedTemplateId={templateId}
          onSelectTemplate={setTemplateId}
          isLoading={false}
          category={smsCategory}
          onCategoryChange={setSmsCategoryOverride}
        />
      )}

      {/* SMS Readiness Panel */}
      {isSms && (
        <SmsReadinessPanel
          readiness={effectiveReadiness}
          isChecking={isCheckingReadiness}
          phone={customerPhone}
          phoneValid={phoneValidation?.valid ?? false}
          onConsentRecorded={handleConsentRecorded}
        />
      )}

      {/* Submit */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmitClick}
          disabled={!canSubmit || isPending || isCheckingReadiness}
        >
          {isPending ? (
            <SpinnerGap weight="duotone" className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PaperPlaneRight weight="duotone" className="mr-2 h-4 w-4" />
          )}
          Send Request
        </Button>
      </div>

      {/* SMS Confirmation Dialog */}
      {isSms && effectiveReadiness && (
        <SmsSendConfirmation
          open={showConfirmation}
          onOpenChange={setShowConfirmation}
          onConfirm={() => {
            setShowConfirmation(false);
            doSubmit();
          }}
          isPending={isPending}
          recipientPhone={effectiveReadiness.phoneE164 ?? ""}
          templatePreview={effectiveReadiness.templatePreview ?? ""}
          segmentCount={effectiveReadiness.segmentCount}
          creditCost={effectiveReadiness.creditCost}
          scheduledTime={null}
          quietHoursWarning={effectiveReadiness.quietHoursBlocked}
          quietHoursNextValid={effectiveReadiness.quietHoursNextValid}
        />
      )}
    </div>
  );
}
