// Social Media Integration Types

import type {
  SocialPlatform,
  SocialConnection,
  SocialPostTemplate,
  SocialPost,
  SocialPostAnalytics,
  SocialPublishQueueItem,
} from '@/types';

// Re-export types
export type {
  SocialPlatform,
  SocialConnection,
  SocialPostTemplate,
  SocialPost,
  SocialPostAnalytics,
  SocialPublishQueueItem,
};

// OAuth Configuration
export interface SocialOAuthConfig {
  platform: SocialPlatform;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
  redirectUri: string;
}

// OAuth Tokens
export interface SocialOAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
}

// Platform User Info
export interface PlatformUserInfo {
  id: string;
  username?: string;
  displayName?: string;
  profileUrl?: string;
  avatarUrl?: string;
}

// Facebook Page
export interface FacebookPage {
  id: string;
  name: string;
  accessToken: string;
  category?: string;
  picture?: string;
}

// LinkedIn Company Page
export interface LinkedInPage {
  id: string;
  name: string;
  vanityName?: string;
  logoUrl?: string;
}

// Post Result
export interface PostResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

// Analytics Data from Platform
export interface PlatformAnalytics {
  impressions: number;
  reach: number;
  engagements: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
}

// Action Result Type
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// Template Placeholders
export const TEMPLATE_PLACEHOLDERS = {
  '{{reviewer_name}}': 'Customer name',
  '{{rating}}': 'Numeric rating (1-5)',
  '{{rating_stars}}': 'Star emoji representation',
  '{{review_text}}': 'Full review text',
  '{{review_excerpt}}': 'Shortened review excerpt',
  '{{loan_officer_name}}': 'Loan officer full name',
  '{{branch_name}}': 'Branch name',
  '{{organization_name}}': 'Organization name',
  '{{hashtags}}': 'Platform-appropriate hashtags',
  '{{link}}': 'Link to profile or review',
  '{{emoji}}': 'Contextual emoji',
} as const;

// Platform Character Limits
export const PLATFORM_LIMITS: Record<SocialPlatform, number> = {
  twitter: 280,
  facebook: 63206,
  linkedin: 3000,
  instagram: 2200,
};

// Platform API Endpoints
export const PLATFORM_AUTH_URLS: Record<SocialPlatform, string> = {
  facebook: 'https://www.facebook.com/v18.0/dialog/oauth',
  twitter: 'https://twitter.com/i/oauth2/authorize',
  linkedin: 'https://www.linkedin.com/oauth/v2/authorization',
  instagram: 'https://www.facebook.com/v18.0/dialog/oauth', // Uses Facebook OAuth
};

export const PLATFORM_TOKEN_URLS: Record<SocialPlatform, string> = {
  facebook: 'https://graph.facebook.com/v18.0/oauth/access_token',
  twitter: 'https://api.twitter.com/2/oauth2/token',
  linkedin: 'https://www.linkedin.com/oauth/v2/accessToken',
  instagram: 'https://graph.facebook.com/v18.0/oauth/access_token',
};

// Platform Scopes
export const PLATFORM_SCOPES: Record<SocialPlatform, string[]> = {
  facebook: ['pages_manage_posts', 'pages_read_engagement', 'pages_read_user_content'],
  twitter: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
  linkedin: ['w_member_social', 'r_liteprofile'],
  instagram: ['instagram_basic', 'instagram_content_publish', 'pages_read_engagement'],
};

// Star Rating to Emoji Map
export function ratingToStars(rating: number): string {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;

  return (
    '\u2B50'.repeat(fullStars) +
    (halfStar ? '\u2B50' : '') +
    '\u2606'.repeat(emptyStars)
  );
}

// Rating to Emoji (contextual)
export function getContextEmoji(rating: number): string {
  if (rating >= 5) return '\u{1F389}'; // Party popper
  if (rating >= 4) return '\u{1F60A}'; // Smiling face
  if (rating >= 3) return '\u{1F44D}'; // Thumbs up
  return '\u{1F64F}'; // Folded hands
}

// Fill template placeholders
export function fillTemplatePlaceholders(
  template: string,
  data: {
    reviewerName?: string;
    rating?: number;
    reviewText?: string;
    loanOfficerName?: string;
    branchName?: string;
    organizationName?: string;
    hashtags?: string[];
    link?: string;
  }
): string {
  let result = template;

  // Basic replacements
  if (data.reviewerName) {
    result = result.replace(/\{\{reviewer_name\}\}/g, data.reviewerName);
  }
  if (data.rating !== undefined) {
    result = result.replace(/\{\{rating\}\}/g, data.rating.toString());
    result = result.replace(/\{\{rating_stars\}\}/g, ratingToStars(data.rating));
    result = result.replace(/\{\{emoji\}\}/g, getContextEmoji(data.rating));
  }
  if (data.reviewText) {
    result = result.replace(/\{\{review_text\}\}/g, data.reviewText);
    // Create excerpt (first 100 chars)
    const excerpt =
      data.reviewText.length > 100
        ? data.reviewText.substring(0, 97) + '...'
        : data.reviewText;
    result = result.replace(/\{\{review_excerpt\}\}/g, excerpt);
  }
  if (data.loanOfficerName) {
    result = result.replace(/\{\{loan_officer_name\}\}/g, data.loanOfficerName);
  }
  if (data.branchName) {
    result = result.replace(/\{\{branch_name\}\}/g, data.branchName);
  }
  if (data.organizationName) {
    result = result.replace(/\{\{organization_name\}\}/g, data.organizationName);
  }
  if (data.hashtags && data.hashtags.length > 0) {
    result = result.replace(/\{\{hashtags\}\}/g, data.hashtags.join(' '));
  } else {
    result = result.replace(/\{\{hashtags\}\}/g, '');
  }
  if (data.link) {
    result = result.replace(/\{\{link\}\}/g, data.link);
  } else {
    result = result.replace(/\{\{link\}\}/g, '');
  }

  return result.trim();
}
