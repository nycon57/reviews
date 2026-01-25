"use client";

import { useState } from "react";
import Image from "next/image";
import { Play, VideoCamera } from "@phosphor-icons/react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface VideoTestimonialSlotProps {
  videoUrl: string;
  thumbnailUrl?: string | null;
  className?: string;
}

function getVideoEmbedUrl(url: string): string | null {
  // Handle YouTube URLs
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1&rel=0`;
  }

  // Handle Vimeo URLs
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }

  // Handle Loom URLs
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) {
    return `https://www.loom.com/embed/${loomMatch[1]}?autoplay=1`;
  }

  // Return null for direct video files (will use video tag instead)
  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return null;
  }

  return null;
}

function getYouTubeThumbnail(url: string): string | null {
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
  }
  return null;
}

export function VideoTestimonialSlot({
  videoUrl,
  thumbnailUrl,
  className,
}: VideoTestimonialSlotProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const embedUrl = getVideoEmbedUrl(videoUrl);
  const isDirectVideo = videoUrl.match(/\.(mp4|webm|ogg)$/i);

  // Try to get YouTube thumbnail if no custom thumbnail provided
  const displayThumbnail = thumbnailUrl || getYouTubeThumbnail(videoUrl);

  return (
    <section className={cn("py-8 md:py-12 bg-white", className)}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-repwell-teal-400 mb-2">
            <VideoCamera className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wide">
              Video Testimonial
            </span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-repwell-teal-500">
            Hear From Our Clients
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative aspect-video rounded-xl overflow-hidden shadow-lg bg-repwell-teal-500"
        >
          {isPlaying ? (
            <>
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title="Video testimonial"
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : isDirectVideo ? (
                <video
                  src={videoUrl}
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  controls
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-repwell-teal-500 text-white p-6">
                  <VideoCamera className="h-12 w-12 mb-4 opacity-60" />
                  <p className="text-center text-sm mb-2">
                    Unable to play this video format
                  </p>
                  <p className="text-center text-xs opacity-75 mb-4 break-all max-w-xs">
                    {videoUrl}
                  </p>
                  <button
                    onClick={() => setIsPlaying(false)}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-md text-sm transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 w-full h-full group"
              aria-label="Play video"
            >
              {/* Thumbnail */}
              {displayThumbnail ? (
                <Image
                  src={displayThumbnail}
                  alt="Video thumbnail"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-repwell-teal-400 to-repwell-teal-500" />
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-white/90 shadow-lg flex items-center justify-center group-hover:bg-white transition-colors"
                >
                  <Play
                    weight="fill"
                    className="h-10 w-10 md:h-12 md:w-12 text-repwell-teal-400 ml-1"
                  />
                </motion.div>
              </div>

              {/* Play text */}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="text-white/90 text-sm font-medium">
                  Click to play
                </span>
              </div>
            </button>
          )}
        </motion.div>
      </div>
    </section>
  );
}
