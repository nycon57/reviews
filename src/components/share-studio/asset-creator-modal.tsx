"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Image as ImageIcon,
  VideoCamera,
  SpinnerGap as Loader2,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  getOrganizationBranding,
  queueReviewRenderJob,
  queueClipRenderJob,
  getRenderJobStatus,
  getClipMusicTracks,
  renderImageInline,
  renderTemplateInline,
  type OrganizationBrandingResult,
  type ClipMusicTrack,
} from "@/lib/share-studio/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  CheckCircle,
  WarningCircle,
  DownloadSimple,
  FilmSlate,
  ClosedCaptioning,
  MusicNotes,
  QrCode,
} from "@phosphor-icons/react";
import { SocialClip } from "@/remotion/compositions/SocialClip";
import type { OrganizationBranding } from "@/remotion/types";
import { calculateSocialClipDuration } from "@/remotion/utils/timing";
import {
  TEMPLATE_REGISTRY,
  PREMIUM_TEMPLATE_IDS,
} from "@/lib/share-studio/templates/registry";

const Player = dynamic(
  () => import("@remotion/player").then((m) => m.Player),
  { ssr: false }
);

// ============================================================================
// Types
// ============================================================================

type AssetType = "image" | "video";
type Format = "1:1" | "9:16" | "16:9";
type SimpleTemplate = "modern" | "minimal" | "bold";
type TemplateCategory = "simple" | "premium";

interface AssetCreatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceType: "review" | "video_testimonial";
  sourceId: string;
  reviewData: {
    text: string | null;
    customerName: string | null;
    rating: number;
  };
  /** Source video details; enables the Clip tweak options for video testimonials */
  clipSource?: {
    transcript: string | null;
    durationSeconds: number | null;
  };
  onQueued?: () => void;
}

interface ClipTweaks {
  /** "crop" fills the frame (center-crop); "card" places the source in a card on the brand background */
  framing: "crop" | "card";
  showCaptions: boolean;
  /** "off" or a clip_music_tracks id */
  music: string;
  showIntro: boolean;
  showOutro: boolean;
  /** Seconds into the source video; empty string = auto-trim */
  trimStartSec: string;
  trimEndSec: string;
  correctedTranscript: string | null;
}

const DEFAULT_CLIP_TWEAKS: ClipTweaks = {
  framing: "crop",
  showCaptions: true,
  music: "off",
  showIntro: true,
  showOutro: true,
  trimStartSec: "",
  trimEndSec: "",
  correctedTranscript: null,
};

const CLIP_POLL_INTERVAL_MS = 5000;
const CLIP_POLL_TIMEOUT_MS = 12 * 60 * 1000;

// ============================================================================
// Dimension helpers
// ============================================================================

