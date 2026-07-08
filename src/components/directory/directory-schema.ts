import type { DirectoryProfessional } from "@/lib/directory/actions";
import { getIndustryLabel, getIndustrySlug } from "@/lib/directory/breadcrumb-utils";
import { getIndustryConfig } from "@/lib/industry/configs";
import type { IndustryType } from "@/lib/industry/types";

interface GenerateDirectorySchemasOptions {
  professionals: DirectoryProfessional[];
  baseUrl: string;
  industry?: IndustryType;
}

export function generateDirectorySchemas({
  professionals,
  baseUrl,
  industry,
}: GenerateDirectorySchemasOptions): object[] {
  const config = industry ? getIndustryConfig(industry) : null;
  const label = industry ? getIndustryLabel(industry) : null;
  const slug = industry ? getIndustrySlug(industry) : null;

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: industry ? `${label} Professional Directory` : "Professional Directory",
    description: industry
      ? `Find trusted ${config!.labels.professionalPlural.toLowerCase()} in our directory. Search by location and rating.`
      : "Search our directory of trusted professionals. Find experts by location, rating, and specialty.",
    numberOfItems: professionals.length,
    itemListElement: professionals.slice(0, 10).map((professional, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Person",
        "@id": `${baseUrl}/pro/${professional.slug}`,
        name: professional.full_name,
        jobTitle: professional.title || (industry ? config!.labels.professional : "Professional"),
        url: `${baseUrl}/pro/${professional.slug}`,
        ...(professional.photo_url && { image: professional.photo_url }),
        ...(professional.email && { email: professional.email }),
        ...(professional.phone && { telephone: professional.phone }),
        ...(professional.organization && {
          worksFor: {
            "@type": "Organization",
            name: professional.organization.name,
          },
        }),
        ...(professional.average_rating &&
          professional.total_reviews && {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: Number(professional.average_rating).toFixed(1),
              reviewCount: professional.total_reviews,
              bestRating: 5,
              worstRating: 1,
            },
          }),
      },
    })),
  };

  if (!industry || !label || !slug || !config) {
    const webPageSchema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${baseUrl}/directory`,
      name: "Find a Professional | RepWell Professional Directory",
      description:
        "Search our directory of trusted professionals. Find experts by location, rating, and specialty.",
      url: `${baseUrl}/directory`,
      isPartOf: {
        "@type": "WebSite",
        "@id": baseUrl,
        name: "RepWell",
        url: baseUrl,
      },
      mainEntity: itemListSchema,
    };

    return [webPageSchema, itemListSchema];
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Find a Professional",
        item: `${baseUrl}/directory`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: label,
        item: `${baseUrl}/directory/${slug}`,
      },
    ],
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${baseUrl}/directory/${slug}`,
    name: `Find ${config.labels.professionalPlural} | ${label} Professionals Directory`,
    description: `Search our directory of trusted ${config.labels.professionalPlural.toLowerCase()}.`,
    url: `${baseUrl}/directory/${slug}`,
    breadcrumb: breadcrumbSchema,
    isPartOf: {
      "@type": "WebSite",
      "@id": baseUrl,
      name: "RepWell",
      url: baseUrl,
    },
    mainEntity: itemListSchema,
  };

  return [webPageSchema, itemListSchema, breadcrumbSchema];
}
