"use client";

import { motion } from "framer-motion";
import { BlogPostMeta } from "@/types/blog";
import { BlogCard } from "./blog-card";
import { staggerContainer, fadeInUp, viewportOnce } from "@/lib/motion";

interface RelatedPostsProps {
  posts: BlogPostMeta[];
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-16 pt-8 border-t">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
      >
        <motion.h2
          variants={fadeInUp}
          className="text-2xl font-bold mb-6"
        >
          Related Articles
        </motion.h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
