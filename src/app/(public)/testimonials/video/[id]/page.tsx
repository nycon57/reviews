import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getPublicVideoTestimonial,
  getPublicVideoMetadata,
} from "@/lib/video-testimonials/public-actions";
import { VideoTestimonialPlayer } from "./video-testimonial-player";
import { JsonLd } from "@/components/seo/json-ld";

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
      title: "Video Testimonial Not Found",
      description: "The requested video testimonial could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const { title, description, customerName, thumbnailUrl, durationSeconds } = result.data;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.repwell.com";
  const pageUrl = `${baseUrl}/testimonials/video/${id}`;

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
  const result = await getPublicVideoTestimonial(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const video = result.data;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.repwell.com";
  const pageUrl = `${baseUrl}/testimonials/video/${id}`;

  // Schema.org VideoObject structured data
  const videoSchema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: `${video.customer.displayName}'s Experience with ${video.professional.fullName}`,
    description: video.aiGeneratedText || `Video testimonial from ${video.customer.displayName}`,
    thumbnailUrl: video.thumbnailUrl || undefined,
    uploadDate: video.submittedAt,
    duration: video.durationSeconds
      ? `PT${Math.floor(video.durationSeconds / 60)}M${video.durationSeconds % 60}S`
      : undefined,
    contentUrl: video.videoUrl,
    embedUrl: `${baseUrl}/embed/video/${id}`,
    publisher: {
      "@type": "Organization",
      name: video.organization.name,
      logo: video.organization.logoUrl
        ? {
            "@type": "ImageObject",
            url: video.organization.logoUrl,
          }
        : undefined,
    },
    author: {
      "@type": "Person",
      name: video.customer.displayName,
    },
    about: {
      "@type": "Person",
      name: video.professional.fullName,
      jobTitle: video.professional.title || "Professional",
      worksFor: {
        "@type": "Organization",
        name: video.organization.name,
      },
    },
  };

  // Review schema for testimonial context
  const reviewSchema = {
    "@context": "https://schema.org",
    "@type": "Review",
    author: {
      "@type": "Person",
      name: video.customer.displayName,
    },
    itemReviewed: {
      "@type": "LocalBusiness",
      name: video.organization.name,
      image: video.organization.logoUrl || undefined,
    },
    reviewBody: video.aiGeneratedText || video.transcription || undefined,
    video: {
      "@type": "VideoObject",
      contentUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl || undefined,
      duration: video.durationSeconds
        ? `PT${Math.floor(video.durationSeconds / 60)}M${video.durationSeconds % 60}S`
        : undefined,
    },
  };

  return (
    <>
      <JsonLd data={videoSchema} />
      <JsonLd data={reviewSchema} />

      <VideoTestimonialPlayer
        video={video}
        pageUrl={pageUrl}
        embedUrl={`${baseUrl}/embed/video/${id}`}
      />
    </>
  );
}
