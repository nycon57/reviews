import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { classifyAgentUserAgent } from "@/lib/agents/detection";
import { getProofLinkBySlug, recordProofLinkEvent } from "@/lib/share-studio/service";
import { platformLabel } from "@/lib/share-studio/utils";
import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";
import { SmartLinkContent, type Professional } from "./smart-link-content";
import { getInitials } from "@/lib/utils";
import {
  generateOrganizationReviewSnippetSchema,
  generateVideoObjectSchema,
  getBaseUrl,
} from "@/lib/seo";
import { StructuredData } from "@/components/seo/structured-data";
import { VideoTestimonialPlayer } from "@/app/(public)/testimonials/video/[id]/video-testimonial-player";
import type { PublicVideoTestimonial } from "@/lib/video-testimonials/public-actions";
import { applyPublicProfessionalFilters } from "@/lib/users/public-visibility";
import {
  LandingPanel,
  type SmartLinkProfessionalContact,
} from "./landing-panel";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProofLinkBySlug(slug);

  if (!data || !data.link.published) {
    return {
      title: "Smart Link",
      robots: { index: false, follow: false },
    };
  }

  const link = data.link;
  const item = data.item;
  const baseUrl = getBaseUrl();
  const canonical = `${baseUrl}/s/${slug}`;
  const ogImage = `${baseUrl}/s/${slug}/opengraph-image`;

  const title =
    (link.title as string | null) ||
    (item.title as string | null) ||
    "Smart Link";
  const description =
    (link.description as string | null) ||
    (item.summary as string | null) ||
    "Shared from Share Studio";
  const sourceType = (item.source_type as string | null) || "review";

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: sourceType === "video_testimonial" ? "video.other" : "article",
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

function formatReviewDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return null;
  }
}

function sanitizeSignedPath(path: string): string {
  return path.replace(/^\/+/, "");
}

/**
 * Fetch the professional's public contact fields (same set the pro profile
 * page exposes) for the contact card shown below the showcased review.
 * Returns null when the user is not publicly visible or has no name.
 */
async function fetchLandingContact(
  professionalId: string,
  slug: string
): Promise<SmartLinkProfessionalContact | null> {
  // Typed client: `users` is in the generated schema, and the untyped client's
  // self-referential builder type exceeds TS instantiation depth inside the
  // public-visibility filter helper.
  const supabase = createAdminClient();

  try {
    const contactQuery = supabase
      .from("users")
      .select(
        "id, full_name, phone, address, cta_button_text, cta_button_url, linkedin_url, facebook_url, instagram_url, twitter_url, personal_website_url, zillow_profile_url, organizations!inner(account_type)"
      );

    const { data: contactRow } = await applyPublicProfessionalFilters(contactQuery)
      .eq("id", professionalId)
      .maybeSingle();

    if (!contactRow?.full_name) return null;

    // SAFETY: `users.address` is a Json column the profile form only ever writes
    // as a {street, city, state, zip} object, which is the shape the contact
    // card reads; the column type cannot express that.
    const address = (contactRow.address as SmartLinkProfessionalContact["address"]) ?? null;

    return {
      id: String(contactRow.id),
      fullName: contactRow.full_name,
      phone: contactRow.phone,
      address,
      ctaText: contactRow.cta_button_text,
      ctaUrl: contactRow.cta_button_url,
      linkedinUrl: contactRow.linkedin_url,
      facebookUrl: contactRow.facebook_url,
      instagramUrl: contactRow.instagram_url,
      twitterUrl: contactRow.twitter_url,
      personalWebsiteUrl: contactRow.personal_website_url,
      zillowUrl: contactRow.zillow_profile_url,
    };
  } catch (err) {
    console.error("Failed to fetch landing contact for smart link", {
      professionalId,
      slug,
      error: err,
    });
    // Render the page without the contact card
    return null;
  }
}

