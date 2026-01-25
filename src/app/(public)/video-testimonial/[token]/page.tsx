import { Metadata } from "next";
import { getVideoTestimonialByToken } from "@/lib/video-testimonials/public-actions";
import { VideoTestimonialForm } from "./video-testimonial-form";
import { VideoTestimonialError } from "./video-testimonial-error";

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const result = await getVideoTestimonialByToken(token);

  if (!result.success || !result.data) {
    return {
      title: "Video Testimonial Request",
      description: "Share your experience with a video testimonial.",
    };
  }

  const { organization, professional } = result.data;

  return {
    title: `Share Your Experience - ${organization.name}`,
    description: `Record a video testimonial about your experience with ${professional.fullName}`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function VideoTestimonialPage({ params }: PageProps) {
  const { token } = await params;
  const result = await getVideoTestimonialByToken(token);

  if (!result.success || !result.data) {
    return <VideoTestimonialError message={result.error || "Request not found"} />;
  }

  return <VideoTestimonialForm request={result.data} />;
}
