"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Clock, Tag, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type DocArticle, docSections, getSection } from "@/lib/docs/content";

interface DocsContentProps {
  article: DocArticle & { section: string; sectionTitle: string };
}

// Simple markdown-like rendering
function renderContent(content: string): React.ReactNode {
  const lines = content.trim().split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = "";

  lines.forEach((line, index) => {
    // Code block handling
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${index}`}
            className="my-4 overflow-x-auto rounded-lg bg-brand-navy p-4 text-body-sm"
          >
            <code className="text-brand-snow font-mono">
              {codeBlockContent.join("\n")}
            </code>
          </pre>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeBlockLang = line.slice(3);
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // Heading handling
    if (line.startsWith("# ")) {
      elements.push(
        <h1
          key={`h1-${index}`}
          className="text-display-sm text-brand-navy mb-4 mt-8 first:mt-0"
        >
          {line.slice(2)}
        </h1>
      );
      return;
    }

    if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={`h2-${index}`}
          className="text-heading-lg text-brand-navy mb-3 mt-8 border-b border-brand-silver/30 pb-2"
        >
          {line.slice(3)}
        </h2>
      );
      return;
    }

    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${index}`} className="text-heading-md text-brand-navy mb-2 mt-6">
          {line.slice(4)}
        </h3>
      );
      return;
    }

    // List handling
    if (line.startsWith("- ")) {
      const content = line.slice(2);
      elements.push(
        <li key={`li-${index}`} className="text-body-md text-brand-slate ml-4 my-1">
          {renderInlineContent(content)}
        </li>
      );
      return;
    }

    // Numbered list
    const numberedMatch = line.match(/^(\d+)\.\s(.+)/);
    if (numberedMatch) {
      elements.push(
        <li key={`oli-${index}`} className="text-body-md text-brand-slate ml-4 my-1 list-decimal">
          {renderInlineContent(numberedMatch[2])}
        </li>
      );
      return;
    }

    // Empty line = paragraph break
    if (line.trim() === "") {
      elements.push(<div key={`br-${index}`} className="h-4" />);
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${index}`} className="text-body-md text-brand-slate my-2">
        {renderInlineContent(line)}
      </p>
    );
  });

  return elements;
}

// Handle inline formatting
function renderInlineContent(text: string): React.ReactNode {
  // Split by inline code, bold, and links
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Inline code
    const codeMatch = remaining.match(/`([^`]+)`/);
    // Bold
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    // Links
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);

    // Find earliest match
    const matches = [
      { match: codeMatch, type: "code", index: codeMatch?.index ?? Infinity },
      { match: boldMatch, type: "bold", index: boldMatch?.index ?? Infinity },
      { match: linkMatch, type: "link", index: linkMatch?.index ?? Infinity },
    ].sort((a, b) => a.index - b.index);

    const earliest = matches[0];

    if (earliest.match && earliest.index !== Infinity) {
      // Add text before match
      if (earliest.index > 0) {
        parts.push(remaining.slice(0, earliest.index));
      }

      // Add formatted content
      if (earliest.type === "code" && earliest.match) {
        parts.push(
          <code
            key={`inline-code-${key++}`}
            className="rounded bg-brand-frost px-1.5 py-0.5 text-body-sm font-mono text-brand-navy"
          >
            {earliest.match[1]}
          </code>
        );
        remaining = remaining.slice(earliest.index + earliest.match[0].length);
      } else if (earliest.type === "bold" && earliest.match) {
        parts.push(
          <strong key={`bold-${key++}`} className="font-semibold text-brand-navy">
            {earliest.match[1]}
          </strong>
        );
        remaining = remaining.slice(earliest.index + earliest.match[0].length);
      } else if (earliest.type === "link" && linkMatch) {
        parts.push(
          <Link
            key={`link-${key++}`}
            href={linkMatch[2]}
            className="text-brand-blue hover:underline font-medium"
          >
            {linkMatch[1]}
          </Link>
        );
        remaining = remaining.slice(earliest.index + linkMatch[0].length);
      }
    } else {
      // No more matches, add remaining text
      parts.push(remaining);
      remaining = "";
    }
  }

  return parts;
}

