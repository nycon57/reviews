// AI Response Suggestions Service

import { createChatCompletion, isAIEnabled, getOpenAIClient } from './client';
import { AI_CONFIG, type SentimentLabel, type ReviewTheme } from './types';

// Response tone options
export type ResponseTone = 'professional' | 'friendly' | 'empathetic';

// Response suggestion result
export interface ResponseSuggestion {
  response: string;
  tone: ResponseTone;
  keyPoints: string[];
  suggestedFollowUp?: string;
}

// Review context for generating suggestions
export interface ReviewContext {
  text: string | null;
  rating: number;
  customerName: string | null;
  loanOfficerName: string;
  source: string;
  sentimentScore?: number | null;
  sentimentLabel?: SentimentLabel | null;
  themes?: ReviewTheme[];
  keyPhrases?: string[];
}

// Tone descriptions for the AI prompt
const TONE_DESCRIPTIONS: Record<ResponseTone, string> = {
  professional: 'Maintain a professional, business-like tone. Be courteous and formal while still being warm. Use proper grammar and avoid slang.',
  friendly: 'Use a warm, conversational tone. Be personable and approachable while maintaining professionalism. Include genuine appreciation.',
  empathetic: 'Show deep understanding and compassion. Acknowledge any frustrations or concerns. Focus on resolving issues and rebuilding trust.',
};

// Generate the system prompt for response suggestions
function getSystemPrompt(tone: ResponseTone, context: ReviewContext): string {
  const sentimentContext = context.sentimentLabel
    ? `The review has ${context.sentimentLabel} sentiment (score: ${context.sentimentScore?.toFixed(2) || 'unknown'}).`
    : '';

  const themesContext = context.themes && context.themes.length > 0
    ? `Key themes mentioned: ${context.themes.join(', ')}.`
    : '';

  const keyPhrasesContext = context.keyPhrases && context.keyPhrases.length > 0
    ? `Key phrases from the review: "${context.keyPhrases.join('", "')}".`
    : '';

  return `You are an expert at writing personalized responses to customer reviews for mortgage loan officers.
Your task is to generate a thoughtful, contextual response to a customer review.

TONE REQUIREMENT: ${TONE_DESCRIPTIONS[tone]}

CONTEXT:
- This is a ${context.source} review with a ${context.rating}-star rating.
- The loan officer's name is ${context.loanOfficerName}.
${sentimentContext}
${themesContext}
${keyPhrasesContext}

GUIDELINES:
1. Address the customer by name if provided, otherwise use "Valued Customer"
2. For positive reviews (4-5 stars): Express genuine gratitude, highlight specific positives they mentioned, encourage referrals
3. For neutral reviews (3 stars): Thank them, acknowledge areas for improvement, offer to discuss further
4. For negative reviews (1-2 stars): Apologize sincerely, acknowledge specific concerns, offer to make things right, provide contact info
5. Keep responses between 75-150 words for optimal engagement
6. Never be defensive or dismissive of feedback
7. End with the loan officer's name as signature
8. Include a subtle call-to-action when appropriate (referrals for positive, follow-up for negative)

Respond with a JSON object:
{
  "response": "<the full response text>",
  "keyPoints": ["<2-3 key points addressed in the response>"],
  "suggestedFollowUp": "<optional: suggested follow-up action if applicable>"
}`;
}

