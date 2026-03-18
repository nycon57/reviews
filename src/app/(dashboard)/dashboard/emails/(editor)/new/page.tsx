import { requireEnterpriseManager } from "@/lib/access";
import { EmailBuilderPage } from "@/components/email-builder/email-builder-page";
import { getEmailBrandingConfig } from "@/lib/organization/actions";

export const metadata = {
  title: "New Template | RepWell",
};

export default async function NewTemplatePage() {
  await requireEnterpriseManager();
  const { branding, orgLogoUrl } = await getEmailBrandingConfig();
  return <EmailBuilderPage orgBranding={branding} orgLogoUrl={orgLogoUrl} />;
}
