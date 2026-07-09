import { createAdminClient } from "@/lib/supabase/admin";
import type { Address, EmailBrandingConfig } from "@/lib/organization/types";
import { deriveEmailBrandingConfig } from "@/lib/organization/email-branding";
import { replaceMergeFields } from "./merge-fields";
import { renderEmailDocument } from "./renderer";
import type { EmailDocument } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function templatesTable(supabase: ReturnType<typeof createAdminClient>): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase.from as any)("email_templates_custom");
}

async function getOrgBranding(organizationId: string): Promise<EmailBrandingConfig | null> {
  const supabase = createAdminClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", organizationId)
    .single();

  if (!org) return null;

  return deriveEmailBrandingConfig({
    name: org.name,
    logo_url: org.logo_url,
    primary_color: org.primary_color,
    company_email: org.company_email,
    company_phone: org.company_phone,
    website_url: org.website_url,
    twitter_url: org.twitter_url,
    linkedin_url: org.linkedin_url,
    facebook_url: org.facebook_url,
    instagram_url: org.instagram_url,
    company_address: org.company_address as Address | null | undefined,
  });
}

/**
 * Server-only send-path resolver. This intentionally does not live in the
 * client-imported actions module, so template IDs are not exposed as a public
 * Server Action lookup surface.
 */
export async function resolveTemplateById(
  templateId: string,
  mergeValues: Record<string, string>
): Promise<{ subject: string; html: string }> {
  const supabase = createAdminClient();

  const { data, error } = await templatesTable(supabase)
    .select("document, subject, html_cache, organization_id")
    .eq("id", templateId)
    .single();

  if (error || !data) {
    throw new Error(`Custom template not found: ${templateId}`);
  }

  const row = data as {
    document: unknown;
    subject: string;
    html_cache: string | null;
    organization_id: string;
  };
  const subject = replaceMergeFields(row.subject, mergeValues);

  if (row.html_cache) {
    const html = replaceMergeFields(row.html_cache, mergeValues);
    return { subject, html };
  }

  const raw = row.document;
  if (
    !raw ||
    typeof raw !== "object" ||
    !("blocks" in (raw as Record<string, unknown>)) ||
    !Array.isArray((raw as Record<string, unknown>).blocks) ||
    !("settings" in (raw as Record<string, unknown>))
  ) {
    throw new Error(`Custom template ${templateId} has an invalid document structure`);
  }

  const doc = raw as EmailDocument;
  const orgBranding = await getOrgBranding(row.organization_id);
  const { html } = await renderEmailDocument(doc, mergeValues, orgBranding);
  return { subject, html };
}
