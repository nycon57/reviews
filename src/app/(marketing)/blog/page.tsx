import { Suspense } from "react";
import { Metadata } from "next";
import { Rss } from "lucide-react";
import Link from "next/link";
import { getAllPosts, getFeaturedPosts } from "@/lib/blog";
import { BlogCategory } from "@/types/blog";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/marketing/hero-section";
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
    <>
      <HeroSection
        title="RepWell Blog"
        description="Insights on customer experience, review management, and AI-powered analytics for mortgage professionals."
        cta={[]}
        compact
      />

      <div className="container mx-auto px-4 py-12">
        {/* RSS Feed Link */}
        <div className="flex justify-end mb-6">
          <Link href="/blog/rss.xml" target="_blank">
            <Button variant="outline" size="sm" className="gap-2">
              <Rss className="h-4 w-4" />
              RSS Feed
            </Button>
          </Link>
        </div>

        <Suspense fallback={<BlogArchiveSkeleton />}>
          <BlogArchiveClient
            posts={filteredPosts}
            featuredPosts={featuredPosts}
            currentCategory={params.category || null}
          />
        </Suspense>
      </div>
    </>
  );
}

function BlogArchiveSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-9 w-24 animate-pulse rounded-md bg-muted"
          />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}
