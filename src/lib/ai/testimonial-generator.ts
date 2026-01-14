// AI Testimonial Generator Service

import { createChatCompletion, isAIEnabled } from './client';
import { AI_CONFIG } from './types';
import type {
  TestimonialFormat,
  TestimonialReviewContext,
  GeneratedTestimonial,
  TestimonialGenerationResult,
  GeneratedGraphic,
  GraphicGenerationOptions,
} from './testimonial-types';

// Format descriptions for AI prompts
const FORMAT_DESCRIPTIONS: Record<TestimonialFormat, { description: string; maxLength: number }> = {
  short: {
    description: 'A concise 1-2 sentence testimonial quote that captures the essence of the review.',
    maxLength: 150,
  },
  medium: {
    description: 'A full paragraph testimonial suitable for website display, maintaining authenticity.',
    maxLength: 300,
  },
  long: {
    description: 'An extended testimonial with context about the customer journey and experience.',
    maxLength: 500,
  },
  social: {
    description: 'A punchy, shareable quote optimized for social media (Twitter/X length under 280 chars).',
    maxLength: 280,
  },
  headline: {
    description: 'A single powerful headline (under 10 words) that captures the review essence.',
    maxLength: 60,
  },
};

// Get system prompt for testimonial generation
function getSystemPrompt(format: TestimonialFormat, context: TestimonialReviewContext): string {
  const formatInfo = FORMAT_DESCRIPTIONS[format];

  const sentimentContext = context.sentimentLabel
    ? `Sentiment: ${context.sentimentLabel} (score: ${context.sentimentScore?.toFixed(2) || 'N/A'})`
    : '';

  const themesContext = context.themes.length > 0
    ? `Key themes: ${context.themes.join(', ')}`
    : '';

  const keyPhrasesContext = context.keyPhrases.length > 0
    ? `Notable phrases: "${context.keyPhrases.slice(0, 5).join('", "')}"`
    : '';

  return `You are an expert at creating compelling marketing testimonials from customer reviews.
Your task is to transform a positive customer review into a polished, marketing-ready testimonial.

FORMAT REQUIREMENT: ${formatInfo.description}
Maximum length: ${formatInfo.maxLength} characters

REVIEW CONTEXT:
- Rating: ${context.rating}/5 stars
- Source: ${context.source}
- Customer: ${context.customerName || 'Anonymous'}
- Location: ${context.customerLocation || 'Not specified'}
- Loan Officer: ${context.loanOfficerName}
- Review Date: ${context.reviewDate}
${sentimentContext}
${themesContext}
${keyPhrasesContext}

GUIDELINES:
1. Maintain the customer's authentic voice and specific details
2. Focus on emotional impact and concrete outcomes
3. Highlight what makes this loan officer exceptional
4. Keep the testimonial genuine - avoid marketing jargon
5. Include customer attribution when available
6. Extract the most impactful quote directly from the review
7. Identify 2-3 key highlights that make this testimonial compelling
8. Rate your confidence (0-1) based on how suitable the review is for testimonials

IMPORTANT:
- Only create testimonials from positive reviews (3+ stars)
- Don't fabricate details not present in the original review
- Preserve specific numbers, timeframes, or achievements mentioned
- If the review lacks substance, indicate low confidence

Respond with a JSON object:
{
  "content": "<the polished testimonial text>",
  "originalQuote": "<the most impactful exact quote from the review>",
  "keyHighlights": ["<highlight 1>", "<highlight 2>", "<highlight 3>"],
  "confidence": <0.0 to 1.0>
}`;
}

// Generate user prompt with review content
function getUserPrompt(context: TestimonialReviewContext, format: TestimonialFormat): string {
  const reviewText = context.text || '(No review text provided)';
  const formatInfo = FORMAT_DESCRIPTIONS[format];

  return `Generate a ${format} testimonial (max ${formatInfo.maxLength} chars) from this ${context.rating}-star review:

"${reviewText}"

Customer: ${context.customerName || 'Anonymous'}
Loan Officer: ${context.loanOfficerName}`;
}

