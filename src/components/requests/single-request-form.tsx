"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  PaperPlaneRight,
  SpinnerGap,
} from "@phosphor-icons/react";
import { createSurveyAndQueue } from "@/lib/distribution/actions";
import { createVideoTestimonialRequest } from "@/lib/video-testimonials/actions";
import { EmailTemplatePicker } from "@/components/email-builder/email-template-picker";
import { isValidEmail } from "@/lib/utils";
import type { RequestType } from "@/lib/requests/bulk-request-types";

interface SingleRequestFormProps {
  requestType: RequestType;
  currentUserId: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function SingleRequestForm({
  requestType,
  currentUserId,
  onSuccess,
  onClose,
}: SingleRequestFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Form fields
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [emailTemplate, setEmailTemplate] = useState<{ id: string; name: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    customerName?: string;
    customerEmail?: string;
  }>({});

  const isText = requestType === "text";
  const canSubmit = !isPending;

  function validateForm() {
    const nextErrors: typeof fieldErrors = {};
    const trimmedName = customerName.trim();
    const trimmedEmail = customerEmail.trim();

    if (!trimmedName) {
      nextErrors.customerName = "Enter the customer's name.";
    }

    if (!trimmedEmail) {
      nextErrors.customerEmail = "Enter the customer's email address.";
    } else if (!isValidEmail(trimmedEmail)) {
      nextErrors.customerEmail = "Enter a valid email address.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function doSubmit() {
    if (!validateForm()) {
      return;
    }

    const trimmedName = customerName.trim();
    const trimmedEmail = customerEmail.trim();
    const trimmedPhone = customerPhone.trim();

    startTransition(async () => {
      if (isText) {
        const result = await createSurveyAndQueue({
          loanOfficerId: currentUserId,
          customerName: trimmedName,
          customerEmail: trimmedEmail,
          customerPhone: trimmedPhone || undefined,
          sendImmediately: true,
          customTemplateId: emailTemplate?.id,
        });
        handleResult(result, "Review request sent");
      } else {
        const result = await createVideoTestimonialRequest({
          loanOfficerId: currentUserId,
          customerName: trimmedName,
          customerEmail: trimmedEmail,
          customerPhone: trimmedPhone || undefined,
          sendImmediately: true,
          maxDurationSeconds: 120,
        });
        handleResult(result, "Video testimonial request sent");
      }
    });
  }

  function handleResult(
    result: { success: boolean; error?: string },
    successMsg: string
  ) {
    if (result.success) {
      toast({ title: "Success", description: successMsg });
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setEmailTemplate(null);
      setFieldErrors({});
      onClose();
      onSuccess();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to send review request",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-4">
      {/* Customer Name */}
      <div className="space-y-2">
        <Label htmlFor="req-customer-name">Customer Name *</Label>
        <Input
          id="req-customer-name"
          value={customerName}
          onChange={(e) => {
            setCustomerName(e.target.value);
            if (fieldErrors.customerName) {
              setFieldErrors((prev) => ({ ...prev, customerName: undefined }));
            }
          }}
          onBlur={() => {
            if (!customerName.trim()) {
              setFieldErrors((prev) => ({
                ...prev,
                customerName: "Enter the customer's name.",
              }));
            }
          }}
          placeholder="John Smith"
          aria-invalid={Boolean(fieldErrors.customerName)}
          aria-describedby={fieldErrors.customerName ? "req-customer-name-error" : undefined}
        />
        {fieldErrors.customerName && (
          <p id="req-customer-name-error" className="text-xs text-destructive" role="alert">
            {fieldErrors.customerName}
          </p>
        )}
      </div>

      {/* Customer Email */}
      <div className="space-y-2">
        <Label htmlFor="req-customer-email">Customer Email *</Label>
        <Input
          id="req-customer-email"
          type="email"
          value={customerEmail}
          onChange={(e) => {
            setCustomerEmail(e.target.value);
            if (fieldErrors.customerEmail) {
              setFieldErrors((prev) => ({ ...prev, customerEmail: undefined }));
            }
          }}
          onBlur={() => {
            const trimmedEmail = customerEmail.trim();
            if (!trimmedEmail) {
              setFieldErrors((prev) => ({
                ...prev,
                customerEmail: "Enter the customer's email address.",
              }));
            } else if (!isValidEmail(trimmedEmail)) {
              setFieldErrors((prev) => ({
                ...prev,
                customerEmail: "Enter a valid email address.",
              }));
            }
          }}
          placeholder="john@example.com"
          aria-invalid={Boolean(fieldErrors.customerEmail)}
          aria-describedby={fieldErrors.customerEmail ? "req-customer-email-error" : undefined}
        />
        {fieldErrors.customerEmail && (
          <p id="req-customer-email-error" className="text-xs text-destructive" role="alert">
            {fieldErrors.customerEmail}
          </p>
        )}
      </div>

      {/* Customer Phone (optional) */}
      <div className="space-y-2">
        <Label htmlFor="req-customer-phone">
          Customer Phone
          <span className="text-muted-foreground font-normal"> (optional)</span>
        </Label>
        <Input
          id="req-customer-phone"
          type="tel"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          placeholder="(555) 123-4567"
        />
      </div>

      {/* Email Template Picker */}
      {isText && (
        <EmailTemplatePicker
          value={emailTemplate}
          onChange={setEmailTemplate}
        />
      )}

      {/* Submit */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={doSubmit}
          disabled={!canSubmit || isPending}
        >
          {isPending ? (
            <SpinnerGap weight="duotone" className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PaperPlaneRight weight="duotone" className="mr-2 h-4 w-4" />
          )}
          Send review request
        </Button>
      </div>
    </div>
  );
}
