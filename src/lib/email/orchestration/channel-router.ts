import { createAdminClient } from "@/lib/supabase/admin";
import type { ChannelSendResult, SequenceRecord, SequenceStep, EmailContext } from "./types";

/**
 * Route a sequence step to the correct channel and execute it.
 * With SMS removed, this always sends via email.
 */
export async function routeStepToChannel(
  sequence: SequenceRecord,
  step: SequenceStep,
  emailSender: (
    ctx: EmailContext
  ) => Promise<{ success: boolean; emailId?: string; error?: string }>
): Promise<ChannelSendResult> {
  const supabase = createAdminClient();

  const { data: user } = await supabase
    .from("users")
    .select("id, email, full_name")
    .eq("id", sequence.user_id)
    .single();

  if (!user) {
    return { success: false, channel: "email", error: "User not found" };
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
