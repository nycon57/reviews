import { Suspense } from "react";
import { Metadata } from "next";
import { getAllPosts, getFeaturedPosts } from "@/lib/blog";
import { BlogCategory } from "@/types/blog";
import { BlogArchiveClient } from "./blog-archive-client";

export const metadata: Metadata = {
  title: "Blog | RepWell",
  description:
    "Insights on customer experience, review management, and AI-powered analytics for mortgage professionals. Tips, best practices, and industry news.",
  openGraph: {
    title: "RepWell Blog",
    description:
      "Insights on customer experience, review management, and AI-powered analytics for mortgage professionals.",
    type: "website",
    url: "/blog",
  },
  twitter: {
    card: "summary_large_image",
    title: "RepWell Blog",
    description:
      "Insights on customer experience, review management, and AI-powered analytics for mortgage professionals.",
  },
  alternates: {
    types: {
      "application/rss+xml": "/blog/rss.xml",
    },
  },
};

interface BlogPageProps {
  searchParams: Promise<{
    category?: BlogCategory;
  }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const allPosts = getAllPosts();
  const featuredPosts = getFeaturedPosts();

  // Filter by category if provided
  const filteredPosts = params.category
    ? allPosts.filter((post) => post.category === params.category)
    : allPosts;

  return (
    <Suspense fallback={<BlogArchiveSkeleton />}>
      <BlogArchiveClient
        posts={filteredPosts}
        featuredPosts={featuredPosts}
        currentCategory={params.category || null}
      />
    </Suspense>
  );
}

function BlogArchiveSkeleton() {
  return (
    <div className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero skeleton */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="h-6 w-24 animate-pulse rounded-full bg-repwell-sage-100 mx-auto mb-4" />
          <div className="h-12 w-2/3 animate-pulse rounded-lg bg-repwell-sage-100 mx-auto mb-4" />
          <div className="h-6 w-full animate-pulse rounded-lg bg-repwell-sage-100 mx-auto" />
        </div>

        {/* Category filter skeleton */}
        <div className="flex gap-2 justify-center mb-12">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-24 animate-pulse rounded-full bg-repwell-sage-100"
            />
          ))}
        </div>

        {/* Posts grid skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-2xl bg-repwell-sage-100"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
