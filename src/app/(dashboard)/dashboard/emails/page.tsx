import Link from "next/link";
import { Envelope, ChartBar } from "@phosphor-icons/react/dist/ssr";
import { requireEnterpriseManager } from "@/lib/access";
import { isPlatformAdmin } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
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
  const [templates, { organization }, isStaff] = await Promise.all([
    listTemplates(),
    getCurrentOrganization(),
    isPlatformAdmin(),
  ]);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between gap-3">
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
        {isStaff && (
          <Button variant="outline" size="sm" asChild>
            <Link href="/staff/email-analytics">
              <ChartBar className="mr-2 h-4 w-4" />
              View analytics
            </Link>
          </Button>
        )}
      </div>

      <TemplateGallery
        templates={templates}
        orgLogoUrl={organization?.logo_url ?? null}
        orgName={organization?.name ?? null}
      />
    </div>
  );
}