// Generate a single response suggestion using OpenAI
export async function generateResponseSuggestion(
  context: ReviewContext,
  tone: ResponseTone = 'professional'
): Promise<ResponseSuggestion> {
  if (!isAIEnabled()) {
    return generateFallbackResponse(context, tone);
  }

  const systemPrompt = getSystemPrompt(tone, context);
  const userPrompt = generateUserPrompt(context);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < AI_CONFIG.maxRetries; attempt++) {
    try {
      const response = await createChatCompletion(systemPrompt, userPrompt);
      const parsed = JSON.parse(response);

      // Validate response structure
      if (!parsed.response || typeof parsed.response !== 'string') {
        throw new Error('Invalid response format from AI');
      }

      return {
        response: parsed.response.trim(),
        tone,
        keyPoints: Array.isArray(parsed.keyPoints)
          ? parsed.keyPoints.filter((p: unknown): p is string => typeof p === 'string').slice(0, 3)
          : [],
        suggestedFollowUp: typeof parsed.suggestedFollowUp === 'string'
          ? parsed.suggestedFollowUp
          : undefined,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Response suggestion attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt < AI_CONFIG.maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, AI_CONFIG.retryDelayMs * (attempt + 1)));
      }
    }
  }

  // Fall back to template-based response if AI fails
  console.warn('AI response generation failed, using fallback:', lastError?.message);
  return generateFallbackResponse(context, tone);
}

// Generate user prompt with review content
function generateUserPrompt(context: ReviewContext): string {
  const customerName = context.customerName || 'Valued Customer';
  const reviewText = context.text || '(No review text provided)';

  return `Generate a response to this ${context.rating}-star review from ${customerName}:

"${reviewText}"

Remember to sign off as ${context.loanOfficerName}.`;
}

// Fallback response generation when AI is unavailable
function generateFallbackResponse(
  context: ReviewContext,
  tone: ResponseTone
): ResponseSuggestion {
  const customerName = context.customerName || 'Valued Customer';
  const loanOfficerName = context.loanOfficerName;

  let response: string;
  let keyPoints: string[];
  let suggestedFollowUp: string | undefined;

  if (context.rating >= 4) {
    // Positive review response
    switch (tone) {
      case 'friendly':
        response = `Hi ${customerName}!

Wow, thank you so much for the wonderful review! It was such a pleasure working with you through your mortgage journey. Your kind words really made my day!

I'm thrilled that everything went smoothly and that you had a great experience. If you ever need anything in the future, or if any of your friends or family are looking for a loan officer, I'd be honored to help them out!

Thanks again,
${loanOfficerName}`;
        break;
      case 'empathetic':
        response = `Dear ${customerName},

I'm deeply grateful for you taking the time to share your experience. Working with you was truly meaningful to me, and I'm so glad I could be part of such an important milestone in your life.

Your trust means everything, and I'm honored to have been your loan officer. Please don't hesitate to reach out if you ever need anything at all.

With sincere thanks,
${loanOfficerName}`;
        break;
      default: // professional
        response = `Dear ${customerName},

Thank you for taking the time to share your positive experience. I truly appreciate your kind words and the trust you placed in me throughout the mortgage process.

It was my pleasure to assist you, and I'm delighted that everything went smoothly. Should you ever need assistance in the future, or know someone in need of mortgage services, I would be honored to help.

Best regards,
${loanOfficerName}`;
    }
    keyPoints = ['Express gratitude', 'Acknowledge positive experience', 'Encourage referrals'];
    suggestedFollowUp = 'Consider sending a handwritten thank-you note';
  } else if (context.rating >= 3) {
    // Neutral review response
    switch (tone) {
      case 'friendly':
        response = `Hi ${customerName},

Thanks for sharing your feedback! I really appreciate you taking the time to let me know about your experience.

I'm always looking to improve, and your input is valuable. If there's anything specific I could have done better, I'd love to hear more. Please feel free to reach out anytime!

Best,
${loanOfficerName}`;
        break;
      case 'empathetic':
        response = `Dear ${customerName},

Thank you for sharing your honest feedback. I truly value your perspective and appreciate you taking the time to help me understand your experience.

I want every client to feel completely satisfied, and I'd welcome the chance to discuss how I might have served you better. Please don't hesitate to reach out if you'd like to talk.

Sincerely,
${loanOfficerName}`;
        break;
      default: // professional
        response = `Dear ${customerName},

Thank you for taking the time to provide your feedback. Your input is valuable and helps me improve my services.

I strive to provide an excellent experience for every client, and I would welcome the opportunity to discuss your experience further. Please feel free to contact me directly if there's anything I can address.

Best regards,
${loanOfficerName}`;
    }
    keyPoints = ['Thank for feedback', 'Express commitment to improvement', 'Offer follow-up'];
    suggestedFollowUp = 'Reach out directly to understand their concerns';
  } else {
    // Negative review response
    switch (tone) {
      case 'friendly':
        response = `Hi ${customerName},

I'm really sorry to hear that your experience didn't meet your expectations. That's definitely not what I want for any of my clients.

I'd love the chance to make this right. Would you be open to chatting with me directly? I want to understand what happened and see how I can help.

Please reach out anytime,
${loanOfficerName}`;
        break;
      case 'empathetic':
        response = `Dear ${customerName},

I'm truly sorry for the difficulties you experienced. Reading your feedback, I can understand your frustration, and I want you to know that your concerns are being heard.

I take full responsibility for any shortcomings in your experience, and I would be grateful for the opportunity to discuss this with you personally and make things right.

With sincere apologies,
${loanOfficerName}`;
        break;
      default: // professional
        response = `Dear ${customerName},

I sincerely apologize that your experience did not meet the high standards I strive to provide. Your feedback is important, and I take it very seriously.

I would greatly appreciate the opportunity to discuss your concerns directly and work toward a resolution. Please contact me at your earliest convenience so I can address this matter personally.

Respectfully,
${loanOfficerName}`;
    }
    keyPoints = ['Sincere apology', 'Acknowledge specific concerns', 'Offer resolution'];
    suggestedFollowUp = 'Call the customer within 24 hours to discuss concerns';
  }

  return {
    response,
    tone,
    keyPoints,
    suggestedFollowUp,
  };
}

