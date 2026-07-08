import { notFound } from "next/navigation";
import { requireEnterpriseManager } from "@/lib/access";
import { EmailBuilderPage } from "@/components/email-builder/email-builder-page";
import { getTemplateById } from "@/lib/email-builder/actions";
import { getEmailBrandingConfig } from "@/lib/organization/actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit Template | RepWell",
};

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireEnterpriseManager();
  const { id } = await params;
  const [template, { branding, orgLogoUrl }] = await Promise.all([
    getTemplateById(id),
    getEmailBrandingConfig(),
  ]);

  if (!template) notFound();

  return (
    <EmailBuilderPage
      initialTemplate={{
        id: template.id,
        name: template.name,
        subject: template.subject,
        preview_text: template.preview_text,
        document: template.document,
      }}
      orgBranding={branding}
      orgLogoUrl={orgLogoUrl}
    />
  );
}
