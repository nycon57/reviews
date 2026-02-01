"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { SmsService } from "@/lib/sms/sms-service";
import { ConsentService } from "@/lib/sms/consent-service";
import type {
  ChannelType,
  ChannelConfig,
  ChannelSendResult,
  SmartChannelConfig,
  SmsOrchestratedContext,
  SequenceRecord,
  SequenceStep,
  EmailContext,
} from "./types";

// SMS Eligibility

interface SmsEligibility {
  eligible: boolean;
  reason?: string;
  phone?: string;
}

/** Validates phone number, consent status, and credit balance for SMS eligibility. */
export async function checkSmsEligibility(
  userId: string,
  organizationId: string,
  requirements?: SmartChannelConfig["smsRequirements"]
): Promise<SmsEligibility> {
  const supabase = createAdminClient();

  const { data: user } = await supabase
    .from("users")
    .select("phone")
    .eq("id", userId)
    .single();

  const phone = user?.phone as string | null;
  if (!phone) {
    return { eligible: false, reason: "no_phone_number" };
  }

  const checkConsent = requirements?.requireConsent !== false;
  const checkCredits = requirements?.requireCredits !== false;

  const [consentResult, creditsResult] = await Promise.all([
    checkConsent
      ? new ConsentService().checkConsent(organizationId, phone)
      : Promise.resolve(true),
    checkCredits
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from as any)("sms_credits")
          .select("included_credits, used_credits, overage_rate_cents")
          .eq("organization_id", organizationId)
          .order("period_end", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (checkConsent && !consentResult) {
    return { eligible: false, reason: "no_sms_consent" };
  }

  if (checkCredits && creditsResult.data) {
    const credits = creditsResult.data;
    const remaining = credits.included_credits - credits.used_credits;
    if (remaining <= 0 && credits.overage_rate_cents === 0) {
      return { eligible: false, reason: "sms_credits_exhausted", phone };
    }
  }

  return { eligible: true, phone };
}

// Smart Channel Selection

export async function selectChannel(
  userId: string,
  organizationId: string,
  config: SmartChannelConfig,
  step: SequenceStep
): Promise<{ channel: ChannelType; phone?: string }> {
  const smsEligibility = await checkSmsEligibility(
    userId,
    organizationId,
    config.smsRequirements
  );

  switch (config.strategy) {
    case "prefer_sms":
      if (smsEligibility.eligible) {
        return { channel: "sms", phone: smsEligibility.phone };
      }
      return { channel: "email" };

    case "prefer_email":
      if (step.template.name) {
        return { channel: "email" };
      }
      if (smsEligibility.eligible) {
        return { channel: "sms", phone: smsEligibility.phone };
      }
      return { channel: "email" };

    case "best_available": {
      if (smsEligibility.eligible) {
        const engagement = await getUserChannelEngagement(userId, organizationId);
        if (engagement.smsConversionRate > engagement.emailOpenRate) {
          return { channel: "sms", phone: smsEligibility.phone };
        }
      }
      return { channel: "email" };
    }

    case "round_robin": {
      const preferSms = step.step % 2 === 0;
      if (preferSms && smsEligibility.eligible) {
        return { channel: "sms", phone: smsEligibility.phone };
      }
      return { channel: "email" };
    }

    default:
      return { channel: "email" };
  }
}

/** Get basic engagement metrics per channel, used by the "best_available" strategy. */
async function getUserChannelEngagement(
  userId: string,
  organizationId: string
): Promise<{ emailOpenRate: number; smsConversionRate: number }> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: smsStats } = await (supabase.from as any)("sms_messages")
    .select("status")
    .eq("organization_id", organizationId)
    .or(`borrower_id.eq.${userId},loan_officer_id.eq.${userId}`)
    .eq("direction", "outbound")
    .limit(50);

  const smsTotal = smsStats?.length ?? 0;
  const smsDelivered = smsStats?.filter(
    (m: { status: string }) => m.status === "delivered"
  ).length ?? 0;

  // No open-tracking data yet; return 0 so "best_available" prefers SMS when delivery data exists.
  return {
    emailOpenRate: 0,
    smsConversionRate: smsTotal > 0 ? smsDelivered / smsTotal : 0,
  };
}