// Generate a single testimonial for a specific format
export async function generateTestimonial(
  context: TestimonialReviewContext,
  format: TestimonialFormat = 'medium'
): Promise<GeneratedTestimonial> {
  // Check if review is suitable for testimonials
  if (context.rating < 3) {
    throw new Error('Review rating too low for testimonial generation');
  }

  if (!context.text || context.text.trim().length < 20) {
    throw new Error('Review text too short for testimonial generation');
  }

  if (!isAIEnabled()) {
    return generateFallbackTestimonial(context, format);
  }

  const systemPrompt = getSystemPrompt(format, context);
  const userPrompt = getUserPrompt(context, format);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < AI_CONFIG.maxRetries; attempt++) {
    try {
      const response = await createChatCompletion(systemPrompt, userPrompt);
      const parsed = JSON.parse(response);

      // Validate response structure
      if (!parsed.content || typeof parsed.content !== 'string') {
        throw new Error('Invalid testimonial format from AI');
      }

      const formatInfo = FORMAT_DESCRIPTIONS[format];
      let content = parsed.content.trim();

      // Truncate if exceeds max length
      if (content.length > formatInfo.maxLength) {
        content = content.substring(0, formatInfo.maxLength - 3) + '...';
      }

      return {
        content,
        format,
        originalQuote: typeof parsed.originalQuote === 'string'
          ? parsed.originalQuote.trim()
          : context.text?.substring(0, 100) || '',
        keyHighlights: Array.isArray(parsed.keyHighlights)
          ? parsed.keyHighlights.filter((h: unknown): h is string => typeof h === 'string').slice(0, 3)
          : [],
        confidence: typeof parsed.confidence === 'number'
          ? Math.min(1, Math.max(0, parsed.confidence))
          : 0.7,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Testimonial generation attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt < AI_CONFIG.maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, AI_CONFIG.retryDelayMs * (attempt + 1)));
      }
    }
  }

  console.warn('AI testimonial generation failed, using fallback:', lastError?.message);
  return generateFallbackTestimonial(context, format);
}

// Generate fallback testimonial when AI is unavailable
function generateFallbackTestimonial(
  context: TestimonialReviewContext,
  format: TestimonialFormat
): GeneratedTestimonial {
  const customerName = context.customerName || 'A Satisfied Customer';
  const text = context.text || '';
  const formatInfo = FORMAT_DESCRIPTIONS[format];

  // Extract the first meaningful sentence as quote
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const bestQuote = sentences[0]?.trim() || text.substring(0, 100);

  let content: string;

  switch (format) {
    case 'headline':
      // Create a simple headline from the review
      if (context.rating === 5) {
        content = `"${context.loanOfficerName} made our dream home a reality!"`;
      } else {
        content = `"A great experience with ${context.loanOfficerName}!"`;
      }
      break;

    case 'social': {
      // Create a social-ready quote
      const socialQuote = bestQuote.length > 200
        ? bestQuote.substring(0, 197) + '...'
        : bestQuote;
      content = `"${socialQuote}" - ${customerName}`;
      break;
    }

    case 'short':
      content = `"${bestQuote}" - ${customerName}`;
      break;

    case 'long':
      content = `${customerName} shares their experience working with ${context.loanOfficerName}:\n\n"${text.substring(0, 400)}${text.length > 400 ? '...' : ''}"\n\n${context.rating === 5 ? 'A 5-star experience!' : `Rated ${context.rating} out of 5 stars.`}`;
      break;

    default: {
      // medium
      const mediumText = text.length > 250 ? text.substring(0, 247) + '...' : text;
      content = `"${mediumText}" - ${customerName}`;
    }
  }

  // Ensure content doesn't exceed max length
  if (content.length > formatInfo.maxLength) {
    content = content.substring(0, formatInfo.maxLength - 3) + '...';
  }

  return {
    content,
    format,
    originalQuote: bestQuote,
    keyHighlights: context.keyPhrases.slice(0, 3),
    confidence: 0.5, // Lower confidence for fallback
  };
}

