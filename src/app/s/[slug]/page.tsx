import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getProofLinkBySlug, recordProofLinkEvent } from "@/lib/share-studio/service";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { SmartLinkContent, type Professional } from "./smart-link-content";
import { getInitials } from "@/lib/utils";

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
      type: "article",
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

function platformLabel(source: string): string {
  const s = source.toLowerCase();
  if (s === "google") return "Google Review";
  if (s === "zillow") return "Zillow Review";
  if (s === "facebook") return "Facebook Review";
  if (s === "yelp") return "Yelp Review";
  if (s === "realtor") return "Realtor.com Review";
  if (s) return `${source.charAt(0).toUpperCase()}${source.slice(1)} Review`;
  return "Verified Review";
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

  // Fetch professional data from link creator
  let professional: Professional | null = null;
  let ctaLabel = `Connect with ${organizationName}`;
  const createdBy = link.created_by as string | null;

  if (createdBy) {
    try {
      const supabase = createUntypedAdminClient();
      const { data: userData } = await supabase
        .from("users")
        .select(
          "full_name, title, photo_url, avatar_url, nmls_id, average_rating, total_reviews, cta_button_text"
        )
        .eq("id", createdBy)
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
        createdBy,
        slug,
        error: err,
      });
      // Use fallback — no professional card, default CTA label
    }
  }

  const pageUrl = `${baseUrl()}/s/${slug}`;
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
