import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicVideoTestimonial, getPublicVideoMetadata } from "@/lib/video-testimonials/public-actions";
import { EmbedVideoPlayer } from "./embed-video-player";
import { getPublishedSmartLinkBySource } from "@/lib/share-studio/service";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getPublicVideoMetadata(id);

  if (!result.success || !result.data) {
    return {
      title: "Video Testimonial",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: result.data.title,
    robots: { index: false, follow: false }, // Embeds shouldn't be indexed
  };
}

export default async function EmbedVideoPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getPublicVideoTestimonial(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const video = result.data;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://repwell.ai";
  const smartLink = await getPublishedSmartLinkBySource({
    organizationId: video.organization.id,
    sourceType: "video_testimonial",
    sourceId: id,
  });
  const pageUrl = smartLink
    ? `${baseUrl}/s/${smartLink.slug}`
    : `${baseUrl}/testimonials/video/${id}`;

  return (
    <EmbedVideoPlayer
      videoUrl={video.videoUrl}
      thumbnailUrl={video.thumbnailUrl}
      durationSeconds={video.durationSeconds}
      customerName={video.customer.displayName}
      organizationName={video.organization.name}
      organizationLogoUrl={video.organization.logoUrl}
      pageUrl={pageUrl}
    />
  );
}
