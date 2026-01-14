import { redirect, notFound } from "next/navigation";
import { getSection, docSections } from "@/lib/docs/content";

interface PageProps {
  params: Promise<{
    section: string;
  }>;
}

export async function generateStaticParams() {
  return docSections.map((section) => ({
    section: section.slug,
  }));
}

export default async function DocSectionPage({ params }: PageProps) {
  const resolvedParams = await params;
  const section = getSection(resolvedParams.section);

  if (!section) {
    notFound();
  }

  // Redirect to first article in section
  const firstArticle = section.articles[0];
  if (firstArticle) {
    redirect(`/docs/${section.slug}/${firstArticle.slug}`);
  }

  notFound();
}