export default async function SmartLinkPage({ params }: RouteParams) {
  const { slug } = await params;
  const data = await getProofLinkBySlug(slug);

  if (!data || !data.link.published) {
    notFound();
  }

  const headersStore = await headers();
  const userAgent = headersStore.get("user-agent") ?? "";
  const referrer = headersStore.get("referer");
  const forwarded = headersStore.get("x-forwarded-for");
  const ipAddress = forwarded?.split(",")[0]?.trim() || headersStore.get("x-real-ip");

  // Skip analytics for known bots/crawlers.
  const isBot = classifyAgentUserAgent(userAgent) !== null;

  if (!isBot) {
    try {
      await recordProofLinkEvent({
        organizationId: String(data.link.organization_id),
        proofLinkId: String(data.link.id),
        eventType: "view",
        requestId: headersStore.get("x-vercel-id") ?? undefined,
        userAgent,
        referrer,
        ipAddress,
        metadata: { slug },
      });
    } catch (err) {
      console.error("Failed to record proof link event", {
        organizationId: String(data.link.organization_id),
        proofLinkId: String(data.link.id),
        slug,
        requestId: headersStore.get("x-vercel-id") ?? undefined,
        error: err,
      });
    }
  }

  const item = data.item;
  const link = data.link;
  const brand = data.brandTokens;

  const quote = (item.quote as string | null) || "";
  const customerName = (item.customer_name as string | null) || "Verified Customer";
  const rating = (item.rating as number | null) ?? 5;
  const sourcePlatform = (item.source_platform as string | null) || "";
  const organizationName = (data.organization.name as string) || "Organization";
  const destinationUrl = (link.destination_url as string | null) || null;
  const logoUrl = brand.logoUrl;
  const reviewDate = formatReviewDate((item.source_review_date as string | null) || null);
  const primaryColor = brand.primaryColor || "#0f172a";
  const sourceType = (item.source_type as string | null) || "review";

  const supabase = createUntypedAdminClient();

  // Fetch professional data from presenter owner (fallback: link creator).
  let professional: Professional | null = null;
  let ctaLabel = `Connect with ${organizationName}`;
  const presenterUserId =
    (item.presenter_user_id as string | null) ||
    (link.created_by as string | null);

  // Where the primary CTA sends visitors: the presenter's public RepWell
  // profile. Starts as the UUID URL (which redirects to the SEO slug) and is
  // upgraded to the slug URL once we've loaded the user.
  let professionalProfileUrl: string | null = presenterUserId
    ? `/pro/${presenterUserId}`
    : null;

  // The org logo links to the org's public RepWell page, but only for
  // enterprise accounts — individual accounts have no verified org page.
  const orgSlug = (data.organization.slug as string | null) || null;
  const orgProfileUrl =
    data.organization.account_type === "enterprise" && orgSlug
      ? `/org/${orgSlug}`
      : null;

  // Text reviews need the presenter's public contact fields too; start that
  // query alongside the professional fetch instead of after it. (The video
  // branch resolves its own professional from the response row.)
  const landingContactPromise =
    sourceType !== "video_testimonial" && presenterUserId
      ? fetchLandingContact(String(presenterUserId), slug)
      : null;

  if (presenterUserId) {
    try {
      const { data: userData } = await supabase
        .from("users")
        .select(
          "slug, full_name, title, photo_url, avatar_url, nmls_id, average_rating, total_reviews, cta_button_text"
        )
        .eq("id", presenterUserId)
        .maybeSingle();

      if (userData) {
        const userSlug = (userData.slug as string | null) || null;
        if (userSlug) {
          professionalProfileUrl = `/pro/${userSlug}`;
        }
        const fullName = (userData.full_name as string | null) || null;
        if (fullName) {
          professional = {
            fullName,
            title: (userData.title as string | null) || null,
            photoUrl:
              (userData.photo_url as string | null) ||
              (userData.avatar_url as string | null) ||
              null,
            nmlsId: (userData.nmls_id as string | null) || null,
            averageRating: (userData.average_rating as number | null) ?? null,
            totalReviews: (userData.total_reviews as number | null) ?? null,
          };
        }
        if (userData.cta_button_text) {
          ctaLabel = userData.cta_button_text as string;
        }
      }
    } catch (err) {
      console.error("Failed to fetch professional data for smart link", {
        presenterUserId,
        slug,
        error: err,
      });
      // Use fallback — no professional card, default CTA label
    }
  }

  const baseUrl = getBaseUrl();
  const pageUrl = `${baseUrl}/s/${slug}`;

  if (sourceType === "video_testimonial") {
    const sourceId = (item.source_id as string | null) || null;
    if (!sourceId) {
      notFound();
    }

    const { data: videoRow, error: videoError } = await supabase
      .from("video_testimonial_responses")
      .select(`
        id, video_path, video_url, thumbnail_url, duration_seconds, transcription, ai_generated_text,
        key_phrases, sentiment_label, approval_status, quarantined, submitted_at, published_at, user_id,
        video_testimonial_requests!inner (customer_name, source_metadata),
        users!user_id (id, full_name, photo_url, title)
      `)
      .eq("id", sourceId)
      .eq("organization_id", data.organization.id)
      .maybeSingle();

    if (videoError || !videoRow) {
      notFound();
    }

    // Quarantine enforcement (ADR 0001): never serve a video publicly unless
    // it is approved/published and not quarantined.
    const videoApprovalStatus = String(videoRow.approval_status ?? "");
    if (
      videoRow.quarantined ||
      !["approved", "published"].includes(videoApprovalStatus)
    ) {
      notFound();
    }

    const storageClient = createAdminClient();
    const signedUrlResult = await storageClient.storage
      .from("video-testimonials")
      .createSignedUrl(sanitizeSignedPath(String(videoRow.video_path ?? "")), 86400);

    const signedVideoUrl =
      signedUrlResult.error || !signedUrlResult.data?.signedUrl
        ? ((videoRow.video_url as string | null) ?? "")
        : signedUrlResult.data.signedUrl;

    if (!signedVideoUrl) {
      notFound();
    }

    const request = (videoRow.video_testimonial_requests as
      | {
          customer_name?: string | null;
          source_metadata?: {
            customer_display_name?: string;
            customer_relationship?: string;
          } | null;
        }
      | null) ?? null;

    const sourceProfessional =
      (videoRow.users as
        | {
            id?: string;
            full_name?: string | null;
            photo_url?: string | null;
            title?: string | null;
          }
        | null) ?? null;

    const customerDisplayName =
      request?.source_metadata?.customer_display_name ||
      request?.customer_name ||
      "Verified Customer";

    const videoProfessionalName =
      sourceProfessional?.full_name ||
      professional?.fullName ||
      "Professional";

    const videoData: PublicVideoTestimonial = {
      id: String(videoRow.id),
      videoUrl: signedVideoUrl,
      thumbnailUrl: (videoRow.thumbnail_url as string | null) ?? null,
      durationSeconds: (videoRow.duration_seconds as number | null) ?? null,
      transcription: (videoRow.transcription as string | null) ?? null,
      aiGeneratedText: (videoRow.ai_generated_text as string | null) ?? null,
      keyPhrases: (videoRow.key_phrases as string[] | null) ?? null,
      sentimentLabel: (videoRow.sentiment_label as string | null) ?? null,
      submittedAt: String(videoRow.submitted_at),
      publishedAt: (videoRow.published_at as string | null) ?? null,
      customer: {
        displayName: customerDisplayName,
        relationship: request?.source_metadata?.customer_relationship ?? null,
      },
      professional: {
        id: String(
          sourceProfessional?.id ||
            (videoRow.user_id as string | null) ||
            presenterUserId ||
            ""
        ),
        fullName: videoProfessionalName,
        photoUrl:
          (sourceProfessional?.photo_url as string | null) ??
          professional?.photoUrl ??
          null,
        title:
          (sourceProfessional?.title as string | null) ??
          professional?.title ??
          null,
      },
      organization: {
        id: String(data.organization.id),
        name: organizationName,
        logoUrl: logoUrl,
        primaryColor: primaryColor,
      },
    };

    // Landing-page parity: fetch the professional's public contact fields
    // (same set the pro profile page exposes) for the contact card below the player.
    let landingContact: SmartLinkProfessionalContact | null = null;
    const videoProfessionalId =
      sourceProfessional?.id ||
      (videoRow.user_id as string | null) ||
      presenterUserId;

    if (videoProfessionalId) {
      landingContact = await fetchLandingContact(String(videoProfessionalId), slug);
    }

    const videoSchema = generateVideoObjectSchema({
      name: `${customerDisplayName}'s Experience with ${videoProfessionalName}`,
      description:
        videoData.aiGeneratedText ||
        videoData.transcription ||
        `Video testimonial from ${customerDisplayName}`,
      thumbnailUrl: videoData.thumbnailUrl,
      uploadDate: videoData.publishedAt || videoData.submittedAt,
      publisherName: organizationName,
      publisherLogoUrl: logoUrl,
      authorName: customerDisplayName,
      aboutName: videoProfessionalName,
      aboutJobTitle: videoData.professional.title,
      aboutOrganizationName: organizationName,
    });

    return (
      <>
        <StructuredData data={videoSchema} />
        <VideoTestimonialPlayer
          video={videoData}
          pageUrl={pageUrl}
          embedUrl={`${baseUrl}/embed/video/${sourceId}`}
          belowContent={
            landingContact ? (
              <LandingPanel
                contact={landingContact}
                primaryColor={primaryColor}
              />
            ) : undefined
          }
        />
      </>
    );
  }

  // Prefer the full review text captured in the source snapshot over the
  // 300-char clipped quote so the showcased review never ends mid-sentence.
  const snapshot = (item.source_snapshot as Record<string, unknown> | null) ?? null;
  const snapshotText = typeof snapshot?.text === "string" ? snapshot.text.trim() : "";
  const fullQuote = snapshotText || quote;

  const landingContact = landingContactPromise ? await landingContactPromise : null;

  // Share intents keep the clipped quote; a full review is too long for a tweet.
  const shareText = quote
    ? `"${quote}" — ${customerName}`
    : `Check out this review from ${organizationName}`;

  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareText)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(`Review from ${organizationName}`)}&body=${encodeURIComponent(`${shareText}\n\n${pageUrl}`)}`;

  const fallbackText =
    (item.title as string | null) ||
    (item.summary as string | null) ||
    "Verified customer experience";
  const reviewSchema = generateOrganizationReviewSnippetSchema({
    organizationName,
    organizationUrl: orgProfileUrl ? `${baseUrl}${orgProfileUrl}` : undefined,
    authorName: customerName,
    rating,
    reviewBody: fullQuote,
    datePublished: (item.source_review_date as string | null) || undefined,
    publisherName: "RepWell",
  });

  return (
    <main className="min-h-screen">
      <StructuredData data={reviewSchema} />
      <SmartLinkContent
        quote={fullQuote}
        fallbackText={fallbackText}
        customerName={customerName}
        initials={getInitials(customerName)}
        rating={rating}
        sourceLabel={platformLabel(sourcePlatform)}
        sourcePlatform={sourcePlatform}
        reviewDate={reviewDate}
        organizationName={organizationName}
        logoUrl={logoUrl}
        primaryColor={primaryColor}
        professional={professional}
        ctaLabel={ctaLabel}
        ctaHref={`/s/${slug}/go`}
        profileUrl={professionalProfileUrl}
        orgProfileUrl={orgProfileUrl}
        destinationUrl={destinationUrl}
        pageUrl={pageUrl}
        twitterUrl={twitterUrl}
        linkedinUrl={linkedinUrl}
        emailUrl={emailUrl}
        contact={landingContact}
      />
    </main>
  );
}
