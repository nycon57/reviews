import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getProofLinkBySlug, recordProofLinkEvent } from "@/lib/share-studio/service";
import { platformLabel } from "@/lib/share-studio/utils";
import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";
import { SmartLinkContent, type Professional } from "./smart-link-content";
import { getInitials } from "@/lib/utils";
import { VideoTestimonialPlayer } from "@/app/(public)/testimonials/video/[id]/video-testimonial-player";
import type { PublicVideoTestimonial } from "@/lib/video-testimonials/public-actions";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

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
  const canonical = `${baseUrl()}/s/${slug}`;
  const ogImage = `${baseUrl()}/s/${slug}/opengraph-image`;

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

  // Skip analytics for known bots/crawlers
  const BOT_PATTERN = /bot|crawl|spider|slurp|facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|Googlebot|Bingbot|Baiduspider|YandexBot|DuckDuckBot|Sogou|Exabot|ia_archiver|AhrefsBot|SemrushBot|MJ12bot|DotBot|PetalBot|Bytespider|GPTBot|ClaudeBot|Applebot|prefetch|prerender/i;
  const isBot = BOT_PATTERN.test(userAgent);

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

  // Fetch professional data from presenter owner (fallback: link creator).
  let professional: Professional | null = null;
  let ctaLabel = `Connect with ${organizationName}`;
  const presenterUserId =
    (item.presenter_user_id as string | null) ||
    (link.created_by as string | null);

  if (presenterUserId) {
    try {
      const supabase = createUntypedAdminClient();
      const { data: userData } = await supabase
        .from("users")
        .select(
          "full_name, title, photo_url, avatar_url, nmls_id, average_rating, total_reviews, cta_button_text"
        )
        .eq("id", presenterUserId)
        .maybeSingle();

      if (userData) {
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

  const pageUrl = `${baseUrl()}/s/${slug}`;

  if (sourceType === "video_testimonial") {
    const sourceId = (item.source_id as string | null) || null;
    if (!sourceId) {
      notFound();
    }

    const supabase = createUntypedAdminClient();
    const { data: videoRow, error: videoError } = await supabase
      .from("video_testimonial_responses")
      .select(`
        id, video_path, video_url, thumbnail_url, duration_seconds, transcription, ai_generated_text,
        key_phrases, sentiment_label, submitted_at, published_at, user_id,
        video_testimonial_requests!inner (customer_name, source_metadata),
        users!user_id (id, full_name, photo_url, title)
      `)
      .eq("id", sourceId)
      .eq("organization_id", data.organization.id)
      .maybeSingle();

    if (videoError || !videoRow) {
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

    return (
      <VideoTestimonialPlayer
        video={videoData}
        pageUrl={pageUrl}
        embedUrl={`${baseUrl()}/embed/video/${sourceId}`}
      />
    );
  }

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

  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor: "#f8faf8",
        backgroundImage:
          "radial-gradient(circle, #c8d5c8 0.75px, transparent 0.75px)",
        backgroundSize: "24px 24px",
      }}
    >
      <SmartLinkContent
        quote={quote}
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
        destinationUrl={destinationUrl}
        pageUrl={pageUrl}
        twitterUrl={twitterUrl}
        linkedinUrl={linkedinUrl}
        emailUrl={emailUrl}
      />
    </main>
  );
}
