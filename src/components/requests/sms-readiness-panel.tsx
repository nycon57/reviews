"use client";

import { Label } from "@/components/ui/label";
import { SmsConsentCapture } from "@/components/distribution/sms-consent-capture";
import type { SendReadiness } from "@/lib/sms/send/actions";
import {
  CheckCircle,
  Warning,
  SpinnerGap,
} from "@phosphor-icons/react";

interface SmsReadinessPanelProps {
  readiness: SendReadiness | null;
  isChecking: boolean;
  /** Raw phone input for consent capture */
  phone: string;
  phoneValid: boolean;
  onConsentRecorded: () => void;
}

export function SmsReadinessPanel({
  readiness,
  isChecking,
  phone,
  phoneValid,
  onConsentRecorded,
}: SmsReadinessPanelProps) {
  if (isChecking) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2">
        <SpinnerGap className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Checking SMS readiness...
        </span>
      </div>
    );
  }

  if (!readiness) return null;

  return (
    <div className="space-y-3">
      {/* Consent status */}
      {phoneValid && (
        <SmsConsentCapture
          phone={phone}
          consentStatus={readiness.consentStatus}
          onConsentRecorded={onConsentRecorded}
        />
      )}

      {/* Readiness indicators */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Send readiness</Label>
        <div className="grid grid-cols-2 gap-2">
          <ValidationItem
            label="Registration"
            ok={readiness.registrationComplete}
            detail={
              readiness.registrationComplete ? "10DLC approved" : "Pending"
            }
          />
          <ValidationItem
            label="Credits"
            ok={readiness.creditSufficient}
            detail={`${readiness.creditBalance} remaining`}
          />
          <ValidationItem
            label="Template"
            ok={readiness.templateValid}
            detail={
              readiness.templateValid
                ? `${readiness.segmentCount} segment${readiness.segmentCount !== 1 ? "s" : ""}`
                : "Invalid"
            }
          />
          <ValidationItem
            label="Quiet hours"
            ok={!readiness.quietHoursBlocked}
            detail={readiness.quietHoursBlocked ? "Active" : "Clear"}
            warning={readiness.quietHoursBlocked}
          />
        </div>
      </div>
    </div>
  );
}

function ValidationItem({
  label,
  ok,
  detail,
  warning,
}: {
  label: string;
  ok: boolean;
  detail: string;
  warning?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border px-2.5 py-1.5">
      {ok ? (
        <CheckCircle
          weight="fill"
          className="h-3.5 w-3.5 text-repwell-sage-200 shrink-0"
        />
      ) : warning ? (
        <Warning
          weight="fill"
          className="h-3.5 w-3.5 text-amber-500 shrink-0"
        />
      ) : (
        <Warning
          weight="fill"
          className="h-3.5 w-3.5 text-destructive shrink-0"
        />
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium truncate">{label}</p>
        <p className="text-[10px] text-muted-foreground truncate">{detail}</p>
      </div>
    </div>
  );
}
