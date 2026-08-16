"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SpeakerHigh as Volume2,
  SpeakerSlash as VolumeX,
  ArrowsOut as Maximize,
  ShareNetwork as Share2,
  Code,
  Link,
  FacebookLogo as Facebook,
  LinkedinLogo as Linkedin,
  TwitterLogo as Twitter,
  Copy,
  Check,
  Quotes as Quote,
  User,
  BuildingOffice as Building2,
  Clock,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useVideoPlayer } from "@/hooks/use-video-player";
import { formatDuration, formatRelationship, escapeHtml } from "@/lib/video-testimonials/types";
import type { PublicVideoTestimonial } from "@/lib/video-testimonials/public-actions";
import { trackVideoShare, type SharePlatform } from "@/lib/video-testimonials/public-actions";

interface VideoTestimonialPlayerProps {
  video: PublicVideoTestimonial;
  pageUrl: string;
  embedUrl: string;
  /** Optional landing-page content rendered below the player card (e.g. contact card on smart links). */
  belowContent?: React.ReactNode;
}

export function VideoTestimonialPlayer({
  video,
  pageUrl,
  embedUrl,
  belowContent,
}: VideoTestimonialPlayerProps) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const {
    videoRef,
    isPlaying,
    isMuted,
    currentTime,
    progress,
    togglePlay,
    toggleMute,
    enterFullscreen,
    handleTimeUpdate,
    handleSeek,
    handleSliderKeyDown,
    setIsPlaying,
  } = useVideoPlayer({ durationSeconds: video.durationSeconds });

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      const platform: SharePlatform = field === "embed" ? "embed" : "link";
      trackVideoShare(video.id, platform).catch(console.error);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleSocialShare = (platform: SharePlatform) => {
    trackVideoShare(video.id, platform).catch(console.error);
  };

  const embedCode = `<iframe
  src="${embedUrl}"
  width="560"
  height="315"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
  title="Video Testimonial from ${escapeHtml(video.customer.displayName)}"
></iframe>`;

  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(
    `Watch ${video.customer.displayName}'s testimonial about their experience with ${video.professional.fullName}`
  );
  const socialLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-muted via-card to-background-subtle">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        {/* Header with Organization Branding */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            {video.organization.logoUrl ? (
              <Image
                src={video.organization.logoUrl}
                alt={video.organization.name}
                width={48}
                height={48}
                className="rounded-lg object-contain"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-soft">
                <Building2 className="h-6 w-6 text-repwell-teal-500" />
              </div>
            )}
            <div>
              <h2 className="font-display text-lg font-semibold text-heading">
                {video.organization.name}
              </h2>
              <p className="text-sm text-muted-foreground">Customer Testimonial</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShareDialog(true)}
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </motion.header>

        {/* Video Player Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
        >
          {/* Video Container */}
          <div className="group relative aspect-video bg-repwell-teal-500">
            <video
              ref={videoRef}
              src={video.videoUrl}
              poster={video.thumbnailUrl || undefined}
              className="h-full w-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              playsInline
            />

            {/* Play/Pause Overlay */}
            <AnimatePresence>
              {!isPlaying && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={togglePlay}
                  className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/30"
                  aria-label="Play video"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-card/90 shadow-lg transition-colors hover:bg-card">
                    <Play className="ml-1 h-10 w-10 text-repwell-teal-500" />
                  </div>
                </motion.button>
              )}
            </AnimatePresence>

            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
              {/* Progress Bar */}
              <div
                className="mb-3 h-1 w-full cursor-pointer rounded-full bg-white/30"
                onClick={handleSeek}
                onKeyDown={handleSliderKeyDown}
                role="slider"
                aria-label="Video progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                tabIndex={0}
              >
                <div
                  className="h-full rounded-full bg-repwell-teal-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="text-white transition-colors hover:text-repwell-teal-300"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </button>
                  <button
                    onClick={toggleMute}
                    className="text-white transition-colors hover:text-repwell-teal-300"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </button>
                  <span className="font-mono text-sm text-white">
                    {formatDuration(Math.floor(currentTime))} /{" "}
                    {formatDuration(video.durationSeconds)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowShareDialog(true)}
                    className="text-white transition-colors hover:text-repwell-teal-300"
                    aria-label="Share video"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={enterFullscreen}
                    className="text-white transition-colors hover:text-repwell-teal-300"
                    aria-label="Enter fullscreen"
                  >
                    <Maximize className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Video Info */}
          <div className="p-6 sm:p-8">
            {/* Customer Info */}
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-surface-soft">
                <User className="h-7 w-7 text-repwell-teal-500" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="mb-1 font-display text-2xl font-semibold text-heading">
                  {video.customer.displayName}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  {video.customer.relationship && (
                    <Badge variant="secondary" className="bg-surface-soft text-heading">
                      {formatRelationship(video.customer.relationship)}
                    </Badge>
                  )}
                  {video.durationSeconds && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDuration(video.durationSeconds)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* AI Generated Quote/Summary */}
            {video.aiGeneratedText && (
              <div className="relative mb-6 rounded-xl bg-background-muted p-6">
                <Quote className="absolute left-4 top-4 h-8 w-8 text-repwell-sage-300" />
                <p className="pl-8 italic leading-relaxed text-foreground">
                  &ldquo;{video.aiGeneratedText}&rdquo;
                </p>
              </div>
            )}

            {/* Key Phrases */}
            {video.keyPhrases && video.keyPhrases.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {video.keyPhrases.slice(0, 5).map((phrase, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="border-repwell-teal-300/20 bg-repwell-teal-300/10 text-repwell-teal-300"
                  >
                    {phrase}
                  </Badge>
                ))}
              </div>
            )}

            {/* Loan Officer Info */}
            <div className="border-t border-border pt-6">
              <p className="mb-3 text-sm text-muted-foreground">Testimonial for</p>
              <div className="flex items-center gap-3">
                {video.professional.photoUrl ? (
                  <Image
                    src={video.professional.photoUrl}
                    alt={video.professional.fullName}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-repwell-teal-100">
                    <User className="h-6 w-6 text-repwell-teal-400" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-heading">{video.professional.fullName}</p>
                  {video.professional.title && (
                    <p className="text-sm text-muted-foreground">{video.professional.title}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {belowContent}

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center text-sm text-muted-foreground"
        >
          <p>Powered by RepWell</p>
        </motion.footer>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Share this Testimonial</DialogTitle>
            <DialogDescription>
              Share this video testimonial on social media or embed it on your website.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="social" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="social" className="gap-2">
                <Share2 className="h-4 w-4" />
                Social
              </TabsTrigger>
              <TabsTrigger value="link" className="gap-2">
                <Link className="h-4 w-4" />
                Link
              </TabsTrigger>
              <TabsTrigger value="embed" className="gap-2">
                <Code className="h-4 w-4" />
                Embed
              </TabsTrigger>
            </TabsList>

            {/* Social Sharing */}
            <TabsContent value="social" className="mt-4">
              <div className="grid grid-cols-3 gap-3">
                <SocialButton
                  href={socialLinks.facebook}
                  icon={<Facebook className="h-8 w-8 text-blue-600" />}
                  label="Facebook"
                  hoverClass="hover:bg-blue-50 hover:border-blue-200"
                  onClick={() => handleSocialShare("facebook")}
                />
                <SocialButton
                  href={socialLinks.linkedin}
                  icon={<Linkedin className="h-8 w-8 text-blue-700" />}
                  label="LinkedIn"
                  hoverClass="hover:bg-blue-50 hover:border-blue-200"
                  onClick={() => handleSocialShare("linkedin")}
                />
                <SocialButton
                  href={socialLinks.twitter}
                  icon={<Twitter className="h-8 w-8 text-heading" />}
                  label="X"
                  hoverClass="hover:bg-background-muted hover:border-border"
                  onClick={() => handleSocialShare("twitter")}
                />
              </div>
            </TabsContent>

            {/* Direct Link */}
            <TabsContent value="link" className="mt-4">
              <CopyField
                value={pageUrl}
                field="link"
                copiedField={copiedField}
                onCopy={copyToClipboard}
                description="Share this link to let others watch this video testimonial."
              />
            </TabsContent>

            {/* Embed Code */}
            <TabsContent value="embed" className="mt-4">
              <CopyField
                value={embedCode}
                field="embed"
                copiedField={copiedField}
                onCopy={copyToClipboard}
                description="Paste this code into your website to embed the video testimonial."
                multiline
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper components for the share dialog
function SocialButton({
  href,
  icon,
  label,
  hoverClass,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  hoverClass: string;
  onClick: () => void;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border border-border p-4 transition-colors",
        hoverClass
      )}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}

function CopyField({
  value,
  field,
  copiedField,
  onCopy,
  description,
  multiline,
}: {
  value: string;
  field: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
  description: string;
  multiline?: boolean;
}) {
  const isCopied = copiedField === field;

  return (
    <div className="space-y-3">
      <div className={multiline ? "relative" : "flex gap-2"}>
        {multiline ? (
          <>
            <textarea
              value={value}
              readOnly
              rows={6}
              className="w-full resize-none rounded-lg border border-border bg-background-subtle px-3 py-2 font-mono text-sm text-foreground"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCopy(value, field)}
              className={cn(
                "absolute right-2 top-2 gap-2",
                isCopied && "border-success/20 text-success"
              )}
            >
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {isCopied ? "Copied" : "Copy"}
            </Button>
          </>
        ) : (
          <>
            <input
              type="text"
              value={value}
              readOnly
              className="flex-1 rounded-lg border border-border bg-background-subtle px-3 py-2 font-mono text-sm text-foreground"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCopy(value, field)}
              className="gap-2"
            >
              {isCopied ? (
                <>
                  <Check className="h-4 w-4 text-success" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
