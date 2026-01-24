"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { MDXRemoteSerializeResult } from "next-mdx-remote";
import { motion } from "framer-motion";
import { format } from "date-fns";

// Dynamic import MDXRenderer to avoid SSR issues during static generation
const MDXRenderer = dynamic(
  () => import("./mdx-renderer").then((mod) => mod.MDXRenderer),
  { ssr: false, loading: () => <div className="animate-pulse h-96 bg-repwell-sage-100/30 rounded-xl" /> }
);
import {
  ArrowLeft,
  Calendar,
  Clock,
  CaretRight as ChevronRight,
  TwitterLogo as Twitter,
  FacebookLogo as Facebook,
  LinkedinLogo as Linkedin,
  Link as Link2,
  Check,
  ArrowRight,
  Envelope as Mail,
  SpinnerGap as Loader2,
} from "@phosphor-icons/react";
import { BlogPost, BlogPostMeta } from "@/types/blog";
import {
  BlogTableOfContents,
  AuthorBioCard,
  FeaturedPostCard,
} from "@/components/blog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  fadeInUp,
  staggerContainer,
  staggerChildrenDelayed,
  viewportOnce,
} from "@/lib/motion";
import { cn } from "@/lib/utils";

interface BlogPostClientProps {
  post: BlogPost;
  mdxSource: MDXRemoteSerializeResult;
  relatedPosts: BlogPostMeta[];
  postUrl: string;
}

// Extract headings from markdown content
function extractHeadings(content: string) {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: { id: string; text: string; level: number }[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    // Generate ID from text (same as rehype-slug does)
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    headings.push({ id, text, level });
  }

  return headings;
}

