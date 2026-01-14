// OpenAI API Client

import OpenAI from 'openai';
import { AI_CONFIG } from './types';

let openaiClient: OpenAI | null = null;

function getOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }

  return { apiKey };
}

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const { apiKey } = getOpenAIConfig();
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export function isAIEnabled(): boolean {
  return (
    !!process.env.OPENAI_API_KEY &&
    process.env.FEATURE_AI_ANALYSIS !== 'false'
  );
}

export async function createChatCompletion(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: AI_CONFIG.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: AI_CONFIG.maxTokens,
    temperature: AI_CONFIG.temperature,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  return content;
}
