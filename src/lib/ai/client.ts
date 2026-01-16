// Google Gemini API Client

import { GoogleGenAI } from '@google/genai';
import { AI_CONFIG } from './types';

let geminiClient: GoogleGenAI | null = null;

function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
  }

  return { apiKey };
}

export function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const { apiKey } = getGeminiConfig();
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

export function isAIEnabled(): boolean {
  return (
    !!process.env.GEMINI_API_KEY &&
    process.env.FEATURE_AI_ANALYSIS !== 'false'
  );
}

export async function createChatCompletion(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const client = getGeminiClient();

  const response = await client.models.generateContent({
    model: AI_CONFIG.model,
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
      responseMimeType: 'application/json',
    },
  });

  const content = response.text;
  if (!content) {
    throw new Error('Empty response from Gemini');
  }

  return content;
}
