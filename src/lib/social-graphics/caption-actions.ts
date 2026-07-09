"use server";

import { createChatCompletion, isAIEnabled } from "@/lib/ai/client";
import { getAuthenticatedUserResult } from "@/lib/auth/server-action-guards";
import { PLATFORM_CHAR_LIMITS, type ActionResult, type SocialPlatform } from "./types";

export async function generateCaption(input: {
  reviewText?: string | null;
  customerName?: string | null;
  rating?: number;
  platform?: string;
  orgName?: string;
}): Promise<ActionResult<string>> {
  const auth = await getAuthenticatedUserResult();
  if (!auth.success) {
    return { success: false, error: auth.error };
  }

  if (!isAIEnabled()) {
    return { success: false, error: "AI features are not enabled" };
  }

  const platform = (input.platform ?? "facebook") as SocialPlatform;
  const charLimit = PLATFORM_CHAR_LIMITS[platform] ?? 2200;

  const systemPrompt = `You are a social media copywriter for a mortgage/financial services company.
Write a short, professional yet warm caption for sharing a customer review on social media.
Keep the tone confident but not boastful. Use 1-2 emojis max, sparingly.
Do NOT fabricate review details - only reference information provided.
Stay under ${charLimit} characters.
Respond with JSON: { "caption": "your caption here" }`;

  const userPrompt = [
    input.orgName ? `Company: ${input.orgName}` : "",
    input.rating ? `Rating: ${input.rating}/5 stars` : "",
    input.customerName ? `Customer: ${input.customerName}` : "",
    input.reviewText ? `Review: "${input.reviewText}"` : "",
    `Platform: ${platform}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await createChatCompletion(systemPrompt, userPrompt);
    const parsed = JSON.parse(response) as { caption?: string };
    const caption = parsed.caption ?? response;
    return { success: true, data: caption.slice(0, charLimit) };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Caption generation failed",
    };
  }
}
