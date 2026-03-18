import { Envelope } from "@phosphor-icons/react/dist/ssr";
import { requireEnterpriseManager } from "@/lib/access";
import { TemplateGallery } from "@/components/email-builder/template-gallery";
import { listTemplates } from "@/lib/email-builder/actions";
import { getCurrentOrganization } from "@/lib/organization/actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Emails | RepWell",
  description: "Create and manage custom email templates",
};

export default async function EmailsPage() {
  await requireEnterpriseManager();
  const [templates, { organization }] = await Promise.all([
    listTemplates(),
    getCurrentOrganization(),
  ]);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
          <Envelope className="h-6 w-6 text-repwell-teal-300" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-heading">
            Emails
          </h1>
          <p className="text-sm leading-snug text-repwell-teal-300">
            Design custom email templates with drag-and-drop
          </p>
        </div>
      </div>

      <TemplateGallery
        templates={templates}
        orgLogoUrl={organization?.logo_url ?? null}
        orgName={organization?.name ?? null}
      />
    </div>
  );
}
