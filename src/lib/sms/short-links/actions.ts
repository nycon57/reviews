"use server";

import { z } from "zod";
import { ShortLinkService } from "./service";
import type { ShortLinkClickStats } from "./types";

const createShortLinkSchema = z.object({
  organizationId: z.string().uuid(),
  destinationUrl: z.string().url(),
  metadata: z
    .object({
      borrowerPhone: z.string().optional(),
      loanOfficerId: z.string().uuid().optional(),
      messageId: z.string().uuid().optional(),
      expiresInDays: z.number().int().positive().max(365).optional(),
    })
    .optional(),
});

const shortLinkIdSchema = z.string().uuid();

const createLinksForTemplateSchema = z.object({
  organizationId: z.string().uuid(),
  borrowerPhone: z.string().optional(),
  loanOfficerId: z.string().uuid().optional(),
  messageId: z.string().uuid().optional(),
  reviewUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
});

/** Create a short link for a destination URL. */
export async function createShortLink(input: z.infer<typeof createShortLinkSchema>) {
  const validated = createShortLinkSchema.parse(input);
  return ShortLinkService.createShortLink(validated);
}

/** Get click statistics for a short link. */
export async function getShortLinkStats(
  shortLinkId: string
): Promise<ShortLinkClickStats | null> {
  const id = shortLinkIdSchema.parse(shortLinkId);
  return ShortLinkService.getClickStats(id);
}

/**
 * Create short links for review_link and/or video_link merge fields.
 * Call this before renderTemplate when sending real SMS messages.
 */
export async function createLinksForTemplate(opts: z.infer<typeof createLinksForTemplateSchema>): Promise<{
  reviewLink?: string;
  videoLink?: string;
  shortLinkIds: string[];
}> {
  const validated = createLinksForTemplateSchema.parse(opts);
  const shortLinkIds: string[] = [];

  const metadata = {
    borrowerPhone: validated.borrowerPhone,
    loanOfficerId: validated.loanOfficerId,
    messageId: validated.messageId,
  };

  async function shorten(destinationUrl: string | undefined): Promise<string | undefined> {
    if (!destinationUrl) return undefined;
    const { shortLink, shortUrl } = await ShortLinkService.createShortLink({
      organizationId: validated.organizationId,
      destinationUrl,
      metadata,
    });
    shortLinkIds.push(shortLink.id);
    return shortUrl;
  }

  const [reviewLink, videoLink] = await Promise.all([
    shorten(validated.reviewUrl),
    shorten(validated.videoUrl),
  ]);

  return { reviewLink, videoLink, shortLinkIds };
}