// Generate testimonials in multiple formats
export async function generateMultipleFormats(
  context: TestimonialReviewContext,
  formats: TestimonialFormat[] = ['short', 'medium', 'social']
): Promise<TestimonialGenerationResult> {
  const startTime = Date.now();
  const testimonials: GeneratedTestimonial[] = [];
  let suggestedFormat: TestimonialFormat = 'medium';

  for (const format of formats) {
    try {
      const testimonial = await generateTestimonial(context, format);
      testimonials.push(testimonial);

      // Suggest the format with highest confidence
      if (testimonial.confidence > (testimonials.find(t => t.format === suggestedFormat)?.confidence || 0)) {
        suggestedFormat = format;
      }

      // Small delay between API calls
      if (formats.indexOf(format) < formats.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error(`Failed to generate ${format} testimonial:`, error);
      // Continue with other formats
    }
  }

  return {
    reviewId: context.id,
    testimonials,
    suggestedFormat,
    generationTime: Date.now() - startTime,
    error: testimonials.length === 0 ? 'Failed to generate any testimonials' : undefined,
  };
}

// Generate a testimonial graphic as SVG
export function generateTestimonialGraphic(
  testimonial: { content: string; customerName?: string; loanOfficerName?: string; rating?: number },
  options: GraphicGenerationOptions = {}
): GeneratedGraphic {
  const {
    width = 1200,
    height = 675,
    template = 'default',
    backgroundColor = '#ffffff',
    textColor = '#1a1a1a',
    accentColor = '#3b82f6',
    includeRating = true,
  } = options;

  const customerName = testimonial.customerName || 'Happy Customer';
  const content = testimonial.content;
  const rating = testimonial.rating || 5;

  // Escape text for SVG
  const escapeXml = (text: string) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // Word wrap function
  const wrapText = (text: string, maxCharsPerLine: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // Calculate text lines
  const maxCharsPerLine = Math.floor(width / 20);
  const textLines = wrapText(content, maxCharsPerLine);
  const fontSize = textLines.length > 4 ? 24 : textLines.length > 2 ? 28 : 32;
  const lineHeight = fontSize * 1.5;
  const textStartY = height / 2 - (textLines.length * lineHeight) / 2;

  // Generate stars for rating
  const stars = Array(5).fill(0).map((_, i) => {
    const x = width / 2 - 80 + i * 32;
    const fill = i < rating ? '#FFB800' : '#E5E7EB';
    return `<path d="M${x + 12} ${height - 80}l3.09 6.26 6.91 1-5 4.87 1.18 6.88L${x + 12} ${height - 67.5}l-6.18 3.25 1.18-6.88-5-4.87 6.91-1L${x + 12} ${height - 80}z" fill="${fill}"/>`;
  }).join('');

  // Template variations
  let svgContent: string;

  switch (template) {
    case 'modern':
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${backgroundColor}"/>
            <stop offset="100%" style="stop-color:${backgroundColor}dd"/>
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#bg)"/>
        <rect x="60" y="60" width="${width - 120}" height="${height - 120}" rx="20" fill="${accentColor}11" stroke="${accentColor}33" stroke-width="2"/>
        <text x="100" y="130" font-family="Georgia, serif" font-size="72" fill="${accentColor}" opacity="0.3">"</text>
        ${textLines.map((line, i) =>
          `<text x="${width / 2}" y="${textStartY + 40 + i * lineHeight}" font-family="system-ui, sans-serif" font-size="${fontSize}" fill="${textColor}" text-anchor="middle">${escapeXml(line)}</text>`
        ).join('')}
        <text x="${width / 2}" y="${height - 110}" font-family="system-ui, sans-serif" font-size="20" fill="${textColor}" text-anchor="middle" font-weight="600">— ${escapeXml(customerName)}</text>
        ${includeRating ? stars : ''}
      </svg>`;
      break;

    case 'minimal':
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <rect width="${width}" height="${height}" fill="${backgroundColor}"/>
        <line x1="60" y1="${height / 2 - 120}" x2="120" y2="${height / 2 - 120}" stroke="${accentColor}" stroke-width="4"/>
        ${textLines.map((line, i) =>
          `<text x="60" y="${textStartY + 40 + i * lineHeight}" font-family="system-ui, sans-serif" font-size="${fontSize}" fill="${textColor}" font-style="italic">${escapeXml(line)}</text>`
        ).join('')}
        <text x="60" y="${height - 80}" font-family="system-ui, sans-serif" font-size="18" fill="${accentColor}" font-weight="500">${escapeXml(customerName)}</text>
      </svg>`;
      break;

    case 'bold':
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <rect width="${width}" height="${height}" fill="${accentColor}"/>
        <rect x="40" y="40" width="${width - 80}" height="${height - 80}" fill="${backgroundColor}"/>
        ${textLines.map((line, i) =>
          `<text x="${width / 2}" y="${textStartY + 60 + i * lineHeight}" font-family="system-ui, sans-serif" font-size="${fontSize + 4}" fill="${textColor}" text-anchor="middle" font-weight="700">${escapeXml(line)}</text>`
        ).join('')}
        <text x="${width / 2}" y="${height - 80}" font-family="system-ui, sans-serif" font-size="22" fill="${accentColor}" text-anchor="middle" font-weight="600">${escapeXml(customerName)}</text>
      </svg>`;
      break;

    default: // default template
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <rect width="${width}" height="${height}" fill="${backgroundColor}"/>
        <text x="${width / 2}" y="80" font-family="Georgia, serif" font-size="120" fill="${accentColor}" opacity="0.15" text-anchor="middle">"</text>
        ${textLines.map((line, i) =>
          `<text x="${width / 2}" y="${textStartY + 60 + i * lineHeight}" font-family="Georgia, serif" font-size="${fontSize}" fill="${textColor}" text-anchor="middle" font-style="italic">${escapeXml(line)}</text>`
        ).join('')}
        <text x="${width / 2}" y="${height - 110}" font-family="system-ui, sans-serif" font-size="20" fill="${textColor}" text-anchor="middle" font-weight="600">— ${escapeXml(customerName)}</text>
        ${includeRating ? stars : ''}
      </svg>`;
  }

  // Convert SVG to base64
  const imageData = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;

  return {
    imageData,
    width,
    height,
    format: 'svg',
    templateName: template,
  };
}

// Check if a review is suitable for testimonial generation
export function isReviewSuitableForTestimonial(
  rating: number,
  text: string | null,
  sentimentScore: number | null
): { suitable: boolean; reason?: string } {
  if (rating < 4) {
    return { suitable: false, reason: 'Rating too low (minimum 4 stars recommended)' };
  }

  if (!text || text.trim().length < 30) {
    return { suitable: false, reason: 'Review text too short (minimum 30 characters)' };
  }

  if (sentimentScore !== null && sentimentScore < 0.3) {
    return { suitable: false, reason: 'Sentiment score indicates mixed or negative content' };
  }

  return { suitable: true };
}

// Analyze best testimonial opportunities from reviews
export async function analyzeBestTestimonialOpportunities(
  reviews: TestimonialReviewContext[],
  limit: number = 10
): Promise<{ review: TestimonialReviewContext; score: number; reasons: string[] }[]> {
  const scored = reviews
    .filter(r => r.rating >= 4 && r.text && r.text.length >= 30)
    .map(review => {
      let score = 0;
      const reasons: string[] = [];

      // Rating contribution (0-25 points)
      score += (review.rating - 3) * 12.5;
      if (review.rating === 5) reasons.push('5-star rating');

      // Text length contribution (0-20 points)
      const textLength = review.text?.length || 0;
      if (textLength > 200) {
        score += 20;
        reasons.push('Detailed review');
      } else if (textLength > 100) {
        score += 10;
      }

      // Sentiment contribution (0-25 points)
      if (review.sentimentScore !== null) {
        score += review.sentimentScore * 25;
        if (review.sentimentScore > 0.7) reasons.push('Highly positive sentiment');
      }

      // Key phrases contribution (0-15 points)
      if (review.keyPhrases.length > 3) {
        score += 15;
        reasons.push('Rich in quotable phrases');
      } else if (review.keyPhrases.length > 0) {
        score += review.keyPhrases.length * 3;
      }

      // Themes contribution (0-15 points)
      if (review.themes.length > 2) {
        score += 15;
        reasons.push('Covers multiple positive themes');
      } else if (review.themes.length > 0) {
        score += review.themes.length * 5;
      }

      // Customer name bonus (5 points)
      if (review.customerName) {
        score += 5;
        reasons.push('Named customer');
      }

      return { review, score, reasons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}
