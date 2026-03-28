import { describe, expect, it } from "vitest";

import { deriveEmailBrandingConfig } from "@/lib/organization/email-branding";

describe("deriveEmailBrandingConfig", () => {
  it("builds email branding defaults from organization settings", () => {
    const branding = deriveEmailBrandingConfig({
      name: "Acme Mortgage",
      logo_url: "https://cdn.example.com/logo.png",
      primary_color: "#14B8A6",
      company_email: "hello@acme.com",
      company_phone: "+1 (555) 000-0000",
      website_url: "https://acme.com",
      twitter_url: "https://x.com/acme",
      linkedin_url: "https://linkedin.com/company/acme",
      facebook_url: "https://facebook.com/acme",
      instagram_url: "https://instagram.com/acme",
      company_address: {
        street: "123 Main St",
        street2: "Suite 200",
        city: "New York",
        state: "NY",
        postal_code: "10001",
        country: "US",
      },
    });

    expect(branding.enabled).toBe(true);
    expect(branding.header.logoSrc).toBe("https://cdn.example.com/logo.png");
    expect(branding.header.logoAlt).toBe("Acme Mortgage");
    expect(branding.header.socialLinks).toEqual({
      twitter: "https://x.com/acme",
      instagram: "https://instagram.com/acme",
      facebook: "https://facebook.com/acme",
      linkedin: "https://linkedin.com/company/acme",
    });
    expect(branding.header.linkColor).toBe("#14B8A6");
    expect(branding.footer.companyName).toBe("Acme Mortgage");
    expect(branding.footer.logoSrc).toBe("https://cdn.example.com/logo.png");
    expect(branding.footer.address).toBe(
      "123 Main St, Suite 200, New York, NY 10001, US"
    );
    expect(branding.footer.contactInfo).toBe(
      "hello@acme.com | +1 (555) 000-0000 | https://acme.com"
    );
    expect(branding.compliance.physicalAddress).toBe(
      "123 Main St, Suite 200, New York, NY 10001, US"
    );
    expect(branding.compliance.copyrightHolder).toBe("Acme Mortgage");
  });

  it("stays enabled and falls back to safe defaults when org fields are missing", () => {
    const branding = deriveEmailBrandingConfig({
      name: "Fallback Org",
      logo_url: null,
      primary_color: null,
      company_email: null,
      company_phone: null,
      website_url: null,
      twitter_url: null,
      linkedin_url: null,
      facebook_url: null,
      instagram_url: null,
      company_address: null,
    });

    expect(branding.enabled).toBe(true);
    expect(branding.header.logoSrc).toBe("");
    expect(branding.header.linkColor).toBe("rgb(75,85,99)");
    expect(branding.footer.companyName).toBe("Fallback Org");
    expect(branding.footer.address).toBe("");
    expect(branding.footer.contactInfo).toBe("");
    expect(branding.compliance.physicalAddress).toBe("");
  });
});
