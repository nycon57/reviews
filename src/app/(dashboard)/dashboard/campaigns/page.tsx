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
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
          <Mail className="h-6 w-6 text-repwell-teal-300" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-repwell-teal-500">Campaigns</h1>
          <p className="text-sm leading-snug text-repwell-teal-300">
            Create and manage automated multi-channel workflows
          </p>
        </div>
      </div>

      <CampaignsDashboard campaigns={campaigns} templates={templates} />
    </div>
  );
}
