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
}

export function VideoTestimonialPlayer({
  video,
  pageUrl,
  embedUrl,
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
    `Watch ${video.customer.displayName}'s testimonial about their experience with ${video.loanOfficer.fullName}`
  );
  const socialLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-repwell-sage-100 via-white to-repwell-teal-50">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        {/* Header with Organization Branding */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
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
              <div className="w-12 h-12 rounded-lg bg-repwell-sage-200 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-repwell-sage-700" />
              </div>
            )}
            <div>
              <h2 className="font-display text-lg font-semibold text-gray-900">
                {video.organization.name}
              </h2>
              <p className="text-sm text-gray-500">Customer Testimonial</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShareDialog(true)}
            className="gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </motion.header>

        {/* Video Player Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {/* Video Container */}
          <div className="relative aspect-video bg-gray-900 group">
            <video
              ref={videoRef}
              src={video.videoUrl}
              poster={video.thumbnailUrl || undefined}
              className="w-full h-full object-contain"
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
                  className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
                  aria-label="Play video"
                >
                  <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white transition-colors">
                    <Play className="w-10 h-10 text-repwell-teal-500 ml-1" />
                  </div>
                </motion.button>
              )}
            </AnimatePresence>

            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Progress Bar */}
              <div
                className="w-full h-1 bg-white/30 rounded-full mb-3 cursor-pointer"
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
                  className="h-full bg-repwell-teal-400 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="text-white hover:text-repwell-teal-300 transition-colors"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </button>
                  <button
                    onClick={toggleMute}
                    className="text-white hover:text-repwell-teal-300 transition-colors"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <span className="text-white text-sm font-mono">
                    {formatDuration(Math.floor(currentTime))} / {formatDuration(video.durationSeconds)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowShareDialog(true)}
                    className="text-white hover:text-repwell-teal-300 transition-colors"
                    aria-label="Share video"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={enterFullscreen}
                    className="text-white hover:text-repwell-teal-300 transition-colors"
                    aria-label="Enter fullscreen"
                  >
                    <Maximize className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Video Info */}
          <div className="p-6 sm:p-8">
            {/* Customer Info */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-repwell-sage-200 flex items-center justify-center flex-shrink-0">
                <User className="w-7 h-7 text-repwell-sage-700" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-2xl font-semibold text-gray-900 mb-1">
                  {video.customer.displayName}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  {video.customer.relationship && (
                    <Badge variant="secondary" className="bg-repwell-sage-100 text-repwell-sage-800">
                      {formatRelationship(video.customer.relationship)}
                    </Badge>
                  )}
                  {video.durationSeconds && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(video.durationSeconds)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* AI Generated Quote/Summary */}
            {video.aiGeneratedText && (
              <div className="relative bg-repwell-sage-50 rounded-xl p-6 mb-6">
                <Quote className="absolute top-4 left-4 w-8 h-8 text-repwell-sage-300" />
                <p className="text-gray-700 leading-relaxed pl-8 italic">
                  &ldquo;{video.aiGeneratedText}&rdquo;
                </p>
              </div>
            )}

            {/* Key Phrases */}
            {video.keyPhrases && video.keyPhrases.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {video.keyPhrases.slice(0, 5).map((phrase, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-repwell-teal-700 border-repwell-teal-200 bg-repwell-teal-50"
                  >
                    {phrase}
                  </Badge>
                ))}
              </div>
            )}

            {/* Loan Officer Info */}
            <div className="border-t border-gray-100 pt-6">
              <p className="text-sm text-gray-500 mb-3">Testimonial for</p>
              <div className="flex items-center gap-3">
                {video.loanOfficer.photoUrl ? (
                  <Image
                    src={video.loanOfficer.photoUrl}
                    alt={video.loanOfficer.fullName}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-repwell-teal-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-repwell-teal-600" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{video.loanOfficer.fullName}</p>
                  {video.loanOfficer.title && (
                    <p className="text-sm text-gray-500">{video.loanOfficer.title}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center text-sm text-gray-500"
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
                <Share2 className="w-4 h-4" />
                Social
              </TabsTrigger>
              <TabsTrigger value="link" className="gap-2">
                <Link className="w-4 h-4" />
                Link
              </TabsTrigger>
              <TabsTrigger value="embed" className="gap-2">
                <Code className="w-4 h-4" />
                Embed
              </TabsTrigger>
            </TabsList>

            {/* Social Sharing */}
            <TabsContent value="social" className="mt-4">
              <div className="grid grid-cols-3 gap-3">
                <SocialButton
                  href={socialLinks.facebook}
                  icon={<Facebook className="w-8 h-8 text-blue-600" />}
                  label="Facebook"
                  hoverClass="hover:bg-blue-50 hover:border-blue-200"
                  onClick={() => handleSocialShare("facebook")}
                />
                <SocialButton
                  href={socialLinks.linkedin}
                  icon={<Linkedin className="w-8 h-8 text-blue-700" />}
                  label="LinkedIn"
                  hoverClass="hover:bg-blue-50 hover:border-blue-200"
                  onClick={() => handleSocialShare("linkedin")}
                />
                <SocialButton
                  href={socialLinks.twitter}
                  icon={<Twitter className="w-8 h-8 text-gray-900" />}
                  label="X"
                  hoverClass="hover:bg-gray-50 hover:border-gray-300"
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
        "flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 transition-colors",
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
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg font-mono resize-none"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCopy(value, field)}
              className={cn(
                "absolute top-2 right-2 gap-2",
                isCopied && "text-green-600 border-green-200"
              )}
            >
              {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {isCopied ? "Copied" : "Copy"}
            </Button>
          </>
        ) : (
          <>
            <input
              type="text"
              value={value}
              readOnly
              className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg font-mono"
            />
            <Button variant="outline" size="sm" onClick={() => onCopy(value, field)} className="gap-2">
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
          </>
        )}
      </div>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}