// SMS Send Node

export async function sendSequenceSms(
  ctx: SmsOrchestratedContext
): Promise<ChannelSendResult> {
  if (!ctx.user.phone) {
    return {
      success: false,
      channel: "sms",
      error: "User has no phone number",
    };
  }

  try {
    const smsService = await SmsService.forOrganization(ctx.organizationId);

    const result = await smsService.sendReviewRequest({
      borrowerId: ctx.user.id,
      loanOfficerId: (ctx.metadata.loanOfficerId as string) || ctx.user.id,
      templateId: ctx.smsTemplate.templateId,
      borrowerPhone: ctx.user.phone,
      borrowerName: ctx.user.full_name || "Customer",
    });

    if (!result.success) {
      return {
        success: false,
        channel: "sms",
        error: result.error,
      };
    }

    return {
      success: true,
      channel: "sms",
      messageId: result.messageId,
      queued: !!result.scheduledAt,
      scheduledAt: result.scheduledAt,
    };
  } catch (error) {
    return {
      success: false,
      channel: "sms",
      error: error instanceof Error ? error.message : "SMS send failed",
    };
  }
}

// Channel Router

/**
 * Route a sequence step to the correct channel and execute it.
 * Resolution: smartChannel > channelConfig > email (default).
 * Falls back to the configured fallback channel on failure.
 */
export async function routeStepToChannel(
  sequence: SequenceRecord,
  step: SequenceStep,
  emailSender: (ctx: EmailContext) => Promise<{ success: boolean; emailId?: string; error?: string }>
): Promise<ChannelSendResult> {
  const supabase = createAdminClient();

  const { data: user } = await supabase
    .from("users")
    .select("id, email, full_name, phone")
    .eq("id", sequence.user_id)
    .single();

  if (!user) {
    return { success: false, channel: "email", error: "User not found" };
  }

  let targetChannel: ChannelType = "email";
  let userPhone = user.phone as string | null;
  const channelConfig = step.channelConfig;

  if (step.smartChannel) {
    const selected = await selectChannel(
      user.id,
      sequence.organization_id,
      step.smartChannel,
      step
    );
    targetChannel = selected.channel;
    if (selected.phone) userPhone = selected.phone;
  } else if (channelConfig) {
    targetChannel = channelConfig.channel;
  }

  const primaryResult = await executeChannelSend(
    targetChannel,
    sequence,
    step,
    { ...user, phone: userPhone },
    emailSender,
    channelConfig
  );

  if (primaryResult.success) {
    return primaryResult;
  }

  const fallbackChannel = channelConfig?.fallbackChannel;
  if (fallbackChannel && fallbackChannel !== targetChannel) {
    const fallbackResult = await executeChannelSend(
      fallbackChannel,
      sequence,
      step,
      { ...user, phone: userPhone },
      emailSender,
      channelConfig
    );
    return {
      ...fallbackResult,
      usedFallback: true,
      fallbackChannel,
    };
  }

  return primaryResult;
}

async function executeChannelSend(
  channel: ChannelType,
  sequence: SequenceRecord,
  step: SequenceStep,
  user: { id: string; email: string; full_name: string | null; phone: string | null },
  emailSender: (ctx: EmailContext) => Promise<{ success: boolean; emailId?: string; error?: string }>,
  channelConfig?: ChannelConfig
): Promise<ChannelSendResult> {
  if (channel === "sms") {
    const smsTemplate = channelConfig?.smsTemplate;

    if (!smsTemplate) {
      return {
        success: false,
        channel: "sms",
        error: "No SMS template configured for this step",
      };
    }

    return sendSequenceSms({
      sequence,
      step,
      user,
      organizationId: sequence.organization_id,
      smsTemplate,
      metadata: sequence.metadata,
    });
  }

  const emailCtx: EmailContext = {
    sequence,
    step,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
    },
    metadata: sequence.metadata,
  };

  const result = await emailSender(emailCtx);

  return {
    success: result.success,
    channel: "email",
    messageId: result.emailId,
    error: result.error,
  };
}
