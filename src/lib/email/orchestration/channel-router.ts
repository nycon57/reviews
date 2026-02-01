"use server";

/**
 * Campaign Sequencer — Channel Router
 *
 * Routes sequence steps to the correct delivery channel (email or SMS).
 * Handles:
 * - SMS send node: sends via SmsService with consent/quiet-hours checks
 * - Channel fallback: falls back to email if SMS is unavailable
 * - Smart channel selection: picks the best channel per recipient state
 */

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

// ============================================================================
// SMS Eligibility Checks
// ============================================================================

interface SmsEligibility {
  eligible: boolean;
  reason?: string;
  phone?: string;
}

/**
 * Check whether a user is eligible to receive SMS for a given organization.
 * Validates phone number, consent status, and credit balance.
 */
export async function checkSmsEligibility(
  userId: string,
  organizationId: string,
  requirements?: SmartChannelConfig["smsRequirements"]
): Promise<SmsEligibility> {
  const supabase = createAdminClient();

  // 1. Check if user has a phone number
  const { data: user } = await supabase
    .from("users")
    .select("phone")
    .eq("id", userId)
    .single();

  const phone = user?.phone as string | null;
  if (!phone) {
    return { eligible: false, reason: "no_phone_number" };
  }

  // 2. Check SMS consent
  if (requirements?.requireConsent !== false) {
    const consentService = new ConsentService();
    const hasConsent = await consentService.checkConsent(organizationId, phone);
    if (!hasConsent) {
      return { eligible: false, reason: "no_sms_consent" };
    }
  }

  // 3. Check SMS credits
  if (requirements?.requireCredits !== false) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: credits } = await (supabase.from as any)("sms_credits")
      .select("included_credits, used_credits, overage_rate_cents")
      .eq("organization_id", organizationId)
      .order("period_end", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (credits) {
      const remaining = credits.included_credits - credits.used_credits;
      if (remaining <= 0 && credits.overage_rate_cents === 0) {
        return { eligible: false, reason: "sms_credits_exhausted", phone };
      }
    }
  }

  return { eligible: true, phone };
}

// ============================================================================
// Smart Channel Selection
// ============================================================================

/**
 * Determine the best channel based on the smart channel config and user state.
 */
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
      // Use email by default; only use SMS if step has no email template
      if (step.template.name) {
        return { channel: "email" };
      }
      if (smsEligibility.eligible) {
        return { channel: "sms", phone: smsEligibility.phone };
      }
      return { channel: "email" };

    case "best_available": {
      // Pick the channel with the best historical engagement for this user.
      // If we can't determine, prefer the channel that has all requirements met.
      if (smsEligibility.eligible) {
        const engagement = await getUserChannelEngagement(userId, organizationId);
        if (engagement.smsConversionRate > engagement.emailOpenRate) {
          return { channel: "sms", phone: smsEligibility.phone };
        }
      }
      return { channel: "email" };
    }

    case "round_robin": {
      // Alternate channels step-by-step. Odd steps → email, even → SMS.
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

/**
 * Get basic engagement metrics per channel for a user.
 * Used by the "best_available" smart channel strategy.
 */
async function getUserChannelEngagement(
  userId: string,
  organizationId: string
): Promise<{ emailOpenRate: number; smsConversionRate: number }> {
  const supabase = createAdminClient();

  // Email: check open rate from email_sequences completed steps
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: emailCount } = await (supabase.from as any)("email_sequences")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("organization_id", organizationId);

  // SMS: check delivery + click rate
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

  return {
    emailOpenRate: emailCount ? 0.3 : 0, // baseline; real tracking would use email opens
    smsConversionRate: smsTotal > 0 ? smsDelivered / smsTotal : 0,
  };
}

// ============================================================================
// SMS Send Node
// ============================================================================

/**
 * Send an SMS through the orchestration engine.
 * Wraps SmsService with sequence-aware context.
 */
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

    // Resolve merge fields from sequence metadata
    const mergeFields: Record<string, string> = {
      borrower_name: ctx.user.full_name || "",
      ...(ctx.smsTemplate.mergeFieldOverrides ?? {}),
    };

    // Add metadata values as merge fields
    for (const [key, value] of Object.entries(ctx.metadata)) {
      if (typeof value === "string") {
        mergeFields[key] = value;
      }
    }

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

// ============================================================================
// Channel Router (Main Entry Point)
// ============================================================================

/**
 * Route a sequence step to the correct channel and execute it.
 *
 * Resolution order:
 * 1. If step has smartChannel config → auto-select channel
 * 2. If step has channelConfig → use specified channel
 * 3. Default → email
 *
 * If the primary channel fails and a fallback is configured, the fallback
 * channel is attempted automatically.
 */
export async function routeStepToChannel(
  sequence: SequenceRecord,
  step: SequenceStep,
  emailSender: (ctx: EmailContext) => Promise<{ success: boolean; emailId?: string; error?: string }>
): Promise<ChannelSendResult> {
  const supabase = createAdminClient();

  // Get user data (with phone)
  const { data: user } = await supabase
    .from("users")
    .select("id, email, full_name, phone")
    .eq("id", sequence.user_id)
    .single();

  if (!user) {
    return { success: false, channel: "email", error: "User not found" };
  }

  // Determine channel
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

  // Attempt primary channel
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

  // Attempt fallback if configured
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

/**
 * Execute a send on a specific channel.
 */
async function executeChannelSend(
  channel: ChannelType,
  sequence: SequenceRecord,
  step: SequenceStep,
  user: { id: string; email: string; full_name: string | null; phone: string | null },
  emailSender: (ctx: EmailContext) => Promise<{ success: boolean; emailId?: string; error?: string }>,
  channelConfig?: ChannelConfig
): Promise<ChannelSendResult> {
  if (channel === "sms") {
    const smsTemplate =
      channelConfig?.smsTemplate ?? step.channelConfig?.smsTemplate;

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

  // Email channel (default)
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
