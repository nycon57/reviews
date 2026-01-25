/**
 * Remotion Render Service
 *
 * Server-side video generation using Remotion.
 * Handles fetching data, preparing props, and triggering renders.
 */

import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import * as crypto from "crypto";
import * as path from "path";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  RenderRequest,
  RenderResult,
  CompositionType,
  VideoTestimonialRenderRequest,
  TextTestimonialRenderRequest,
  LeaderboardCelebrationRenderRequest,
  ReportSummaryRenderRequest,
  SocialClipRenderRequest,
  VideoThumbnailRenderRequest,
} from "./types";
import { getCompositionId } from "./types";
import type {
  VideoTestimonialProps,
  TextTestimonialProps,
  LeaderboardCelebrationProps,
  ReportSummaryProps,
  SocialClipProps,
  VideoThumbnailProps,
  CaptionSegment,
  VideoFormat,
} from "@/remotion/types";

// Cache bundled Remotion app
let bundledApp: string | null = null;

/**
 * Bundle the Remotion app (cached)
 */
async function getBundledApp(): Promise<string> {
  if (bundledApp) {
    return bundledApp;
  }

  const entryPoint = path.join(process.cwd(), "src/remotion/Root.tsx");

  bundledApp = await bundle({
    entryPoint,
    // Enable for production
    // webpackOverride: (config) => config,
  });

  return bundledApp;
}

/**
 * Main render function
 */
export async function renderVideo(request: RenderRequest): Promise<RenderResult> {
  const jobId = crypto.randomUUID();

  try {
    // Get composition props based on request type
    const inputProps = await getInputProps(request);

    // Get bundled app
    const bundleLocation = await getBundledApp();

    // Get composition ID
    const compositionId = getCompositionId(request.compositionType, request.format);

    // Select composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps: inputProps as unknown as Record<string, unknown>,
    });

    // Determine output path
    const outputFileName = `${request.compositionType}-${jobId}.${
      request.compositionType === "video-thumbnail" ? "png" : "mp4"
    }`;
    const outputPath = path.join("/tmp", outputFileName);

    // Render the output
    const propsAsRecord = inputProps as unknown as Record<string, unknown>;
    if (request.compositionType === "video-thumbnail") {
      // Render a still image for thumbnails
      await renderStill({
        composition,
        serveUrl: bundleLocation,
        output: outputPath,
        inputProps: propsAsRecord,
        imageFormat: "png",
      });
    } else {
      // Render video
      await renderMedia({
        composition,
        serveUrl: bundleLocation,
        codec: "h264",
        outputLocation: outputPath,
        inputProps: propsAsRecord,
        // Performance options
        concurrency: 2,
        // Quality settings
        imageFormat: "jpeg",
        jpegQuality: 80,
      });
    }

    // Upload to Supabase Storage
    const { url, storagePath } = await uploadToStorage(
      outputPath,
      request.organizationId,
      outputFileName
    );

    // Calculate duration
    const fps = 30;
    const durationSeconds = composition.durationInFrames / fps;

    // Save to database
    await saveGeneratedVideo({
      id: jobId,
      organizationId: request.organizationId,
      sourceType: request.compositionType,
      sourceId: getSourceId(request),
      template: getTemplate(request),
      format: request.format,
      storagePath,
      durationSeconds,
    });

    return {
      success: true,
      jobId,
      outputUrl: url,
      storagePath,
      durationSeconds,
    };
  } catch (error) {
    console.error("Video render failed:", error);
    return {
      success: false,
      jobId,
      error: error instanceof Error ? error.message : "Unknown render error",
    };
  }
}

/**
 * Get input props for composition based on request type
 */
async function getInputProps(
  request: RenderRequest
): Promise<
  | VideoTestimonialProps
  | TextTestimonialProps
  | LeaderboardCelebrationProps
  | ReportSummaryProps
  | SocialClipProps
  | VideoThumbnailProps
> {
  switch (request.compositionType) {
    case "video-testimonial":
      return getVideoTestimonialProps(request);
    case "text-testimonial":
      return getTextTestimonialProps(request);
    case "leaderboard-celebration":
      return getLeaderboardCelebrationProps(request);
    case "report-summary":
      return getReportSummaryProps(request);
    case "social-clip":
      return getSocialClipProps(request);
    case "video-thumbnail":
      return getVideoThumbnailProps(request);
    default:
      throw new Error(`Unknown composition type`);
  }
}

/**
 * Fetch and prepare video testimonial props
 */
