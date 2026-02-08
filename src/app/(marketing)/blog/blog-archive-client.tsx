"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Calendar,
  Clock,
  ArrowRight,
  Image as ImageIcon,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { BlogPostMeta, BlogCategory, BLOG_CATEGORIES } from "@/types/blog";
import {
  BlogHero,
  FeaturedPostCard,
} from "@/components/blog";
import {
  fadeInUp,
  staggerContainer,
  viewportOnce,
} from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BlogArchiveClientProps {
  posts: BlogPostMeta[];
  featuredPosts: BlogPostMeta[];
  currentCategory: BlogCategory | null;
}

// Premium Category Filter with animated indicator
function CategoryFilterPremium() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") as BlogCategory | null;

  const handleCategoryChange = (category: BlogCategory | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const allCategories: (BlogCategory | null)[] = [null, ...BLOG_CATEGORIES];

  return (
    <div className="flex flex-wrap justify-center gap-2">
      <LayoutGroup>
        {allCategories.map((category) => {
          const isActive = currentCategory === category;
          return (
            <button
              key={category || "all"}
              onClick={() => handleCategoryChange(category)}
              className={cn(
                "relative px-4 py-2 text-sm font-medium rounded-full transition-colors",
                isActive
                  ? "text-white"
                  : "text-repwell-teal-400 hover:text-repwell-teal-500"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeCategory"
                  className="absolute inset-0 bg-repwell-teal-300 rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">
                {category || "All Posts"}
              </span>
            </button>
          );
        })}
      </LayoutGroup>
    </div>
  );
}

// Premium Blog Card
function BlogCardPremium({ post, index }: { post: BlogPostMeta; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group bg-white rounded-2xl border border-repwell-sage-100 overflow-hidden shadow-sm hover:shadow-md transition-all"
    >
      <Link href={`/blog/${post.slug}`} className="block">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          {post.image ? (
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-repwell-sage-100 to-repwell-teal-100 flex items-center justify-center">
              <ImageIcon className="h-12 w-12 text-repwell-sage-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          <Badge
            variant="secondary"
            className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-repwell-teal-500"
          >
            {post.category}
          </Badge>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Meta */}
          <div className="flex items-center gap-3 text-sm text-repwell-teal-400 mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(post.date), "MMM d, yyyy")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {post.readingTime} min
            </span>
          </div>

          {/* Title */}
          <h3 className="font-display text-lg font-bold text-repwell-teal-500 mb-2 line-clamp-2 group-hover:text-repwell-teal-300 transition-colors">
            {post.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-repwell-teal-400 line-clamp-2 mb-4">
            {post.description}
          </p>

          {/* Author + Read more */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {post.author.avatar ? (
                <Image
                  src={post.author.avatar}
                  alt={post.author.name}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-repwell-sage-100 flex items-center justify-center text-xs font-medium text-repwell-teal-500">
                  {post.author.name.charAt(0)}
                </div>
              )}
              <span className="text-sm text-repwell-teal-400">
                {post.author.name}
              </span>
            </div>

            <span className="inline-flex items-center text-sm font-medium text-repwell-teal-300 group-hover:gap-2 transition-all">
              Read
              <ArrowRight className="h-4 w-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export function BlogArchiveClient({
  posts,
  featuredPosts,
  currentCategory,
}: BlogArchiveClientProps) {
  const [visiblePosts, setVisiblePosts] = React.useState(9);
  const showFeatured = !currentCategory && featuredPosts.length > 0;
  const hasMorePosts = posts.length > visiblePosts;

  const loadMore = () => {
    setVisiblePosts((prev) => prev + 6);
  };

  return (
    <>
      {/* Hero */}
      <BlogHero
        badge="Blog"
        title={
          currentCategory ? (
            <>
              {currentCategory}{" "}
              <span className="text-repwell-teal-300">Articles</span>
            </>
          ) : (
            <>
              Insights &{" "}
              <span className="text-repwell-teal-300">Best Practices</span>
            </>
          )
        }
        description="Insights on customer experience, review management, and AI-powered analytics for mortgage professionals."
      />

      {/* Category Filter */}
      <section className="py-8 bg-white border-b border-repwell-sage-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CategoryFilterPremium />
        </div>
      </section>

      {/* Featured Posts */}
      {showFeatured && (
        <section className="py-12 md:py-16 bg-repwell-sage-100/30">
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
                <h2 className="font-display text-2xl font-bold text-repwell-teal-500">
                  Featured Articles
                </h2>
                <Badge
                  variant="outline"
                  className="border-repwell-teal-300/50 text-repwell-teal-400"
                >
                  Editor's Picks
                </Badge>
              </motion.div>

              <div className="grid gap-6 lg:grid-cols-5">
                {/* Large featured post */}
                {featuredPosts[0] && (
                  <motion.div
                    variants={fadeInUp}
                    className="lg:col-span-3"
                  >
                    <FeaturedPostCard post={featuredPosts[0]} variant="large" />
                  </motion.div>
                )}

                {/* Smaller featured posts */}
                <div className="lg:col-span-2 grid gap-6">
                  {featuredPosts.slice(1, 3).map((post, index) => (
                    <motion.div
                      key={post.slug}
                      variants={fadeInUp}
                    >
                      <FeaturedPostCard post={post} variant="small" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* All Posts Grid */}
      <section className="py-12 md:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="font-display text-2xl font-bold text-repwell-teal-500 mb-8"
            >
              {currentCategory ? `${currentCategory} Articles` : "All Articles"}
            </motion.h2>

            {posts.length === 0 ? (
              <motion.div
                variants={fadeInUp}
                className="text-center py-16 bg-repwell-sage-100/30 rounded-2xl"
              >
                <p className="text-repwell-teal-400 mb-4">
                  No posts found in this category.
                </p>
                <Link href="/blog">
                  <Button
                    variant="outline"
                    className="border-repwell-sage-200 text-repwell-teal-400"
                  >
                    View All Posts
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {posts.slice(0, visiblePosts).map((post, index) => (
                      <BlogCardPremium
                        key={post.slug}
                        post={post}
                        index={index}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Load More Button */}
                {hasMorePosts && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center mt-12"
                  >
                    <Button
                      onClick={loadMore}
                      variant="outline"
                      size="lg"
                      className="border-repwell-sage-200 text-repwell-teal-400 hover:bg-repwell-sage-100/50"
                    >
                      Load More Articles
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </section>

    </>
  );
}
