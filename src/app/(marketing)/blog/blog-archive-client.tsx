"use client";

import { motion } from "framer-motion";
import { BlogPostMeta, BlogCategory } from "@/types/blog";
import { BlogCard, CategoryFilter } from "@/components/blog";
import { staggerContainer, fadeInUp } from "@/lib/motion";

interface BlogArchiveClientProps {
  posts: BlogPostMeta[];
  featuredPosts: BlogPostMeta[];
  currentCategory: BlogCategory | null;
}

export function BlogArchiveClient({
  posts,
  featuredPosts,
  currentCategory,
}: BlogArchiveClientProps) {
  // Only show featured section when viewing all posts
  const showFeatured = !currentCategory && featuredPosts.length > 0;

  return (
    <div className="space-y-12">
      {/* Category Filter */}
      <CategoryFilter />

      {/* Featured Posts */}
      {showFeatured && (
        <motion.section
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.h2
            variants={fadeInUp}
            className="text-2xl font-bold mb-6"
          >
            Featured Articles
          </motion.h2>
          <div className="grid gap-6 md:grid-cols-2">
            {featuredPosts.slice(0, 2).map((post) => (
              <BlogCard key={post.slug} post={post} featured />
            ))}
          </div>
        </motion.section>
      )}

      {/* All Posts */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.h2 variants={fadeInUp} className="text-2xl font-bold mb-6">
          {currentCategory ? currentCategory : "All Articles"}
        </motion.h2>
        {posts.length === 0 ? (
          <motion.p
            variants={fadeInUp}
            className="text-muted-foreground text-center py-12"
          >
            No posts found in this category.
          </motion.p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </motion.section>
    </div>
  );
}
