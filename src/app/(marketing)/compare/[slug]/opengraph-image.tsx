import { notFound } from "next/navigation";
import { buildMarketingOpenGraphImage } from "@/lib/seo/og";
import { competitorConfigs } from "@/lib/competitor-pages";

export const alt = "RepWell competitor comparison";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};

interface CompareOpenGraphImageProps {
  params: Promise<{ slug: string }>;
}

export default async function OpenGraphImage({ params }: CompareOpenGraphImageProps) {
  const { slug } = await params;
  const config = competitorConfigs[slug];

  if (!config) {
    notFound();
  }

  return buildMarketingOpenGraphImage({
    eyebrow: "RepWell Compare",
    title: `RepWell vs ${config.competitorName}`,
    description: config.seo.description,
  });
}
