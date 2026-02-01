"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { recordInlineConsent } from "@/lib/sms/send/actions";
import type { SmsConsentStatus } from "@/lib/sms/types";
import {
  ShieldCheck,
  ShieldWarning,
  SpinnerGap,
  CheckCircle,
  Clock,
} from "@phosphor-icons/react";

const DEFAULT_CONSENT_LANGUAGE =
  "By checking this box, you agree to receive text messages from us regarding your review request. Message and data rates may apply. Reply STOP to opt out at any time.";

interface SmsConsentCaptureProps {
  phone: string;
  consentStatus: SmsConsentStatus | "none";
  onConsentRecorded: () => void;
  consentLanguage?: string;
}

export function SmsConsentCapture({
  phone,
  consentStatus,
  onConsentRecorded,
  consentLanguage = DEFAULT_CONSENT_LANGUAGE,
}: SmsConsentCaptureProps) {
  const [agreed, setAgreed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  if (consentStatus === "opted_in") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-950/30">
        <ShieldCheck weight="fill" className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="text-sm text-emerald-700 dark:text-emerald-300">SMS consent verified</span>
        <Badge variant="outline" className="ml-auto text-[10px] border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400">
          Opted in
        </Badge>
      </div>
    );
  }

  if (consentStatus === "pending") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/30">
        <Clock weight="fill" className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="text-sm text-amber-700 dark:text-amber-300">Awaiting double opt-in confirmation</span>
        <Badge variant="outline" className="ml-auto text-[10px] border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400">
          Pending
        </Badge>
      </div>
    );
  }

  // Not opted in or opted out — show consent capture form
  const isOptedOut = consentStatus === "opted_out";

  function handleRecordConsent() {
    startTransition(async () => {
      const result = await recordInlineConsent({
        phone,
        consentLanguage,
      });
      if (result.success) {
        toast({ title: "Consent recorded", description: "SMS consent has been recorded for this number." });
        onConsentRecorded();
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  }

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldWarning weight="fill" className="h-4 w-4 text-destructive shrink-0" />
        <span className="text-sm font-medium text-destructive">
          {isOptedOut ? "Recipient has opted out" : "Consent required"}
        </span>
        <Badge variant="destructive" className="ml-auto text-[10px]">
          {isOptedOut ? "Opted out" : "No consent"}
        </Badge>
      </div>

      {isOptedOut ? (
        <p className="text-xs text-muted-foreground">
          This recipient previously opted out of SMS messages. They must re-consent before you can send.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Record the borrower&apos;s consent before sending SMS messages.
        </p>
      )}

      <div className="rounded-md border bg-background p-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {consentLanguage}
        </p>
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="sms-consent-agree"
          checked={agreed}
          onCheckedChange={(checked) => setAgreed(checked === true)}
        />
        <label htmlFor="sms-consent-agree" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
          I confirm the borrower has verbally or electronically agreed to receive SMS messages
        </label>
      </div>

      <Button
        size="sm"
        variant="outline"
        disabled={!agreed || isPending}
        onClick={handleRecordConsent}
        className="w-full"
      >
        {isPending ? (
          <SpinnerGap className="mr-2 h-3.5 w-3.5 animate-spin" />
        ) : (
          <CheckCircle className="mr-2 h-3.5 w-3.5" />
        )}
        Record consent
      </Button>
    </div>
  );
}
