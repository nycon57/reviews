import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  getPublicVideoTestimonial,
  getPublicVideoMetadata,
} from "@/lib/video-testimonials/public-actions";
import { VideoTestimonialPlayer } from "./video-testimonial-player";
import { MultiSchemaStructuredData } from "@/components/seo/structured-data";
import {
  generateVideoObjectSchema,
  generateVideoTestimonialReviewSchema,
} from "@/lib/seo";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublishedSmartLinkBySource } from "@/lib/share-studio/service";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: sourceRow } = await supabase
    .from("video_testimonial_responses")
    .select("organization_id")
    .eq("id", id)
    .eq("approval_status", "published")
    .maybeSingle();

  const smartLink = sourceRow
    ? await getPublishedSmartLinkBySource({
        organizationId: String(sourceRow.organization_id),
        sourceType: "video_testimonial",
        sourceId: id,
      })
    : null;

  const result = await getPublicVideoMetadata(id);

  if (!result.success || !result.data) {
    return {
      title: "Video Testimonial Not Found",
      description: "The requested video testimonial could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const { title, description, customerName, thumbnailUrl, durationSeconds } = result.data;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://repwell.ai";
  const pageUrl = smartLink ? `${baseUrl}/s/${smartLink.slug}` : `${baseUrl}/testimonials/video/${id}`;

  // Format duration for schema.org (ISO 8601 duration)
  const isoDuration = durationSeconds
    ? `PT${Math.floor(durationSeconds / 60)}M${durationSeconds % 60}S`
    : undefined;

  return {
    title: `${title} | RepWell`,
    description,
    openGraph: {
      title,
      description,
      type: "video.other",
      url: pageUrl,
      siteName: "RepWell",
      images: thumbnailUrl
        ? [
            {
              url: thumbnailUrl,
              width: 1280,
              height: 720,
              alt: `Video testimonial from ${customerName}`,
            },
          ]
        : undefined,
      videos: thumbnailUrl
        ? [
            {
              url: pageUrl,
              type: "text/html",
              width: 1280,
              height: 720,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: thumbnailUrl ? [thumbnailUrl] : undefined,
    },
    alternates: {
      canonical: pageUrl,
    },
    other: {
      // Schema.org VideoObject as JSON-LD will be rendered in the page
      "video:duration": isoDuration || "",
    },
  };
}

export default async function PublicVideoTestimonialPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: sourceRow } = await supabase
    .from("video_testimonial_responses")
    .select("organization_id")
    .eq("id", id)
    .eq("approval_status", "published")
    .maybeSingle();

  if (sourceRow) {
    const smartLink = await getPublishedSmartLinkBySource({
      organizationId: String(sourceRow.organization_id),
      sourceType: "video_testimonial",
      sourceId: id,
    });
    if (smartLink) {
      redirect(`/s/${smartLink.slug}`);
    }
  }

  const result = await getPublicVideoTestimonial(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const video = result.data;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://repwell.ai";
  const pageUrl = `${baseUrl}/testimonials/video/${id}`;

  const videoSchema = generateVideoObjectSchema({
    name: `${video.customer.displayName}'s Experience with ${video.professional.fullName}`,
    description: video.aiGeneratedText || `Video testimonial from ${video.customer.displayName}`,
    thumbnailUrl: video.thumbnailUrl,
    uploadDate: video.submittedAt,
    durationSeconds: video.durationSeconds,
    contentUrl: video.videoUrl,
    embedUrl: `${baseUrl}/embed/video/${id}`,
    publisherName: video.organization.name,
    publisherLogoUrl: video.organization.logoUrl,
    authorName: video.customer.displayName,
    aboutName: video.professional.fullName,
    aboutJobTitle: video.professional.title,
    aboutOrganizationName: video.organization.name,
  });

  const reviewSchema = generateVideoTestimonialReviewSchema({
    authorName: video.customer.displayName,
    organizationName: video.organization.name,
    organizationLogoUrl: video.organization.logoUrl,
    reviewBody: video.aiGeneratedText || video.transcription || undefined,
    videoContentUrl: video.videoUrl,
    videoThumbnailUrl: video.thumbnailUrl,
    videoDurationSeconds: video.durationSeconds,
  });

  return (
    <>
      <MultiSchemaStructuredData schemas={[videoSchema, reviewSchema]} />

      <VideoTestimonialPlayer
        video={video}
        pageUrl={pageUrl}
        embedUrl={`${baseUrl}/embed/video/${id}`}
      />
    </>
  );
}
