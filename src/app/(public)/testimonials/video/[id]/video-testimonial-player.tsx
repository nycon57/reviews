"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Share2,
  Code,
  Link,
  Facebook,
  Linkedin,
  Twitter,
  Copy,
  Check,
  Quote,
  User,
  Building2,
  Clock,
} from "lucide-react";
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
import type { PublicVideoTestimonial } from "@/lib/video-testimonials/public-actions";
import { trackVideoShare, type SharePlatform } from "@/lib/video-testimonials/public-actions";

interface VideoTestimonialPlayerProps {
  video: PublicVideoTestimonial;
  pageUrl: string;
  embedUrl: string;
}

// Format duration from seconds to MM:SS
function formatDuration(seconds: number | null): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Format relationship type for display
function formatRelationship(relationship: string | null): string {
  if (!relationship) return "";
  const labels: Record<string, string> = {
    home_buyer: "Home Buyer",
    refinancer: "Refinancer",
    first_time_buyer: "First-Time Home Buyer",
    investor: "Investor",
    business_owner: "Business Owner",
    other: "Client",
  };
  return labels[relationship] || relationship;
}

// Escape HTML entities to prevent XSS in embed code
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function VideoTestimonialPlayer({
  video,
  pageUrl,
  embedUrl,
}: VideoTestimonialPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error("Video play failed:", error);
            setIsPlaying(false);
          });
      }
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && video.durationSeconds) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = percent * video.durationSeconds;
    }
  };

  const handleSliderKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!videoRef.current || !video.durationSeconds) return;

    const seekAmount = 5; // seconds
    let newTime = videoRef.current.currentTime;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        newTime = Math.min(newTime + seekAmount, video.durationSeconds);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        newTime = Math.max(newTime - seekAmount, 0);
        break;
      case "Home":
        newTime = 0;
        break;
      case "End":
        newTime = video.durationSeconds;
        break;
      default:
        return;
    }

    e.preventDefault();
    videoRef.current.currentTime = newTime;
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);

      // Track share event
      const platform: SharePlatform = field === "embed" ? "embed" : "link";
      trackVideoShare(video.id, platform).catch(console.error);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleSocialShare = (platform: SharePlatform) => {
    // Track share event (non-blocking)
    trackVideoShare(video.id, platform).catch(console.error);
  };

  // Generate embed code with XSS-safe title attribute
  const embedCode = `<iframe
  src="${embedUrl}"
  width="560"
  height="315"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
  title="Video Testimonial from ${escapeHtml(video.customer.displayName)}"
></iframe>`;

  // Social share URLs
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(
    `Watch ${video.customer.displayName}'s testimonial about their experience with ${video.loanOfficer.fullName}`
  );
  const socialLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
  };

  const progress =
    video.durationSeconds && video.durationSeconds > 0
      ? (currentTime / video.durationSeconds) * 100
      : 0;

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
                  onClick={handlePlayPause}
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
                    onClick={handlePlayPause}
                    className="text-white hover:text-repwell-teal-300 transition-colors"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6" />
                    )}
                  </button>
                  <button
                    onClick={handleMuteToggle}
                    className="text-white hover:text-repwell-teal-300 transition-colors"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                  <span className="text-white text-sm font-mono">
                    {formatDuration(Math.floor(currentTime))} /{" "}
                    {formatDuration(video.durationSeconds)}
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
                    onClick={handleFullscreen}
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
                  <p className="font-medium text-gray-900">
                    {video.loanOfficer.fullName}
                  </p>
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
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleSocialShare("facebook")}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                >
                  <Facebook className="w-8 h-8 text-blue-600" />
                  <span className="text-sm font-medium">Facebook</span>
                </a>
                <a
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleSocialShare("linkedin")}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                >
                  <Linkedin className="w-8 h-8 text-blue-700" />
                  <span className="text-sm font-medium">LinkedIn</span>
                </a>
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleSocialShare("twitter")}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  <Twitter className="w-8 h-8 text-gray-900" />
                  <span className="text-sm font-medium">X</span>
                </a>
              </div>
            </TabsContent>

            {/* Direct Link */}
            <TabsContent value="link" className="mt-4">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pageUrl}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(pageUrl, "link")}
                    className="gap-2"
                  >
                    {copiedField === "link" ? (
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
                </div>
                <p className="text-sm text-gray-500">
                  Share this link to let others watch this video testimonial.
                </p>
              </div>
            </TabsContent>

            {/* Embed Code */}
            <TabsContent value="embed" className="mt-4">
              <div className="space-y-3">
                <div className="relative">
                  <textarea
                    value={embedCode}
                    readOnly
                    rows={6}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg font-mono resize-none"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(embedCode, "embed")}
                    className={cn(
                      "absolute top-2 right-2 gap-2",
                      copiedField === "embed" && "text-green-600 border-green-200"
                    )}
                  >
                    {copiedField === "embed" ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Paste this code into your website to embed the video testimonial.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
