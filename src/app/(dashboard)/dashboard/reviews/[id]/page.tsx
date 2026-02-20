import { redirect, notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { VideoDetailView } from "@/components/reviews/video-detail-view";
import { ReviewDetailView } from "@/components/reviews/review-detail-view";

export const metadata = {
  title: "Content Detail | RepWell",
  description: "View and manage review or video testimonial details",
};

async function checkAccess() {
  const user = await unifiedGetUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = createAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    redirect("/dashboard");
  }

  const validRoles = ["admin", "manager", "user"] as const;
  type UserRole = typeof validRoles[number];
  const rawRole = userData.role;
  const role: UserRole = validRoles.includes(rawRole as UserRole) ? (rawRole as UserRole) : "user";

  return {
    role,
    organizationId: userData.organization_id,
  };
}

async function getVideoTestimonial(id: string, organizationId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("video_testimonial_responses")
    .select(
      `
      id,
      video_path,
      thumbnail_url,
      transcription,
      transcription_status,
      ai_generated_text,
      sentiment_score,
      sentiment_label,
      key_phrases,
      duration_seconds,
      file_size_bytes,
      width,
      height,
      mime_type,
      approval_status,
      rejection_reason,
      manager_notes,
      approved_at,
      approved_by,
      published_at,
      created_at,
      video_testimonial_requests!inner (
        id,
        customer_name,
        customer_email,
        organization_id,
        user_id
      )
    `
    )
    .eq("id", id)
    .eq("video_testimonial_requests.organization_id", organizationId)
    .single();

  if (error || !data) {
    return null;
  }

  const request = data.video_testimonial_requests as {
    id: string;
    customer_name: string;
    customer_email: string;
    organization_id: string;
    user_id: string;
  };

  // Fetch user data separately
  let loanOfficerName = "Unknown";
  let loanOfficerEmail = "";
  if (request.user_id) {
    const { data: userData } = await supabase
      .from("users")
      .select("full_name, email")
      .eq("id", request.user_id)
      .single();
    if (userData) {
      loanOfficerName = userData.full_name || "Unknown";
      loanOfficerEmail = userData.email || "";
    }
  }

  return {
    id: data.id,
    videoPath: data.video_path,
    thumbnailUrl: data.thumbnail_url,
    transcription: data.transcription,
    transcriptionStatus: data.transcription_status,
    aiGeneratedText: data.ai_generated_text,
    sentimentScore: data.sentiment_score,
    sentimentLabel: data.sentiment_label,
    keyPhrases: data.key_phrases as string[] | null,
    durationSeconds: data.duration_seconds,
    fileSizeBytes: data.file_size_bytes,
    width: data.width,
    height: data.height,
    mimeType: data.mime_type,
    approvalStatus: data.approval_status,
    rejectionReason: data.rejection_reason,
    managerNotes: data.manager_notes,
    approvedAt: data.approved_at,
    approvedBy: data.approved_by,
    publishedAt: data.published_at,
    submittedAt: data.created_at,
    customerName: request.customer_name,
    customerEmail: request.customer_email,
    loanOfficerId: request.user_id || "",
    loanOfficerName,
    loanOfficerEmail,
    requestId: request.id,
  };
}

async function getTextReview(id: string, organizationId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      id,
      source,
      source_review_id,
      source_url,
      rating,
      title,
      text,
      customer_name,
      customer_email,
      customer_location,
      review_date,
      status,
      featured,
      response_text,
      response_at,
      sentiment_score,
      sentiment_label,
      key_phrases,
      themes,
      approved_at,
      published_at,
      synced_at,
      created_at,
      updated_at,
      user_id
    `
    )
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (error || !data) {
    return null;
  }

  // Fetch user data separately if user_id exists
  let loanOfficer: { id: string; fullName: string; email: string; photoUrl: string | null } | undefined;
  if (data.user_id) {
    const { data: userData } = await supabase
      .from("users")
      .select("id, full_name, email, avatar_url")
      .eq("id", data.user_id)
      .single();
    if (userData) {
      loanOfficer = {
        id: userData.id,
        fullName: userData.full_name || "Unknown",
        email: userData.email || "",
        photoUrl: userData.avatar_url,
      };
    }
  }

  return {
    id: data.id,
    source: data.source,
    sourceReviewId: data.source_review_id,
    sourceUrl: data.source_url,
    rating: data.rating,
    title: data.title,
    text: data.text,
    customerName: data.customer_name,
    customerEmail: data.customer_email,
    customerLocation: data.customer_location,
    reviewDate: data.review_date,
    status: data.status as "pending" | "approved" | "rejected" | "archived",
    featured: data.featured ?? false,
    responseText: data.response_text,
    responseAt: data.response_at,
    sentimentScore: data.sentiment_score,
    sentimentLabel: data.sentiment_label,
    keyPhrases: data.key_phrases as string[] | null,
    themes: data.themes as string[] | null,
    approvedAt: data.approved_at,
    publishedAt: data.published_at,
    syncedAt: data.synced_at,
    createdAt: data.created_at || new Date().toISOString(),
    updatedAt: data.updated_at || new Date().toISOString(),
    loanOfficer,
  };
}

export default async function ContentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { id } = await params;
  const { type } = await searchParams;
  const { role, organizationId } = await checkAccess();

  const isVideo = type === "video";

  if (isVideo) {
    const video = await getVideoTestimonial(id, organizationId);
    if (!video) {
      notFound();
    }

    return <VideoDetailView video={video} userRole={role} />;
  }

  // Text review
  const review = await getTextReview(id, organizationId);
  if (!review) {
    notFound();
  }

  return <ReviewDetailView review={review} userRole={role} />;
}
