"use server";

import { ShortLinkService } from "./service";
import type { CreateShortLinkInput, ShortLinkClickStats } from "./types";

/**
 * Create a short link for a destination URL.
 * Returns the full short URL ready for use in SMS messages.
 */
export async function createShortLink(input: CreateShortLinkInput) {
  return ShortLinkService.createShortLink(input);
}

/**
 * Get click statistics for a short link.
 */
export async function getShortLinkStats(
  shortLinkId: string
): Promise<ShortLinkClickStats | null> {
  return ShortLinkService.getClickStats(shortLinkId);
}

/**
 * Create short links for review_link and/or video_link merge fields
 * when rendering an SMS template. Returns a merge context with the
 * generated short URLs replacing the original destination URLs.
 *
 * Call this before renderTemplate when sending real SMS messages.
 */
export async function createLinksForTemplate(opts: {
  organizationId: string;
  borrowerPhone?: string;
  loanOfficerId?: string;
  messageId?: string;
  reviewUrl?: string;
  videoUrl?: string;
}): Promise<{
  reviewLink?: string;
  videoLink?: string;
  shortLinkIds: string[];
}> {
  const shortLinkIds: string[] = [];
  let reviewLink: string | undefined;
  let videoLink: string | undefined;

  const metadata = {
    borrowerPhone: opts.borrowerPhone,
    loanOfficerId: opts.loanOfficerId,
    messageId: opts.messageId,
  };

  if (opts.reviewUrl) {
    const { shortLink, shortUrl } = await ShortLinkService.createShortLink({
      organizationId: opts.organizationId,
      destinationUrl: opts.reviewUrl,
      metadata,
    });
    reviewLink = shortUrl;
    shortLinkIds.push(shortLink.id);
  }

  if (opts.videoUrl) {
    const { shortLink, shortUrl } = await ShortLinkService.createShortLink({
      organizationId: opts.organizationId,
      destinationUrl: opts.videoUrl,
      metadata,
    });
    videoLink = shortUrl;
    shortLinkIds.push(shortLink.id);
  }

  return { reviewLink, videoLink, shortLinkIds };
}
