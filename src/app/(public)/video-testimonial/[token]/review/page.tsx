import { Metadata } from "next";
import { getTextApprovalData } from "@/lib/video-testimonials/approval-actions";
import { TextApprovalStep } from "@/components/video-testimonials/text-approval-step";
import { VideoTestimonialError } from "../video-testimonial-error";

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const result = await getTextApprovalData(token);

  if (!result.success || !result.data) {
    return {
      title: "Review Your Testimonial",
      description: "Review and approve your testimonial text.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const { organizationName, loanOfficerName } = result.data;

  return {
    title: `Review Your Testimonial - ${organizationName}`,
    description: `Review and approve your testimonial for ${loanOfficerName}`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function TextApprovalPage({ params }: PageProps) {
  const { token } = await params;
  const result = await getTextApprovalData(token);

  if (!result.success || !result.data) {
    return <VideoTestimonialError message={result.error || "Unable to load review data"} />;
  }

  return <TextApprovalStep token={token} data={result.data} />;
}