async function getVideoTestimonialProps(
  request: VideoTestimonialRenderRequest
): Promise<VideoTestimonialProps> {
  const supabase = createAdminClient();

  // Fetch video response with related data
  const { data: response, error } = await supabase
    .from("video_testimonial_responses")
    .select(`
      *,
      video_testimonial_requests!inner (
        user_id,
        organization_id,
        customer_first_name,
        customer_last_name,
        customer_relationship,
        users!user_id (
          id,
          full_name,
          title,
          photo_url
        ),
        organizations!inner (
          id,
          name,
          logo_url,
          primary_color
        )
      )
    `)
    .eq("id", request.videoResponseId)
    .single();

  if (error || !response) {
    throw new Error(`Video response not found: ${request.videoResponseId}`);
  }

  // Cast to allow accessing properties that may not be in generated types
  const req = response.video_testimonial_requests as unknown as {
    customer_first_name: string | null;
    customer_last_name: string | null;
    customer_relationship: string | null;
    organizations: { id: string; name: string; logo_url: string | null; primary_color?: string };
    users: { id: string; full_name: string; title?: string; photo_url: string | null };
  };
  const org = req.organizations;
  const professional = req.users;
  const customerName = [req.customer_first_name, req.customer_last_name].filter(Boolean).join(" ") || "Valued Customer";

  // Parse transcription into caption segments
  const captions = parseTranscriptionToCaptions(response.transcription);

  return {
    videoUrl: response.video_url,
    captions,
    format: request.format,
    template: request.template || "modern",
    organization: {
      name: org.name,
      logoUrl: org.logo_url,
      primaryColor: org.primary_color || "#354f52",
      secondaryColor: "#84a98c", // Default brand secondary color
    },
    loanOfficer: {
      fullName: professional.full_name,
      title: professional.title || null,
      photoUrl: professional.photo_url,
    },
    customer: {
      displayName: customerName,
      relationship: req.customer_relationship || null,
    },
    transcription: response.transcription || "",
    aiQuote: response.ai_generated_text || (response.key_phrases as string[] | null)?.[0] || null,
    showCaptions: true,
    showIntro: true,
    showOutro: true,
    videoDurationMs: (response.duration_seconds || 60) * 1000,
  };
}

/**
 * Fetch and prepare text testimonial props
 */
async function getTextTestimonialProps(
  request: TextTestimonialRenderRequest
): Promise<TextTestimonialProps> {
  const supabase = createAdminClient();

  // Fetch testimonial with related data
  const { data: testimonial, error } = await supabase
    .from("testimonials")
    .select(`
      *,
      organizations!inner (
        id,
        name,
        logo_url,
        primary_color
      ),
      reviews!inner (
        customer_name,
        rating
      )
    `)
    .eq("id", request.testimonialId)
    .single();

  if (error || !testimonial) {
    throw new Error(`Testimonial not found: ${request.testimonialId}`);
  }

  const org = testimonial.organizations;
  const review = testimonial.reviews;

  return {
    text: testimonial.content,
    author: review.customer_name || "Anonymous",
    rating: review.rating || 5,
    format: request.format,
    template: request.template || "modern",
    organization: {
      name: org.name,
      logoUrl: org.logo_url,
      primaryColor: org.primary_color || "#354f52",
      secondaryColor: "#84a98c", // Default brand secondary color
    },
    authorSubtitle: undefined,
    authorPhotoUrl: undefined,
  };
}

/**
 * Fetch and prepare leaderboard celebration props
 */
