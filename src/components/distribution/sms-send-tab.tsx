"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  sendSmsReviewRequest,
  checkSmsSendReadiness,
  getSmsTemplatesForSend,
  getRecentSmsSends,
  type SendReadiness,
  type RecentSmsSend,
} from "@/lib/sms/send/actions";
import { getUsersForSend } from "@/lib/distribution/actions";
import { toE164, formatForDisplay } from "@/lib/sms/phone-utils";
import { SmsBorrowerSelector } from "./sms-borrower-selector";
import { SmsTemplateSelector } from "./sms-template-selector";
import { SmsConsentCapture } from "./sms-consent-capture";
import { SmsSendConfirmation } from "./sms-send-confirmation";
import { SmsDeliveryTracker, RecentSmsList } from "./sms-delivery-status";
import type { SmsTemplate, SmsTemplateCategory } from "@/lib/sms/types";
import {
  PaperPlaneRight,
  SpinnerGap,
  CalendarBlank,
  Warning,
  CheckCircle,
  ArrowClockwise,
  User,
  ListBullets,
} from "@phosphor-icons/react";

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
}

interface SmsSendTabProps {
  onSuccess?: () => void;
}

export function SmsSendTab({ onSuccess }: SmsSendTabProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Data
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [recentSends, setRecentSends] = useState<RecentSmsSend[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form state
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowerPhone, setBorrowerPhone] = useState("");
  const [loanOfficerId, setLoanOfficerId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [templateCategory, setTemplateCategory] = useState<SmsTemplateCategory | null>(null);
  const [useSchedule, setUseSchedule] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  // Readiness check
  const [readiness, setReadiness] = useState<SendReadiness | null>(null);
  const [isCheckingReadiness, setIsCheckingReadiness] = useState(false);

  // Confirmation dialog
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Post-send tracking
  const [sentMessageId, setSentMessageId] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setIsLoadingData(true);
      const [usersResult, templatesResult, sendsResult] = await Promise.all([
        getUsersForSend(),
        getSmsTemplatesForSend(),
        getRecentSmsSends(),
      ]);

      if (usersResult.success && usersResult.data) {
        setTeamMembers(usersResult.data);
      }
      if (templatesResult.success && templatesResult.data) {
        setTemplates(templatesResult.data);
      }
      if (sendsResult.success && sendsResult.data) {
        setRecentSends(sendsResult.data);
      }
      setIsLoadingData(false);
    }
    loadData();
  }, []);

  // Phone validation
  const phoneE164 = toE164(borrowerPhone);
  const phoneValidation = borrowerPhone.length > 0
    ? { valid: phoneE164 !== null, display: phoneE164 ? formatForDisplay(phoneE164) : null }
    : null;

  // Check readiness when phone and template change (debounced 500ms)
  useEffect(() => {
    if (!phoneE164 || !templateId) {
      setReadiness(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsCheckingReadiness(true);
      const result = await checkSmsSendReadiness({
        borrowerPhone: phoneE164,
        templateId,
      });
      if (result.success && result.data) {
        setReadiness(result.data);
      }
      setIsCheckingReadiness(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [phoneE164, templateId]);

  // Compute whether form is ready to submit
  const canSend =
    borrowerName.trim().length > 0 &&
    phoneValidation?.valid &&
    loanOfficerId &&
    templateId &&
    readiness &&
    !readiness.consentRequired &&
    readiness.creditSufficient &&
    readiness.templateValid;

  const scheduledIso = useSchedule && scheduledDate && scheduledTime
    ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
    : undefined;

  // Handle send
  function handleSendClick() {
    if (!canSend) return;
    setShowConfirmation(true);
  }

  function handleConfirmSend() {
    startTransition(async () => {
      const result = await sendSmsReviewRequest({
        borrowerName,
        borrowerPhone,
        loanOfficerId,
        templateId,
        scheduledAt: scheduledIso,
      });

      setShowConfirmation(false);

      if (result.success && result.data) {
        const data = result.data;
        if (data.scheduledAt) {
          toast({
            title: "SMS scheduled",
            description: `Message will be sent at ${new Date(data.scheduledAt).toLocaleString()}.`,
          });
        } else {
          toast({
            title: "SMS sent",
            description: "Review request sent successfully.",
          });
        }

        if (data.messageId) {
          setSentMessageId(data.messageId);
        }

        // Refresh recent sends
        const sendsResult = await getRecentSmsSends();
        if (sendsResult.success && sendsResult.data) {
          setRecentSends(sendsResult.data);
        }

        // Reset form (preserve sentMessageId for delivery tracking)
        setBorrowerName("");
        setBorrowerPhone("");
        setTemplateId("");
        setScheduledDate("");
        setScheduledTime("");
        setUseSchedule(false);
        setReadiness(null);
        onSuccess?.();
      } else {
        toast({
          title: "Send failed",
          description: result.success ? "Unknown error" : result.error,
          variant: "destructive",
        });
      }
    });
  }

  function handleConsentRecorded() {
    // Re-check readiness after consent is recorded
    if (phoneE164 && templateId) {
      startTransition(async () => {
        const result = await checkSmsSendReadiness({
          borrowerPhone,
          templateId,
        });
        if (result.success && result.data) {
          setReadiness(result.data);
        }
      });
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <SpinnerGap className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Post-send delivery tracker */}
      {sentMessageId && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Delivery status
            </span>
            <SmsDeliveryTracker messageId={sentMessageId} />
          </div>
        </div>
      )}

      {/* Borrower info */}
      <SmsBorrowerSelector
        borrowerName={borrowerName}
        borrowerPhone={borrowerPhone}
        onNameChange={setBorrowerName}
        onPhoneChange={setBorrowerPhone}
        phoneValidation={phoneValidation}
      />

      {/* Loan officer selector */}
      <div className="space-y-1.5">
        <Label htmlFor="sms-loan-officer" className="text-sm font-medium">
          Loan officer
        </Label>
        <Select value={loanOfficerId} onValueChange={setLoanOfficerId}>
          <SelectTrigger id="sms-loan-officer">
            <SelectValue placeholder="Select loan officer" />
          </SelectTrigger>
          <SelectContent>
            {teamMembers.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  {m.fullName}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Template selector */}
      <SmsTemplateSelector
        templates={templates}
        selectedTemplateId={templateId}
        onSelectTemplate={setTemplateId}
        isLoading={isLoadingData}
        category={templateCategory}
        onCategoryChange={setTemplateCategory}
      />

      <Separator />

      {/* Consent status */}
      {readiness && phoneValidation?.valid && (
        <SmsConsentCapture
          phone={borrowerPhone}
          consentStatus={readiness.consentStatus}
          onConsentRecorded={handleConsentRecorded}
        />
      )}

      {/* Pre-send validation indicators */}
      {readiness && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Send readiness</Label>
          <div className="grid grid-cols-2 gap-2">
            <ValidationItem
              label="Registration"
              ok={readiness.registrationComplete}
              detail={readiness.registrationComplete ? "10DLC approved" : "Pending"}
            />
            <ValidationItem
              label="Credits"
              ok={readiness.creditSufficient}
              detail={`${readiness.creditBalance} remaining`}
            />
            <ValidationItem
              label="Template"
              ok={readiness.templateValid}
              detail={readiness.templateValid ? `${readiness.segmentCount} segment${readiness.segmentCount !== 1 ? "s" : ""}` : "Invalid"}
            />
            <ValidationItem
              label="Quiet hours"
              ok={!readiness.quietHoursBlocked}
              detail={readiness.quietHoursBlocked ? "Active" : "Clear"}
              warning={readiness.quietHoursBlocked}
            />
          </div>
        </div>
      )}

      <Separator />

      {/* Scheduled send option */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant={!useSchedule ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setUseSchedule(false)}
          >
            <PaperPlaneRight className="mr-2 h-4 w-4" />
            Send now
          </Button>
          <Button
            type="button"
            variant={useSchedule ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setUseSchedule(true)}
          >
            <CalendarBlank className="mr-2 h-4 w-4" />
            Schedule
          </Button>
        </div>

        {useSchedule && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="sms-schedule-date" className="text-xs">Date</Label>
              <Input
                id="sms-schedule-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sms-schedule-time" className="text-xs">Time</Label>
              <Input
                id="sms-schedule-time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Send button */}
      <Button
        className="w-full"
        disabled={!canSend || isPending || isCheckingReadiness}
        onClick={handleSendClick}
      >
        {isPending ? (
          <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <PaperPlaneRight className="mr-2 h-4 w-4" />
        )}
        {useSchedule ? "Schedule SMS" : "Send SMS"}
      </Button>

      {/* Confirmation dialog */}
      {readiness && (
        <SmsSendConfirmation
          open={showConfirmation}
          onOpenChange={setShowConfirmation}
          onConfirm={handleConfirmSend}
          isPending={isPending}
          recipientPhone={readiness.phoneE164 ?? ""}
          templatePreview={readiness.templatePreview ?? ""}
          segmentCount={readiness.segmentCount}
          creditCost={readiness.creditCost}
          scheduledTime={scheduledIso ?? null}
          quietHoursWarning={readiness.quietHoursBlocked}
          quietHoursNextValid={readiness.quietHoursNextValid}
        />
      )}

      <Separator />

      {/* Recent sends */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListBullets className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Recent sends</Label>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              startTransition(async () => {
                const result = await getRecentSmsSends();
                if (result.success && result.data) {
                  setRecentSends(result.data);
                }
              });
            }}
          >
            <ArrowClockwise className="mr-1 h-3 w-3" />
            Refresh
          </Button>
        </div>
        <RecentSmsList sends={recentSends} isLoading={false} />
      </div>
    </div>
  );
}

// ── Validation Item ──────────────────────────────────────────────────

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
        <CheckCircle weight="fill" className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
      ) : warning ? (
        <Warning weight="fill" className="h-3.5 w-3.5 text-amber-500 shrink-0" />
      ) : (
        <Warning weight="fill" className="h-3.5 w-3.5 text-destructive shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium truncate">{label}</p>
        <p className="text-[10px] text-muted-foreground truncate">{detail}</p>
      </div>
    </div>
  );
}
