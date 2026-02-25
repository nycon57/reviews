import { Envelope as Mail } from "@phosphor-icons/react/dist/ssr";
import { CampaignsDashboard } from "./campaigns-dashboard";
import { requireEnterpriseManager } from "@/lib/access";
import { listCampaigns } from "@/lib/campaigns/actions";
import { getWorkflowTemplates } from "@/lib/campaigns/queries";

export const metadata = {
  title: "Campaigns | RepWell",
  description: "Create and manage automated multi-channel workflows",
};

export default async function CampaignsPage() {
  await requireEnterpriseManager();

  const [campaigns, templates] = await Promise.all([
    listCampaigns(),
    getWorkflowTemplates(),
  ]);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage automated multi-channel workflows
          </p>
        </div>
      </div>

      <CampaignsDashboard campaigns={campaigns} templates={templates} />
    </div>
  );
}
