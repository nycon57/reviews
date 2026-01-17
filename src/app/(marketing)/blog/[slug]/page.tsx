import { Metadata } from "next";
import { notFound } from "next/navigation";
import { serialize } from "next-mdx-remote/serialize";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { getPostBySlug, getRelatedPosts, getAllPostSlugs } from "@/lib/blog";
import { JsonLd } from "@/components/blog/json-ld";
import { BlogPostClient } from "./blog-post-client";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found | RepWell Blog",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://repwell.com";
  const postUrl = `${siteUrl}/blog/${slug}`;

  return {
    title: `${post.title} | RepWell Blog`,
    description: post.description,
    authors: [{ name: post.author.name }],
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: postUrl,
      publishedTime: post.date,
      authors: [post.author.name],
      tags: post.tags,
      images: post.image
        ? [
            {
              url: post.image,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.image ? [post.image] : undefined,
    },
    alternates: {
      canonical: postUrl,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(slug, post.category, post.tags, 3);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://repwell.com";
  const postUrl = `${siteUrl}/blog/${slug}`;

  // Serialize MDX content on the server
  const mdxSource = await serialize(post.content, {
    mdxOptions: {
      rehypePlugins: [rehypeHighlight, rehypeSlug],
    },
  });

  // JSON-LD structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Person",
      name: post.author.name,
      jobTitle: post.author.role,
    },
    publisher: {
      "@type": "Organization",
      name: "RepWell",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    keywords: post.tags.join(", "),
    articleSection: post.category,
    wordCount: post.content.split(/\s+/).length,
    image: post.image || undefined,
  };

  return (
    <>
      <JsonLd data={structuredData} />
      <BlogPostClient
        post={post}
        mdxSource={mdxSource}
        relatedPosts={relatedPosts}
        postUrl={postUrl}
      />
    </>
  );
}
