import { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsContent } from "@/components/docs/docs-content";
import { getArticle, docSections } from "@/lib/docs/content";

interface PageProps {
  params: Promise<{
    section: string;
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const params: { section: string; slug: string }[] = [];

  for (const section of docSections) {
    for (const article of section.articles) {
      params.push({
        section: section.slug,
        slug: article.slug,
      });
    }
  }

  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const article = getArticle(resolvedParams.section, resolvedParams.slug);

  if (!article) {
    return {
      title: "Not Found",
    };
  }

  return {
    title: article.title,
    description: article.description,
    openGraph: {
      title: `${article.title} | RepWell Docs`,
      description: article.description,
      type: "article",
    },
  };
}

export default async function DocArticlePage({ params }: PageProps) {
  const resolvedParams = await params;
  const article = getArticle(resolvedParams.section, resolvedParams.slug);

  if (!article) {
    notFound();
  }

  return <DocsContent article={article} />;
}