// Calculate reading time
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// Get navigation (prev/next articles)
function getNavigation(sectionSlug: string, articleSlug: string) {
  const section = getSection(sectionSlug);
  if (!section) return { prev: null, next: null };

  const articleIndex = section.articles.findIndex((a) => a.slug === articleSlug);

  let prev = null;
  let next = null;

  // Previous article
  if (articleIndex > 0) {
    const prevArticle = section.articles[articleIndex - 1];
    prev = {
      title: prevArticle.title,
      href: `/docs/${sectionSlug}/${prevArticle.slug}`,
    };
  } else {
    // Try previous section
    const sectionIndex = docSections.findIndex((s) => s.slug === sectionSlug);
    if (sectionIndex > 0) {
      const prevSection = docSections[sectionIndex - 1];
      const lastArticle = prevSection.articles[prevSection.articles.length - 1];
      prev = {
        title: lastArticle.title,
        href: `/docs/${prevSection.slug}/${lastArticle.slug}`,
      };
    }
  }

  // Next article
  if (articleIndex < section.articles.length - 1) {
    const nextArticle = section.articles[articleIndex + 1];
    next = {
      title: nextArticle.title,
      href: `/docs/${sectionSlug}/${nextArticle.slug}`,
    };
  } else {
    // Try next section
    const sectionIndex = docSections.findIndex((s) => s.slug === sectionSlug);
    if (sectionIndex < docSections.length - 1) {
      const nextSection = docSections[sectionIndex + 1];
      const firstArticle = nextSection.articles[0];
      next = {
        title: firstArticle.title,
        href: `/docs/${nextSection.slug}/${firstArticle.slug}`,
      };
    }
  }

  return { prev, next };
}

export function DocsContent({ article }: DocsContentProps) {
  const readingTime = calculateReadingTime(article.content);
  const { prev, next } = getNavigation(article.section, article.slug);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="max-w-none"
    >
      {/* Breadcrumb */}
      <motion.nav variants={fadeInUp} className="mb-6 flex items-center gap-2 text-body-sm">
        <Link href="/docs" className="text-brand-slate hover:text-brand-blue transition-colors">
          Docs
        </Link>
        <ChevronRight className="h-4 w-4 text-brand-silver" />
        <Link
          href={`/docs/${article.section}`}
          className="text-brand-slate hover:text-brand-blue transition-colors"
        >
          {article.sectionTitle}
        </Link>
        <ChevronRight className="h-4 w-4 text-brand-silver" />
        <span className="text-brand-navy font-medium">{article.title}</span>
      </motion.nav>

      {/* Article Header */}
      <motion.header variants={fadeInUp} className="mb-8">
        <h1 className="text-display-sm text-brand-navy mb-3">{article.title}</h1>
        <p className="text-body-lg text-brand-slate mb-4">{article.description}</p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-body-sm text-brand-slate">
            <Clock className="h-4 w-4" />
            <span>{readingTime} min read</span>
          </div>
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-brand-slate" />
            <div className="flex flex-wrap gap-1.5">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-caption">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Article Content */}
      <motion.article
        variants={fadeInUp}
        className={cn(
          "prose prose-slate max-w-none",
          "[&>h1]:text-display-sm [&>h1]:text-brand-navy",
          "[&>h2]:text-heading-lg [&>h2]:text-brand-navy [&>h2]:border-b [&>h2]:border-brand-silver/30 [&>h2]:pb-2",
          "[&>h3]:text-heading-md [&>h3]:text-brand-navy",
          "[&>p]:text-body-md [&>p]:text-brand-slate",
          "[&>ul]:list-disc [&>ol]:list-decimal"
        )}
      >
        {renderContent(article.content)}
      </motion.article>

      {/* Navigation */}
      <motion.nav
        variants={fadeInUp}
        className="mt-12 flex items-center justify-between border-t border-brand-silver/30 pt-8"
      >
        {prev ? (
          <Link href={prev.href}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous:</span>
              <span className="text-brand-slate">{prev.title}</span>
            </Button>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link href={next.href}>
            <Button variant="ghost" className="gap-2">
              <span className="hidden sm:inline">Next:</span>
              <span className="text-brand-slate">{next.title}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <div />
        )}
      </motion.nav>
    </motion.div>
  );
}