const FORMAT_DIMENSIONS: Record<Format, { width: number; height: number }> = {
  "16:9": { width: 1920, height: 1080 },
  "1:1": { width: 1080, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
};

const FORMAT_LABELS: Record<Format, string> = {
  "1:1": "Square (1:1)",
  "9:16": "Vertical (9:16)",
  "16:9": "Landscape (16:9)",
};

const SIMPLE_TEMPLATE_LABELS: Record<SimpleTemplate, string> = {
  modern: "Modern",
  minimal: "Minimal",
  bold: "Bold",
};

const FPS = 30;

// ============================================================================
// Satori-identical layout tokens (must stay in sync with satori-renderer.ts)
// ============================================================================

const COLORS = {
  sage: { 100: "#cad2c5", 200: "#84a98c" },
  teal: { 300: "#52796f", 400: "#354f52", 500: "#2f3e46" },
  white: "#ffffff",
} as const;

function lightenColor(hex: string, percent: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const f = percent / 100;
  const r = Math.min(255, Math.max(0, Math.round(parseInt(m[1], 16) + (255 - parseInt(m[1], 16)) * f)));
  const g = Math.min(255, Math.max(0, Math.round(parseInt(m[2], 16) + (255 - parseInt(m[2], 16)) * f)));
  const b = Math.min(255, Math.max(0, Math.round(parseInt(m[3], 16) + (255 - parseInt(m[3], 16)) * f)));
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function getTemplateStyles(
  template: SimpleTemplate,
  primaryColor: string,
  secondaryColor: string,
) {
  switch (template) {
    case "minimal":
      return { background: COLORS.white, textColor: COLORS.teal[500] };
    case "bold":
      return {
        background: `linear-gradient(135deg, ${primaryColor || COLORS.teal[400]}, ${secondaryColor || COLORS.sage[200]})`,
        textColor: COLORS.white,
      };
    case "modern":
    default:
      return {
        background: `linear-gradient(180deg, ${lightenColor(COLORS.sage[100], 30)} 0%, ${COLORS.white} 100%)`,
        textColor: COLORS.teal[500],
      };
  }
}

function getLayoutTokens(dims: { width: number; height: number }) {
  const isVertical = dims.height > dims.width;
  const isLandscape = dims.width > dims.height;
  return {
    padding: isVertical ? 60 : isLandscape ? 56 : 56,
    quoteFontSize: isVertical ? 32 : isLandscape ? 30 : 34,
    starSize: isVertical ? 36 : 32,
    authorFontSize: isVertical ? 22 : 20,
    orgFontSize: isVertical ? 20 : isLandscape ? 20 : 18,
    quotePaddingX: isVertical ? 20 : 40,
  };
}

// ============================================================================
// Component
// ============================================================================

export function AssetCreatorModal({
  open,
  onOpenChange,
  sourceType,
  sourceId,
  reviewData,
  clipSource,
  onQueued,
}: AssetCreatorModalProps) {
  const [assetType, setAssetType] = useState<AssetType>("image");
  const [format, setFormat] = useState<Format>("1:1");
  const [templateCategory, setTemplateCategory] = useState<TemplateCategory>("premium");
  const [simpleTemplate, setSimpleTemplate] = useState<SimpleTemplate>("modern");
  const [premiumTemplateId, setPremiumTemplateId] = useState(PREMIUM_TEMPLATE_IDS[0]);
  const [branding, setBranding] = useState<OrganizationBrandingResult | null>(
    null
  );
  const [isQueuing, setIsQueuing] = useState(false);

  // Clip (branded video testimonial) tweaks + render progress
  const isClip = sourceType === "video_testimonial" && assetType === "video";
  const [clipTweaks, setClipTweaks] = useState<ClipTweaks>(DEFAULT_CLIP_TWEAKS);
  const [musicTracks, setMusicTracks] = useState<ClipMusicTrack[]>([]);
  const [clipJob, setClipJob] = useState<{
    jobId: string;
    status: "queued" | "processing" | "completed" | "failed";
    assetUrl: string | null;
    error: string | null;
  } | null>(null);

  // Fetch branding on open; reset progress state on close
  useEffect(() => {
    if (!open) {
      setClipJob(null);
      return;
    }
    void getOrganizationBranding().then((data) => {
      if (data) setBranding(data);
    });
    if (sourceType === "video_testimonial") {
      void getClipMusicTracks().then(setMusicTracks);
    }
  }, [open, sourceType]);

  // Poll the clip render job until it resolves. Keyed to the job id only so
  // status updates don't tear down and recreate the interval.
  const clipJobId = clipJob?.jobId ?? null;
  useEffect(() => {
    if (!open || !clipJobId) return;

    const updateClipJob = (
      updates: Partial<NonNullable<typeof clipJob>>
    ): void => setClipJob((prev) => (prev ? { ...prev, ...updates } : prev));

    const startedAt = Date.now();
    const interval = setInterval(async () => {
      if (Date.now() - startedAt > CLIP_POLL_TIMEOUT_MS) {
        clearInterval(interval);
        updateClipJob({ status: "failed", error: "Render timed out" });
        return;
      }
      try {
        const result = await getRenderJobStatus(clipJobId);
        if (result.status === "completed") {
          clearInterval(interval);
          updateClipJob({ status: "completed", assetUrl: result.asset?.url ?? null });
          onQueued?.();
        } else if (result.status === "failed") {
          clearInterval(interval);
          updateClipJob({ status: "failed", error: result.errorMessage });
        } else if (result.status === "processing") {
          updateClipJob({ status: "processing" });
        }
      } catch {
        // Transient polling failure: keep trying until the timeout
      }
    }, CLIP_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [open, clipJobId, onQueued]);

  // Clips default to the vertical social format and start from the source
  // transcript for Caption Correction. Adjusted during render (prev-comparison)
  // instead of an effect so the first frame never shows the stale format.
  const clipSyncKey = isClip ? (clipSource?.transcript ?? "") : null;
  const [prevClipSyncKey, setPrevClipSyncKey] = useState<string | null>(null);
  if (clipSyncKey !== prevClipSyncKey) {
    setPrevClipSyncKey(clipSyncKey);
    if (isClip) {
      setFormat("9:16");
      setClipTweaks((prev) =>
        prev.correctedTranscript === null
          ? { ...prev, correctedTranscript: clipSource?.transcript ?? null }
          : prev
      );
    }
  }

  // Image stills use CSS preview; videos use Remotion Player
  const useVideoPlayer = assetType === "video";
  const showTemplateSelector = !useVideoPlayer || !(sourceType === "video_testimonial");

  const organization: OrganizationBranding = useMemo(
    () => ({
      name: branding?.name || "Organization",
      logoUrl: branding?.logoUrl ?? null,
      primaryColor: branding?.primaryColor || "#52796f",
      secondaryColor: branding?.secondaryColor || "#84a98c",
    }),
    [branding]
  );

  const dims = FORMAT_DIMENSIONS[format];

  // Video-only: Remotion composition props (always SocialClip format for video)
  const videoCompositionProps = useMemo(() => {
    if (!useVideoPlayer) return null;
    const text = reviewData.text || "Customer feedback shared via Share Studio";
    const author = reviewData.customerName || "Verified Customer";
    const rating = Math.max(1, Math.min(5, Math.round(reviewData.rating)));

    return {
      type: "testimonial_quote" as const,
      quote: text,
      author,
      rating,
      organization,
      format,
    };
  }, [reviewData, organization, format, useVideoPlayer]);

  const durationInFrames = useMemo(() => {
    if (!videoCompositionProps) return FPS * 5;
    return calculateSocialClipDuration(videoCompositionProps, FPS);
  }, [videoCompositionProps]);

  const handleCreate = useCallback(async () => {
    setIsQueuing(true);
    try {
      if (assetType === "image") {
        if (templateCategory === "premium") {
          // Premium templates: React SVG + resvg
          const result = await renderTemplateInline(sourceType, sourceId, {
            templateId: premiumTemplateId,
            format,
          });

          if (result.success) {
            toast({
              title: "Image created",
              description: "Your premium image asset is ready.",
            });
            onOpenChange(false);
            onQueued?.();
          } else {
            toast({
              title: "Create failed",
              description: result.error || "Could not create the image.",
              variant: "destructive",
            });
          }
        } else {
          // Simple templates: Satori (existing flow)
          const result = await renderImageInline(sourceType, sourceId, {
            format,
            template: showTemplateSelector ? simpleTemplate : "modern",
          });

          if (result.success) {
            toast({
              title: "Image created",
              description: "Your image asset is ready.",
            });
            onOpenChange(false);
            onQueued?.();
          } else {
            toast({
              title: "Create failed",
              description: result.error || "Could not create the image.",
              variant: "destructive",
            });
          }
        }
      } else if (sourceType === "video_testimonial") {
        // Clip: branded testimonial built from the source video. The modal
        // stays open and polls until the render resolves.
        const trimStartMs = clipTweaks.trimStartSec.trim()
          ? Math.max(0, Math.round(parseFloat(clipTweaks.trimStartSec) * 1000))
          : undefined;
        const trimEndMs = clipTweaks.trimEndSec.trim()
          ? Math.max(0, Math.round(parseFloat(clipTweaks.trimEndSec) * 1000))
          : undefined;

        const result = await queueClipRenderJob(sourceId, {
          format,
          framing: clipTweaks.framing,
          showCaptions: clipTweaks.showCaptions,
          showIntro: clipTweaks.showIntro,
          showOutro: clipTweaks.showOutro,
          ...(clipTweaks.music !== "off" ? { musicTrackId: clipTweaks.music } : {}),
          ...(trimStartMs !== undefined ? { trimStartMs } : {}),
          ...(trimEndMs !== undefined ? { trimEndMs } : {}),
          ...(clipTweaks.correctedTranscript &&
          clipTweaks.correctedTranscript.trim() !== (clipSource?.transcript ?? "").trim()
            ? { correctedTranscript: clipTweaks.correctedTranscript.trim() }
            : {}),
        });

        if (result.success && result.jobId) {
          setClipJob({
            jobId: result.jobId,
            status: "queued",
            assetUrl: null,
            error: null,
          });
        } else {
          toast({
            title: "Queue failed",
            description: result.error || "Could not queue the clip render.",
            variant: "destructive",
          });
        }
      } else {
        // Review-sourced videos: animated quote clip through the queue
        const options = {
          assetType: "video" as const,
          format,
          template: showTemplateSelector ? simpleTemplate : ("modern" as const),
          templateId: undefined,
          templateVersionId: undefined,
          priority: 0,
        };

        const result = await queueReviewRenderJob(sourceId, options);

        if (result.success) {
          toast({
            title: "Video queued",
            description: "Your video is now processing. This may take a moment.",
          });
          onOpenChange(false);
          onQueued?.();
        } else {
          toast({
            title: "Queue failed",
            description: result.error || "Could not queue the video render.",
            variant: "destructive",
          });
        }
      }
    } finally {
      setIsQueuing(false);
    }
  }, [assetType, format, templateCategory, simpleTemplate, premiumTemplateId, showTemplateSelector, sourceType, sourceId, clipTweaks, clipSource, onOpenChange, onQueued]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Asset</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 sm:grid-cols-[280px_1fr]">
          {/* Controls (left) */}
          <div className="space-y-5 order-2 sm:order-1">
            {/* Asset Type */}
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Asset Type
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <ToggleButton
                  active={assetType === "image"}
                  onClick={() => setAssetType("image")}
                  icon={<ImageIcon className="h-4 w-4" />}
                  label="Image"
                />
                <ToggleButton
                  active={assetType === "video"}
                  onClick={() => setAssetType("video")}
                  icon={<VideoCamera className="h-4 w-4" />}
                  label="Video"
                />
              </div>
            </div>

            {/* Format */}
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Format
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {(["1:1", "9:16", "16:9"] as Format[]).map((f) => (
                  <ToggleButton
                    key={f}
                    active={format === f}
                    onClick={() => setFormat(f)}
                    label={f}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {FORMAT_LABELS[format]}
              </p>
            </div>

            {/* Clip tweaks (video testimonials only) */}
            {isClip && (
              <div className="space-y-4">
                {/* Framing */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Framing
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <ToggleButton
                      active={clipTweaks.framing === "crop"}
                      onClick={() =>
                        setClipTweaks((p) => ({ ...p, framing: "crop" }))
                      }
                      label="Fill frame"
                    />
                    <ToggleButton
                      active={clipTweaks.framing === "card"}
                      onClick={() =>
                        setClipTweaks((p) => ({ ...p, framing: "card" }))
                      }
                      label="Card"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {clipTweaks.framing === "crop"
                      ? "Your video fills the frame edge to edge, cropped to center."
                      : "Your video sits in a card on your brand background, nothing cropped."}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <ClosedCaptioning className="h-4 w-4 text-muted-foreground" />
                    Captions
                  </Label>
                  <Switch
                    checked={clipTweaks.showCaptions}
                    onCheckedChange={(v) =>
                      setClipTweaks((p) => ({ ...p, showCaptions: v }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <MusicNotes className="h-4 w-4 text-muted-foreground" />
                    Music
                  </Label>
                  <Select
                    value={clipTweaks.music}
                    onValueChange={(value) =>
                      setClipTweaks((p) => ({ ...p, music: value }))
                    }
                  >
                    <SelectTrigger aria-label="Background music">
                      <SelectValue placeholder="No music" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">No music</SelectItem>
                      {musicTracks.map((track) => (
                        <SelectItem key={track.id} value={track.id}>
                          {track.name}
                          <span className="ml-1.5 text-muted-foreground">
                            {track.mood}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {clipTweaks.music !== "off" && (
                    <p className="text-xs text-muted-foreground">
                      {musicTracks.find((track) => track.id === clipTweaks.music)
                        ?.description ?? "Plays softly and ducks under speech."}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <FilmSlate className="h-4 w-4 text-muted-foreground" />
                    Intro and end card
                  </Label>
                  <Switch
                    checked={clipTweaks.showIntro && clipTweaks.showOutro}
                    onCheckedChange={(v) =>
                      setClipTweaks((p) => ({ ...p, showIntro: v, showOutro: v }))
                    }
                  />
                </div>

                {/* Trim */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Trim (seconds)
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      placeholder="Auto"
                      aria-label="Trim start in seconds"
                      value={clipTweaks.trimStartSec}
                      onChange={(e) =>
                        setClipTweaks((p) => ({ ...p, trimStartSec: e.target.value }))
                      }
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      placeholder="Auto"
                      aria-label="Trim end in seconds"
                      value={clipTweaks.trimEndSec}
                      onChange={(e) =>
                        setClipTweaks((p) => ({ ...p, trimEndSec: e.target.value }))
                      }
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Auto removes silence at the start and end.
                  </p>
                  {(clipSource?.durationSeconds ?? 0) > 60 && (
                    <p className="flex items-start gap-1.5 text-xs text-amber-600">
                      <WarningCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      This video runs over 60 seconds. Short clips hold attention
                      better on social; consider trimming.
                    </p>
                  )}
                </div>

                {/* Caption Correction */}
                {clipSource?.transcript && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Caption text
                    </Label>
                    <Textarea
                      rows={4}
                      value={clipTweaks.correctedTranscript ?? ""}
                      onChange={(e) =>
                        setClipTweaks((p) => ({
                          ...p,
                          correctedTranscript: e.target.value,
                        }))
                      }
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Fix misheard words here; caption timing stays the same.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Template Category (image only) */}
            {showTemplateSelector && assetType === "image" && (
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Style
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <ToggleButton
                    active={templateCategory === "premium"}
                    onClick={() => setTemplateCategory("premium")}
                    label="Premium"
                  />
                  <ToggleButton
                    active={templateCategory === "simple"}
                    onClick={() => setTemplateCategory("simple")}
                    label="Simple"
                  />
                </div>
              </div>
            )}

            {/* Premium template picker */}
            {showTemplateSelector && assetType === "image" && templateCategory === "premium" && (
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Template
                </Label>
                <div className="space-y-1.5">
                  {PREMIUM_TEMPLATE_IDS.map((id) => {
                    const meta = TEMPLATE_REGISTRY[id];
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPremiumTemplateId(id)}
                        className={cn(
                          "w-full text-left rounded-md border px-3 py-2.5 transition-colors",
                          premiumTemplateId === id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <div className="text-sm font-medium">{meta.name}</div>
                        <div className="text-xs opacity-70 mt-0.5">{meta.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Simple template picker (existing Satori templates) */}
            {showTemplateSelector && (assetType === "video" || templateCategory === "simple") && (
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Template
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["modern", "minimal", "bold"] as SimpleTemplate[]).map((t) => (
                    <ToggleButton
                      key={t}
                      active={simpleTemplate === t}
                      onClick={() => setSimpleTemplate(t)}
                      label={SIMPLE_TEMPLATE_LABELS[t]}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Create / Queue button */}
            <Button
              className="w-full"
              onClick={() => void handleCreate()}
              disabled={
                isQueuing ||
                (clipJob !== null && ["queued", "processing"].includes(clipJob.status))
              }
            >
              {isQueuing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {assetType === "image" ? "Creating..." : "Queuing..."}
                </>
              ) : assetType === "image" ? (
                "Create Image"
              ) : isClip ? (
                clipJob?.status === "completed" || clipJob?.status === "failed" ? (
                  "Render Again"
                ) : (
                  "Render Clip"
                )
              ) : (
                "Queue Video"
              )}
            </Button>
          </div>

          {/* Preview (right) */}
          <div className="order-1 sm:order-2 flex items-center justify-center rounded-lg border bg-muted/30 p-4 min-h-[300px]">
            {isClip ? (
              <ClipStatusPanel
                job={clipJob}
                tweaks={clipTweaks}
                musicName={
                  musicTracks.find((track) => track.id === clipTweaks.music)
                    ?.name ?? null
                }
              />
            ) : useVideoPlayer && Player && videoCompositionProps ? (
              <div
                className="w-full"
                style={{
                  maxWidth:
                    format === "9:16"
                      ? 240
                      : format === "1:1"
                        ? 360
                        : "100%",
                }}
              >
                <Player
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  component={SocialClip as React.FC<any>}
                  compositionWidth={dims.width}
                  compositionHeight={dims.height}
                  durationInFrames={durationInFrames}
                  fps={FPS}
                  inputProps={videoCompositionProps}
                  controls
                  numberOfSharedAudioTags={0}
                  style={{ width: "100%" }}
                />
              </div>
            ) : assetType === "image" && templateCategory === "premium" ? (
              <PremiumPreview
                templateId={premiumTemplateId}
                text={reviewData.text}
                customerName={reviewData.customerName}
                rating={reviewData.rating}
                organization={organization}
                format={format}
              />
            ) : (
              <StillPreview
                text={reviewData.text}
                customerName={reviewData.customerName}
                rating={reviewData.rating}
                organization={organization}
                template={simpleTemplate}
                format={format}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Premium Preview — renders the same React SVG component in the browser
//
// True WYSIWYG: the same component that renders server-side via resvg
// renders client-side as an inline <svg>.
// ============================================================================

function PremiumPreview({
  templateId,
  text,
  customerName,
  rating,
  organization,
  format,
}: {
  templateId: string;
  text: string | null;
  customerName: string | null;
  rating: number;
  organization: OrganizationBranding;
  format: Format;
}) {
  const dims = FORMAT_DIMENSIONS[format];
  const meta = TEMPLATE_REGISTRY[templateId];

  const maxContainerWidth = format === "9:16" ? 240 : format === "1:1" ? 360 : 460;
  const scale = maxContainerWidth / dims.width;

  if (!meta) return null;

  const Component = meta.component;

  return (
    <div
      style={{
        width: maxContainerWidth,
        height: dims.height * scale,
        overflow: "hidden",
        borderRadius: 8,
      }}
    >
      <div
        style={{
          width: dims.width,
          height: dims.height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <Component
          width={dims.width}
          height={dims.height}
          quote={text || "Customer feedback shared via Share Studio"}
          customerName={customerName || "Verified Customer"}
          rating={Math.max(1, Math.min(5, Math.round(rating)))}
          avatarBase64={null}
          orgName={organization.name || "Organization"}
          primaryColor={organization.primaryColor}
          secondaryColor={organization.secondaryColor}
          logoBase64={null}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Still Preview — renders at actual Satori pixel dimensions, scaled down
//
// This guarantees pixel-perfect WYSIWYG: the preview uses the exact same
// absolute pixel values as satori-renderer.ts, rendered into a full-size
// div that is then CSS-scaled to fit the modal container.
// ============================================================================

function hexToRgba(hex: string, opacity: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${opacity})`;
}

function StillPreview({
  text,
  customerName,
  rating,
  organization,
  template,
  format,
}: {
  text: string | null;
  customerName: string | null;
  rating: number;
  organization: OrganizationBranding;
  template: SimpleTemplate;
  format: Format;
}) {
  const dims = FORMAT_DIMENSIONS[format];
  const tokens = getLayoutTokens(dims);
  const styles = getTemplateStyles(template, organization.primaryColor, organization.secondaryColor);

  const quote = text || "Customer feedback shared via Share Studio";
  const author = customerName || "Verified Customer";
  const filled = Math.max(1, Math.min(5, Math.round(rating)));
  const orgName = organization.name || "Organization";

  // Unicode stars matching Satori renderer
  const filledStars = "\u2605".repeat(filled);
  const emptyStars = "\u2605".repeat(5 - filled);

  // Scale factor: fit the full-size render into the preview container
  // Container max is ~460px wide for the preview area
  const maxContainerWidth = format === "9:16" ? 240 : format === "1:1" ? 360 : 460;
  const scale = maxContainerWidth / dims.width;

  return (
    <div
      style={{
        width: maxContainerWidth,
        height: dims.height * scale,
        overflow: "hidden",
        borderRadius: 8,
      }}
    >
      <div
        style={{
          width: dims.width,
          height: dims.height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          background: styles.background,
          color: styles.textColor,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: tokens.padding,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* Top: organization name */}
        <div
          style={{
            fontSize: tokens.orgFontSize,
            fontWeight: 700,
            letterSpacing: "-0.01em",
          }}
        >
          {orgName}
        </div>

        {/* Middle: quote block */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            paddingLeft: tokens.quotePaddingX,
            paddingRight: tokens.quotePaddingX,
          }}
        >
          <div
            style={{
              width: "100%",
              textAlign: "center",
              fontSize: tokens.quoteFontSize,
              fontWeight: 400,
              fontStyle: "italic",
              lineHeight: 1.5,
            }}
          >
            &ldquo;{quote}&rdquo;
          </div>
        </div>

        {/* Bottom: stars + author + powered by */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* Stars */}
          <div
            style={{
              display: "flex",
              fontSize: tokens.starSize,
              letterSpacing: 4,
              lineHeight: 1,
            }}
          >
            <span style={{ color: "#FBBF24" }}>{filledStars}</span>
            <span style={{ color: hexToRgba(styles.textColor, 0.2) }}>
              {emptyStars}
            </span>
          </div>
          {/* Author */}
          <div
            style={{
              fontSize: tokens.authorFontSize,
              fontWeight: 600,
            }}
          >
            {author}
          </div>
          {/* Powered by */}
          <div
            style={{
              fontSize: 12,
              opacity: 0.4,
              marginTop: 8,
              display: "flex",
              gap: 4,
            }}
          >
            <span>Powered by</span>
            <span style={{ fontWeight: 600 }}>RepWell</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Clip status panel — what the render contains + live job progress
// ============================================================================

function ClipStatusPanel({
  job,
  tweaks,
  musicName,
}: {
  job: {
    status: "queued" | "processing" | "completed" | "failed";
    assetUrl: string | null;
    error: string | null;
  } | null;
  tweaks: ClipTweaks;
  musicName: string | null;
}) {
  const segments = [
    tweaks.showIntro && { icon: <FilmSlate className="h-4 w-4" />, label: "Branded intro" },
    {
      icon: <ClosedCaptioning className="h-4 w-4" />,
      label: tweaks.showCaptions ? "Your video with captions" : "Your video",
    },
    tweaks.music !== "off" &&
      musicName && {
        icon: <MusicNotes className="h-4 w-4" />,
        label: `${musicName}, ducked under speech`,
      },
    tweaks.showOutro && {
      icon: <QrCode className="h-4 w-4" />,
      label: "End card with contact info and QR",
    },
  ].filter(Boolean) as Array<{ icon: React.ReactNode; label: string }>;

  if (job?.status === "completed" && job.assetUrl) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle className="h-10 w-10 text-repwell-sage-200" weight="fill" />
        <div>
          <p className="font-medium">Your clip is ready</p>
          <p className="mt-1 text-sm text-muted-foreground">
            It is also saved to your Share Studio library.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <a href={job.assetUrl} download target="_blank" rel="noopener noreferrer">
              <DownloadSimple className="h-4 w-4" />
              Download clip
            </a>
          </Button>
        </div>
        <video
          src={job.assetUrl}
          controls
          playsInline
          className="max-h-[340px] rounded-lg border"
        />
      </div>
    );
  }

  if (job?.status === "failed") {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <WarningCircle className="h-10 w-10 text-destructive" weight="fill" />
        <div>
          <p className="font-medium">Render failed</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {job.error || "Something went wrong. Adjust the options and try again."}
          </p>
        </div>
      </div>
    );
  }

  if (job) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-9 w-9 animate-spin text-muted-foreground" />
        <div>
          <p className="font-medium">
            {job.status === "processing" ? "Rendering your clip" : "Waiting in queue"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Usually takes a couple of minutes. You can close this window; the
            finished clip lands in your Share Studio library.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xs space-y-3">
      <p className="text-sm font-medium">This clip will include</p>
      <ul className="space-y-2.5">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <span className="text-repwell-teal-300">{segment.icon}</span>
            {segment.label}
          </li>
        ))}
      </ul>
      <p className="pt-1 text-xs text-muted-foreground">
        Styling follows your organization&apos;s branding automatically.
      </p>
    </div>
  );
}

// ============================================================================
// Toggle Button helper
// ============================================================================

function ToggleButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground hover:bg-muted"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
