import { createUntypedAdminClient } from "@/lib/supabase/admin";

export type NpsCategory = "promoter" | "passive" | "detractor";

/**
 * Check if the message body is a standalone numeric NPS reply (0-10).
 * Only matches standalone numbers — not numbers embedded in longer messages.
 */
export function parseNpsScore(body: string): {
  isNumeric: boolean;
  score?: number;
  category?: NpsCategory;
} {
  const match = body.trim().match(/^(\d|10)$/);
  if (!match) return { isNumeric: false };

  const score = parseInt(match[1], 10);

  return {
    isNumeric: true,
    score,
    category: classifyNpsScore(score),
  };
}

export function classifyNpsScore(score: number): NpsCategory {
  if (score >= 9) return "promoter";
  if (score >= 7) return "passive";
  return "detractor";
}

/**
 * Check if the sender has a pending outbound message
 * (sent within last 72 hours).
 */
export async function checkPendingNpsRequest(
  organizationId: string,
  phone: string
): Promise<{
  hasPending: boolean;
  messageId?: string;
  loanOfficerId?: string;
}> {
  const supabase = createUntypedAdminClient();

  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 72);

  const { data, error } = await supabase
    .from("sms_messages")
    .select("id, loan_officer_id, template_id")
    .eq("organization_id", organizationId)
    .eq("to_number", phone)
    .eq("direction", "outbound")
    .in("status", ["sent", "delivered"])
    .gte("sent_at", cutoff.toISOString())
    .order("sent_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error(
      `[NPS Parser] Failed to check pending NPS request (org ${organizationId}, phone ${phone}):`,
      error.message
    );
    return { hasPending: false };
  }

  if (!data || data.length === 0) {
    return { hasPending: false };
  }

  return {
    hasPending: true,
    messageId: data[0].id,
    loanOfficerId: data[0].loan_officer_id ?? undefined,
  };
}

/**
 * Process an NPS reply: record the score and send appropriate auto-reply.
 * Errors from survey_responses insert are logged but do not crash the webhook.
 */
export async function processNpsReply(params: {
  organizationId: string;
  phone: string;
  score: number;
  category: NpsCategory;
  originalMessageId?: string;
  loanOfficerId?: string;
  reviewLink?: string;
}): Promise<{ response: string }> {
  const supabase = createUntypedAdminClient();

  const { error } = await supabase.from("survey_responses").insert({
    organization_id: params.organizationId,
    response_type: "nps",
    score: params.score,
    category: params.category,
    source: "sms",
    phone_number: params.phone,
    original_message_id: params.originalMessageId ?? null,
    loan_officer_id: params.loanOfficerId ?? null,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error(
      "[NPS Parser] Failed to store survey response:",
      error.message
    );
  }

  if (params.category === "promoter") {
    const link = params.reviewLink || "";
    if (!link) {
      console.warn(
        `[NPS Parser] No reviewLink provided for promoter response (org ${params.organizationId}) — link will be empty`
      );
    }
    return {
      response:
        `Thank you for the amazing feedback! We'd love if you could share your experience: ${link} Reply STOP to opt out.`,
    };
  } else if (params.category === "passive") {
    return {
      response:
        "Thank you for your feedback! We're always working to improve. Reply STOP to opt out.",
    };
  } else {
    return {
      response:
        "Thank you for your feedback. We'd love to hear more about how we can improve. Reply STOP to opt out.",
    };
  }
}
