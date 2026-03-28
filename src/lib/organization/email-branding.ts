import { emailBrandingConfigSchema, type Address } from "@/lib/organization/types";

type EmailBrandingSource = {
  name?: string | null | undefined;
  logo_url?: string | null | undefined;
  primary_color?: string | null | undefined;
  company_email?: string | null | undefined;
  company_phone?: string | null | undefined;
  website_url?: string | null | undefined;
  twitter_url?: string | null | undefined;
  linkedin_url?: string | null | undefined;
  facebook_url?: string | null | undefined;
  instagram_url?: string | null | undefined;
  company_address?: Address | null | undefined;
};

function formatOrganizationAddress(address: Address | null | undefined): string {
  if (!address) return "";

  return [
    address.street,
    address.street2,
    [address.city, [address.state, address.postal_code].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(", "),
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
}

function buildContactInfo(source: EmailBrandingSource): string {
  return [source.company_email, source.company_phone, source.website_url]
    .filter((value): value is string => Boolean(value))
    .join(" | ");
}

export function deriveEmailBrandingConfig(source: EmailBrandingSource) {
  const companyName = source.name?.trim() || "";
  const logoSrc = source.logo_url?.trim() || "";
  const address = formatOrganizationAddress(source.company_address);
  const contactInfo = buildContactInfo(source);

  return emailBrandingConfigSchema.parse({
    enabled: true,
    header: {
      logoSrc,
      logoAlt: companyName || "Logo",
      socialLinks: {
        twitter: source.twitter_url || undefined,
        instagram: source.instagram_url || undefined,
        facebook: source.facebook_url || undefined,
        linkedin: source.linkedin_url || undefined,
      },
      linkColor: source.primary_color || "rgb(75,85,99)",
    },
    footer: {
      logoSrc,
      logoAlt: companyName || "Logo",
      companyName,
      address,
      contactInfo,
      socialLinks: {
        facebook: source.facebook_url || undefined,
        twitter: source.twitter_url || undefined,
        instagram: source.instagram_url || undefined,
        linkedin: source.linkedin_url || undefined,
      },
    },
    compliance: {
      physicalAddress: address,
      copyrightHolder: companyName,
    },
  });
}
