import Link from "next/link";
import {
  Envelope as Mail,
  PaperPlaneTilt,
  FileText,
  ChartBar,
} from "@phosphor-icons/react/dist/ssr";
import { TabsContent } from "@/components/ui/tabs";
import { UrlSyncedTabs } from "@/components/shared/url-synced-tabs";
import { Button } from "@/components/ui/button";
import { CampaignsDashboard } from "./campaigns-dashboard";
import { TemplateGallery } from "@/components/email-builder/template-gallery";
import { requireEnterpriseManager } from "@/lib/access";
import { isPlatformAdmin } from "@/lib/auth/actions";
import { listCampaigns } from "@/lib/campaigns/actions";
import { getWorkflowTemplates } from "@/lib/campaigns/queries";
import { listTemplates } from "@/lib/email-builder/actions";
import { getCurrentOrganization } from "@/lib/organization/actions";

export const metadata = {
  title: "Campaigns | RepWell",
  description: "Automated workflows and reusable email templates",
};

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireEnterpriseManager();

  const { tab } = await searchParams;
  const activeTab = tab === "templates" ? "templates" : "sequences";

  // Tab switches navigate (UrlSyncedTabs pushes ?tab=), so each render only
  // needs the active tab's data — don't pay for the other tab's queries.
  const sequencesData =
    activeTab === "sequences"
      ? await Promise.all([listCampaigns(), getWorkflowTemplates()])
      : null;
  const templatesData =
    activeTab === "templates"
      ? await Promise.all([
          listTemplates(),
          getCurrentOrganization(),
          isPlatformAdmin(),
        ])
      : null;

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
          <Mail className="h-6 w-6 text-repwell-teal-300" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-heading">
            Campaigns
          </h1>
          <p className="text-sm leading-snug text-repwell-teal-300">
            Automated workflows and the reusable email templates they send
          </p>
        </div>
      </div>

      <UrlSyncedTabs
        basePath="/dashboard/campaigns"
        defaultTab="sequences"
        tabs={[
          {
            value: "sequences",
            label: "Sequences",
            icon: <PaperPlaneTilt className="h-4 w-4" />,
          },
          {
            value: "templates",
            label: "Templates",
            icon: <FileText className="h-4 w-4" />,
          },
        ]}
      >
        {sequencesData && (
          <TabsContent value="sequences" className="space-y-6">
            <CampaignsDashboard
              campaigns={sequencesData[0]}
              templates={sequencesData[1]}
            />
          </TabsContent>
        )}

        {templatesData && (
          <TabsContent value="templates" className="space-y-6">
            {templatesData[2] && (
              <div className="flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/staff/email-analytics">
                    <ChartBar className="mr-2 h-4 w-4" />
                    View analytics
                  </Link>
                </Button>
              </div>
            )}
            <TemplateGallery
              templates={templatesData[0]}
              orgLogoUrl={templatesData[1].organization?.logo_url ?? null}
              orgName={templatesData[1].organization?.name ?? null}
            />
          </TabsContent>
        )}
      </UrlSyncedTabs>
    </div>
  );
}