async function getLeaderboardCelebrationProps(
  request: LeaderboardCelebrationRenderRequest
): Promise<LeaderboardCelebrationProps> {
  const supabase = createAdminClient();

  // Fetch organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, logo_url, primary_color")
    .eq("id", request.organizationId)
    .single();

  if (!org) {
    throw new Error(`Organization not found: ${request.organizationId}`);
  }

  // Fetch leaderboard data based on celebration type
  if (request.celebrationType === "new_leader" && request.userId) {
    const { data: user } = await supabase
      .from("users")
      .select("id, full_name, photo_url")
      .eq("id", request.userId)
      .single();

    // Fetch their stats
    const { data: stats } = await supabase
      .from("leaderboard_snapshots")
      .select("reputation_score, rank, total_reviews, average_rating")
      .eq("user_id", request.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    return {
      celebrationType: "new_first_place",
      organization: {
        name: org.name,
        logoUrl: org.logo_url,
        primaryColor: org.primary_color || "#354f52",
        secondaryColor: "#84a98c", // Default brand secondary color
      },
      winner: {
        name: user?.full_name || "Unknown",
        photoUrl: user?.photo_url || null,
        score: stats?.reputation_score || 0,
        rank: 1,
        previousRank: 2,
        newRank: 1,
      },
      topFive: [],
      period: "This Week",
    };
  }

  if (request.celebrationType === "weekly_highlights") {
    // Fetch top 5 from leaderboard
    const { data: entries } = await supabase
      .from("leaderboard_snapshots")
      .select(`
        reputation_score,
        rank,
        user_id
      `)
      .eq("organization_id", request.organizationId)
      .order("reputation_score", { ascending: false })
      .limit(5);

    // Fetch user data separately
    const userIds = (entries || []).map(e => e.user_id).filter((id): id is string => !!id);
    const userMap = new Map<string, { full_name: string | null; photo_url: string | null }>();
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, full_name, photo_url")
        .in("id", userIds);
      for (const u of users || []) {
        userMap.set(u.id, { full_name: u.full_name, photo_url: u.photo_url });
      }
    }

    const topFive =
      entries?.map((e, i) => {
        const user = e.user_id ? userMap.get(e.user_id) : null;
        return {
          name: user?.full_name || 'Unknown',
          photoUrl: user?.photo_url || null,
          score: e.reputation_score,
          rank: i + 1,
        };
      }) || [];

    const winner = topFive[0] || { name: "Unknown", photoUrl: null, score: 0, rank: 1, previousRank: 1, newRank: 1 };

    return {
      celebrationType: "weekly_highlights",
      organization: {
        name: org.name,
        logoUrl: org.logo_url,
        primaryColor: org.primary_color || "#354f52",
        secondaryColor: "#84a98c", // Default brand secondary color
      },
      winner: { ...winner, previousRank: 1, newRank: 1 },
      topFive,
      period: "This Week",
    };
  }

  // Achievement celebration (badge_earned)
  return {
    celebrationType: "badge_earned",
    organization: {
      name: org.name,
      logoUrl: org.logo_url,
      primaryColor: org.primary_color || "#354f52",
      secondaryColor: "#84a98c", // Default brand secondary color
    },
    winner: {
      name: "Unknown",
      photoUrl: null,
      score: 0,
      rank: 1,
      previousRank: 1,
      newRank: 1,
    },
    topFive: [],
    period: "This Week",
    badge: {
      name: request.badgeType || "Achievement Unlocked",
      iconUrl: null,
      description: "Congratulations on your achievement!",
    },
  };
}

/**
 * Fetch and prepare report summary props
 */
async function getReportSummaryProps(
  request: ReportSummaryRenderRequest
): Promise<ReportSummaryProps> {
  const supabase = createAdminClient();

  // Fetch organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, logo_url, primary_color")
    .eq("id", request.organizationId)
    .single();

  if (!org) {
    throw new Error(`Organization not found: ${request.organizationId}`);
  }

  // Note: "reports" table doesn't exist yet, using defaults
  // TODO: Implement reports table and fetch data when available
  const metrics = {
    npsScore: 72,
    npsPrevious: 68,
    totalReviews: 156,
    reviewsPrevious: 142,
    averageRating: 4.8,
    ratingPrevious: 4.7,
    responseRate: 85,
    responseRatePrevious: 82,
  };

  return {
    period: request.period,
    organization: {
      name: org.name,
      logoUrl: org.logo_url,
      primaryColor: org.primary_color || "#354f52",
      secondaryColor: "#84a98c", // Default brand secondary color
    },
    metrics,
    sentimentBreakdown: {
      positive: 75,
      neutral: 18,
      negative: 7,
    },
    topPerformer: {
      name: "Top Performer",
      photoUrl: null,
      score: 95,
    },
    teamHighlights: [],
  };
}

/**
 * Fetch and prepare social clip props
 */
async function getSocialClipProps(
  request: SocialClipRenderRequest
): Promise<SocialClipProps> {
  const supabase = createAdminClient();

  // Fetch organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, logo_url, primary_color")
    .eq("id", request.organizationId)
    .single();

  if (!org) {
    throw new Error(`Organization not found: ${request.organizationId}`);
  }

  // Fetch source data based on type
  let quote = "";
  let author = "";
  let rating = 5;
  let statValue: string | undefined;
  let statLabel: string | undefined;

  if (request.sourceType === "testimonial") {
    const { data } = await supabase
      .from("testimonials")
      .select(`
        content,
        reviews!inner (
          customer_name,
          rating
        )
      `)
      .eq("id", request.sourceId)
      .single();

    if (data) {
      quote = data.content;
      author = data.reviews.customer_name || "Anonymous";
      rating = data.reviews.rating || 5;
    }
  } else if (request.sourceType === "review") {
    const { data } = await supabase
      .from("reviews")
      .select("text, customer_name, rating")
      .eq("id", request.sourceId)
      .single();

    if (data) {
      quote = data.text || "";
      author = data.customer_name || "Anonymous";
      rating = data.rating || 5;
    }
  }

  return {
    type: request.clipType,
    format: request.format,
    quote,
    author,
    rating,
    organization: {
      name: org.name,
      logoUrl: org.logo_url,
      primaryColor: org.primary_color || "#354f52",
      secondaryColor: "#84a98c", // Default brand secondary color
    },
    statValue,
    statLabel,
  };
}

/**
 * Fetch and prepare video thumbnail props
 */
