import { notFound } from "next/navigation";
import { requireEnterpriseManager } from "@/lib/access";
import { getCampaign } from "@/lib/campaigns/actions";
import { WorkflowBuilder } from "@/components/workflow-builder";

export const metadata = {
  title: "Campaign Workflow | RepWell",
  description: "Build, edit, and publish an automated workflow campaign.",
};

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

const LOCK_TTL_MS = 15 * 60 * 1000;

function isLockExpired(lockedAt: string | null): boolean {
  if (!lockedAt) {
    return true;
  }

  const timestamp = new Date(lockedAt).getTime();
  if (Number.isNaN(timestamp)) {
    return true;
  }

  return Date.now() - timestamp > LOCK_TTL_MS;
}

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const ctx = await requireEnterpriseManager();
  const { id } = await params;

  const campaign = await getCampaign(id);
  if (!campaign) {
    notFound();
  }

  const isLockedByAnotherUser = Boolean(
    campaign.lockedBy
    && campaign.lockedBy !== ctx.userId
    && !isLockExpired(campaign.lockedAt)
  );

  return (
    <div className="space-y-6">
      <WorkflowBuilder
        initialCampaign={campaign}
        initiallyReadOnly={isLockedByAnotherUser}
        lockedByName={campaign.lockedByName}
      />
    </div>
  );
}