// Floating Social Share
function FloatingSocialShare({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = React.useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy to clipboard");
    }
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="hidden xl:flex fixed left-8 top-1/2 -translate-y-1/2 z-40 flex-col gap-3"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={shareLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-repwell-sage-100 text-repwell-teal-400 hover:text-repwell-teal-300 hover:border-repwell-teal-300 transition-colors shadow-sm"
            >
              <Twitter className="h-4 w-4" />
            </a>
          </TooltipTrigger>
          <TooltipContent side="right">Share on Twitter</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={shareLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-repwell-sage-100 text-repwell-teal-400 hover:text-repwell-teal-300 hover:border-repwell-teal-300 transition-colors shadow-sm"
            >
              <Facebook className="h-4 w-4" />
            </a>
          </TooltipTrigger>
          <TooltipContent side="right">Share on Facebook</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={shareLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-repwell-sage-100 text-repwell-teal-400 hover:text-repwell-teal-300 hover:border-repwell-teal-300 transition-colors shadow-sm"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          </TooltipTrigger>
          <TooltipContent side="right">Share on LinkedIn</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={copyToClipboard}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-repwell-sage-100 text-repwell-teal-400 hover:text-repwell-teal-300 hover:border-repwell-teal-300 transition-colors shadow-sm"
            >
              {copied ? (
                <Check className="h-4 w-4 text-repwell-teal-300" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {copied ? "Copied!" : "Copy link"}
          </TooltipContent>
        </Tooltip>
      </motion.div>
    </TooltipProvider>
  );
}

// Inline Social Share for mobile
function InlineSocialShare({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = React.useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-repwell-teal-400 mr-2">Share:</span>
      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-9 h-9 rounded-lg bg-repwell-sage-100/50 text-repwell-teal-400 hover:bg-repwell-teal-300 hover:text-white transition-colors"
      >
        <Twitter className="h-4 w-4" />
      </a>
      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-9 h-9 rounded-lg bg-repwell-sage-100/50 text-repwell-teal-400 hover:bg-repwell-teal-300 hover:text-white transition-colors"
      >
        <Facebook className="h-4 w-4" />
      </a>
      <a
        href={shareLinks.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-9 h-9 rounded-lg bg-repwell-sage-100/50 text-repwell-teal-400 hover:bg-repwell-teal-300 hover:text-white transition-colors"
      >
        <Linkedin className="h-4 w-4" />
      </a>
      <button
        onClick={copyToClipboard}
        className="flex items-center justify-center w-9 h-9 rounded-lg bg-repwell-sage-100/50 text-repwell-teal-400 hover:bg-repwell-teal-300 hover:text-white transition-colors"
      >
        {copied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Link2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

// Newsletter CTA
function NewsletterCTA() {
  const [email, setEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setEmail("");
    }, 1000);
  };

  return (
    <section className="py-16 md:py-24 bg-repwell-teal-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="text-center max-w-2xl mx-auto"
        >
          <motion.div variants={fadeInUp} className="mb-4">
            <Mail className="h-12 w-12 text-repwell-sage-100 mx-auto" />
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            className="font-display text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Want More Insights?
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="text-lg text-repwell-sage-100 mb-8"
          >
            Subscribe to our newsletter for the latest tips and best practices.
          </motion.p>

          <motion.div variants={fadeInUp}>
            {isSubmitted ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <p className="text-white font-medium">
                  Thanks for subscribing! Check your inbox for confirmation.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              >
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white focus:ring-white"
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-white text-repwell-teal-500 hover:bg-repwell-sage-100 whitespace-nowrap"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subscribing...
                    </>
                  ) : (
                    <>
                      Subscribe
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// Related Posts Premium
function RelatedPostsPremium({ posts }: { posts: BlogPostMeta[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-repwell-sage-100/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.div
            variants={fadeInUp}
            className="flex items-center justify-between mb-8"
          >
            <h2 className="font-display text-2xl md:text-3xl font-bold text-repwell-teal-500">
              Related Articles
            </h2>
            <Link href="/blog">
              <Button
                variant="outline"
                className="border-repwell-sage-200 text-repwell-teal-400"
              >
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <motion.div
                key={post.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <FeaturedPostCard post={post} variant="small" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function BlogPostClient({
  post,
  mdxSource,
  relatedPosts,
  postUrl,
}: BlogPostClientProps) {
  return (
    <>
      {/* Floating Social Share */}
      <FloatingSocialShare url={postUrl} title={post.title} />

      <article>
        {/* Header Section */}
        <header className="py-12 md:py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerChildrenDelayed}
              className="max-w-4xl mx-auto"
            >
              {/* Breadcrumbs */}
              <motion.nav
                variants={fadeInUp}
                className="flex items-center gap-2 text-sm text-repwell-teal-400 mb-6"
              >
                <Link
                  href="/blog"
                  className="hover:text-repwell-teal-300 transition-colors"
                >
                  Blog
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-repwell-teal-500">{post.category}</span>
              </motion.nav>

              {/* Category Badge */}
              <motion.div variants={fadeInUp}>
                <Badge
                  variant="secondary"
                  className="bg-repwell-teal-300/10 text-repwell-teal-300 border-repwell-teal-300/30 mb-4"
                >
                  {post.category}
                </Badge>
              </motion.div>

              {/* Title */}
              <motion.h1
                variants={fadeInUp}
                className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500 tracking-tight mb-6"
              >
                {post.title}
              </motion.h1>

              {/* Description */}
              <motion.p
                variants={fadeInUp}
                className="text-xl text-repwell-teal-400 leading-relaxed mb-8"
              >
                {post.description}
              </motion.p>

              {/* Author & Meta */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-wrap items-center gap-6 mb-8"
              >
                {/* Author */}
                <div className="flex items-center gap-3">
                  {post.author.avatar ? (
                    <Image
                      src={post.author.avatar}
                      alt={post.author.name}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-repwell-teal-300 flex items-center justify-center text-lg font-bold text-white">
                      {post.author.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-repwell-teal-500">
                      {post.author.name}
                    </p>
                    {post.author.role && (
                      <p className="text-sm text-repwell-teal-400">
                        {post.author.role}
                      </p>
                    )}
                  </div>
                </div>

                <div className="hidden sm:block w-px h-8 bg-repwell-sage-200" />

                {/* Date & Reading Time */}
                <div className="flex items-center gap-4 text-sm text-repwell-teal-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(post.date), "MMMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {post.readingTime} min read
                  </span>
                </div>
              </motion.div>

              {/* Tags */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-wrap gap-2 mb-8"
              >
                {post.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="border-repwell-sage-200 text-repwell-teal-400"
                  >
                    {tag}
                  </Badge>
                ))}
              </motion.div>

              {/* Mobile Social Share */}
              <motion.div variants={fadeInUp} className="xl:hidden">
                <InlineSocialShare url={postUrl} title={post.title} />
              </motion.div>
            </motion.div>
          </div>
        </header>

        {/* Featured Image */}
        {post.image && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative aspect-[21/9] rounded-2xl overflow-hidden shadow-lg"
            >
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1280px) 100vw, 1280px"
              />
            </motion.div>
          </div>
        )}

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid gap-12 lg:grid-cols-12">
            {/* Main Content */}
            <div className="lg:col-span-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="prose prose-lg max-w-none
                  prose-headings:font-display prose-headings:text-repwell-teal-500 prose-headings:scroll-mt-28
                  prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-4
                  prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3
                  prose-p:text-repwell-teal-400 prose-p:leading-relaxed
                  prose-a:text-repwell-teal-300 prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-repwell-teal-500
                  prose-ul:text-repwell-teal-400 prose-ol:text-repwell-teal-400
                  prose-li:marker:text-repwell-teal-300
                  prose-blockquote:border-l-repwell-teal-300 prose-blockquote:text-repwell-teal-400 prose-blockquote:bg-repwell-sage-100/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
                  prose-code:text-repwell-teal-500 prose-code:bg-repwell-sage-100/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                  prose-pre:bg-repwell-teal-500 prose-pre:text-white
                  prose-img:rounded-xl prose-img:shadow-md
                "
              >
                <MDXRenderer source={mdxSource} />
              </motion.div>

              {/* Author Bio */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-16"
              >
                <AuthorBioCard author={post.author} />
              </motion.div>
            </div>

            {/* Sidebar - Table of Contents */}
            <aside className="hidden lg:block lg:col-span-4">
              <div className="sticky top-28">
                <BlogTableOfContents headings={extractHeadings(post.content)} />

                {/* Back to Blog */}
                <div className="mt-8 p-6 bg-repwell-sage-100/30 rounded-2xl border border-repwell-sage-100">
                  <p className="text-sm text-repwell-teal-400 mb-4">
                    Enjoyed this article?
                  </p>
                  <Link href="/blog">
                    <Button
                      variant="outline"
                      className="w-full border-repwell-sage-200 text-repwell-teal-400"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Blog
                    </Button>
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      <RelatedPostsPremium posts={relatedPosts} />

      {/* Newsletter CTA */}
      <NewsletterCTA />
    </>
  );
}
