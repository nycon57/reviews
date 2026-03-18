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

  const isText = requestType === "text";
  const canSubmit = Boolean(customerName.trim()) && Boolean(customerEmail.trim());

  function doSubmit() {
    startTransition(async () => {
      if (isText) {
        const result = await createSurveyAndQueue({
          loanOfficerId: currentUserId,
          customerName,
          customerEmail,
          customerPhone: customerPhone || undefined,
          sendImmediately: true,
          customTemplateId: emailTemplate?.id,
        });
        handleResult(result, "Review request sent");
      } else {
        const result = await createVideoTestimonialRequest({
          loanOfficerId: currentUserId,
          customerName,
          customerEmail,
          customerPhone: customerPhone || undefined,
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
        <Label htmlFor="req-customer-email">Customer Email *</Label>
        <Input
          id="req-customer-email"
          type="email"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          placeholder="john@example.com"
        />
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
          Send Request
        </Button>
      </div>
    </div>
  );
}