async function getVideoThumbnailProps(
  request: VideoThumbnailRenderRequest
): Promise<VideoThumbnailProps> {
  const supabase = createAdminClient();

  // Fetch video response with related data
  const { data: response, error } = await supabase
    .from("video_testimonial_responses")
    .select(`
      *,
      video_testimonial_requests!inner (
        customer_name,
        user_id,
        organization_id,
        organizations!inner (
          id,
          name,
          logo_url,
          primary_color
        )
      )
    `)
    .eq("id", request.videoResponseId)
    .single();

  if (error || !response) {
    throw new Error(`Video response not found: ${request.videoResponseId}`);
  }

  const req = response.video_testimonial_requests;
  const org = req.organizations;

  // Fetch user data separately
  let userName = "Team Member";
  let userPhoto: string | null = null;
  if (req.user_id) {
    const { data: userData } = await supabase
      .from("users")
      .select("full_name, photo_url")
      .eq("id", req.user_id)
      .single();
    if (userData) {
      userName = userData.full_name || "Team Member";
      userPhoto = userData.photo_url;
    }
  }

  return {
    customerName: req.customer_name || "Valued Customer",
    quote: response.ai_generated_text || response.key_phrases?.[0] || "Great experience!",
    rating: response.sentiment_score
      ? Math.round((response.sentiment_score / 100) * 5)
      : 5,
    organization: {
      name: org.name,
      logoUrl: org.logo_url,
      primaryColor: org.primary_color || "#354f52",
      secondaryColor: "#84a98c", // Default brand secondary color
    },
    loanOfficer: {
      fullName: userName,
      photoUrl: userPhoto,
    },
    customerPhotoUrl: response.thumbnail_url,
  };
}

/**
 * Parse transcription text into caption segments
 */
function parseTranscriptionToCaptions(
  transcription: string | null
): CaptionSegment[] {
  if (!transcription) {
    return [];
  }

  // Split into sentences/phrases
  const phrases = transcription.split(/[.!?]+/).filter((p) => p.trim());

  const captions: CaptionSegment[] = [];
  let currentMs = 0;
  const wordsPerSecond = 2.5; // Average speaking rate

  for (const phrase of phrases) {
    const trimmed = phrase.trim();
    if (!trimmed) continue;

    const wordCount = trimmed.split(/\s+/).length;
    const durationMs = (wordCount / wordsPerSecond) * 1000;

    captions.push({
      text: trimmed,
      startMs: currentMs,
      endMs: currentMs + durationMs,
    });

    currentMs += durationMs + 200; // 200ms pause between phrases
  }

  return captions;
}

/**
 * Upload rendered video to Supabase Storage
 */
async function uploadToStorage(
  localPath: string,
  organizationId: string,
  fileName: string
): Promise<{ url: string; storagePath: string }> {
  const supabase = createAdminClient();
  const fs = await import("fs/promises");

  const fileBuffer = await fs.readFile(localPath);
  const storagePath = `generated-videos/${organizationId}/${fileName}`;

  const { error } = await supabase.storage
    .from("videos")
    .upload(storagePath, fileBuffer, {
      contentType: fileName.endsWith(".png") ? "image/png" : "video/mp4",
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload video: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("videos").getPublicUrl(storagePath);

  // Clean up local file
  await fs.unlink(localPath);

  return { url: publicUrl, storagePath };
}

/**
 * Save generated video record to database
 */
async function saveGeneratedVideo(_data: {
  id: string;
  organizationId: string;
  sourceType: CompositionType;
  sourceId: string;
  template: string;
  format: VideoFormat;
  storagePath: string;
  durationSeconds: number;
}): Promise<void> {
  // Note: "generated_videos" table doesn't exist yet
  // TODO: Create generated_videos table and implement storage
  // For now, this is a no-op
  console.log("saveGeneratedVideo: table not yet implemented");
}

/**
 * Get source ID from request
 */
function getSourceId(request: RenderRequest): string {
  switch (request.compositionType) {
    case "video-testimonial":
    case "video-thumbnail":
      return (request as VideoTestimonialRenderRequest).videoResponseId;
    case "text-testimonial":
      return (request as TextTestimonialRenderRequest).testimonialId;
    case "leaderboard-celebration":
      return (
        (request as LeaderboardCelebrationRenderRequest).leaderboardId ||
        (request as LeaderboardCelebrationRenderRequest).userId ||
        "celebration"
      );
    case "report-summary":
      return (request as ReportSummaryRenderRequest).reportId;
    case "social-clip":
      return (request as SocialClipRenderRequest).sourceId;
    default:
      return "unknown";
  }
}

/**
 * Get template from request
 */
function getTemplate(request: RenderRequest): string {
  if ("template" in request && request.template) {
    return request.template;
  }
  return "modern";
}