// Generate multiple response suggestions with different tones
export async function generateMultipleResponseSuggestions(
  context: ReviewContext,
  tones: ResponseTone[] = ['professional', 'friendly', 'empathetic']
): Promise<ResponseSuggestion[]> {
  const suggestions: ResponseSuggestion[] = [];

  for (const tone of tones) {
    try {
      const suggestion = await generateResponseSuggestion(context, tone);
      suggestions.push(suggestion);
      // Small delay between API calls to avoid rate limiting
      if (tones.indexOf(tone) < tones.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error(`Failed to generate ${tone} suggestion:`, error);
      // Add fallback for this tone
      suggestions.push(generateFallbackResponse(context, tone));
    }
  }

  return suggestions;
}

// Improved response using AI with edit context (for learning)
export async function improveResponseWithContext(
  originalSuggestion: string,
  editedResponse: string,
  context: ReviewContext
): Promise<{ improvedPrompt: string; learnings: string[] }> {
  if (!isAIEnabled()) {
    return {
      improvedPrompt: '',
      learnings: ['AI features not enabled - learning skipped'],
    };
  }

  const client = getOpenAIClient();

  try {
    const response = await client.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [
        {
          role: 'system',
          content: `You are an expert at analyzing response edits to improve future AI suggestions.
Compare the original AI suggestion with the user's edited version to identify patterns and improvements.

Respond with JSON:
{
  "learnings": ["<specific improvements the user made>"],
  "improvedPrompt": "<how to adjust future prompts based on this feedback>"
}`,
        },
        {
          role: 'user',
          content: `Review context:
- Rating: ${context.rating} stars
- Sentiment: ${context.sentimentLabel || 'unknown'}
- Customer: ${context.customerName || 'unknown'}

Original AI suggestion:
"${originalSuggestion}"

User's edited version:
"${editedResponse}"

Analyze the differences and extract learnings.`,
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return {
        improvedPrompt: parsed.improvedPrompt || '',
        learnings: Array.isArray(parsed.learnings) ? parsed.learnings : [],
      };
    }
  } catch (error) {
    console.error('Failed to analyze response edits:', error);
  }

  return {
    improvedPrompt: '',
    learnings: [],
  };
}
